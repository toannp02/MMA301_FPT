import * as FS from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import { Asset } from "expo-asset";
import { Image } from "react-native";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { SpaceImageStore } from "../domain/spaces";
import { spaceIdValid } from "../domain/spaces";
import { withTimeout } from "../domain/async";
export async function prepareSpaceImage(
  uri: string,
  base64 = false,
  png = false,
) {
  let source = uri;
  if (!uri.includes(":")) {
    const asset = await new Asset({
      name: "wall-image",
      type: "png",
      hash: null,
      uri,
    }).downloadAsync();
    if (!asset.localUri) throw new Error("Bundled image is unavailable.");
    source = asset.localUri;
  }
  const size = await withTimeout(
    new Promise<{ width: number; height: number }>((resolve, reject) =>
      Image.getSize(
        source,
        (width, height) => resolve({ width, height }),
        () => reject(new Error("Image cannot be read.")),
      ),
    ),
    15000,
  );
  const context = ImageManipulator.manipulate(source);
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
function directory(id: string) {
  if (!spaceIdValid(id) || !FS.documentDirectory)
    throw new Error("Invalid space directory");
  return `${FS.documentDirectory}wall-spaces/${id}/`;
}
export class WallImageStore implements SpaceImageStore {
  async persist(id: string, assetId: string, uri: string) {
    if (!spaceIdValid(assetId)) throw new Error("Invalid space asset");
    const dir = directory(id);
    if (uri.startsWith(dir)) {
      const info = await FS.getInfoAsync(uri);
      if (!info.exists)
        throw new Error("A saved image is missing. Choose it again.");
      return {
        uri,
        created: false,
        key: uri.slice(dir.length).replace(/\.(jpg|png)$/, ""),
      };
    }
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      uri,
    );
    const key = `${assetId}_${hash.slice(0, 16)}`;
    const png = assetId === "mask";
    const target = `${dir}${key}.${png ? "png" : "jpg"}`;
    if ((await FS.getInfoAsync(target)).exists)
      return { uri: target, created: false, key };
    const image = await prepareSpaceImage(uri, false, png);
    const info = await FS.getInfoAsync(image.uri);
    if (!info.exists || !info.size || info.size > 4 * 1024 * 1024)
      throw new Error("Prepared space image must be under 4 MB.");
    await FS.makeDirectoryAsync(dir, { intermediates: true });
    try {
      await FS.copyAsync({ from: image.uri, to: target });
    } catch (error) {
      await FS.deleteAsync(target, { idempotent: true });
      throw error;
    }
    return { uri: target, created: true, key };
  }
  async remove(id: string, key: string) {
    if (!spaceIdValid(key)) throw new Error("Invalid asset");
    for (const extension of ["jpg", "png"])
      await FS.deleteAsync(`${directory(id)}${key}.${extension}`, {
        idempotent: true,
      });
  }
  async prune(id: string, keepUris: string[]) {
    const dir = directory(id);
    const names = await FS.readDirectoryAsync(dir);
    const keep = new Set(
      keepUris
        .filter((uri) => uri.startsWith(dir))
        .map((uri) => uri.slice(dir.length)),
    );
    await Promise.allSettled(
      names
        .filter(
          (name) => /^[a-zA-Z0-9_-]+\.(jpg|png)$/.test(name) && !keep.has(name),
        )
        .map((name) => FS.deleteAsync(`${dir}${name}`, { idempotent: true })),
    );
  }
  async removeSpace(id: string) {
    await FS.deleteAsync(directory(id), { idempotent: true });
  }
}
