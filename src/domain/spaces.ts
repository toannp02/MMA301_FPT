import type { Artwork, Result } from "./models";

export interface Point {
  x: number;
  y: number;
}
export type Quad = [Point, Point, Point, Point];
export type LayoutKind =
  "single" | "pair" | "stack" | "row" | "column" | "grid" | "custom";
export type StudioFrame = "none" | "black" | "white" | "wood";
export interface ArtAppearance {
  depthCm?: number;
  frameProfile?: "bare" | "slim" | "classic" | "float" | "canvas";
  frame: StudioFrame;
  frameCm: number;
  mountCm: number;
  shadow: number;
  shadowOffset?: number;
  shadowAngle?: number;
  shadowSoftness?: number;
  glazing: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  hue: number;
}
export interface PlacedArtwork {
  id: string;
  artwork: Pick<Artwork, "id" | "title" | "imageUrl" | "widthCm" | "heightCm">;
  center: Point;
  scale: number;
  rotation: number;
  appearance: ArtAppearance;
}
export interface ForegroundStroke {
  radius: number;
  points: Point[];
}
export interface WallSurface {
  photoAssist?: { confidence: number; brightness: number; warmth: number };
  occlusionEnabled?: boolean;
  foregroundStrokes?: ForegroundStroke[];
  corners: Quad;
  widthCm: number;
  heightCm: number;
  measurement: "approximate" | "manual" | "arkit" | "lidar";
  occlusionMaskUri?: string;
}
export interface WallSpace {
  version: 1;
  id: string;
  name: string;
  room: { uri: string; width: number; height: number };
  wall: WallSurface;
  pieces: PlacedArtwork[];
  layout: LayoutKind;
  gapCm: number;
  createdAt: string;
  updatedAt: string;
}
export interface SpaceImageStore {
  persist(
    spaceId: string,
    assetId: string,
    uri: string,
  ): Promise<{ uri: string; created: boolean; key: string }>;
  remove(spaceId: string, assetId: string): Promise<void>;
  removeSpace(spaceId: string): Promise<void>;
  prune?(spaceId: string, keepUris: string[]): Promise<void>;
}
export interface SpaceRepository {
  list(): Promise<Result<WallSpace[]>>;
  get(id: string): Promise<Result<WallSpace | null>>;
  save(space: WallSpace): Promise<Result<WallSpace>>;
  remove(id: string): Promise<Result<void>>;
}
export const defaultAppearance: ArtAppearance = {
  frame: "black",
  frameCm: 2,
  mountCm: 0,
  shadow: 0.45,
  glazing: false,
  brightness: 0,
  contrast: 1,
  saturation: 1,
  warmth: 0,
  hue: 0,
};
export const defaultWall: WallSurface = {
  corners: [
    { x: 0.12, y: 0.12 },
    { x: 0.88, y: 0.12 },
    { x: 0.88, y: 0.82 },
    { x: 0.12, y: 0.82 },
  ],
  widthCm: 300,
  heightCm: 240,
  measurement: "approximate",
};
export function makePiece(artwork: Artwork, id: string): PlacedArtwork {
  return {
    id,
    artwork: {
      id: artwork.id,
      title: artwork.title,
      imageUrl: artwork.imageUrl,
      widthCm: artwork.widthCm,
      heightCm: artwork.heightCm,
    },
    center: { x: 0.5, y: 0.5 },
    scale: 1,
    rotation: 0,
    appearance: { ...defaultAppearance },
  };
}
export const spaceIdValid = (id: string) => /^[a-zA-Z0-9_-]{1,100}$/.test(id);
const finite = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
export function validQuad(value: unknown): value is Quad {
  if (
    !Array.isArray(value) ||
    value.length !== 4 ||
    !value.every((p) => record(p) && finite(p.x, 0, 1) && finite(p.y, 0, 1))
  )
    return false;
  const q = value as Quad;
  const crosses = q.map((p, i) => {
    const b = q[(i + 1) % 4],
      c = q[(i + 2) % 4];
    return (b.x - p.x) * (c.y - b.y) - (b.y - p.y) * (c.x - b.x);
  });
  return crosses.every((cross) => cross > 0.0001);
}
function validImageUri(uri: unknown): uri is string {
  // Expo Go serves bundled assets from the current LAN host, including 10/8
  // and 172.16/12 networks. Check the parsed host, not a hostname prefix.
  let localHttp = false;
  if (typeof uri === "string" && uri.startsWith("http://")) {
    try {
      const url = new URL(uri);
      const host = url.hostname;
      const octets = host.split(".").map(Number);
      const ipv4 =
        octets.length === 4 &&
        octets.every((n) => Number.isInteger(n) && n >= 0 && n <= 255);
      localHttp =
        !url.username &&
        !url.password &&
        (host === "localhost" ||
          host === "[::1]" ||
          (ipv4 &&
            (octets[0] === 127 ||
              octets[0] === 10 ||
              (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
              (octets[0] === 192 && octets[1] === 168))));
    } catch {
      /* Invalid URLs are rejected below. */
    }
  }
  return (
    typeof uri === "string" &&
    uri.length < 6_000_000 &&
    (localHttp ||
      /^(file:\/\/|data:image\/(png|jpeg);base64,|https:\/\/)/.test(uri) ||
      /^\/assets\//.test(uri) ||
      /^[a-z0-9_]{1,200}$/.test(uri))
  );
}
export function validSpace(value: unknown): value is WallSpace {
  if (
    record(value) &&
    record(value.wall) &&
    ((value.wall.occlusionEnabled !== undefined &&
      typeof value.wall.occlusionEnabled !== "boolean") ||
      (value.wall.photoAssist !== undefined &&
        (!record(value.wall.photoAssist) ||
          !finite(value.wall.photoAssist.confidence, 0, 1) ||
          !finite(value.wall.photoAssist.brightness, -0.5, 0.5) ||
          !finite(value.wall.photoAssist.warmth, -1, 1))))
  )
    return false;
  if (
    !record(value) ||
    value.version !== 1 ||
    typeof value.id !== "string" ||
    !spaceIdValid(value.id) ||
    typeof value.name !== "string" ||
    value.name.trim().length < 1 ||
    value.name.length > 80 ||
    !record(value.room) ||
    !validImageUri(value.room.uri) ||
    !finite(value.room.width, 1, 8000) ||
    !finite(value.room.height, 1, 8000) ||
    !record(value.wall) ||
    !validQuad(value.wall.corners) ||
    !finite(value.wall.widthCm, 10, 5000) ||
    !finite(value.wall.heightCm, 10, 5000) ||
    !["approximate", "manual", "arkit", "lidar"].includes(
      String(value.wall.measurement),
    ) ||
    (value.wall.occlusionMaskUri !== undefined &&
      !validImageUri(value.wall.occlusionMaskUri))
  )
    return false;
  if (
    value.wall.foregroundStrokes !== undefined &&
    (!Array.isArray(value.wall.foregroundStrokes) ||
      value.wall.foregroundStrokes.length > 100 ||
      !value.wall.foregroundStrokes.every(
        (stroke) =>
          record(stroke) &&
          finite(stroke.radius, 0.001, 0.2) &&
          Array.isArray(stroke.points) &&
          stroke.points.length > 0 &&
          stroke.points.length <= 1000 &&
          stroke.points.every(
            (p) => record(p) && finite(p.x, 0, 1) && finite(p.y, 0, 1),
          ),
      ))
  )
    return false;
  if (
    !Array.isArray(value.pieces) ||
    value.pieces.length > 9 ||
    !["single", "pair", "stack", "row", "column", "grid", "custom"].includes(
      String(value.layout),
    ) ||
    !finite(value.gapCm, 0, 100)
  )
    return false;
  const ids = new Set<string>();
  for (const piece of value.pieces) {
    if (
      !record(piece) ||
      typeof piece.id !== "string" ||
      !spaceIdValid(piece.id) ||
      ids.has(piece.id) ||
      !record(piece.artwork) ||
      typeof piece.artwork.id !== "string" ||
      !spaceIdValid(piece.artwork.id) ||
      typeof piece.artwork.title !== "string" ||
      piece.artwork.title.length > 80 ||
      !validImageUri(piece.artwork.imageUrl) ||
      !finite(piece.artwork.widthCm, 0.1, 1000) ||
      !finite(piece.artwork.heightCm, 0.1, 1000) ||
      !record(piece.center) ||
      !finite(piece.center.x, 0, 1) ||
      !finite(piece.center.y, 0, 1) ||
      !finite(piece.scale, 0.001, 5) ||
      !finite(piece.rotation, -180, 180) ||
      !record(piece.appearance)
    )
      return false;
    const a = piece.appearance;
    if (
      !["none", "black", "white", "wood"].includes(String(a.frame)) ||
      !finite(a.frameCm, 0, 15) ||
      !finite(a.mountCm, 0, 30) ||
      !finite(a.shadow, 0, 1) ||
      (a.depthCm !== undefined && !finite(a.depthCm, 0, 10)) ||
      (a.shadowOffset !== undefined && !finite(a.shadowOffset, 0, 3)) ||
      (a.shadowAngle !== undefined && !finite(a.shadowAngle, -180, 180)) ||
      (a.shadowSoftness !== undefined && !finite(a.shadowSoftness, 0, 40)) ||
      (a.frameProfile !== undefined &&
        !["bare", "slim", "classic", "float", "canvas"].includes(
          String(a.frameProfile),
        )) ||
      typeof a.glazing !== "boolean" ||
      !finite(a.brightness, -0.5, 0.5) ||
      !finite(a.contrast, 0.5, 1.5) ||
      !finite(a.saturation, 0, 2) ||
      !finite(a.warmth, -1, 1) ||
      !finite(a.hue, -180, 180)
    )
      return false;
    ids.add(piece.id);
  }
  return [value.createdAt, value.updatedAt].every(
    (date) => typeof date === "string" && Number.isFinite(Date.parse(date)),
  );
}
