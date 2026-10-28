import type { Result, Artwork, Category } from "../models";
export interface ArtworkRepository {
  listPublished(): Promise<Result<Artwork[]>>;
  getPublishedById(id: string): Promise<Result<Artwork | null>>;
  listCategories(): Promise<Result<Category[]>>;
}
export interface ImportedImage {
  contentHash?: string;
  allowDuplicate?: boolean;
  uri: string;
  width: number;
  height: number;
  bytes: number;
}
export interface CustomArtworkRepository {
  list(): Promise<Result<Artwork[]>>;
  add(
    title: string,
    widthCm: number,
    image: ImportedImage,
  ): Promise<Result<Artwork>>;
  remove(id: string): Promise<Result<void>>;
}
export interface ArtworkImageStore {
  persist(id: string, uri: string): Promise<string>;
  remove(id: string): Promise<void>;
}
