import type React from "react";
import type { View } from "react-native";
import type { WallSpace } from "../domain/spaces";
import { prepareSpaceImage } from "./spaceImages";
import { withTimeout } from "../domain/async";
import { sceneSVG } from "../features/studio/rendering";
export async function exportSpacePNG(
  _view: React.RefObject<React.ComponentRef<typeof View> | null>,
  space: WallSpace,
) {
  const width = Math.round(
      space.room.width *
        Math.min(1, 2400 / Math.max(space.room.width, space.room.height)),
    ),
    height = Math.round((width * space.room.height) / space.room.width);
  const converted = new Map<string, Promise<string>>();
  const inline = (uri: string) => {
    if (uri.startsWith("data:image/")) return Promise.resolve(uri);
    let pending = converted.get(uri);
    if (!pending) {
      pending = prepareSpaceImage(uri, true).then((image) => {
        if (!image.base64) throw new Error("Image is unavailable for export.");
        return `data:image/jpeg;base64,${image.base64}`;
      });
      converted.set(uri, pending);
    }
    return pending;
  };
  const prepared = {
    ...space,
    room: { ...space.room, uri: await inline(space.room.uri) },
    pieces: await Promise.all(
      space.pieces.map(async (piece) => ({
        ...piece,
        artwork: {
          ...piece.artwork,
          imageUrl: await inline(piece.artwork.imageUrl),
        },
      })),
    ),
  };
  const image = new window.Image();
  const svg = new Blob([sceneSVG(prepared, width, height, true)], {
    type: "image/svg+xml",
  });
  const url = URL.createObjectURL(svg);
  try {
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("Artwork images could not be exported."));
        image.src = url;
      }),
      15000,
      "Image export timed out. Reload the room images and retry.",
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image export is unavailable.");
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function shareSpacePNG(uri: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const file = new File([blob], "artspace-design.png", { type: "image/png" });
  const url = URL.createObjectURL(file);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
