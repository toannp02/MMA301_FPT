import type {
  LayoutKind,
  PlacedArtwork,
  Point,
  Quad,
  WallSpace,
} from "../../domain/spaces";

export type Matrix3 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** Keep every rendered corner inside the calibrated wall, including its frame. */
export function fitPiece(
  space: WallSpace,
  piece: PlacedArtwork,
): PlacedArtwork {
  const edge = Math.min(space.wall.widthCm, space.wall.heightCm) * 0.04;
  const appearance = {
    ...piece.appearance,
    frameCm: Math.min(edge, piece.appearance.frameCm),
    mountCm: Math.min(edge, piece.appearance.mountCm),
  };
  const padding =
    appearance.mountCm + (appearance.frame === "none" ? 0 : appearance.frameCm);
  const c = Math.abs(Math.cos((piece.rotation * Math.PI) / 180));
  const s = Math.abs(Math.sin((piece.rotation * Math.PI) / 180));
  const w = piece.artwork.widthCm,
    h = piece.artwork.heightCm;
  const maxScale = Math.min(
    (space.wall.widthCm * 0.98 - 2 * padding * (c + s)) / (w * c + h * s),
    (space.wall.heightCm * 0.98 - 2 * padding * (c + s)) / (w * s + h * c),
  );
  const scale = Math.max(0.001, Math.min(piece.scale, maxScale));
  const halfX =
    ((w * scale + padding * 2) * c + (h * scale + padding * 2) * s) /
    space.wall.widthCm /
    2;
  const halfY =
    ((w * scale + padding * 2) * s + (h * scale + padding * 2) * c) /
    space.wall.heightCm /
    2;
  return {
    ...piece,
    appearance,
    scale,
    center: {
      x: Math.max(halfX, Math.min(1 - halfX, piece.center.x)),
      y: Math.max(halfY, Math.min(1 - halfY, piece.center.y)),
    },
  };
}
export function fitSpace(space: WallSpace): WallSpace {
  return {
    ...space,
    pieces: space.pieces.map((piece) => fitPiece(space, piece)),
  };
}
export function homography(q: Quad): Matrix3 {
  const [a, b, c, d] = q;
  const dx1 = b.x - c.x,
    dx2 = d.x - c.x,
    dx3 = a.x - b.x + c.x - d.x;
  const dy1 = b.y - c.y,
    dy2 = d.y - c.y,
    dy3 = a.y - b.y + c.y - d.y;
  const determinant = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(determinant) < 1e-10)
    throw new Error("Wall corners are too close together.");
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  return [
    b.x - a.x + g * b.x,
    d.x - a.x + h * d.x,
    a.x,
    b.y - a.y + g * b.y,
    d.y - a.y + h * d.y,
    a.y,
    g,
    h,
    1,
  ];
}
export function project(m: Matrix3, point: Point): Point {
  const w = m[6] * point.x + m[7] * point.y + m[8];
  if (Math.abs(w) < 1e-8)
    throw new Error("Wall perspective cannot be projected.");
  return {
    x: (m[0] * point.x + m[1] * point.y + m[2]) / w,
    y: (m[3] * point.x + m[4] * point.y + m[5]) / w,
  };
}
export function invert(m: Matrix3): Matrix3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-10) throw new Error("Invalid wall calibration.");
  return [
    (e * i - f * h) / det,
    (c * h - b * i) / det,
    (b * f - c * e) / det,
    (f * g - d * i) / det,
    (a * i - c * g) / det,
    (c * d - a * f) / det,
    (d * h - e * g) / det,
    (b * g - a * h) / det,
    (a * e - b * d) / det,
  ];
}
export function pieceQuad(
  space: WallSpace,
  piece: PlacedArtwork,
  extraCm = 0,
): Quad {
  const width =
    (piece.artwork.widthCm * piece.scale + extraCm * 2) / space.wall.widthCm;
  const height =
    (piece.artwork.heightCm * piece.scale + extraCm * 2) / space.wall.heightCm;
  const radians = (piece.rotation * Math.PI) / 180;
  const cos = Math.cos(radians),
    sin = Math.sin(radians);
  const matrix = homography(space.wall.corners);
  return (
    [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ] as const
  ).map(([x, y]) => {
    // Rotate in centimetres so a non-square wall does not distort rotation.
    const cmX = x * width * space.wall.widthCm,
      cmY = y * height * space.wall.heightCm;
    return project(matrix, {
      x: piece.center.x + (cmX * cos - cmY * sin) / space.wall.widthCm,
      y: piece.center.y + (cmX * sin + cmY * cos) / space.wall.heightCm,
    });
  }) as Quad;
}
export function layoutPieces(
  space: WallSpace,
  kind: LayoutKind,
  count: number,
): PlacedArtwork[] {
  const length =
    kind === "single"
      ? 1
      : kind === "pair" || kind === "stack"
        ? 2
        : Math.max(2, Math.min(9, Math.round(count)));
  if (!space.pieces.length) return [];
  const pieces = Array.from({ length }, (_, i) => ({
    ...(space.pieces[i] ?? space.pieces[0]),
    id: space.pieces[i]?.id ?? `${space.pieces[0].id}_slot${i}`,
    appearance: { ...(space.pieces[i] ?? space.pieces[0]).appearance },
    rotation: 0,
  }));
  const columns =
    kind === "stack" || kind === "column"
      ? 1
      : kind === "grid"
        ? Math.ceil(Math.sqrt(length))
        : length;
  const rows = Math.ceil(length / columns);
  // Keep frame/mount widths in centimetres while fitting artwork, then centre cells.
  const gap = Math.min(
    space.gapCm,
    columns > 1 ? (space.wall.widthCm * 0.1) / (columns - 1) : space.gapCm,
    rows > 1 ? (space.wall.heightCm * 0.1) / (rows - 1) : space.gapCm,
  );
  const measure = (factor: number) => {
    const scaled = pieces.map((piece) =>
      fitPiece(space, {
        ...piece,
        scale: Math.max(0.001, piece.scale * factor),
      }),
    );
    const pad = (p: PlacedArtwork) =>
      2 *
      (p.appearance.mountCm +
        (p.appearance.frame === "none" ? 0 : p.appearance.frameCm));
    const widths = Array.from({ length: columns }, (_, col) =>
      Math.max(
        ...scaled
          .filter((_, i) => i % columns === col)
          .map((p) => p.artwork.widthCm * p.scale + pad(p)),
      ),
    );
    const heights = Array.from({ length: rows }, (_, row) =>
      Math.max(
        ...scaled
          .slice(row * columns, (row + 1) * columns)
          .map((p) => p.artwork.heightCm * p.scale + pad(p)),
      ),
    );
    return {
      scaled,
      widths,
      heights,
      totalW: widths.reduce((a, b) => a + b, 0) + gap * (columns - 1),
      totalH: heights.reduce((a, b) => a + b, 0) + gap * (rows - 1),
    };
  };
  let low = 0,
    high = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2,
      m = measure(mid);
    if (
      m.totalW <= space.wall.widthCm * 0.94 &&
      m.totalH <= space.wall.heightCm * 0.94
    )
      low = mid;
    else high = mid;
  }
  const m = measure(low);
  return m.scaled.map((piece, i) => {
    const col = i % columns,
      row = Math.floor(i / columns);
    const x =
      m.widths.slice(0, col).reduce((a, b) => a + b, 0) +
      gap * col +
      m.widths[col] / 2 -
      m.totalW / 2;
    const y =
      m.heights.slice(0, row).reduce((a, b) => a + b, 0) +
      gap * row +
      m.heights[row] / 2 -
      m.totalH / 2;
    return fitPiece(space, {
      ...piece,
      center: {
        x: 0.5 + x / space.wall.widthCm,
        y: 0.5 + y / space.wall.heightCm,
      },
    });
  });
}
export function affineTriangle(
  from: [Point, Point, Point],
  to: [Point, Point, Point],
): [number, number, number, number, number, number] {
  const matrix: Matrix3 = [
    from[0].x,
    from[0].y,
    1,
    from[1].x,
    from[1].y,
    1,
    from[2].x,
    from[2].y,
    1,
  ];
  const inv = invert(matrix);
  const solve = (axis: "x" | "y") =>
    [0, 1, 2].map(
      (row) =>
        inv[row * 3] * to[0][axis] +
        inv[row * 3 + 1] * to[1][axis] +
        inv[row * 3 + 2] * to[2][axis],
    );
  const x = solve("x"),
    y = solve("y");
  return [x[0], y[0], x[1], y[1], x[2], y[2]];
}
