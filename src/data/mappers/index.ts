import type {
  Artwork,
  Category,
  SavedDesign,
  UserProfile,
} from "../../domain/models";
import {
  positiveDimension,
  validId,
  validDesign,
} from "../../domain/validators";
const invalid = () =>
  Object.assign(new Error("Invalid document"), { code: "invalid-data" });
export function text(v: unknown, max = 2048): string {
  if (typeof v !== "string" || v.length > max) throw invalid();
  return v;
}
export function iso(v: unknown): string {
  if (
    typeof v === "object" &&
    v !== null &&
    "toDate" in v &&
    typeof v.toDate === "function"
  ) {
    const d: unknown = v.toDate();
    if (d instanceof Date && Number.isFinite(d.getTime()))
      return d.toISOString();
  }
  throw invalid();
}
export function artworkMapper(id: string, d: Record<string, unknown>): Artwork {
  if (
    !validId(id) ||
    d.status !== "published" ||
    typeof d.isFeatured !== "boolean" ||
    typeof d.widthCm !== "number" ||
    typeof d.heightCm !== "number" ||
    !positiveDimension(d.widthCm) ||
    !positiveDimension(d.heightCm)
  )
    throw invalid();
  const imageUrl = text(d.imageUrl);
  const thumbnailUrl = text(d.thumbnailUrl);
  if (!imageUrl.startsWith("https://") || !thumbnailUrl.startsWith("https://"))
    throw invalid();
  return {
    id,
    title: text(d.title, 120),
    description: text(d.description, 2000),
    categoryId: text(d.categoryId, 128),
    imageUrl,
    thumbnailUrl,
    widthCm: d.widthCm,
    heightCm: d.heightCm,
    isFeatured: d.isFeatured,
    status: "published",
  };
}
export function categoryMapper(
  id: string,
  d: Record<string, unknown>,
): Category {
  if (!validId(id) || typeof d.order !== "number" || !Number.isFinite(d.order))
    throw invalid();
  return { id, name: text(d.name, 80), slug: text(d.slug, 80), order: d.order };
}
export function userMapper(
  uid: string,
  email: string,
  d: Record<string, unknown>,
): UserProfile {
  return {
    uid,
    email,
    displayName: text(d.displayName, 60),
    avatarUrl: d.avatarUrl === null ? null : text(d.avatarUrl),
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
  };
}
export function designMapper(
  uid: string,
  id: string,
  d: Record<string, unknown>,
  uri: string,
): SavedDesign {
  if (
    typeof d.widthCm !== "number" ||
    typeof d.heightCm !== "number" ||
    typeof d.scaleFactor !== "number" ||
    d.sourceKind !== "catalog" ||
    (d.frameStyle !== "none" &&
      d.frameStyle !== "black" &&
      d.frameStyle !== "white")
  )
    throw invalid();
  const design: SavedDesign = {
    id,
    userId: uid,
    artworkId: d.artworkId === null ? null : text(d.artworkId, 128),
    sourceKind: "catalog",
    sourceImageUri: null,
    capturedImageUri: uri,
    imageStoragePath: text(d.imageStoragePath),
    storageMode: "cloud",
    widthCm: d.widthCm,
    heightCm: d.heightCm,
    scaleFactor: d.scaleFactor,
    frameStyle: d.frameStyle,
    createdAt: iso(d.createdAt),
  };
  if (
    !validDesign(design, uid) ||
    design.imageStoragePath !== `designs/${uid}/${id}.jpg`
  )
    throw invalid();
  return design;
}
