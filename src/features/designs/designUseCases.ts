import { fail, ok, type SavedDesign, type Result } from "../../domain/models";
import type {
  CaptureStorage,
  SavedDesignRepository,
} from "../../domain/repositories";
import { validDesign } from "../../domain/validators";
export class DesignUseCases {
  private inFlight = new Map<string, Promise<Result<SavedDesign>>>();
  constructor(
    private repo: SavedDesignRepository,
    private storage: CaptureStorage,
    private localStorage?: CaptureStorage,
  ) {}
  save(uid: string, draft: SavedDesign): Promise<Result<SavedDesign>> {
    if (!validDesign(draft, uid))
      return Promise.resolve(
        fail("invalid-design", "This capture has invalid metadata. Retake it."),
      );
    const key = `${uid}/${draft.id}`;
    const pending = this.inFlight.get(key);
    if (pending) return pending;
    const run = this.saveOnce(uid, draft).finally(() =>
      this.inFlight.delete(key),
    );
    this.inFlight.set(key, run);
    return run;
  }
  private async saveOnce(
    uid: string,
    draft: SavedDesign,
  ): Promise<Result<SavedDesign>> {
    const existing = await this.repo.getById(uid, draft.id);
    if (!existing.ok) return existing;
    if (
      existing.data &&
      existing.data.capturedImageUri !== "file:///missing-capture.jpg"
    )
      return ok(existing.data);
    const storage =
      draft.sourceKind === "custom"
        ? (this.localStorage ?? this.storage)
        : this.storage;
    const file = await storage.saveCapture(
      uid,
      draft.id,
      draft.capturedImageUri,
    );
    if (!file.ok) return file;
    const result = await this.repo.create(uid, { ...draft, ...file.data });
    if (!result.ok) {
      const cleanup = await storage.removeCapture(
        uid,
        draft.id,
        file.data.imageStoragePath,
      );
      if (!cleanup.ok)
        return fail(
          "cleanup-required",
          "Save failed and image cleanup failed. Retry this same draft to reconcile it.",
          true,
        );
    }
    return result;
  }
  async delete(uid: string, id: string): Promise<Result<void>> {
    const found = await this.repo.getById(uid, id);
    if (!found.ok) return found;
    if (!found.data) return ok(undefined);
    // Keep metadata until file deletion succeeds so partial failures remain retryable.
    const storage =
      found.data.storageMode === "local"
        ? (this.localStorage ?? this.storage)
        : this.storage;
    const removed = await storage.removeCapture(
      uid,
      id,
      found.data.imageStoragePath,
    );
    if (!removed.ok) return removed;
    return this.repo.delete(uid, id);
  }
}
