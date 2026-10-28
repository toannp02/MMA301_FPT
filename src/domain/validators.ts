import { Artwork, SavedDesign } from "./models";
export const cleanName = (value: string) =>
  value
    .trim()
    .replace(/[\u0000-\u001f]/g, "")
    .slice(0, 60);
export function validateCredentials(
  email: string,
  password: string,
  name?: string,
): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254)
    return "Enter a valid email address.";
  if (password.length < 8 || password.length > 128)
    return "Use a password with 8–128 characters.";
  if (
    name !== undefined &&
    (cleanName(name).length < 2 || name.trim().length > 60)
  )
    return "Use a name with 2–60 characters.";
  return null;
}
export const validId = (id: string) => /^[a-zA-Z0-9_-]{1,128}$/.test(id);
export const validImageUri = (uri: string) =>
  /^(https:\/\/|file:\/\/|asset:\/\/)/.test(uri) && uri.length <= 2048;
export const positiveDimension = (n: number) =>
  Number.isFinite(n) && n > 0 && n <= 1000;
export const validIsoUtc = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value));
export const clampScale = (n: number) =>
  Number.isFinite(n) ? Math.min(2, Math.max(0.5, n)) : 1;
export const dimensionsMeters = (
  width: number,
  height: number,
  scale: number,
) => ({
  width: (width / 100) * clampScale(scale),
  height: (height / 100) * clampScale(scale),
});
export function filterArtworks(
  items: Artwork[],
  search: string,
  category: string | null,
): Artwork[] {
  return items.filter(
    (a) =>
      a.status === "published" &&
      (!category || a.categoryId === category) &&
      a.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
}
export function validDesign(d: SavedDesign, uid: string): boolean {
  return (
    d.userId === uid &&
    validId(uid) &&
    validId(d.id) &&
    positiveDimension(d.widthCm) &&
    positiveDimension(d.heightCm) &&
    Number.isFinite(d.scaleFactor) &&
    d.scaleFactor >= 0.5 &&
    d.scaleFactor <= 2 &&
    ["none", "black", "white"].includes(d.frameStyle) &&
    ["cloud", "local"].includes(d.storageMode) &&
    ((d.sourceKind === "catalog" && d.sourceImageUri === null) ||
      (d.sourceKind === "custom" &&
        d.storageMode === "local" &&
        d.imageStoragePath === null &&
        typeof d.artworkId === "string" &&
        /^custom-[a-zA-Z0-9_-]{1,100}$/.test(d.artworkId) &&
        typeof d.sourceImageUri === "string" &&
        d.sourceImageUri.startsWith("file://") &&
        validImageUri(d.sourceImageUri))) &&
    d.artworkId !== null &&
    validId(d.artworkId) &&
    validImageUri(d.capturedImageUri) &&
    validIsoUtc(d.createdAt)
  );
}
