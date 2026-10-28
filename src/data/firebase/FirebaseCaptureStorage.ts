import { ref, uploadBytes, deleteObject } from "firebase/storage";
import * as FS from "expo-file-system/legacy";
import type { CaptureStorage } from "../../domain/repositories";
import type { FirebaseClient } from "../../infra/firebase/client";
import { validId } from "../../domain/validators";
import { attempt } from "../errors";
export class FirebaseCaptureStorage implements CaptureStorage {
  constructor(private client: FirebaseClient) {}
  private path(uid: string, id: string) {
    if (!validId(uid) || !validId(id)) throw new Error("Invalid path");
    return `designs/${uid}/${id}.jpg`;
  }
  saveCapture(uid: string, id: string, fileUri: string) {
    return attempt(async () => {
      if (!fileUri.startsWith("file://"))
        throw new Error("Local capture required");
      const info = await FS.getInfoAsync(fileUri);
      if (!info.exists || !info.size || info.size > 10 * 1024 * 1024)
        throw new Error("Invalid capture size");
      const blob = await (await fetch(fileUri)).blob();
      const path = this.path(uid, id);
      await uploadBytes(ref(this.client.storage, path), blob, {
        contentType: "image/jpeg",
      });
      // Only the metadata adapter resolves a display URL. It is never persisted in Firestore.
      return {
        capturedImageUri: fileUri,
        imageStoragePath: path,
        storageMode: "cloud" as const,
      };
    });
  }
  removeCapture(uid: string, id: string, path: string | null) {
    return attempt(async () => {
      const expected = this.path(uid, id);
      if (path !== expected) throw new Error("Invalid image owner");
      try {
        await deleteObject(ref(this.client.storage, expected));
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
      }
    });
  }
}
