import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { decode } from "jpeg-js";
import { toByteArray, fromByteArray } from "base64-js";
import type { WallSpace } from "../domain/spaces";
import { suggestWall } from "../features/studio/photoAssist";
import { wallMaskPNG } from "../features/studio/maskPng";
import { withTimeout } from "../domain/async";

export async function analyzeRoomPhoto(room: WallSpace["room"]) {
  const context = ImageManipulator.manipulate(room.uri);
  context.resize(room.width >= room.height ? { width: 96 } : { height: 96 });
  try {
    const rendered = await withTimeout(
      context.renderAsync(),
      10000,
      "Photo analysis timed out.",
    );
    try {
      const image = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.9,
        base64: true,
      });
      if (!image.base64) return null;
      const pixels = decode(toByteArray(image.base64), {
        useTArray: true,
        maxResolutionInMP: 1,
        maxMemoryUsageInMB: 16,
      });
      const suggestion = suggestWall(pixels.data, pixels.width, pixels.height);
      if (!suggestion) return null;
      let occlusionMaskUri: string | undefined;
      if (suggestion.confidence >= 0.62) {
        occlusionMaskUri = `data:image/png;base64,${fromByteArray(wallMaskPNG(suggestion.wallPixels, pixels.width, pixels.height))}`;
      }
      const { corners, confidence, brightness, warmth } = suggestion;
      return { corners, confidence, brightness, warmth, occlusionMaskUri };
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}
