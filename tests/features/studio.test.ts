import { applyEditorChange } from "../../src/features/studio/editorState";
import { newSpace } from "../../src/features/studio/createSpace";
import {
  homography,
  invert,
  project,
  pieceQuad,
  fitSpace,
  layoutPieces,
  affineTriangle,
} from "../../src/features/studio/geometry";
import {
  sceneSVG,
  sceneGraphic,
  appearanceMatrix,
} from "../../src/features/studio/rendering";
import {
  validQuad,
  validSpace,
  defaultAppearance,
  type Quad,
} from "../../src/domain/spaces";
import type { Artwork } from "../../src/domain/models";
export const artwork: Artwork = {
  id: "art1",
  title: "Test painting",
  description: "",
  categoryId: "test",
  imageUrl: "https://example.com/art.png",
  thumbnailUrl: "https://example.com/art.png",
  widthCm: 60,
  heightCm: 90,
  isFeatured: false,
  status: "published",
};
export const room = { uri: "file:///room.jpg", width: 1200, height: 900 };
const corners: Quad = [
  { x: 0.1, y: 0.1 },
  { x: 0.95, y: 0.2 },
  { x: 0.7, y: 0.9 },
  { x: 0.2, y: 0.75 },
];

test.each([
  "10.33.92.163",
  "172.16.0.2",
  "172.31.255.254",
  "192.168.1.5",
  "127.0.0.1",
  "localhost",
  "[::1]",
])("Expo Go LAN assets on %s can be saved", (host) => {
  expect(
    validSpace(
      newSpace("lan-room", "LAN room", room, {
        ...artwork,
        imageUrl: `http://${host}:8082/assets/art.png?hash=1`,
      }),
    ),
  ).toBe(true);
});
test.each([
  "localhost.evil.test",
  "192.168.evil.test",
  "172.32.0.1",
  "8.8.8.8",
  "10.0.0.1@public.test",
])("HTTP host %s is not accepted as a local asset", (host) => {
  expect(
    validSpace(
      newSpace("lan-room", "LAN room", room, {
        ...artwork,
        imageUrl: `http://${host}:8082/art.png`,
      }),
    ),
  ).toBe(false);
});
test("perspective maps all four corners and inverse recovers wall coordinates", () => {
  const m = homography(corners),
    inv = invert(m);
  const unit = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  unit.forEach((p, i) => {
    const q = project(m, p);
    expect(q.x).toBeCloseTo(corners[i].x);
    expect(q.y).toBeCloseTo(corners[i].y);
  });
  for (let x = 0; x <= 1; x += 0.1)
    for (let y = 0; y <= 1; y += 0.1) {
      const q = project(inv, project(m, { x, y }));
      expect(q.x).toBeCloseTo(x);
      expect(q.y).toBeCloseTo(y);
    }
});
test("crossed, off-photo, degenerate and non-finite wall corners are rejected", () => {
  expect(validQuad(corners)).toBe(true);
  expect(validQuad([corners[0], corners[2], corners[1], corners[3]])).toBe(
    false,
  );
  expect(validQuad(corners.map(() => ({ x: 0.5, y: 0.5 })))).toBe(false);
  expect(validQuad([{ x: NaN, y: 0 }, ...corners.slice(1)])).toBe(false);
  expect(validQuad([{ x: -1, y: 0 }, ...corners.slice(1)])).toBe(false);
  expect(() =>
    homography([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]),
  ).toThrow();
});
test("affine texture triangles preserve each source vertex", () => {
  const from: [
      { x: number; y: number },
      { x: number; y: number },
      { x: number; y: number },
    ] = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 0, y: 100 },
    ],
    to: [
      { x: number; y: number },
      { x: number; y: number },
      { x: number; y: number },
    ] = [
      { x: 20, y: 30 },
      { x: 130, y: 40 },
      { x: 15, y: 80 },
    ];
  const [a, b, c, d, e, f] = affineTriangle(from, to);
  from.forEach((p, i) => {
    expect(a * p.x + c * p.y + e).toBeCloseTo(to[i].x);
    expect(b * p.x + d * p.y + f).toBeCloseTo(to[i].y);
  });
});
test.each([0, 20, 45, 90, -45, 180])(
  "rotated oversized artwork stays on wall at %s degrees",
  (rotation) => {
    const space = newSpace("wall1", "Test", room, artwork);
    space.wall.widthCm = 10;
    space.wall.heightCm = 10;
    space.wall.corners = corners;
    space.pieces[0] = {
      ...space.pieces[0],
      rotation,
      scale: 5,
      center: { x: 0, y: 1 },
    };
    const fitted = fitSpace(space),
      piece = fitted.pieces[0],
      inv = invert(homography(corners));
    const padding = piece.appearance.frameCm + piece.appearance.mountCm;
    pieceQuad(fitted, piece, padding).forEach((p) => {
      const q = project(inv, p);
      expect(q.x).toBeGreaterThanOrEqual(-1e-8);
      expect(q.y).toBeGreaterThanOrEqual(-1e-8);
      expect(q.x).toBeLessThanOrEqual(1 + 1e-8);
      expect(q.y).toBeLessThanOrEqual(1 + 1e-8);
    });
    expect(validSpace(fitted)).toBe(true);
  },
);
test.each(["single", "pair", "stack", "row", "column", "grid"] as const)(
  "%s layout is bounded and generates unique slots",
  (kind) => {
    const space = newSpace("wall1", "Test", room, artwork);
    const pieces = layoutPieces(space, kind, 9);
    expect(pieces.length).toBe(
      kind === "single" ? 1 : kind === "pair" || kind === "stack" ? 2 : 9,
    );
    expect(new Set(pieces.map((p) => p.id)).size).toBe(pieces.length);
    const fitted = fitSpace({ ...space, pieces });
    expect(validSpace(fitted)).toBe(true);
    const inverse = invert(homography(space.wall.corners));
    fitted.pieces.forEach((piece) =>
      pieceQuad(fitted, piece).forEach((p) => {
        const q = project(inverse, p);
        expect(q.x).toBeGreaterThanOrEqual(0);
        expect(q.x).toBeLessThanOrEqual(1);
        expect(q.y).toBeGreaterThanOrEqual(0);
        expect(q.y).toBeLessThanOrEqual(1);
      }),
    );
  },
);
test("default colour matrix preserves RGB and alpha", () => {
  expect(appearanceMatrix(defaultAppearance)).toEqual(
    expect.arrayContaining([1, 0]),
  );
  const m = appearanceMatrix(defaultAppearance);
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0].forEach((v, i) =>
    expect(m[i]).toBeCloseTo(v),
  );
});
test("export reuses image definitions and escapes source strings", () => {
  const space = newSpace("wall1", "Test", room, artwork);
  space.pieces = layoutPieces(space, "pair", 2);
  const graphic = sceneGraphic(space, 1200, 900);
  expect(graphic.images).toHaveLength(1);
  expect(graphic.pieces[0].triangles).toHaveLength(32);
  const svg = sceneSVG(space, 1200, 900, true);
  expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  expect(svg).toContain("feColorMatrix");
  expect(svg).not.toContain("NaN");
  expect(svg).not.toContain("Infinity");
  expect(svg).toContain("clip0_7_7_1");
});

test("manual foreground mask persists valid strokes and exports a luminance mask", () => {
  const space = newSpace("wall1", "Test", room, artwork);
  space.wall.foregroundStrokes = [
    {
      radius: 0.03,
      points: [
        { x: 0.2, y: 0.5 },
        { x: 0.4, y: 0.6 },
      ],
    },
  ];
  expect(validSpace(space)).toBe(true);
  expect(sceneSVG(space, 1200, 900)).toContain('id="painted-foreground"');
  space.wall.foregroundStrokes[0].points[0].x = 2;
  expect(validSpace(space)).toBe(false);
});

test("repeated identical layout events preserve editor and texture identity", () => {
  const space = newSpace("wall1", "Test", room, artwork),
    state = { space, selected: space.pieces[0].id, mode: "browse" };
  expect(applyEditorChange(state, state)).toBe(state);
  const next = applyEditorChange(state, { ...state, mode: "wall" });
  expect(next.space).toBe(space);
  expect(next.mode).toBe("wall");
});
test("removed selected slots recover to a surviving piece", () => {
  const space = newSpace("wall1", "Test", room, artwork),
    state = { space, selected: "deleted_slot" };
  expect(applyEditorChange(state, { ...state })).toMatchObject({
    selected: space.pieces[0].id,
  });
});

test("explicit deselection survives subsequent layout and editor updates", () => {
  const space = newSpace("wall1", "Test", room, artwork),
    state = { space, selected: space.pieces[0].id as string | null };
  const deselected = applyEditorChange(state, { ...state, selected: null });
  expect(deselected.selected).toBeNull();
  expect(applyEditorChange(deselected, { ...deselected }).selected).toBeNull();
});
test("layout spacing retains physical frame widths when artwork is fitted", () => {
  const space = newSpace("wall1", "Test", room, artwork);
  space.pieces = layoutPieces(space, "row", 9);
  const left = space.pieces[0],
    right = space.pieces[1];
  const distance = (right.center.x - left.center.x) * space.wall.widthCm;
  const gap =
    distance -
    left.artwork.widthCm * left.scale -
    left.appearance.frameCm -
    right.appearance.frameCm;
  expect(gap).toBeCloseTo(
    Math.min(space.gapCm, (space.wall.widthCm * 0.1) / 8),
  );
});
