import type {
  Result,
  UserProfile,
  Artwork,
  Category,
  Favorite,
  SavedDesign,
  StorageMode,
} from "../models";
export interface AuthRepository {
  getCurrentUser(): Promise<UserProfile | null>;
  signIn(email: string, password: string): Promise<Result<UserProfile>>;
  signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<Result<UserProfile>>;
  signOut(): Promise<Result<void>>;
  updateProfile(displayName: string): Promise<Result<UserProfile>>;
  observeAuth(callback: (user: UserProfile | null) => void): () => void;
}
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
export interface FavoriteRepository {
  list(userId: string): Promise<Result<Favorite[]>>;
  add(userId: string, artworkId: string): Promise<Result<void>>;
  remove(userId: string, artworkId: string): Promise<Result<void>>;
}
export interface SavedDesignRepository {
  list(userId: string): Promise<Result<SavedDesign[]>>;
  getById(userId: string, id: string): Promise<Result<SavedDesign | null>>;
  create(userId: string, input: SavedDesign): Promise<Result<SavedDesign>>;
  delete(userId: string, id: string): Promise<Result<void>>;
}
export interface CaptureStorage {
  saveCapture(
    userId: string,
    designId: string,
    fileUri: string,
  ): Promise<
    Result<{
      capturedImageUri: string;
      imageStoragePath: string | null;
      storageMode: StorageMode;
    }>
  >;
  removeCapture(
    userId: string,
    designId: string,
    imageStoragePath: string | null,
  ): Promise<Result<void>>;
}
