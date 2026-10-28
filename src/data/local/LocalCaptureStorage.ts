import * as FS from "expo-file-system/legacy";
import type { CaptureStorage } from "../../domain/repositories";
import { validId } from "../../domain/validators";
import { attempt } from "../errors";
export class LocalCaptureStorage implements CaptureStorage {
  private path(uid: string, id: string) {
    if (!validId(uid) || !validId(id) || !FS.documentDirectory)
      throw new Error("Invalid file scope");
    return `${FS.documentDirectory}designs/${uid}/${id}.jpg`;
  }
  saveCapture(uid: string, id: string, fileUri: string) {
    return attempt(async () => {
      if (!fileUri.startsWith("file://"))
        throw new Error("Capture must be a local file");
      const info = await FS.getInfoAsync(fileUri);
      if (!info.exists || !info.size || info.size > 10 * 1024 * 1024)
        throw new Error("Capture is missing or too large");
      const path = this.path(uid, id);
      await FS.makeDirectoryAsync(path.slice(0, path.lastIndexOf("/")), {
        intermediates: true,
      });
      await FS.copyAsync({ from: fileUri, to: path });
      return {
        capturedImageUri: path,
        imageStoragePath: null,
        storageMode: "local" as const,
      };
    });
  }
  removeCapture(uid: string, id: string, _path: string | null) {
    return attempt(() =>
      FS.deleteAsync(this.path(uid, id), { idempotent: true }),
    );
  }
}
