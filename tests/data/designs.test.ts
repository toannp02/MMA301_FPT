import { LocalSavedDesignRepository } from "../../src/data/local/LocalSavedDesignRepository";
import { DesignUseCases } from "../../src/features/designs/designUseCases";
import { ok, fail, type SavedDesign } from "../../src/domain/models";
import type { CaptureStorage } from "../../src/domain/repositories";
import { CombinedSavedDesignRepository } from "../../src/data/local/CombinedSavedDesignRepository";
import { validDesign } from "../../src/domain/validators";
const draft: SavedDesign = {
  id: "one",
  userId: "A",
  artworkId: "art-01",
  sourceKind: "catalog",
  sourceImageUri: null,
  capturedImageUri: "file:///tmp.jpg",
  imageStoragePath: null,
  storageMode: "local",
  widthCm: 60,
  heightCm: 90,
  scaleFactor: 1,
  frameStyle: "none",
  createdAt: "2026-10-27T00:00:00.000Z",
};
function setup() {
  const memory = new Map<string, string>();
  const store = {
    getItem: jest.fn(async (key: string) => memory.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      memory.set(key, value);
    }),
  };
  const repo = new LocalSavedDesignRepository(store);
  const storage: CaptureStorage = {
    saveCapture: jest.fn(async () =>
      ok({
        capturedImageUri: "file:///persistent.jpg",
        imageStoragePath: null,
        storageMode: "local" as const,
      }),
    ),
    removeCapture: jest.fn(async () => ok(undefined)),
  };
  return {
    memory,
    store,
    repo,
    storage,
    actions: new DesignUseCases(repo, storage),
  };
}
test("save survives repository recreation and remains scoped by account", async () => {
  const x = setup();
  expect((await x.actions.save("A", draft)).ok).toBe(true);
  const restarted = new LocalSavedDesignRepository(x.store);
  expect(await restarted.list("A")).toMatchObject({
    ok: true,
    data: [{ id: "one", capturedImageUri: "file:///persistent.jpg" }],
  });
  expect(await restarted.list("B")).toEqual(ok([]));
  expect((await x.actions.save("B", draft)).ok).toBe(false);
});
test("duplicate simultaneous saves perform one upload and one metadata write", async () => {
  const x = setup();
  const result = await Promise.all([
    x.actions.save("A", draft),
    x.actions.save("A", draft),
  ]);
  expect(result.every((r) => r.ok)).toBe(true);
  expect(x.storage.saveCapture).toHaveBeenCalledTimes(1);
  await x.actions.save("A", draft);
  expect(x.storage.saveCapture).toHaveBeenCalledTimes(1);
});
test("metadata failure compensates uploaded file", async () => {
  const x = setup();
  x.store.setItem.mockRejectedValueOnce(new Error("disk full"));
  expect((await x.actions.save("A", draft)).ok).toBe(false);
  expect(x.storage.removeCapture).toHaveBeenCalledWith("A", "one", null);
});
test("rollback failure is actionable and same draft retry succeeds", async () => {
  const x = setup();
  x.store.setItem.mockRejectedValueOnce(new Error("disk full"));
  jest
    .mocked(x.storage.removeCapture)
    .mockResolvedValueOnce(fail("offline", "No connection"));
  expect(await x.actions.save("A", draft)).toMatchObject({
    ok: false,
    error: { code: "cleanup-required" },
  });
  expect((await x.actions.save("A", draft)).ok).toBe(true);
});
test("file delete failure retains metadata for retry", async () => {
  const x = setup();
  await x.actions.save("A", draft);
  jest
    .mocked(x.storage.removeCapture)
    .mockResolvedValueOnce(fail("io", "Busy", true));
  expect((await x.actions.delete("A", "one")).ok).toBe(false);
  expect(await x.repo.list("A")).toMatchObject({ data: [{ id: "one" }] });
  expect((await x.actions.delete("A", "one")).ok).toBe(true);
  expect(await x.repo.list("A")).toEqual(ok([]));
});
test("metadata delete failure can be retried after file already removed", async () => {
  const x = setup();
  await x.actions.save("A", draft);
  x.store.setItem.mockRejectedValueOnce(new Error("disk full"));
  expect((await x.actions.delete("A", "one")).ok).toBe(false);
  expect((await x.actions.delete("A", "one")).ok).toBe(true);
});
test("corrupt local metadata reports failure instead of silently erasing saves", async () => {
  const x = setup();
  x.memory.set("artspace:designs:v1:A", "broken");
  expect((await x.repo.list("A")).ok).toBe(false);
});

test("custom capture uses only local storage, survives restart, and cannot become a cloud design", async () => {
  const x = setup();
  const local = setup();
  const cloudRepo = {
    list: jest.fn(async () => ok([])),
    getById: jest.fn(async () => ok(null)),
    create: jest.fn(async (_uid: string, d: SavedDesign) => ok(d)),
    delete: jest.fn(async () => ok(undefined)),
  };
  const combined = new CombinedSavedDesignRepository(local.repo, cloudRepo);
  const actions = new DesignUseCases(combined, x.storage, local.storage);
  const custom: SavedDesign = {
    ...draft,
    artworkId: "custom-photo",
    sourceKind: "custom",
    sourceImageUri: "file:///documents/custom-photo.jpg",
  };
  expect(validDesign(custom, "A")).toBe(true);
  expect(validDesign({ ...custom, storageMode: "cloud" }, "A")).toBe(false);
  expect(
    validDesign(
      { ...custom, sourceImageUri: "https://example.com/photo.jpg" },
      "A",
    ),
  ).toBe(false);
  expect((await actions.save("A", custom)).ok).toBe(true);
  expect(local.storage.saveCapture).toHaveBeenCalledTimes(1);
  expect(x.storage.saveCapture).not.toHaveBeenCalled();
  expect(cloudRepo.create).not.toHaveBeenCalled();
  expect(
    await new LocalSavedDesignRepository(local.store).getById("A", draft.id),
  ).toMatchObject({
    ok: true,
    data: { sourceKind: "custom", storageMode: "local" },
  });
  await actions.delete("A", draft.id);
  expect(local.storage.removeCapture).toHaveBeenCalledTimes(1);
  expect(x.storage.removeCapture).not.toHaveBeenCalled();
  expect(cloudRepo.delete).not.toHaveBeenCalled();
});

test("guest custom saves remain available in cloud mode without requesting guest Firestore paths", async () => {
  const x = setup();
  const cloud = {
    ...x.repo,
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };
  const combined = new CombinedSavedDesignRepository(x.repo, cloud);
  expect(await combined.list("guest")).toEqual(ok([]));
  expect(await combined.getById("guest", "missing")).toEqual(ok(null));
  expect(cloud.list).not.toHaveBeenCalled();
  expect(cloud.getById).not.toHaveBeenCalled();
});
