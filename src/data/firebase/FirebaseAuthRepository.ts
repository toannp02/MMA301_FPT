import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import type { AuthRepository } from "../../domain/repositories";
import type { UserProfile } from "../../domain/models";
import type { FirebaseClient } from "../../infra/firebase/client";
import { attempt } from "../errors";
import { userMapper } from "../mappers";
export class FirebaseAuthRepository implements AuthRepository {
  constructor(private client: FirebaseClient) {}
  private async profile(user: User): Promise<UserProfile> {
    const ref = doc(this.client.db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // Registration and the auth observer can reach this path together.
      // Re-read inside the transaction to preserve an existing creation timestamp.
      await runTransaction(this.client.db, async (transaction) => {
        if ((await transaction.get(ref)).exists()) return;
        transaction.set(ref, {
          email: user.email ?? "",
          displayName: user.displayName ?? "Art lover",
          avatarUrl: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      const fresh = await getDoc(ref);
      return userMapper(user.uid, user.email ?? "", fresh.data() ?? {});
    }
    return userMapper(user.uid, user.email ?? "", snap.data());
  }
  async getCurrentUser() {
    return this.client.auth.currentUser
      ? this.profile(this.client.auth.currentUser)
      : null;
  }
  signIn(email: string, password: string) {
    return attempt(async () =>
      this.profile(
        (
          await signInWithEmailAndPassword(
            this.client.auth,
            email.trim(),
            password,
          )
        ).user,
      ),
    );
  }
  signUp(email: string, password: string, displayName: string) {
    return attempt(async () => {
      const { user } = await createUserWithEmailAndPassword(
        this.client.auth,
        email.trim(),
        password,
      );
      await updateProfile(user, { displayName });
      await this.profile(user);
      // The auth observer can create the profile before updateProfile finishes.
      await setDoc(
        doc(this.client.db, "users", user.uid),
        { displayName, updatedAt: serverTimestamp() },
        { merge: true },
      );
      return this.profile(user);
    });
  }
  signOut() {
    return attempt(() => signOut(this.client.auth));
  }
  updateProfile(displayName: string) {
    return attempt(async () => {
      const user = this.client.auth.currentUser;
      if (!user) throw new Error("Sign in required");
      await this.profile(user);
      await setDoc(
        doc(this.client.db, "users", user.uid),
        { displayName, updatedAt: serverTimestamp() },
        { merge: true },
      );
      await updateProfile(user, { displayName });
      return this.profile(user);
    });
  }
  observeAuth(callback: (user: UserProfile | null) => void) {
    let generation = 0;
    const unsub = onAuthStateChanged(this.client.auth, (user) => {
      const token = ++generation;
      if (!user) {
        callback(null);
        return;
      }
      // Auth identity remains available even when offline profile hydration fails.
      this.profile(user)
        .then((p) => {
          if (token === generation) callback(p);
        })
        .catch(() => {
          if (token === generation)
            callback({
              uid: user.uid,
              email: user.email ?? "",
              displayName: user.displayName ?? "Art lover",
              avatarUrl: null,
              createdAt: user.metadata.creationTime
                ? new Date(user.metadata.creationTime).toISOString()
                : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
        });
    });
    return () => {
      generation++;
      unsub();
    };
  }
}
