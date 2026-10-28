import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import type { FavoriteRepository } from "../../domain/repositories";
import type { FirebaseClient } from "../../infra/firebase/client";
import { attempt } from "../errors";
import { iso } from "../mappers";
export class FirebaseFavoriteRepository implements FavoriteRepository {
  constructor(private client: FirebaseClient) {}
  list(uid: string) {
    return attempt(async () =>
      (
        await getDocs(collection(this.client.db, "users", uid, "favorites"))
      ).docs.map((d) => ({
        artworkId: d.id,
        createdAt: iso(d.data().createdAt),
      })),
    );
  }
  add(uid: string, id: string) {
    return attempt(() =>
      runTransaction(this.client.db, async (tx) => {
        const ref = doc(this.client.db, "users", uid, "favorites", id);
        if (!(await tx.get(ref)).exists())
          tx.set(ref, { artworkId: id, createdAt: serverTimestamp() });
      }),
    );
  }
  remove(uid: string, id: string) {
    return attempt(() =>
      deleteDoc(doc(this.client.db, "users", uid, "favorites", id)),
    );
  }
}
