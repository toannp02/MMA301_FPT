import type { Artwork } from "../../domain/models";
import { makePiece, type WallSpace } from "../../domain/spaces";
import { fitSpace } from "./geometry";

/** Apply to an editable copy: choosing a room never overwrites a saved design. */
export function placeArtworkInRoom(
  space: WallSpace,
  artwork: Artwork,
  slotId?: string,
): WallSpace {
  const active =
    space.pieces.find((piece) => piece.id === slotId) ?? space.pieces[0];
  const fresh = makePiece(artwork, active?.id ?? `${space.id}_art0`);
  if (active)
    return fitSpace({
      ...space,
      pieces: space.pieces.map((piece) =>
        piece.id === active.id ? { ...piece, artwork: fresh.artwork } : piece,
      ),
    });
  const tone = space.wall.photoAssist;
  const scale =
    space.wall.measurement === "approximate"
      ? Math.min(
          1,
          (space.wall.widthCm * 0.42) / artwork.widthCm,
          (space.wall.heightCm * 0.72) / artwork.heightCm,
        )
      : 1;
  return fitSpace({
    ...space,
    layout: "single",
    pieces: [
      {
        ...fresh,
        scale,
        appearance: {
          ...fresh.appearance,
          frame: "none",
          shadow: 0.3,
          shadowOffset: 0.7,
          brightness: tone?.brightness ?? 0,
          warmth: tone?.warmth ?? 0,
        },
      },
    ],
  });
}
