import type { Artwork } from "../../domain/models";
import {
  defaultWall,
  makePiece,
  type WallSpace,
  type WallSurface,
} from "../../domain/spaces";
import { fitSpace } from "./geometry";
export function newSpace(
  id: string,
  name: string,
  room: WallSpace["room"],
  artwork?: Artwork,
  wall?: WallSurface,
): WallSpace {
  const date = new Date().toISOString();
  return fitSpace({
    version: 1,
    id,
    name: name.trim() || "My wall",
    room,
    wall: wall ?? {
      ...defaultWall,
      corners: defaultWall.corners.map((p) => ({
        ...p,
      })) as WallSurface["corners"],
    },
    pieces: artwork ? [makePiece(artwork, `${id}_art0`)] : [],
    layout: "single",
    gapCm: 5,
    createdAt: date,
    updatedAt: date,
  });
}
