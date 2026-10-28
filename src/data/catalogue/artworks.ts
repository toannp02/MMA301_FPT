import { Asset } from "expo-asset";
import type { Artwork, Category } from "../../domain/models";
import { ok } from "../../domain/models";
import sampleImages from "../../../assets/artworks/samples/manifest.json";
import type { ArtworkRepository } from "../../domain/repositories";
const suppliedAssets: number[] = [
  require("../../../assets/artworks/samples/sample-01.jpg"),
  require("../../../assets/artworks/samples/sample-02.jpg"),
  require("../../../assets/artworks/samples/sample-03.jpg"),
  require("../../../assets/artworks/samples/sample-04.jpg"),
  require("../../../assets/artworks/samples/sample-05.jpg"),
  require("../../../assets/artworks/samples/sample-06.jpg"),
  require("../../../assets/artworks/samples/sample-07.jpg"),
  require("../../../assets/artworks/samples/sample-08.jpg"),
];
export const categories: Category[] = ["Earth", "Botanical", "Abstract"].map(
  (name, i) => ({
    id: name.toLowerCase(),
    name,
    slug: name.toLowerCase(),
    order: i,
  }),
);
export const artworks: Artwork[] = [
  ...sampleImages.map((image, i): Artwork => {
    const uri = Asset.fromModule(suppliedAssets[i]).uri;
    return {
      id: image.id,
      title: image.title,
      description:
        "Artwork image supplied for this project, prepared for wall preview. Display title and physical dimensions are illustrative; enter the measured artwork size in the editor.",
      categoryId: "abstract",
      imageUrl: uri,
      thumbnailUrl: uri,
      widthCm: image.defaultWidthCm,
      heightCm: Number(
        ((image.defaultWidthCm * image.height) / image.width).toFixed(2),
      ),
      isFeatured: true,
      status: "published",
    };
  }),
];
export class BundledCatalogueRepository implements ArtworkRepository {
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
