import { newSpace } from "../../src/features/studio/createSpace";
import { makePiece, validSpace } from "../../src/domain/spaces";
import type { Artwork } from "../../src/domain/models";
import {
  insideQuad,
  artworkAtPoint,
} from "../../src/features/studio/directManipulation";
import {
  depthFaces,
  edgeStrips,
  sceneGraphic,
  sceneSVG,
  shadowLayers,
} from "../../src/features/studio/rendering";
const art: Artwork = {
  id: "a",
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
  const s = newSpace("room", "Room", {
    uri: "file:///room.jpg",
    width: 1200,
    height: 900,
  });
  s.pieces = [makePiece(art, "p")];
  return s;
}
test("perspective hit test rejects empty corners of the bounding box and picks the topmost overlapping art", () => {
  const q = [
    { x: 0, y: 0.5 },
    { x: 0.5, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 1 },
  ] as const;
  expect(insideQuad({ x: 0.05, y: 0.05 }, [...q])).toBe(false);
  expect(insideQuad({ x: 0.5, y: 0.5 }, [...q])).toBe(true);
  const s = fixture();
  s.pieces.push({ ...s.pieces[0], id: "top" });
  expect(
    artworkAtPoint(
      s,
      { left: -400, top: -300, width: 2000, height: 1500 },
      { x: 600, y: 405 },
    ),
  ).toBe("top");
  expect(
    artworkAtPoint(
      s,
      { left: 0, top: 0, width: 1200, height: 900 },
      { x: 1, y: 1 },
    ),
  ).toBeNull();
});
test("thickness creates shaded edge faces, scales with output size and changes shadow reach", () => {
  const s = fixture();
  s.pieces[0].appearance.depthCm = 3;
  const p = sceneGraphic(s, 1200, 900).pieces[0];
  const faces = depthFaces(p, 1200, 900);
  expect(faces).toHaveLength(4);
  expect(new Set(faces.map((f) => f.fill)).size).toBeGreaterThan(1);
  expect(sceneSVG(s, 1200, 900)).toContain(faces[0].fill);
  const original = shadowLayers(p, 1200, 900)[3].quad[0].x;
  p.appearance = { ...p.appearance, depthCm: 6 };
  expect(shadowLayers(p, 1200, 900)[3].quad[0].x).toBeGreaterThan(original);
  p.appearance.depthCm = 0;
  expect(depthFaces(p, 1200, 900)).toEqual([]);
  s.pieces[0].appearance.depthCm = 11;
  expect(validSpace(s)).toBe(false);
});
test("contact shadow hugs the frame, edges catch light on the lit side and shade away from it", () => {
  const s = fixture();
  s.pieces[0].appearance = {
    ...s.pieces[0].appearance,
    frame: "black",
    frameCm: 3,
    mountCm: 4,
    shadow: 0.6,
    shadowAngle: 90,
  };
  const p = sceneGraphic(s, 1200, 900).pieces[0];
  const layers = shadowLayers(p, 1200, 900);
  const contact = layers.slice(0, 3);
  // Darkest contact layer is drawn last and sits closest to the frame.
  expect(contact.map((l) => l.opacity)).toEqual(
    [...contact.map((l) => l.opacity)].sort((a, b) => a - b),
  );
  const reach = (l: (typeof layers)[number]) =>
    Math.abs(l.quad[0].x - p.outer[0].x);
  expect(reach(contact[2])).toBeLessThan(reach(contact[0]));
  expect(reach(contact[0])).toBeLessThan(8);
  // Light from above (shadow falls down): top outer edge is highlighted,
  // bottom outer edge darkened, and the inner top lip shades the mount.
  const strips = edgeStrips(p, 1200, 900);
  const top = Math.min(...p.outer.map((v) => v.y)),
    bottom = Math.max(...p.outer.map((v) => v.y)),
    mountTop = Math.min(...p.mount.map((v) => v.y));
  const at = (y: number) =>
    strips.find((strip) =>
      strip.quad.slice(0, 2).every((v) => Math.abs(v.y - y) < 1e-6),
    );
  expect(at(top)?.fill).toBe("white");
  expect(at(bottom)?.fill).toBe("black");
  expect(at(mountTop)?.fill).toBe("black");
  expect(sceneSVG(s, 1200, 900)).toContain(`opacity="${at(top)?.opacity}"`);
  // Frameless canvases keep the outer bevel but no inner lip.
  s.pieces[0].appearance.frame = "none";
  const bare = sceneGraphic(s, 1200, 900).pieces[0];
  expect(edgeStrips(bare, 1200, 900).length).toBeLessThan(strips.length);
  // Depth side facing the shadow is darker than the one facing the light.
  s.pieces[0].appearance = {
    ...s.pieces[0].appearance,
    depthCm: 3,
    frame: "wood",
  };
  const faces = depthFaces(sceneGraphic(s, 1200, 900).pieces[0], 1200, 900);
  const lum = (fill: string) =>
    fill
      .match(/\d+/g)!
      .map(Number)
      .reduce((a, b) => a + b, 0);
  expect(lum(faces[2].fill)).toBeLessThan(lum(faces[0].fill));
});
