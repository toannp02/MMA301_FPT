import type { WallSpace } from "../../domain/spaces";
import { fitSpace } from "./geometry";
export function applyEditorChange<
  T extends { space: WallSpace; selected: string | null },
>(current: T, changed: T): T {
  if (changed === current) return current;
  const space =
    changed.space === current.space ? current.space : fitSpace(changed.space);
  return {
    ...changed,
    space,
    selected:
      changed.selected === null ||
      space.pieces.some((piece) => piece.id === changed.selected)
        ? changed.selected
        : (space.pieces[0]?.id ?? null),
  };
}
