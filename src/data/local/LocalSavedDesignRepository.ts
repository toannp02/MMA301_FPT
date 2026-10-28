import type { SavedDesignRepository } from "../../domain/repositories";
import type { SavedDesign } from "../../domain/models";
import { validDesign, validId } from "../../domain/validators";
import { attempt } from "../errors";
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export class LocalSavedDesignRepository implements SavedDesignRepository {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private store: KeyValueStore) {}
  private key(uid: string) {
    if (!validId(uid)) throw new Error("Invalid user scope");
    return `artspace:designs:v1:${uid}`;
  }
  private async read(uid: string): Promise<SavedDesign[]> {
    const raw = await this.store.getItem(this.key(uid));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed) || !parsed.every((d) => validDesign(d, uid)))
      throw Object.assign(new Error("Invalid metadata"), {
        code: "invalid-data",
      });
    return parsed;
  }
  private serialize<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => undefined);
    return next;
  }
  list(uid: string) {
    return attempt(async () =>
      (await this.read(uid)).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  }
  getById(uid: string, id: string) {
    return attempt(
      async () => (await this.read(uid)).find((d) => d.id === id) ?? null,
    );
  }
  create(uid: string, input: SavedDesign) {
    return attempt(() =>
      this.serialize(async () => {
        if (!validDesign(input, uid) || input.storageMode !== "local")
          throw new Error("Invalid design");
        const items = await this.read(uid);
        const existing = items.find((d) => d.id === input.id);
        if (existing) return existing;
        await this.store.setItem(
          this.key(uid),
          JSON.stringify([...items, input]),
        );
        return input;
      }),
    );
  }
  delete(uid: string, id: string) {
    return attempt(() =>
      this.serialize(async () => {
        await this.store.setItem(
          this.key(uid),
          JSON.stringify((await this.read(uid)).filter((d) => d.id !== id)),
        );
      }),
    );
  }
}
