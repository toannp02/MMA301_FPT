import {
  PersonalArtworkRepository,
  PERSONAL_ARTWORKS_KEY,
} from "../../src/data/local/PersonalArtworkRepository";
import { ok, fail } from "../../src/domain/models";
import type {
  ArtworkRepository,
  ImportedImage,
} from "../../src/domain/repositories";
const image: ImportedImage = {
  uri: "file:///cache/photo.jpg",
  width: 1200,
  height: 800,
  bytes: 300000,
};
function setup() {
  const memory = new Map<string, string>();
  const store = {
    getItem: async (k: string) => memory.get(k) ?? null,
    setItem: jest.fn(async (k: string, v: string) => {
      memory.set(k, v);
    }),
  };
  const images = {
    persist: jest.fn(async (id: string) => `file:///documents/${id}.jpg`),
    remove: jest.fn(async () => undefined),
  };
  const catalogue: ArtworkRepository = {
    listPublished: async () => ok([]),
    listCategories: async () => ok([]),
    getPublishedById: async () => ok(null),
  };
  let id = 0;
  const make = () =>
    new PersonalArtworkRepository(catalogue, store, images, () => `id-${++id}`);
  return { repo: make(), make, memory, store, images, catalogue };
}
test("import persists across recreation with original proportions and a durable URI", async () => {
  const x = setup();
  const added = await x.repo.add("  Landscape  ", 90, image);
  expect(added.ok).toBe(true);
  if (!added.ok) throw new Error("Import failed");
  expect(added.data).toMatchObject({
    title: "Landscape",
    widthCm: 90,
    heightCm: 60,
    sourceKind: "custom",
    imageUrl: "file:///documents/custom-id-1.jpg",
  });
  expect(await x.make().getPublishedById(added.data.id)).toEqual(added);
  expect(await x.make().listPublished()).toEqual(ok([added.data]));
});
test.each([
  ["x", 60, image],
  ["Valid", NaN, image],
  ["Valid", 1001, image],
  ["Valid", 60, { ...image, bytes: 2_000_000 }],
  ["Valid", 60, { ...image, width: 0 }],
  ["Valid", 900, { ...image, width: 1, height: 2048 }],
])(
  "invalid import metadata is rejected before file persistence",
  async (title, width, picked) => {
    const x = setup();
    expect((await x.repo.add(title, width, picked)).ok).toBe(false);
    expect(x.images.persist).not.toHaveBeenCalled();
  },
);
test("failed metadata write removes the newly copied image", async () => {
  const x = setup();
  x.store.setItem.mockRejectedValueOnce(new Error("Full disk"));
  expect((await x.repo.add("Landscape", 90, image)).ok).toBe(false);
  expect(x.images.remove).toHaveBeenCalledWith("custom-id-1");
  expect(await x.repo.list()).toEqual(ok([]));
});
test("concurrent imports do not overwrite metadata; limit is enforced", async () => {
  const x = setup();
  const results = await Promise.all(
    Array.from({ length: 11 }, (_, i) => x.repo.add(`Piece ${i}`, 60, image)),
  );
  expect(results.filter((r) => r.ok)).toHaveLength(10);
  expect(x.images.persist).toHaveBeenCalledTimes(10);
  const list = await x.repo.list();
  expect(list.ok && list.data.length).toBe(10);
});
test("imports stay accessible independently of remote catalogue errors", async () => {
  const x = setup();
  await x.repo.add("Landscape", 90, image);
  x.catalogue.listPublished = async () => fail("offline", "Offline");
  expect((await x.repo.list()).ok).toBe(true);
  expect((await x.repo.getPublishedById("custom-id-1")).ok).toBe(true);
});
test("remove survives restart and file cleanup failures, and rejects catalogue ids", async () => {
  const x = setup();
  await x.repo.add("Landscape", 90, image);
  x.images.remove.mockRejectedValueOnce(new Error("Busy file"));
  expect((await x.repo.remove("custom-id-1")).ok).toBe(true);
  expect(await x.make().list()).toEqual(ok([]));
  expect((await x.repo.remove("art-01")).ok).toBe(false);
});

test("failed removal metadata commit preserves the imported image and record", async () => {
  const x = setup();
  await x.repo.add("Landscape", 90, image);
  x.store.setItem.mockRejectedValueOnce(new Error("disk"));
  expect((await x.repo.remove("custom-id-1")).ok).toBe(false);
  expect(x.images.remove).not.toHaveBeenCalled();
  expect(await x.make().list()).toMatchObject({
    ok: true,
    data: [{ id: "custom-id-1" }],
  });
});
test("corrupt persisted import data is rejected rather than rendered", async () => {
  const x = setup();
  x.memory.set(
    PERSONAL_ARTWORKS_KEY,
    JSON.stringify([{ id: "custom-x", imageUrl: "javascript:bad" }]),
  );
  expect((await x.repo.list()).ok).toBe(false);
});

test("matching fingerprints require explicit duplicate approval and survive recreation", async () => {
  const x = setup(),
    contentHash = "a".repeat(64);
  const first = await x.repo.add("Original", 60, { ...image, contentHash });
  expect(first.ok).toBe(true);
  const duplicate = await x
    .make()
    .add("Another", 60, { ...image, contentHash });
  expect(duplicate).toMatchObject({
    ok: false,
    error: { code: "import-duplicate" },
  });
  expect(x.images.persist).toHaveBeenCalledTimes(1);
  expect(
    (
      await x.repo.add("Approved copy", 60, {
        ...image,
        contentHash,
        allowDuplicate: true,
      })
    ).ok,
  ).toBe(true);
  expect(x.images.remove).not.toHaveBeenCalled();
});
