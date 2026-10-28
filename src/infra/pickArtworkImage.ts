import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ImportedImage } from "../domain/repositories";
import { MAX_IMPORTED_BYTES } from "../domain/customArtworks";
import * as FS from "expo-file-system/legacy";
export async function pickArtworkImage(
  source: "library" | "camera" = "library",
): Promise<ImportedImage | null> {
  // Call directly from the tap handler, including on web; no broad library permission.
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: false,
    allowsMultipleSelection: false,
    quality: 1,
    exif: false,
  };
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      const error = new Error(
        "Allow camera access in Settings to photograph your artwork, or choose an image from your library.",
      );
      error.name = "CameraPermissionError";
      throw error;
    }
  }
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset || (asset.type && asset.type !== "image"))
    throw new Error("Select a still image.");
  if (
    (asset.fileSize ?? 0) > 30 * 1024 * 1024 ||
    !asset.width ||
    !asset.height ||
    asset.width * asset.height > 40_000_000
  )
    throw new Error("Choose a photo smaller than 30 MB and 40 megapixels.");
  const context = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width, asset.height);
  if (longest > 2048)
    context.resize(
      asset.width >= asset.height ? { width: 2048 } : { height: 2048 },
    );
  try {
    const rendered = await context.renderAsync();
    try {
      const image = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.8,
        base64: Platform.OS === "web",
      });
      const info =
        Platform.OS === "web" ? null : await FS.getInfoAsync(image.uri);
      const bytes = image.base64
        ? Math.ceil((image.base64.length * 3) / 4)
        : info?.exists
          ? (info.size ?? 0)
          : 0;
      if (!bytes || bytes > MAX_IMPORTED_BYTES)
        throw new Error(
          "Prepared image exceeds 1 MB. Choose a smaller or simpler photo.",
        );
      const encoded =
        image.base64 ??
        (await FS.readAsStringAsync(image.uri, {
          encoding: FS.EncodingType.Base64,
        }));
      const contentHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        encoded,
      );
      return {
        contentHash,
        uri:
          Platform.OS === "web"
            ? `data:image/jpeg;base64,${image.base64}`
            : image.uri,
        width: image.width,
        height: image.height,
        bytes,
      };
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}
