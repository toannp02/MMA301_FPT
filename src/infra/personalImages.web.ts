import type { ArtworkImageStore } from "../domain/repositories";
import { customArtworkId, MAX_IMPORTED_BYTES } from "../domain/customArtworks";
// The bounded JPEG data URI is persisted with metadata in browser local storage.
export class PersonalImageStore implements ArtworkImageStore {
  async persist(id: string, uri: string) {
    if (
      !customArtworkId(id) ||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(uri) ||
      uri.length > MAX_IMPORTED_BYTES * 1.4
    )
      throw new Error("Invalid browser image");
    return uri;
  }
  async remove(_id: string) {
    /* Metadata removal also removes the inline image. */
  }
}
