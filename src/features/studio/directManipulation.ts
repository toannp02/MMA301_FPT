import type { Point, Quad, WallSpace } from "../../domain/spaces";
import { pieceQuad } from "./geometry";

export function insideQuad(point: Point, quad: Quad) {
  const cross = quad.map((a, i) => {
    const b = quad[(i + 1) % 4];
    return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
  });
  return cross.every((n) => n >= -1e-8) || cross.every((n) => n <= 1e-8);
}
export function artworkAtPoint(
  space: WallSpace,
  viewport: { left: number; top: number; width: number; height: number },
  point: Point,
) {
  if (!viewport.width || !viewport.height) return null;
  const normalized = {
    x: (point.x - viewport.left) / viewport.width,
    y: (point.y - viewport.top) / viewport.height,
  };
  return (
    [...space.pieces]
      .reverse()
      .find((piece) =>
        insideQuad(
          normalized,
          pieceQuad(
            space,
            piece,
            piece.appearance.mountCm +
              (piece.appearance.frame === "none"
                ? 0
                : piece.appearance.frameCm),
          ),
        ),
      )?.id ?? null
  );
}
export const toggledSelection = (
  selected: string | null,
  tapped: string | null,
) => (tapped === selected ? null : tapped);
