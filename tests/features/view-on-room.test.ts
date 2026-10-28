import { newSpace } from "../../src/features/studio/createSpace";
import { placeArtworkInRoom } from "../../src/features/studio/placeArtwork";
import { validSpace } from "../../src/domain/spaces";
import { sceneSVG } from "../../src/features/studio/rendering";
import type { Artwork } from "../../src/domain/models";
const art: Artwork = {
  id: "a1",
  title: "New artwork",
  description: "",
  categoryId: "test",
  imageUrl: "file:///new.jpg",
  thumbnailUrl: "file:///new.jpg",
  widthCm: 60,
  heightCm: 90,
  status: "published",
  isFeatured: false,
};
test("view on room applies one piece with photo tone, natural shadow and fitted proportions", () => {
  const original = newSpace("room1", "My room", {
    uri: "file:///room.jpg",
    width: 1200,
    height: 900,
  });
  original.wall.photoAssist = {
    confidence: 0.8,
    brightness: -0.03,
    warmth: 0.1,
  };
  const before = JSON.stringify(original),
    result = placeArtworkInRoom(original, art);
  expect(result.pieces).toHaveLength(1);
  expect(result.pieces[0].artwork.id).toBe(art.id);
  expect(result.pieces[0].appearance).toMatchObject({
    frame: "none",
    shadow: 0.3,
    shadowOffset: 0.7,
    brightness: -0.03,
    warmth: 0.1,
  });
  expect(validSpace(result)).toBe(true);
  expect(JSON.stringify(original)).toBe(before);
});
test("selecting another artwork preserves calibrated wall, slot position, frame and other pieces", () => {
  const original = newSpace(
    "room1",
    "My room",
    { uri: "file:///room.jpg", width: 1200, height: 900 },
    art,
  );
  original.wall.measurement = "manual";
  original.pieces.push({
    ...original.pieces[0],
    id: "second",
    center: { x: 0.75, y: 0.4 },
  });
  const before = JSON.stringify(original);
  const result = placeArtworkInRoom(
    original,
    { ...art, id: "a2", title: "Another art" },
    "second",
  );
  expect(result.pieces[0].artwork.id).toBe("a1");
  expect(result.pieces[1].artwork.id).toBe("a2");
  expect(result.pieces[1].center).toEqual(original.pieces[1].center);
  expect(result.wall).toEqual(original.wall);
  expect(JSON.stringify(original)).toBe(before);
});
test("shadow offset and occlusion switch persist and match exported render", () => {
  const space = newSpace(
    "room1",
    "My room",
    { uri: "file:///room.jpg", width: 1200, height: 900 },
    art,
  );
  space.pieces[0].appearance.shadowOffset = 1.27;
  space.wall.foregroundStrokes = [
    {
      radius: 0.02,
      points: [
        { x: 0.5, y: 0.5 },
        { x: 0.6, y: 0.5 },
      ],
    },
  ];
  expect(validSpace(space)).toBe(true);
  expect(sceneSVG(space, 1200, 900)).toContain('id="painted-foreground"');
  space.wall.occlusionEnabled = false;
  expect(sceneSVG(space, 1200, 900)).not.toContain('id="painted-foreground"');
  space.pieces[0].appearance.shadowOffset = NaN;
  expect(validSpace(space)).toBe(false);
});

test("microscopic resizes cannot crash the perspective texture renderer", () => {
  const space = newSpace(
    "tiny",
    "My room",
    { uri: "file:///room.jpg", width: 1200, height: 900 },
    art,
  );
  space.wall.widthCm = 5000;
  space.wall.heightCm = 5000;
  space.pieces[0].artwork.widthCm = 0.1;
  space.pieces[0].artwork.heightCm = 0.1;
  space.pieces[0].scale = 0.001;
  expect(() => sceneSVG(space, 390, 844)).not.toThrow();
});
