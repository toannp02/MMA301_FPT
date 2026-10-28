export type ArtworkStatus = "published" | "hidden";
export type SourceKind = "catalog" | "custom";
export type FrameStyle = "none" | "black" | "white";
export type StorageMode = "cloud" | "local";
export interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
}
export interface Artwork {
  contentHash?: string;
  sourceKind?: SourceKind;
  id: string;
  title: string;
  description: string;
  categoryId: string;
  imageUrl: string;
  thumbnailUrl: string;
  widthCm: number;
  heightCm: number;
  isFeatured: boolean;
  status: ArtworkStatus;
}
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Favorite {
  artworkId: string;
  createdAt: string;
}
export interface SavedDesign {
  id: string;
  userId: string;
  artworkId: string | null;
  sourceKind: SourceKind;
  sourceImageUri: string | null;
  capturedImageUri: string;
  imageStoragePath: string | null;
  storageMode: StorageMode;
  widthCm: number;
  heightCm: number;
  scaleFactor: number;
  frameStyle: FrameStyle;
  createdAt: string;
}
export interface AppError {
  code: string;
  message: string;
  retryable: boolean;
}
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };
export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const fail = (
  code: string,
  message: string,
  retryable = false,
): Result<never> => ({ ok: false, error: { code, message, retryable } });
