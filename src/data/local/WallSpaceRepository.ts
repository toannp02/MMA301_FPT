import type {
  SpaceImageStore,
  SpaceRepository,
  WallSpace,
} from "../../domain/spaces";
import { spaceIdValid, validSpace } from "../../domain/spaces";
import { attempt } from "../errors";
import type { KeyValueStore } from "./KeyValueStore";
const KEY = "artspace:wall-spaces:v1";
export class WallSpaceRepository implements SpaceRepository {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private store: KeyValueStore,
    private images: SpaceImageStore,
  ) {}
  private async read(): Promise<WallSpace[]> {
    const raw = await this.store.getItem(KEY);
    const values: unknown = raw ? JSON.parse(raw) : [];
    if (
      !Array.isArray(values) ||
      values.length > 20 ||
      !values.every(validSpace)
    )
      throw new Error(
        "Saved spaces could not be read. Your files have not been removed.",
      );
    return values;
  }
  private serialize<T>(action: () => Promise<T>) {
    const next = this.queue.then(action, action);
    this.queue = next.catch(() => undefined);
    return next;
  }
  list() {
    return attempt(() => this.read());
  }
  get(id: string) {
    return attempt(async () => {
      if (!spaceIdValid(id)) throw new Error("Invalid space");
      return (await this.read()).find((space) => space.id === id) ?? null;
    });
  }
  save(input: WallSpace) {
    return attempt(() =>
      this.serialize(async () => {
        if (!validSpace(input))
          throw Object.assign(new Error("Invalid space"), {
            code: "space-invalid",
          });
        const values = await this.read(),
          previous = values.find((space) => space.id === input.id);
        if (!previous && values.length >= 20)
          throw Object.assign(new Error("Space limit"), {
            code: "space-limit",
          });
        if (previous && previous.updatedAt !== input.updatedAt)
          throw Object.assign(new Error("Space conflict"), {
            code: "space-conflict",
          });
        const created: string[] = [];
        try {
          const persist = async (assetId: string, uri: string) => {
            const value = await this.images.persist(input.id, assetId, uri);
            if (value.created) created.push(value.key);
            return value.uri;
          };
          const roomUri = await persist("room", input.room.uri);
          const previewUri = input.previewUri
            ? await persist("preview", input.previewUri)
            : undefined;
          const pieces: WallSpace["pieces"] = [];
          const sources = new Map<string, string>();
          for (const piece of input.pieces) {
            const sourceKey = `${piece.artwork.id}:${piece.artwork.imageUrl}`;
            let imageUrl = sources.get(sourceKey);
            if (!imageUrl) {
              imageUrl = await persist(
                `art_${piece.artwork.id}`,
                piece.artwork.imageUrl,
              );
              sources.set(sourceKey, imageUrl);
            }
            pieces.push({ ...piece, artwork: { ...piece.artwork, imageUrl } });
          }
          const mask = input.wall.occlusionMaskUri
            ? await persist("mask", input.wall.occlusionMaskUri)
            : undefined;
          const saved: WallSpace = {
            ...input,
            room: { ...input.room, uri: roomUri },
            previewUri,
            wall: { ...input.wall, occlusionMaskUri: mask },
            pieces,
            updatedAt: new Date(
              Math.max(Date.now(), Date.parse(input.updatedAt) + 1),
            ).toISOString(),
          };
          if (!validSpace(saved)) throw new Error("Prepared space is invalid.");
          await this.store.setItem(
            KEY,
            JSON.stringify([
              saved,
              ...values.filter((space) => space.id !== input.id),
            ]),
          );
          // Metadata is durable before unused app-owned images are reclaimed.
          await this.images
            .prune?.(input.id, [
              saved.room.uri,
              ...(saved.previewUri ? [saved.previewUri] : []),
              ...saved.pieces.map((p) => p.artwork.imageUrl),
              ...(saved.wall.occlusionMaskUri
                ? [saved.wall.occlusionMaskUri]
                : []),
            ])
            .catch(() => undefined);
          return saved;
        } catch (error) {
          await Promise.allSettled(
            [...new Set(created)].map((asset) =>
              this.images.remove(input.id, asset),
            ),
          );
          throw error;
        }
      }),
    );
  }
  remove(id: string) {
    return attempt(() =>
      this.serialize(async () => {
        if (!spaceIdValid(id)) throw new Error("Invalid space");
        const values = await this.read();
        await this.store.setItem(
          KEY,
          JSON.stringify(values.filter((space) => space.id !== id)),
        );
        // Commit removal before reclaiming files: a failed metadata write
        // must never leave a visible saved room with its images deleted.
        await this.images.removeSpace(id).catch(() => undefined);
      }),
    );
  }
}
