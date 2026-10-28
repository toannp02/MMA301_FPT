import type React from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as FS from "expo-file-system/legacy";
import type { WallSpace } from "../domain/spaces";
export async function exportSpacePNG(
  view: React.RefObject<View | null>,
  space: WallSpace,
) {
  const scale = Math.min(
    1,
    2400 / Math.max(space.room.width, space.room.height),
  );
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  const uri = await captureRef(view, {
    format: "png",
    result: "tmpfile",
    width: Math.round(space.room.width * scale),
    height: Math.round(space.room.height * scale),
    fileName: "artspace-design",
  });
  const info = await FS.getInfoAsync(uri);
  if (!info.exists || !info.size)
    throw new Error(
      "Export image is missing. Retry after images finish loading.",
    );
  return uri;
}
export async function shareSpacePNG(uri: string) {
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Sharing is unavailable on this device.");
  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle: "Share your wall design",
    UTI: "public.png",
  });
}
