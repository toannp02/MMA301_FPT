import * as FS from "expo-file-system/legacy";
import { Image } from "react-native";
export async function validateCapture(result: unknown): Promise<string> {
  if (
    !result ||
    typeof result !== "object" ||
    !("success" in result) ||
    !result.success ||
    !("url" in result) ||
    typeof result.url !== "string"
  )
    throw new Error("Native capture failed. Try again.");
  const uri = result.url.startsWith("file://")
    ? result.url
    : `file://${result.url}`;
  const info = await FS.getInfoAsync(uri);
  if (!info.exists || !info.size)
    throw new Error("Capture file is missing. Retake it.");
  await new Promise<void>((resolve, reject) =>
    Image.getSize(
      uri,
      (w, h) =>
        w > 0 && h > 0 ? resolve() : reject(new Error("Invalid capture")),
      () => reject(new Error("Capture cannot be decoded")),
    ),
  );
  return uri;
}
