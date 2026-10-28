import { inflateSync } from "node:zlib";
import { suggestWall } from "../../src/features/studio/photoAssist";
import { wallMaskPNG } from "../../src/features/studio/maskPng";
import { validQuad } from "../../src/domain/spaces";
function room() {
  const w = 64,
    h = 64,
    data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const colour =
        y < 12
          ? [140, 140, 140]
          : y > 55
            ? [80, 70, 60]
            : x > 25 && x < 55 && y > 38
              ? [20, 25, 28]
              : [225, 218, 207];
      data.set([...colour, 255], (y * w + x) * 4);
    }
  return { w, h, data };
}
test("suggests a smooth upper wall without placing the default rectangle over furniture", () => {
  const image = room(),
    result = suggestWall(image.data, image.w, image.h);
  expect(result).not.toBeNull();
  if (!result) throw Error();
  expect(validQuad(result.corners)).toBe(true);
  expect(result.corners[2].y).toBeLessThan(0.62);
  expect(result.wallPixels[45 * 64 + 40]).toBe(0);
  expect(result.wallPixels[20 * 64 + 20]).toBe(1);
  expect(result.confidence).toBeGreaterThan(0.6);
  expect(Math.abs(result.warmth)).toBeLessThanOrEqual(0.25);
});
test("unsupported, dark and corrupt pixel buffers do not fabricate a confident wall", () => {
  expect(suggestWall(new Uint8Array(4), 1, 1)).toBeNull();
  expect(suggestWall(new Uint8Array(100), 64, 64)).toBeNull();
  const dark = new Uint8Array(64 * 64 * 4);
  for (let i = 0; i < dark.length; i += 4) dark.set([15, 15, 15, 255], i);
  expect(suggestWall(dark, 64, 64)).toBeNull();
});
test("mask PNG has valid independent DEFLATE scanlines, without a Node Buffer dependency", () => {
  const png = wallMaskPNG(Uint8Array.from([1, 0, 0, 1]), 2, 2);
  expect(Array.from(png.slice(0, 8))).toEqual([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);
  let at = 8,
    compressed: Uint8Array | undefined;
  while (at < png.length) {
    const view = new DataView(png.buffer, png.byteOffset + at, 4),
      len = view.getUint32(0);
    const name = String.fromCharCode(...png.slice(at + 4, at + 8));
    if (name === "IDAT") compressed = png.slice(at + 8, at + 8 + len);
    at += 12 + len;
  }
  expect(compressed).toBeDefined();
  expect(Array.from(inflateSync(compressed!))).toEqual([0, 0, 255, 0, 255, 0]);
  expect(() => wallMaskPNG(new Uint8Array(3), 2, 2)).toThrow();
});
