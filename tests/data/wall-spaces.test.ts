import { WallSpaceRepository } from "../../src/data/local/WallSpaceRepository";
import { newSpace } from "../../src/features/studio/createSpace";
import type { Artwork } from "../../src/domain/models";
const art: Artwork = {
  id: "a1",
  title: "Painting",
  description: "",
  categoryId: "a",
  imageUrl: "file:///art.jpg",
  thumbnailUrl: "file:///art.jpg",
  widthCm: 60,
  heightCm: 90,
  isFeatured: false,
  status: "published",
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
    persist: jest.fn(async (id: string, key: string, uri: string) => ({
      uri: uri.startsWith("file:///saved/")
        ? uri
        : `file:///saved/${id}/${key}.jpg`,
      created: !uri.startsWith("file:///saved/"),
      key,
    })),
    remove: jest.fn(async () => undefined),
    removeSpace: jest.fn(async () => undefined),
  };
  return {
    memory,
    store,
    images,
    repo: new WallSpaceRepository(store, images),
  };
}
const make = () =>
  newSpace(
    "wall1",
    "My room",
    { uri: "file:///room.jpg", width: 1200, height: 900 },
    art,
  );
test("saved spaces survive repository recreation with owned room/art snapshots", async () => {
  const x = setup();
  const saved = await x.repo.save(make());
  expect(saved.ok).toBe(true);
  if (!saved.ok) throw Error();
  expect(saved.data.room.uri).toBe("file:///saved/wall1/room.jpg");
  expect(saved.data.pieces[0].artwork.imageUrl).toContain("/art_a1.jpg");
  expect(await new WallSpaceRepository(x.store, x.images).get("wall1")).toEqual(
    saved,
  );
});
test("failed metadata write rolls back only newly created images", async () => {
  const x = setup();
  x.store.setItem.mockRejectedValueOnce(new Error("disk"));
  expect((await x.repo.save(make())).ok).toBe(false);
  expect(x.images.remove).toHaveBeenCalledTimes(2);
  expect(x.memory.size).toBe(0);
});
test("all rollback deletions are attempted even if one fails", async () => {
  const x = setup();
  x.store.setItem.mockRejectedValueOnce(new Error("disk"));
  x.images.remove.mockRejectedValueOnce(new Error("delete"));
  expect((await x.repo.save(make())).ok).toBe(false);
  expect(x.images.remove).toHaveBeenCalledTimes(2);
});
test("stale concurrent editor cannot overwrite newer content", async () => {
  const x = setup();
  const first = await x.repo.save(make());
  if (!first.ok) throw Error();
  const a = { ...first.data, name: "Editor A" },
    b = { ...first.data, name: "Editor B" };
  const [left, right] = await Promise.all([x.repo.save(a), x.repo.save(b)]);
  expect(left.ok).toBe(true);
  expect(right).toMatchObject({ ok: false, error: { code: "space-conflict" } });
  expect(await x.repo.get("wall1")).toMatchObject({
    ok: true,
    data: { name: "Editor A" },
  });
});
test("malformed stored metadata is preserved and returns a recoverable error", async () => {
  const x = setup();
  x.memory.set("artspace:wall-spaces:v1", "[null]");
  expect((await x.repo.list()).ok).toBe(false);
  expect(x.memory.get("artspace:wall-spaces:v1")).toBe("[null]");
  expect(x.images.removeSpace).not.toHaveBeenCalled();
});
test("invalid input cannot trigger image operations", async () => {
  const x = setup();
  expect((await x.repo.save({ ...make(), name: "" })).ok).toBe(false);
  expect(x.images.persist).not.toHaveBeenCalled();
});
test("removing a space deletes only its app-owned folder", async () => {
  const x = setup();
  await x.repo.save(make());
  expect((await x.repo.remove("wall1")).ok).toBe(true);
  expect(x.images.removeSpace).toHaveBeenCalledWith("wall1");
  expect(await x.repo.get("wall1")).toEqual({ ok: true, data: null });
});
test("file cleanup failure does not resurrect a deleted room", async () => {
  const x = setup();
  await x.repo.save(make());
  x.images.removeSpace.mockRejectedValueOnce(new Error("busy"));
  expect((await x.repo.remove("wall1")).ok).toBe(true);
  expect(await x.repo.get("wall1")).toEqual({ ok: true, data: null });
});

test("failed removal metadata commit leaves the room and every image intact", async () => {
  const x = setup();
  await x.repo.save(make());
  x.store.setItem.mockRejectedValueOnce(new Error("storage full"));
  expect((await x.repo.remove("wall1")).ok).toBe(false);
  expect(x.images.removeSpace).not.toHaveBeenCalled();
  expect(await x.repo.get("wall1")).toMatchObject({
    ok: true,
    data: { id: "wall1" },
  });
});
