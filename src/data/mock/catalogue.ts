import { Asset } from "expo-asset";
import type { Artwork, Category } from "../../domain/models";
import { ok } from "../../domain/models";
import type { ArtworkRepository } from "../../domain/repositories";
export const artAssets: number[] = [
  require("../../../assets/artworks/art-01.png"),
  require("../../../assets/artworks/art-02.png"),
  require("../../../assets/artworks/art-03.png"),
  require("../../../assets/artworks/art-04.png"),
  require("../../../assets/artworks/art-05.png"),
  require("../../../assets/artworks/art-06.png"),
  require("../../../assets/artworks/art-07.png"),
  require("../../../assets/artworks/art-08.png"),
  require("../../../assets/artworks/art-09.png"),
  require("../../../assets/artworks/art-10.png"),
  require("../../../assets/artworks/art-11.png"),
  require("../../../assets/artworks/art-12.png"),
];
export const categories: Category[] = ["Earth", "Botanical", "Abstract"].map(
  (name, i) => ({
    id: name.toLowerCase(),
    name,
    slug: name.toLowerCase(),
    order: i,
  }),
);
const titles = [
  "Terracotta Sun",
  "Quiet Arches",
  "Sage Horizon",
  "Indigo Tide",
  "Ochre Fields",
  "Clay Moon",
  "Forest Layers",
  "Blue Balance",
  "Desert Window",
  "Evening Forms",
  "Olive Rhythm",
  "Rose Geometry",
];
export const artworks: Artwork[] = titles.map((title, i) => ({
  id: `art-${String(i + 1).padStart(2, "0")}`,
  title,
  description:
    "An original geometric study of light, colour and balance. A quiet focal point for your space. Public domain / CC0 ArtSpace collection.",
  categoryId: categories[i % 3].id,
  imageUrl: Asset.fromModule(artAssets[i]).uri,
  thumbnailUrl: Asset.fromModule(artAssets[i]).uri,
  widthCm: 60,
  heightCm: 90,
  isFeatured: i < 3,
  status: "published",
}));
export class MockArtworkRepository implements ArtworkRepository {
  async listPublished() {
    return ok(artworks.filter((a) => a.status === "published"));
  }
  async getPublishedById(id: string) {
    return ok(
      artworks.find((a) => a.id === id && a.status === "published") ?? null,
    );
  }
  async listCategories() {
    return ok(categories);
  }
}
