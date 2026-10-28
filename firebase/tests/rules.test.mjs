import { readFileSync } from "node:fs";
import { before, after, test } from "node:test";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  deleteField,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { ref, uploadBytes, getBytes } from "firebase/storage";
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-artspace-ar",
    firestore: {
      rules: readFileSync("firebase/firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8188,
    },
    storage: {
      rules: readFileSync("firebase/storage.rules", "utf8"),
      host: "127.0.0.1",
      port: 9299,
    },
  });
  await env.withSecurityRulesDisabled(async (c) => {
    for (const [id, status] of [
      ["a", "published"],
      ["hidden", "hidden"],
    ])
      await setDoc(doc(c.firestore(), "artworks", id), { status });
  });
});
after(async () => {
  await env?.cleanup();
});
test("concurrent profile repair preserves the immutable creation timestamp", async () => {
  const db = env
    .authenticatedContext("C", { email: "c@example.com" })
    .firestore();
  const profileRef = doc(db, "users/C");
  const ensureCreated = () =>
    runTransaction(db, async (transaction) => {
      if ((await transaction.get(profileRef)).exists()) return;
      transaction.set(profileRef, {
        email: "c@example.com",
        displayName: "Casey",
        avatarUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  await assertSucceeds(Promise.all([ensureCreated(), ensureCreated()]));
  const initial = (await getDoc(profileRef)).data().createdAt;
  await assertSucceeds(ensureCreated());
  if (!(await getDoc(profileRef)).data().createdAt.isEqual(initial))
    throw new Error("Profile creation timestamp changed");
});
test("guest published query allowed, unfiltered and hidden denied", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertSucceeds(
    getDocs(
      query(collection(db, "artworks"), where("status", "==", "published")),
    ),
  );
  await assertFails(getDocs(collection(db, "artworks")));
  await assertFails(getDoc(doc(db, "artworks", "hidden")));
});
test("catalogue writes and guest favorites denied", async () => {
  await assertFails(
    setDoc(doc(env.authenticatedContext("A").firestore(), "artworks", "a"), {
      status: "published",
    }),
  );
  await assertFails(
    setDoc(
      doc(env.unauthenticatedContext().firestore(), "users/A/favorites/a"),
      { artworkId: "a", createdAt: serverTimestamp() },
    ),
  );
});
test("profile ownership, schema, immutable timestamps and update validation", async () => {
  const a = env
    .authenticatedContext("A", { email: "a@example.com" })
    .firestore();
  const b = env
    .authenticatedContext("B", { email: "b@example.com" })
    .firestore();
  const profile = {
    email: "a@example.com",
    displayName: "Alice",
    avatarUrl: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await assertSucceeds(setDoc(doc(a, "users/A"), profile));
  await assertFails(getDoc(doc(b, "users/A")));
  await assertFails(getDocs(collection(b, "users")));
  await assertFails(
    updateDoc(doc(a, "users/A"), {
      role: "admin",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(a, "users/A"), {
      displayName: "x".repeat(1000),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(a, "users/A"), {
      email: "b@example.com",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(a, "users/A"), {
      createdAt: Timestamp.fromMillis(1),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(a, "users/A"), {
      displayName: deleteField(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(a, "users/A"), {
      displayName: "Alice updated",
      updatedAt: serverTimestamp(),
    }),
  );
});
test("favorite owner isolation, parent requirement and published relationship", async () => {
  const a = env.authenticatedContext("A").firestore();
  const b = env.authenticatedContext("B").firestore();
  await assertSucceeds(
    setDoc(doc(a, "users/A/favorites/a"), {
      artworkId: "a",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(getDoc(doc(b, "users/A/favorites/a")));
  await assertFails(
    setDoc(doc(b, "users/B/favorites/a"), {
      artworkId: "a",
      createdAt: serverTimestamp(),
    }),
  );
  await assertFails(
    setDoc(doc(a, "users/A/favorites/hidden"), {
      artworkId: "hidden",
      createdAt: serverTimestamp(),
    }),
  );
});
test("design owner paths, invalid dimensions and immutable metadata", async () => {
  const a = env.authenticatedContext("A").firestore();
  const b = env.authenticatedContext("B").firestore();
  const design = {
    artworkId: "a",
    sourceKind: "catalog",
    imageStoragePath: "designs/A/one.jpg",
    widthCm: 60,
    heightCm: 90,
    scaleFactor: 1,
    frameStyle: "none",
    createdAt: Timestamp.fromMillis(Date.now() - 1000),
  };
  await assertSucceeds(setDoc(doc(a, "users/A/savedDesigns/one"), design));
  await assertFails(getDoc(doc(b, "users/A/savedDesigns/one")));
  await assertFails(
    setDoc(doc(a, "users/A/savedDesigns/bad"), {
      ...design,
      imageStoragePath: "designs/B/bad.jpg",
    }),
  );
  await assertFails(
    updateDoc(doc(a, "users/A/savedDesigns/one"), { widthCm: -1 }),
  );
  await assertFails(
    updateDoc(doc(a, "users/A/savedDesigns/one"), { frameStyle: "gold" }),
  );
  await assertFails(
    updateDoc(doc(a, "users/A/savedDesigns/one"), {
      capturedImageUri: "file://private",
    }),
  );
});
test("storage MIME, size, ownership and guest access", async () => {
  const a = env.authenticatedContext("A").storage();
  const b = env.authenticatedContext("B").storage();
  const guest = env.unauthenticatedContext().storage();
  await assertSucceeds(
    uploadBytes(ref(a, "designs/A/one.jpg"), new Uint8Array([1, 2, 3]), {
      contentType: "image/jpeg",
    }),
  );
  await assertFails(getBytes(ref(b, "designs/A/one.jpg")));
  await assertFails(getBytes(ref(guest, "designs/A/one.jpg")));
  await assertFails(
    uploadBytes(ref(a, "designs/B/one.jpg"), new Uint8Array([1]), {
      contentType: "image/jpeg",
    }),
  );
  await assertFails(
    uploadBytes(ref(a, "designs/A/wrong.jpg"), new Uint8Array([1]), {
      contentType: "text/plain",
    }),
  );
  await assertFails(
    uploadBytes(
      ref(a, "designs/A/huge.jpg"),
      new Uint8Array(10 * 1024 * 1024 + 1),
      { contentType: "image/jpeg" },
    ),
  );
  await assertFails(
    uploadBytes(ref(a, "artworks/a/original.jpg"), new Uint8Array([1]), {
      contentType: "image/jpeg",
    }),
  );
});
