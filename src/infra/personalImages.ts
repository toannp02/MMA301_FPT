import * as FS from "expo-file-system/legacy";
import type { ArtworkImageStore } from "../domain/repositories";
import { customArtworkId, MAX_IMPORTED_BYTES } from "../domain/customArtworks";
function path(id: string) {
  if (!customArtworkId(id) || !FS.documentDirectory)
    throw new Error("Invalid import path");
  return `${FS.documentDirectory}personal-artworks/${id}.jpg`;
}
export class PersonalImageStore implements ArtworkImageStore {
  async persist(id: string, uri: string) {
    if (!uri.startsWith("file://"))
      throw new Error("Expected a prepared image");
    const info = await FS.getInfoAsync(uri);
    if (!info.exists || !info.size || info.size > MAX_IMPORTED_BYTES)
      throw new Error("Image unavailable or too large");
    const target = path(id);
    await FS.makeDirectoryAsync(target.slice(0, target.lastIndexOf("/")), {
      intermediates: true,
    });
    try {
      await FS.copyAsync({ from: uri, to: target });
    } catch (error) {
      await FS.deleteAsync(target, { idempotent: true });
      throw error;
    }
    return target;
  }
  async remove(id: string) {
    await FS.deleteAsync(path(id), { idempotent: true });
  }
}
