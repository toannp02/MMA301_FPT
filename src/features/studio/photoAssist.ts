import type { Quad } from "../../domain/spaces";

export interface PhotoSuggestion {
  corners: Quad;
  confidence: number;
  brightness: number;
  warmth: number;
  wallPixels: Uint8Array;
  width: number;
  height: number;
}
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/** A conservative, local colour/texture suggestion, never a measured wall or 3D scan. */
export function suggestWall(
  data: Uint8Array,
  width: number,
  height: number,
): PhotoSuggestion | null {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 8 ||
    height < 8 ||
    width > 128 ||
    height > 128 ||
    data.length !== width * height * 4
  )
    return null;
  let best: {
    score: number;
    mask: Uint8Array;
    rect: { x: number; y: number; w: number; h: number };
    rgb: number[];
    area: number;
  } | null = null;
  for (const sy of [0.22, 0.35, 0.48])
    for (const sx of [0.18, 0.4, 0.62, 0.82]) {
      const seedX = Math.floor(sx * width),
        seedY = Math.floor(sy * height),
        offset = (seedY * width + seedX) * 4;
      const rgb = [data[offset], data[offset + 1], data[offset + 2]],
        luminance = rgb.reduce((a, b) => a + b, 0) / 3;
      if (luminance < 55) continue;
      const mask = new Uint8Array(width * height),
        seen = new Uint8Array(width * height),
        queue = [seedY * width + seedX];
      let area = 0;
      while (queue.length) {
        const i = queue.pop()!;
        if (seen[i]) continue;
        seen[i] = 1;
        const x = i % width,
          y = Math.floor(i / width);
        if (
          x < width * 0.04 ||
          x >= width * 0.96 ||
          y < height * 0.1 ||
          y >= height * 0.87
        )
          continue;
        const p = i * 4;
        const distance = Math.sqrt(
          rgb.reduce((sum, c, k) => sum + (data[p + k] - c) ** 2, 0),
        );
        if (distance > 62) continue;
        const texture = Math.max(
          ...[1, width].map((step) =>
            Math.abs(data[p] - data[Math.min(data.length - 4, (i + step) * 4)]),
          ),
        );
        if (texture > 40) continue;
        mask[i] = 1;
        area++;
        if (x > 0) queue.push(i - 1);
        if (x + 1 < width) queue.push(i + 1);
        if (y > 0) queue.push(i - width);
        if (y + 1 < height) queue.push(i + width);
      }
      const heights = new Array<number>(width).fill(0);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++)
          heights[x] = mask[y * width + x] ? heights[x] + 1 : 0;
        const stack: number[] = [];
        for (let x = 0; x <= width; x++) {
          const current = x === width ? 0 : heights[x];
          while (stack.length && heights[stack[stack.length - 1]] > current) {
            const index = stack.pop()!,
              h = heights[index],
              left = stack.length ? stack[stack.length - 1] + 1 : 0,
              w = x - left,
              top = y - h + 1;
            if (w < width * 0.22 || h < height * 0.12) continue;
            const cy = (top + h / 2) / height;
            const score =
              w *
              h *
              (0.6 + (luminance / 255) * 0.4) *
              (1 - Math.abs(cy - 0.4) * 0.8);
            if (!best || score > best.score)
              best = {
                score,
                mask,
                rect: { x: left, y: top, w, h },
                rgb,
                area,
              };
          }
          stack.push(x);
        }
      }
    }
  if (!best || best.rect.w * best.rect.h < width * height * 0.07) return null;
  const { rect, rgb } = best,
    inset = 0.025;
  const left = rect.x / width + inset,
    right = (rect.x + rect.w) / width - inset,
    top = rect.y / height + inset,
    bottom = (rect.y + rect.h) / height - inset;
  if (right - left < 0.15 || bottom - top < 0.08) return null;
  return {
    corners: [
      { x: left, y: top },
      { x: right, y: top },
      { x: right, y: bottom },
      { x: left, y: bottom },
    ],
    confidence: clamp((best.area / (width * height)) * 1.5, 0.2, 0.92),
    brightness: clamp(
      (rgb.reduce((a, b) => a + b, 0) / 3 / 255 - 0.78) * 0.18,
      -0.08,
      0.05,
    ),
    warmth: clamp((rgb[0] - rgb[2]) / 140, -0.25, 0.25),
    wallPixels: best.mask,
    width,
    height,
  };
}
