import { cleanName, positiveDimension } from "./validators";
import type { ImportedImage } from "./repositories";
export const MAX_IMPORTED_IMAGES = 10;
export const MAX_IMPORTED_BYTES = 1024 * 1024;
export const customArtworkId = (id: string) =>
  /^custom-[a-zA-Z0-9_-]{1,100}$/.test(id);
export function importValidation(
  title: string,
  widthCm: number,
  image: ImportedImage,
): string | null {
  if (
    image.contentHash !== undefined &&
    !/^[a-f0-9]{64}$/.test(image.contentHash)
  )
    return "This image fingerprint is invalid. Choose the image again.";
  if (cleanName(title).length < 2 || title.trim().length > 60)
    return "Use a title with 2–60 characters.";
  if (
    ![image.width, image.height].every(
      (n) => Number.isFinite(n) && n > 0 && n <= 2048,
    ) ||
    !Number.isFinite(image.bytes) ||
    image.bytes <= 0 ||
    image.bytes > MAX_IMPORTED_BYTES
  )
    return "Choose a smaller image. The prepared image must be at most 1 MB.";
  if (
    !positiveDimension(widthCm) ||
    !positiveDimension((widthCm * image.height) / image.width)
  )
    return "Use dimensions greater than 0 and at most 1000 cm.";
  return null;
}
