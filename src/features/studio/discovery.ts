import type { Artwork } from "../../domain/models";
export interface ArtworkQuery {
  text: string;
  orientation: "all" | "portrait" | "landscape" | "square";
  maxWidthCm: string;
  category: string;
}
export const emptyQuery: ArtworkQuery = {
  text: "",
  orientation: "all",
  maxWidthCm: "",
  category: "all",
};
export function filterArtworks(
  items: Artwork[],
  query: ArtworkQuery,
): Artwork[] {
  const text = query.text.trim().toLocaleLowerCase(),
    limit = Number(query.maxWidthCm.replace(",", "."));
  return items.filter((art) => {
    const ratio = art.widthCm / art.heightCm;
    const orientation =
      Math.abs(ratio - 1) < 0.02
        ? "square"
        : ratio > 1
          ? "landscape"
          : "portrait";
    return (
      (!text ||
        `${art.title} ${art.description}`.toLocaleLowerCase().includes(text)) &&
      (query.orientation === "all" || query.orientation === orientation) &&
      (!query.maxWidthCm.trim() ||
        (Number.isFinite(limit) && limit > 0 && art.widthCm <= limit)) &&
      (query.category === "all" || art.categoryId === query.category)
    );
  });
}
