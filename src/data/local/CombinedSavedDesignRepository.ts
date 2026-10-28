import type { SavedDesignRepository } from "../../domain/repositories";
import type { SavedDesign } from "../../domain/models";
import { ok } from "../../domain/models";
export class CombinedSavedDesignRepository implements SavedDesignRepository {
  constructor(
    private local: SavedDesignRepository,
    private cloud: SavedDesignRepository,
  ) {}
  async list(uid: string) {
    const local = await this.local.list(uid);
    if (!local.ok || uid === "guest") return local;
    const cloud = await this.cloud.list(uid);
    if (!cloud.ok) return cloud;
    return ok(
      [...local.data, ...cloud.data].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  }
  async getById(uid: string, id: string) {
    const local = await this.local.getById(uid, id);
    if (!local.ok || local.data || uid === "guest") return local;
    return this.cloud.getById(uid, id);
  }
  create(uid: string, input: SavedDesign) {
    return (input.storageMode === "local" ? this.local : this.cloud).create(
      uid,
      input,
    );
  }
  async delete(uid: string, id: string) {
    const local = await this.local.getById(uid, id);
    if (!local.ok) return local;
    return (local.data || uid === "guest" ? this.local : this.cloud).delete(
      uid,
      id,
    );
  }
}
