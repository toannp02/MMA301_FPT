export type ArtworkStatus = "published" | "hidden";
export type SourceKind = "catalog" | "custom";
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
