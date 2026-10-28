import { Asset } from "expo-asset";
import * as FS from "expo-file-system/legacy";
import { artAssets, artworks } from "../../data/mock/catalogue";
import { validId } from "../../domain/validators";
export async function resolveARAsset(id: string, uri: string): Promise<string> {
  if (!validId(id)) throw new Error("Invalid artwork");
  const index = artworks.findIndex((a) => a.id === id && a.imageUrl === uri);
  if (index >= 0) {
    const a = await Asset.fromModule(artAssets[index]).downloadAsync();
    if (!a.localUri) throw new Error("Bundled asset unavailable");
    return a.localUri;
  }
  if (uri.startsWith("file://") && (await FS.getInfoAsync(uri)).exists)
    return uri;
  if (!uri.startsWith("https://") || !FS.cacheDirectory)
    throw new Error("Invalid image source");
  const dir = `${FS.cacheDirectory}artspace/`;
  await FS.makeDirectoryAsync(dir, { intermediates: true });
  const path = `${dir}${id}.img`;
  const result = await FS.downloadAsync(uri, path);
  if (result.status !== 200) {
    await FS.deleteAsync(path, { idempotent: true });
    throw new Error("Image download failed");
  }
  return result.uri;
}
