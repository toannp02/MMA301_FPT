// Admin-only process; never imported by mobile code. Uses ADC outside the repo.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
if (!process.env.ARTSPACE_PROJECT_ID || !process.env.ARTSPACE_BUCKET)
  throw new Error(
    "Set ARTSPACE_PROJECT_ID and ARTSPACE_BUCKET; use trusted ADC credentials.",
  );
initializeApp({
  credential: applicationDefault(),
  projectId: process.env.ARTSPACE_PROJECT_ID,
  storageBucket: process.env.ARTSPACE_BUCKET,
});
const db = getFirestore();
const bucket = getStorage().bucket();
const names = [
  "Terracotta Sun",
  "Quiet Arches",
  "Sage Horizon",
  "Indigo Tide",
  "Ochre Fields",
  "Clay Moon",
  "Forest Layers",
  "Blue Balance",
  "Desert Window",
  "Evening Forms",
  "Olive Rhythm",
  "Rose Geometry",
];
const categories = ["Earth", "Botanical", "Abstract"];
for (const [order, name] of categories.entries())
  await db
    .doc(`categories/${name.toLowerCase()}`)
    .set({ name, slug: name.toLowerCase(), order });
for (const [i, title] of names.entries()) {
  const id = `art-${String(i + 1).padStart(2, "0")}`;
  const destination = `artworks/${id}/original.png`;
  await bucket.upload(`assets/artworks/${id}.png`, {
    destination,
    metadata: {
      contentType: "image/png",
      cacheControl: "public,max-age=86400",
    },
  });
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;
  await db
    .doc(`artworks/${id}`)
    .set({
      title,
      description: "Original ArtSpace geometric study. CC0 / public domain.",
      categoryId: categories[i % 3].toLowerCase(),
      imageUrl: url,
      thumbnailUrl: url,
      widthCm: 60,
      heightCm: 90,
      status: "published",
      isFeatured: i < 3,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
}
console.log("Seeded 12 original artworks and 3 categories.");
