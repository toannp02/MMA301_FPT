import type {
  ArtAppearance,
  Point,
  Quad,
  WallSpace,
} from "../../domain/spaces";
import { affineTriangle, homography, pieceQuad, project } from "./geometry";
export const xmlEscape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
export const pointString = (q: Point[]) =>
  q.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
export function appearanceMatrix(a: ArtAppearance): number[] {
  const angle = (a.hue * Math.PI) / 180,
    c = Math.cos(angle),
    s = Math.sin(angle);
  const hue = [
    0.213 + 0.787 * c - 0.213 * s,
    0.715 - 0.715 * c - 0.715 * s,
    0.072 - 0.072 * c + 0.928 * s,
    0.213 - 0.213 * c + 0.143 * s,
    0.715 + 0.285 * c + 0.14 * s,
    0.072 - 0.072 * c - 0.283 * s,
    0.213 - 0.213 * c - 0.787 * s,
    0.715 - 0.715 * c + 0.715 * s,
    0.072 + 0.928 * c + 0.072 * s,
  ];
  const weights = [0.2126, 0.7152, 0.0722];
  const sat = Array.from(
    { length: 9 },
    (_, i) =>
      weights[i % 3] * (1 - a.saturation) +
      (Math.floor(i / 3) === i % 3 ? a.saturation : 0),
  );
  const matrix = Array.from(
    { length: 9 },
    (_, i) =>
      [0, 1, 2].reduce(
        (sum, k) => sum + hue[Math.floor(i / 3) * 3 + k] * sat[k * 3 + (i % 3)],
        0,
      ) * a.contrast,
  );
  const offset = 0.5 * (1 - a.contrast) + a.brightness;
  return [
    matrix[0],
    matrix[1],
    matrix[2],
    0,
    offset + 0.06 * a.warmth,
    matrix[3],
    matrix[4],
    matrix[5],
    0,
    offset + 0.015 * a.warmth,
    matrix[6],
    matrix[7],
    matrix[8],
    0,
    offset - 0.06 * a.warmth,
    0,
    0,
    0,
    1,
    0,
  ];
}
export interface ImageResource {
  id: string;
  uri: string;
  width: number;
  height: number;
}
export interface MeshTriangle {
  id: string;
  source: string;
  points: string;
  matrix: [number, number, number, number, number, number];
}
export interface GraphicPiece {
  id: string;
  imageId: string;
  imageUri: string;
  quad: Quad;
  outer: Quad;
  mount: Quad;
  triangles: MeshTriangle[];
  appearance: ArtAppearance;
  filterId: string;
}
/** Contact occlusion plus weighted penumbra; preview and export use identical layers. */
export function shadowLayers(
  piece: Pick<GraphicPiece, "outer" | "appearance">,
  width: number,
  height: number,
) {
  const a = piece.appearance;
  if (a.shadow <= 0) return [];
  const unit = Math.min(width, height),
    angle = ((a.shadowAngle ?? 56.31) * Math.PI) / 180;
  const depth = a.depthCm ?? 1.8,
    distance =
      unit * 0.009 * (a.shadowOffset ?? 1) * Math.max(0.12, depth / 1.8),
    softness = a.shadowSoftness ?? 8;
  const dx = Math.cos(angle) * distance,
    dy = Math.sin(angle) * distance;
  const samples =
    softness === 0
      ? [{ x: 0, y: 0, weight: 1 }]
      : [
          { x: 0, y: 0, weight: 0.16 },
          ...[0.35, 0.7, 1].flatMap((r, ring) =>
            Array.from({ length: 8 }, (_, i) => ({
              x: Math.cos((i * Math.PI) / 4) * unit * 0.0008 * softness * r,
              y: Math.sin((i * Math.PI) / 4) * unit * 0.0008 * softness * r,
              weight: [0.07, 0.025, 0.006][ring],
            })),
          ),
        ];
  const total = samples.reduce((sum, p) => sum + p.weight, 0);
  const cast = samples.map((sample) => ({
    quad: piece.outer.map((p) => ({
      x: p.x + dx + sample.x,
      y: p.y + dy + sample.y,
    })),
    opacity: 1 - Math.pow(1 - a.shadow * 0.65, sample.weight / total),
  }));
  // Tight ambient occlusion where the frame meets the wall: slightly grown,
  // barely offset, fading over three steps so the edge reads as a real contact.
  const cx = piece.outer.reduce((sum, p) => sum + p.x, 0) / 4,
    cy = piece.outer.reduce((sum, p) => sum + p.y, 0) / 4;
  const contact = [1, 2, 3].map((step) => {
    const grow = unit * 0.0011 * step * Math.max(0.5, Math.min(2, depth / 1.8));
    return {
      quad: piece.outer.map((p) => {
        const r = Math.max(1, Math.hypot(p.x - cx, p.y - cy));
        return {
          x: p.x + ((p.x - cx) / r) * grow + Math.cos(angle) * grow * 0.5,
          y: p.y + ((p.y - cy) / r) * grow + Math.sin(angle) * grow * 0.5,
        };
      }),
      opacity: a.shadow * [0.16, 0.08, 0.04][step - 1],
    };
  });
  // Widest (faintest) first so the darkest layer sits right at the edge.
  return [...contact.reverse(), ...cast];
}
/** Projected edge faces give the artwork thickness without a native 3D module. */
export function depthFaces(
  piece: Pick<GraphicPiece, "outer" | "appearance">,
  width: number,
  height: number,
) {
  const a = piece.appearance,
    depth = a.depthCm ?? 1.8;
  if (depth <= 0) return [];
  const unit = Math.min(width, height),
    angle = ((a.shadowAngle ?? 56.31) * Math.PI) / 180;
  const cx = piece.outer.reduce((sum, p) => sum + p.x, 0) / 4,
    cy = piece.outer.reduce((sum, p) => sum + p.y, 0) / 4;
  const dx =
      Math.max(
        -unit * 0.008,
        Math.min(unit * 0.008, (width * 0.5 - cx) * 0.01 + unit * 0.001),
      ) * depth,
    dy =
      Math.max(
        -unit * 0.008,
        Math.min(unit * 0.008, (height * 0.5 - cy) * 0.01 + unit * 0.002),
      ) * depth;
  const base =
    a.frame === "wood"
      ? [155, 116, 76]
      : a.frame === "black"
        ? [48, 47, 44]
        : [230, 224, 210];
  return piece.outer.map((p, i) => {
    const next = piece.outer[(i + 1) % 4];
    const length = Math.max(1, Math.hypot(next.x - p.x, next.y - p.y));
    const facing =
      ((next.y - p.y) * Math.cos(angle) - (next.x - p.x) * Math.sin(angle)) /
      length;
    // Shadow direction points away from the light: faces turned that way are darker.
    const shade = 0.66 - 0.22 * facing;
    return {
      quad: [
        p,
        next,
        { x: next.x + dx, y: next.y + dy },
        { x: p.x + dx, y: p.y + dy },
      ],
      fill: `rgb(${base.map((c) => Math.round(c * shade)).join(",")})`,
    };
  });
}
/**
 * Thin perspective strips along the frame: a lit/shaded bevel on the outer edge
 * and, inside a frame, the lip shadow it casts onto the mount or artwork.
 */
export function edgeStrips(
  piece: Pick<GraphicPiece, "outer" | "mount" | "appearance">,
  width: number,
  height: number,
) {
  const a = piece.appearance;
  const unit = Math.min(width, height),
    angle = ((a.shadowAngle ?? 56.31) * Math.PI) / 180,
    thickness = Math.max(1, unit * 0.0022);
  const strips = (quad: Quad, inner: boolean) => {
    const cx = quad.reduce((sum, p) => sum + p.x, 0) / 4,
      cy = quad.reduce((sum, p) => sum + p.y, 0) / 4;
    return quad.flatMap((p, i) => {
      const next = quad[(i + 1) % 4];
      const length = Math.hypot(next.x - p.x, next.y - p.y);
      const reach = Math.hypot(
        (p.x + next.x) / 2 - cx,
        (p.y + next.y) / 2 - cy,
      );
      if (length < 1 || reach < 1) return [];
      // Outward normal dotted with the direction toward the light (opposite the shadow).
      const lit =
        ((next.x - p.x) * Math.sin(angle) - (next.y - p.y) * Math.cos(angle)) /
        length;
      const t = Math.min(0.35, (inner ? thickness * 1.6 : thickness) / reach);
      const toward = (v: Point) => ({
        x: v.x + (cx - v.x) * t,
        y: v.y + (cy - v.y) * t,
      });
      // Outer edges facing the light catch a highlight; inner edges facing it sit in the lip's shadow.
      const light = inner ? lit < 0 : lit > 0;
      const opacity = Math.abs(lit) * (light ? 0.22 : 0.3);
      return opacity < 0.02
        ? []
        : [
            {
              quad: [p, next, toward(next), toward(p)] as Quad,
              fill: light ? "white" : "black",
              opacity,
            },
          ];
    });
  };
  return [
    ...strips(piece.outer, false),
    ...(a.frame === "none" ? [] : strips(piece.mount, true)),
  ];
}
export function sceneGraphic(
  space: WallSpace,
  width: number,
  height: number,
  subdivisions = 4,
) {
  const images: ImageResource[] = [];
  const byUri = new Map<string, ImageResource>();
  const pixel = (q: Quad) =>
    q.map((p) => ({ x: p.x * width, y: p.y * height })) as Quad;
  const pieces: GraphicPiece[] = space.pieces.map((piece, index) => {
    let image = byUri.get(piece.artwork.imageUrl);
    if (!image) {
      const w = Math.min(
        1024,
        (2048 * piece.artwork.widthCm) / piece.artwork.heightCm,
      );
      image = {
        id: `image${images.length}`,
        uri: piece.artwork.imageUrl,
        width: w,
        height: (w * piece.artwork.heightCm) / piece.artwork.widthCm,
      };
      images.push(image);
      byUri.set(image.uri, image);
    }
    const imageResource = image;
    const quad = pixel(pieceQuad(space, piece));
    const projection = (() => {
      try {
        return homography(quad);
      } catch {
        return null;
      }
    })();
    const triangles: MeshTriangle[] = [];
    if (projection)
      for (let y = 0; y < subdivisions; y++)
        for (let x = 0; x < subdivisions; x++) {
          const corners = [
            { x: x / subdivisions, y: y / subdivisions },
            { x: (x + 1) / subdivisions, y: y / subdivisions },
            { x: (x + 1) / subdivisions, y: (y + 1) / subdivisions },
            { x: x / subdivisions, y: (y + 1) / subdivisions },
          ];
          for (const [j, indices] of [
            [0, [0, 1, 2]],
            [1, [0, 2, 3]],
          ] as const) {
            const from = indices.map((i) => ({
              x: corners[i].x * imageResource.width,
              y: corners[i].y * imageResource.height,
            })) as [Point, Point, Point];
            const to = indices.map((i) => project(projection, corners[i])) as [
              Point,
              Point,
              Point,
            ];
            triangles.push({
              id: `clip${index}_${x}_${y}_${j}`,
              source: imageResource.id,
              // Slight overlap removes antialias seams between texture triangles.
              // A separate outer clip keeps the artwork silhouette exact.
              points: pointString(
                from.map((p) => {
                  const cx = from.reduce((sum, v) => sum + v.x, 0) / 3,
                    cy = from.reduce((sum, v) => sum + v.y, 0) / 3;
                  return {
                    x: cx + (p.x - cx) * 1.06,
                    y: cy + (p.y - cy) * 1.06,
                  };
                }),
              ),
              matrix: affineTriangle(from, to),
            });
          }
        }
    const padding =
      piece.appearance.mountCm +
      (piece.appearance.frame === "none" ? 0 : piece.appearance.frameCm);
    return {
      id: piece.id,
      imageId: imageResource.id,
      imageUri: imageResource.uri,
      quad,
      outer: pixel(pieceQuad(space, piece, padding)),
      mount: pixel(pieceQuad(space, piece, piece.appearance.mountCm)),
      triangles,
      appearance: piece.appearance,
      filterId: `filter${index}`,
    };
  });
  return { images, pieces, width, height };
}
export function sceneSVG(
  space: WallSpace,
  width: number,
  height: number,
  exportQuality = false,
): string {
  const graphic = sceneGraphic(space, width, height, exportQuality ? 8 : 4);
  const defs = graphic.images
    .map(
      (image) =>
        `<image id="${image.id}" href="${xmlEscape(image.uri)}" width="${image.width}" height="${image.height}" preserveAspectRatio="none"/>`,
    )
    .join("");
  const pieces = graphic.pieces
    .map((piece) => {
      const a = piece.appearance,
        outer = pointString(piece.outer),
        mount = pointString(piece.mount);
      const shadow = shadowLayers(piece, width, height)
        .map(
          (layer) =>
            `<polygon points="${pointString(layer.quad)}" fill="black" opacity="${layer.opacity}"/>`,
        )
        .join("");
      const clips = piece.triangles
        .map(
          (t) =>
            `<clipPath id="${t.id}" clipPathUnits="userSpaceOnUse"><polygon points="${t.points}"/></clipPath>`,
        )
        .join("");
      const mesh = piece.triangles
        .map(
          (t) =>
            `<g transform="matrix(${t.matrix.join(" ")})"><use href="#${t.source}" clip-path="url(#${t.id})"/></g>`,
        )
        .join("");
      const sides = depthFaces(piece, width, height)
        .map(
          (face) =>
            `<polygon points="${pointString(face.quad)}" fill="${face.fill}"/>`,
        )
        .join("");
      const edges = edgeStrips(piece, width, height)
        .map(
          (strip) =>
            `<polygon points="${pointString(strip.quad)}" fill="${strip.fill}" opacity="${strip.opacity}"/>`,
        )
        .join("");
      return `${shadow}${sides}<polygon points="${outer}" fill="${a.frame === "wood" ? "#9b744c" : a.frame === "white" ? "#ece8df" : "#181818"}"/><polygon points="${mount}" fill="${a.frameProfile === "float" ? "#171717" : "#eeeae0"}"/><defs><clipPath id="${piece.filterId}_bounds"><polygon points="${pointString(piece.quad)}"/></clipPath>${clips}<filter id="${piece.filterId}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${appearanceMatrix(a).join(" ")}"/></filter></defs><g clip-path="url(#${piece.filterId}_bounds)"><g filter="url(#${piece.filterId})">${mesh}</g></g>${edges}${a.glazing ? `<polygon points="${pointString(piece.quad)}" fill="white" opacity="0.07"/>` : ""}`;
    })
    .join("");
  const strokes = (space.wall.foregroundStrokes ?? [])
    .map(
      (stroke) =>
        `<polyline points="${pointString(stroke.points.map((p) => ({ x: p.x * width, y: p.y * height })))}" fill="none" stroke="white" stroke-width="${stroke.radius * Math.min(width, height) * 2}" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("");
  const foreground =
    space.wall.occlusionEnabled !== false && strokes
      ? `<defs><mask id="painted-foreground" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}" style="mask-type:luminance"><rect width="${width}" height="${height}" fill="black"/>${strokes}</mask></defs><image href="${xmlEscape(space.room.uri)}" width="${width}" height="${height}" mask="url(#painted-foreground)"/>`
      : "";
  const mask =
    space.wall.occlusionEnabled !== false && space.wall.occlusionMaskUri
      ? `<defs><mask id="occlusion"><image href="${xmlEscape(space.wall.occlusionMaskUri)}" width="${width}" height="${height}" preserveAspectRatio="none"/></mask></defs><image href="${xmlEscape(space.room.uri)}" width="${width}" height="${height}" mask="url(#occlusion)"/>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs><image href="${xmlEscape(space.room.uri)}" width="${width}" height="${height}" preserveAspectRatio="none"/>${pieces}${mask}${foreground}</svg>`;
}
