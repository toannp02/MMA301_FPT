import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { withTimeout } from "../domain/async";
import type { SpaceImageStore } from "../domain/spaces";
import { spaceIdValid } from "../domain/spaces";
export async function prepareSpaceImage(
  uri: string,
  base64 = true,
  png = false,
) {
  const image = new window.Image();
  image.crossOrigin = "anonymous";
  const size = await withTimeout(
    new Promise<{ width: number; height: number }>((resolve, reject) => {
      image.onload = () =>
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Image cannot be read."));
      image.src = uri;
    }),
    15000,
    "Image loading timed out. Choose the photo again.",
  );
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(size.width, size.height) > 2048)
    context.resize(
      size.width >= size.height ? { width: 2048 } : { height: 2048 },
    );
  try {
    const rendered = await context.renderAsync();
    try {
      return await rendered.saveAsync({
        format: png ? SaveFormat.PNG : SaveFormat.JPEG,
        compress: 0.8,
        base64,
      });
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}
export class WallImageStore implements SpaceImageStore {
  async persist(id: string, assetId: string, uri: string) {
    if (!spaceIdValid(id) || !spaceIdValid(assetId))
      throw new Error("Invalid space asset");
    if (/^data:image\/(jpeg|png);base64,/.test(uri) && uri.length < 5_500_000)
      return { uri, created: false, key: assetId };
    const image = await prepareSpaceImage(uri, true, assetId === "mask");
    if (!image.base64 || image.base64.length > 5_500_000)
      throw new Error("Image is too large for browser storage.");
    return {
      uri: `data:image/${assetId === "mask" ? "png" : "jpeg"};base64,${image.base64}`,
      created: false,
      key: assetId,
    };
  }
  async remove(_id: string, _key: string) {}
  async removeSpace(_id: string) {}
}
