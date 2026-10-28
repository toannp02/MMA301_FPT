import { newSpace } from "../../src/features/studio/createSpace";
import { makePiece, validSpace } from "../../src/domain/spaces";
import {
  frameProfiles,
  resizeArtwork,
  roomViewport,
} from "../../src/features/studio/styleEditing";
import {
  sceneGraphic,
  sceneSVG,
  shadowLayers,
} from "../../src/features/studio/rendering";
import type { Artwork } from "../../src/domain/models";
const art: Artwork = {
  id: "art1",
  title: "Art",
  description: "",
  categoryId: "test",
  imageUrl: "file:///art.jpg",
  thumbnailUrl: "file:///art.jpg",
  widthCm: 60,
  heightCm: 90,
  status: "published",
  isFeatured: false,
};

function fixture() {
  const space = newSpace("style-room", "Room", {
    uri: "file:///room.jpg",
    width: 1200,
    height: 900,
  });
  space.pieces = [makePiece(art, "piece1")];
  return space;
}

test("explicit dimensions preserve the original and other design metadata, reject invalid inputs and fit oversized art", () => {
  const space = fixture(),
    before = JSON.stringify(space);
  const resized = resizeArtwork(space, "piece1", 78.4, 66);
  expect(
    resized.pieces[0].artwork.widthCm * resized.pieces[0].scale,
  ).toBeCloseTo(78.4);
  expect(
    resized.pieces[0].artwork.heightCm * resized.pieces[0].scale,
  ).toBeCloseTo(66);
  expect(JSON.stringify(space)).toBe(before);
  expect(() => resizeArtwork(space, "piece1", NaN, 50)).toThrow();
  expect(() => resizeArtwork(space, "piece1", 0, 50)).toThrow();
  const big = resizeArtwork(space, "piece1", 1000, 1000);
  expect(big.pieces[0].scale).toBeLessThan(1);
  expect(validSpace(big)).toBe(true);
});
test("room zoom clamps panning to the photo and leaves the reset/full-export rectangle unchanged", () => {
  const stage = { width: 400, height: 600 };
  expect(roomViewport(stage, 4 / 3)).toEqual({
    width: 400,
    height: 300,
    left: 0,
    top: 150,
  });
  expect(roomViewport(stage, 4 / 3, 2, { x: 10000, y: -10000 })).toEqual({
    width: 800,
    height: 600,
    left: 0,
    top: 0,
  });
  expect(roomViewport(stage, 4 / 3, 0.1)).toEqual(roomViewport(stage, 4 / 3));
  expect(roomViewport(stage, 4 / 3, 100).width).toBe(1600);
});
test("shadow angle changes direction, softness changes spread, and zero intensity removes the shadow", () => {
  const space = fixture(),
    piece = sceneGraphic(space, 1200, 900).pieces[0];
  piece.appearance = {
    ...piece.appearance,
    shadow: 0.5,
    shadowOffset: 2,
    shadowAngle: 0,
    shadowSoftness: 0,
  };
  const hard = shadowLayers(piece, 1200, 900);
  expect(hard).toHaveLength(4);
  expect(hard[3].quad[0].x - piece.outer[0].x).toBeCloseTo(16.2);
  expect(hard[3].quad[0].y).toBe(piece.outer[0].y);
  piece.appearance.shadowAngle = 90;
  expect(
    shadowLayers(piece, 1200, 900)[3].quad[0].y - piece.outer[0].y,
  ).toBeCloseTo(16.2);
  piece.appearance.shadowSoftness = 14;
  expect(shadowLayers(piece, 1200, 900)).toHaveLength(28);
  piece.appearance.shadow = 0;
  expect(shadowLayers(piece, 1200, 900)).toEqual([]);
});
test("frame presets and optional light fields remain valid in saved spaces and exported graphics", () => {
  for (const profile of frameProfiles) {
    const space = fixture();
    Object.assign(space.pieces[0].appearance, profile.appearance, {
      shadowAngle: -22,
      shadowSoftness: 14,
    });
    expect(validSpace(space)).toBe(true);
    expect(sceneSVG(space, 1200, 900)).not.toContain("NaN");
    space.pieces[0].appearance.shadowSoftness = -1;
    expect(validSpace(space)).toBe(false);
  }
});
