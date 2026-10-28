import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import type { ArtworkRepository } from "../../domain/repositories";
import type { FirebaseClient } from "../../infra/firebase/client";
import { attempt } from "../errors";
import { artworkMapper, categoryMapper } from "../mappers";
export class FirebaseArtworkRepository implements ArtworkRepository {
  constructor(private client: FirebaseClient) {}
  listPublished() {
    return attempt(async () =>
      (
        await getDocs(
          query(
            collection(this.client.db, "artworks"),
            where("status", "==", "published"),
          ),
        )
      ).docs.map((d) => artworkMapper(d.id, d.data())),
    );
  }
  getPublishedById(id: string) {
    return attempt(async () => {
      const d = await getDoc(doc(this.client.db, "artworks", id));
      return d.exists() ? artworkMapper(d.id, d.data()) : null;
    });
  }
  listCategories() {
    return attempt(async () =>
      (await getDocs(collection(this.client.db, "categories"))).docs
        .map((d) => categoryMapper(d.id, d.data()))
        .sort((a, b) => a.order - b.order),
    );
  }
}
