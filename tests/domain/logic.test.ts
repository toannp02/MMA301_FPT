import {
  clampScale,
  dimensionsMeters,
  validateCredentials,
  positiveDimension,
  filterArtworks,
  validId,
  validDesign,
} from "../../src/domain/validators";
import {
  artworkMapper,
  userMapper,
  designMapper,
} from "../../src/data/mappers";
import type { Artwork, SavedDesign } from "../../src/domain/models";
const a: Artwork = {
  id: "one",
  title: "Quiet Sun",
  description: "",
  categoryId: "earth",
  imageUrl: "https://example.com/a.png",
  thumbnailUrl: "https://example.com/a.png",
  widthCm: 60,
  heightCm: 90,
  isFeatured: true,
  status: "published",
};
test.each([
  [0, 0.5],
  [0.5, 0.5],
  [1, 1],
  [3, 2],
  [NaN, 1],
  [Infinity, 1],
])("scale %s clamps to %s", (input, expected) =>
  expect(clampScale(input)).toBe(expected),
);
test("dimensions remain proportional in meters", () => {
  expect(dimensionsMeters(60, 90, 2)).toEqual({ width: 1.2, height: 1.8 });
});
test.each([0, -1, NaN, Infinity, 1001])("invalid physical dimension %s", (n) =>
  expect(positiveDimension(n)).toBe(false),
);
test("credential validation and display name bounds", () => {
  expect(validateCredentials("bad", "longpassword")).toMatch(/email/);
  expect(validateCredentials("a@b.com", "short")).toMatch(/password/);
  expect(validateCredentials("a@b.com", "longpassword", "A")).toMatch(/name/);
  expect(validateCredentials("a@b.com", "longpassword", "Alice")).toBeNull();
});
test("search and category compose; hidden records never returned", () => {
  const items = [
    a,
    { ...a, id: "hidden", status: "hidden" as const },
    { ...a, id: "two", title: "Blue", categoryId: "abstract" },
  ];
  expect(filterArtworks(items, " SUN ", "earth")).toEqual([a]);
  expect(filterArtworks(items, "unmatched", null)).toEqual([]);
  expect(filterArtworks(items, "", "abstract")).toHaveLength(1);
});
test.each(["../A", "", "A/B", "a.b"])("unsafe path %s rejected", (id) =>
  expect(validId(id)).toBe(false),
);
test("artwork mapper rejects malformed or hidden data", () => {
  expect(artworkMapper("one", { ...a })).toEqual(a);
  for (const bad of [
    { ...a, widthCm: NaN },
    { ...a, status: "hidden" },
    { ...a, imageUrl: "http://unsafe" },
    {},
  ])
    expect(() => artworkMapper("one", bad)).toThrow();
});
test("profile timestamp conversion and missing fields", () => {
  const time = { toDate: () => new Date("2026-10-27T00:00:00Z") };
  expect(
    userMapper("A", "trusted@auth.com", {
      displayName: "Alice",
      avatarUrl: null,
      createdAt: time,
      updatedAt: time,
    }).email,
  ).toBe("trusted@auth.com");
  expect(() => userMapper("A", "", {})).toThrow();
});
test("design owner and nullability checks", () => {
  const d: SavedDesign = {
    id: "d",
    userId: "A",
    artworkId: "one",
    sourceKind: "catalog",
    sourceImageUri: null,
    capturedImageUri: "file:///a.jpg",
    imageStoragePath: null,
    storageMode: "local",
    widthCm: 60,
    heightCm: 90,
    scaleFactor: 1,
    frameStyle: "none",
    createdAt: new Date().toISOString(),
  };
  expect(validDesign(d, "A")).toBe(true);
  expect(validDesign(d, "B")).toBe(false);
  expect(validDesign({ ...d, scaleFactor: NaN }, "A")).toBe(false);
});
test("cloud mapper rejects type coercion, unknown frame, source and foreign storage paths", () => {
  const data = {
    artworkId: "one",
    sourceKind: "catalog",
    imageStoragePath: "designs/A/d.jpg",
    widthCm: 60,
    heightCm: 90,
    scaleFactor: 1,
    frameStyle: "none",
    createdAt: { toDate: () => new Date("2026-10-27T00:00:00Z") },
  };
  expect(
    designMapper("A", "d", data, "https://example.com/image"),
  ).toMatchObject({ widthCm: 60 });
  for (const patch of [
    { widthCm: "60" },
    { frameStyle: "gold" },
    { sourceKind: "custom" },
    { imageStoragePath: "designs/B/d.jpg" },
  ])
    expect(() =>
      designMapper(
        "A",
        "d",
        { ...data, ...patch },
        "https://example.com/image",
      ),
    ).toThrow();
});
