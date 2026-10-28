import type {
  ArtAppearance,
  PlacedArtwork,
  WallSpace,
} from "../../domain/spaces";
import { fitSpace } from "./geometry";

export const frameProfiles: {
  name: string;
  appearance: Partial<ArtAppearance>;
}[] = [
  {
    name: "Bare",
    appearance: {
      depthCm: 0.2,
      frameProfile: "bare",
      frame: "none",
      frameCm: 0,
      mountCm: 0,
    },
  },
  {
    name: "Slim",
    appearance: {
      depthCm: 1.5,
      frameProfile: "slim",
      frame: "black",
      frameCm: 1,
      mountCm: 0,
    },
  },
  {
    name: "Classic",
    appearance: {
      depthCm: 3,
      frameProfile: "classic",
      frame: "black",
      frameCm: 3,
      mountCm: 4,
    },
  },
  {
    name: "Float",
    appearance: {
      depthCm: 3,
      frameProfile: "float",
      frame: "wood",
      frameCm: 1.5,
      mountCm: 0.8,
    },
  },
  {
    name: "Canvas",
    appearance: {
      depthCm: 2.5,
      frameProfile: "canvas",
      frame: "white",
      frameCm: 0.8,
      mountCm: 0,
    },
  },
];

export function resizeArtwork(
  space: WallSpace,
  id: string,
  width: number,
  height: number,
): WallSpace {
  if (
    ![width, height].every((n) => Number.isFinite(n) && n >= 0.1 && n <= 1000)
  )
    throw new Error("Artwork dimensions must be between 0.1 and 1000 cm.");
  return fitSpace({
    ...space,
    layout: "custom",
    pieces: space.pieces.map((piece) =>
      piece.id === id
        ? {
            ...piece,
            scale: 1,
            artwork: { ...piece.artwork, widthCm: width, heightCm: height },
          }
        : piece,
    ),
  });
}

export function effectiveDimensions(piece: PlacedArtwork) {
  return {
    width: piece.artwork.widthCm * piece.scale,
    height: piece.artwork.heightCm * piece.scale,
  };
}

/** View-only zoom; never changes wall calibration, artwork data or export bounds. */
export function roomViewport(
  stage: { width: number; height: number },
  ratio: number,
  zoom = 1,
  pan = { x: 0, y: 0 },
) {
  const baseWidth = Math.min(stage.width, stage.height * ratio);
  const width = baseWidth * Math.max(1, Math.min(4, zoom)),
    height = width / ratio;
  const limitX = Math.max(0, (width - stage.width) / 2),
    limitY = Math.max(0, (height - stage.height) / 2);
  return {
    width,
    height,
    left:
      (stage.width - width) / 2 + Math.max(-limitX, Math.min(limitX, pan.x)),
    top:
      (stage.height - height) / 2 + Math.max(-limitY, Math.min(limitY, pan.y)),
  };
}
