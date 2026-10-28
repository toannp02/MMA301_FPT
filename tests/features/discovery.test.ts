import {
  emptyQuery,
  filterArtworks,
} from "../../src/features/studio/discovery";
import type { Artwork } from "../../src/domain/models";
const base: Artwork = {
  id: "a",
  title: "Blue Horizon",
  description: "Oil painting",
  categoryId: "abstract",
  imageUrl: "file:///a.jpg",
  thumbnailUrl: "file:///a.jpg",
  widthCm: 90,
  heightCm: 60,
  isFeatured: false,
  status: "published",
};
const items = [
  base,
  {
    ...base,
    id: "b",
    title: "Forest",
    categoryId: "botanical",
    widthCm: 30,
    heightCm: 60,
  },
  { ...base, id: "c", title: "Moon", widthCm: 60, heightCm: 60 },
];
test("search, physical size, orientation and actual categories compose", () => {
  expect(
    filterArtworks(items, {
      ...emptyQuery,
      text: " BLUE ",
      orientation: "landscape",
      maxWidthCm: "90",
      category: "abstract",
    }).map((a) => a.id),
  ).toEqual(["a"]);
  expect(
    filterArtworks(items, {
      ...emptyQuery,
      orientation: "portrait",
      maxWidthCm: "30,5",
    }).map((a) => a.id),
  ).toEqual(["b"]);
  expect(
    filterArtworks(items, { ...emptyQuery, orientation: "square" }).map(
      (a) => a.id,
    ),
  ).toEqual(["c"]);
});
test("invalid size filters cannot accidentally expose all results", () => {
  expect(filterArtworks(items, { ...emptyQuery, maxWidthCm: "oops" })).toEqual(
    [],
  );
  expect(filterArtworks(items, emptyQuery)).toHaveLength(3);
});
