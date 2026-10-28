import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import type { SavedDesignRepository } from "../../domain/repositories";
import type { SavedDesign } from "../../domain/models";
import type { FirebaseClient } from "../../infra/firebase/client";
import { validDesign } from "../../domain/validators";
import { attempt } from "../errors";
import { designMapper, text } from "../mappers";
export class FirebaseSavedDesignRepository implements SavedDesignRepository {
  constructor(private client: FirebaseClient) {}
  private async map(uid: string, id: string, data: Record<string, unknown>) {
    const path = text(data.imageStoragePath);
    if (path !== `designs/${uid}/${id}.jpg`) throw new Error("Invalid owner");
    // Download URLs are bearer URLs. Keep in memory only; disclose sharing semantics in SECURITY.md.
    let uri: string;
    try {
      uri = await getDownloadURL(ref(this.client.storage, path));
    } catch (e: unknown) {
      if (
        !(
          typeof e === "object" &&
          e &&
          "code" in e &&
          e.code === "storage/object-not-found"
        )
      )
        throw e;
      // A prior delete may have removed the image before metadata deletion failed.
      // Preserve the metadata in the UI so deletion can be retried.
      uri = "file:///missing-capture.jpg";
    }
    return designMapper(uid, id, data, uri);
  }
  list(uid: string) {
    return attempt(async () =>
      (
        await Promise.all(
          (
            await getDocs(
              collection(this.client.db, "users", uid, "savedDesigns"),
            )
          ).docs.map((d) => this.map(uid, d.id, d.data())),
        )
      ).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }
  getById(uid: string, id: string) {
    return attempt(async () => {
      const d = await getDoc(
        doc(this.client.db, "users", uid, "savedDesigns", id),
      );
      return d.exists() ? this.map(uid, id, d.data()) : null;
    });
  }
  create(uid: string, d: SavedDesign) {
    return attempt(async () => {
      if (
        !validDesign(d, uid) ||
        d.storageMode !== "cloud" ||
        d.imageStoragePath !== `designs/${uid}/${d.id}.jpg`
      )
        throw new Error("Invalid cloud design");
      await setDoc(doc(this.client.db, "users", uid, "savedDesigns", d.id), {
        artworkId: d.artworkId,
        sourceKind: d.sourceKind,
        imageStoragePath: d.imageStoragePath,
        widthCm: d.widthCm,
        heightCm: d.heightCm,
        scaleFactor: d.scaleFactor,
        frameStyle: d.frameStyle,
        createdAt: Timestamp.fromDate(new Date(d.createdAt)),
      });
      return d;
    });
  }
  delete(uid: string, id: string) {
    return attempt(() =>
      deleteDoc(doc(this.client.db, "users", uid, "savedDesigns", id)),
    );
  }
}
