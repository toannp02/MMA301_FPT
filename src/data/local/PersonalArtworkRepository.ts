import { fail, type Artwork, type Category } from "../../domain/models";
import type {
  ArtworkRepository,
  ArtworkImageStore,
  CustomArtworkRepository,
  ImportedImage,
} from "../../domain/repositories";
import {
  customArtworkId,
  importValidation,
  MAX_IMPORTED_IMAGES,
  MAX_IMPORTED_BYTES,
} from "../../domain/customArtworks";
import { cleanName, positiveDimension } from "../../domain/validators";
import type { KeyValueStore } from "./KeyValueStore";
import { attempt, unwrap } from "../errors";
export const PERSONAL_ARTWORKS_KEY = "artspace:personal-artworks:v1";
export class PersonalArtworkRepository
  implements ArtworkRepository, CustomArtworkRepository
{
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private catalogue: ArtworkRepository,
    private store: KeyValueStore,
    private images: ArtworkImageStore,
    private createId: () => string,
  ) {}
  private async read(): Promise<Artwork[]> {
    const raw = await this.store.getItem(PERSONAL_ARTWORKS_KEY);
    const items: unknown = raw ? JSON.parse(raw) : [];
    if (
      !Array.isArray(items) ||
      items.length > MAX_IMPORTED_IMAGES ||
      !items.every(validPersonalArtwork)
    )
      throw Object.assign(new Error("Invalid imports"), {
        code: "invalid-data",
      });
    return items;
  }
  private serialize<T>(fn: () => Promise<T>) {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => undefined);
    return next;
  }
  list() {
    return attempt(() => this.read());
  }
  listPublished() {
    return attempt(async () => [
      ...(await this.read()),
      ...unwrap(await this.catalogue.listPublished()),
    ]);
  }
  getPublishedById(id: string) {
    return customArtworkId(id)
      ? attempt(
          async () => (await this.read()).find((a) => a.id === id) ?? null,
        )
      : this.catalogue.getPublishedById(id);
  }
  listCategories() {
    return attempt(async () => [
      ...unwrap(await this.catalogue.listCategories()),
      {
        id: "personal",
        name: "My imports",
        slug: "personal",
        order: 99,
      } satisfies Category,
    ]);
  }
  add(title: string, widthCm: number, image: ImportedImage) {
    const error = importValidation(title, widthCm, image);
    if (error) return Promise.resolve(fail("invalid-import", error));
    return attempt(() =>
      this.serialize(async () => {
        const items = await this.read();
        if (
          image.contentHash &&
          items.some((item) => item.contentHash === image.contentHash) &&
          !image.allowDuplicate
        )
          return Promise.reject(
            Object.assign(new Error("Duplicate"), { code: "import-duplicate" }),
          );
        if (items.length >= MAX_IMPORTED_IMAGES)
          throw Object.assign(new Error("Limit"), { code: "import-limit" });
        const id = `custom-${this.createId()}`;
        if (!customArtworkId(id) || items.some((a) => a.id === id))
          throw new Error("Invalid import identity");
        let uri: string | null = null;
        try {
          uri = await this.images.persist(id, image.uri);
          const artwork: Artwork = {
            id,
            sourceKind: "custom",
            ...(image.contentHash ? { contentHash: image.contentHash } : {}),
            title: cleanName(title),
            description:
              "Your imported artwork · stored only on this device. Original photo proportions are preserved.",
            categoryId: "personal",
            imageUrl: uri,
            thumbnailUrl: uri,
            widthCm,
            heightCm: (widthCm * image.height) / image.width,
            isFeatured: false,
            status: "published",
          };
          if (!validPersonalArtwork(artwork))
            throw new Error("Invalid persisted import");
          await this.store.setItem(
            PERSONAL_ARTWORKS_KEY,
            JSON.stringify([artwork, ...items]),
          );
          return artwork;
        } catch (error) {
          if (uri) await this.images.remove(id);
          throw error;
        }
      }),
    );
  }
  remove(id: string) {
    return attempt(() =>
      this.serialize(async () => {
        if (!customArtworkId(id)) throw new Error("Invalid import");
        const items = await this.read();
        await this.store.setItem(
          PERSONAL_ARTWORKS_KEY,
          JSON.stringify(items.filter((a) => a.id !== id)),
        );
        // A cleanup failure can leave an orphan, but never a broken visible
        // artwork. Metadata failure leaves both the record and file intact.
        await this.images.remove(id).catch(() => undefined);
      }),
    );
  }
}
function validPersonalArtwork(value: unknown): value is Artwork {
  if (!value || typeof value !== "object") return false;
  const a = value as Partial<Artwork>;
  const uri = a.imageUrl;
  return (
    (a.contentHash === undefined ||
      (typeof a.contentHash === "string" &&
        /^[a-f0-9]{64}$/.test(a.contentHash))) &&
    typeof a.id === "string" &&
    customArtworkId(a.id) &&
    a.sourceKind === "custom" &&
    a.status === "published" &&
    a.categoryId === "personal" &&
    typeof a.title === "string" &&
    a.title.length >= 2 &&
    a.title.length <= 60 &&
    typeof a.description === "string" &&
    typeof a.widthCm === "number" &&
    positiveDimension(a.widthCm) &&
    typeof a.heightCm === "number" &&
    positiveDimension(a.heightCm) &&
    typeof uri === "string" &&
    a.thumbnailUrl === uri &&
    ((uri.startsWith("file://") && uri.length <= 2048) ||
      (/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(uri) &&
        uri.length < MAX_IMPORTED_BYTES * 1.4))
  );
}
