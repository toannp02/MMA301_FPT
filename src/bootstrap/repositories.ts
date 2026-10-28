import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { PersonalArtworkRepository } from "../data/local/PersonalArtworkRepository";
import { WallSpaceRepository } from "../data/local/WallSpaceRepository";
import { BundledCatalogueRepository } from "../data/catalogue/artworks";
import { PersonalImageStore } from "../infra/personalImages";
import { WallImageStore } from "../infra/spaceImages";
import type { SpaceRepository } from "../domain/spaces";
import type {
  ArtworkRepository,
  CustomArtworkRepository,
} from "../domain/repositories";
export interface Repositories {
  artworks: ArtworkRepository;
  customArtworks: CustomArtworkRepository;
  spaces: SpaceRepository;
}
export function createRepositories(): Repositories {
  const artworks = new PersonalArtworkRepository(
    new BundledCatalogueRepository(),
    AsyncStorage,
    new PersonalImageStore(),
    () => Crypto.randomUUID(),
  );
  return {
    artworks,
    customArtworks: artworks,
    spaces: new WallSpaceRepository(AsyncStorage, new WallImageStore()),
  };
}
