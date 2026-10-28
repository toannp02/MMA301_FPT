import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { PersonalArtworkRepository } from "../data/local/PersonalArtworkRepository";
import { PersonalImageStore } from "../infra/personalImages";
import { WallImageStore } from "../infra/spaceImages";
import { WallSpaceRepository } from "../data/local/WallSpaceRepository";
import type { SpaceRepository } from "../domain/spaces";
import { CombinedSavedDesignRepository } from "../data/local/CombinedSavedDesignRepository";
import { firebaseConfigured, cloudStorageEnabled } from "../config/env";
import { createFirebaseClient } from "../infra/firebase/client";
import { FirebaseAuthRepository } from "../data/firebase/FirebaseAuthRepository";
import { FirebaseArtworkRepository } from "../data/firebase/FirebaseArtworkRepository";
import { FirebaseFavoriteRepository } from "../data/firebase/FirebaseFavoriteRepository";
import { FirebaseSavedDesignRepository } from "../data/firebase/FirebaseSavedDesignRepository";
import { FirebaseCaptureStorage } from "../data/firebase/FirebaseCaptureStorage";
import { MockArtworkRepository } from "../data/mock/catalogue";
import { LocalSavedDesignRepository } from "../data/local/LocalSavedDesignRepository";
import { LocalCaptureStorage } from "../data/local/LocalCaptureStorage";
import {
  UnavailableAuthRepository,
  UnavailableFavoriteRepository,
} from "../data/UnavailableAuthRepository";
import { DesignUseCases } from "../features/designs/designUseCases";
import type {
  AuthRepository,
  ArtworkRepository,
  CustomArtworkRepository,
  FavoriteRepository,
  SavedDesignRepository,
} from "../domain/repositories";
export interface Repositories {
  auth: AuthRepository;
  artworks: ArtworkRepository;
  customArtworks: CustomArtworkRepository;
  spaces: SpaceRepository;
  favorites: FavoriteRepository;
  designs: SavedDesignRepository;
  designActions: DesignUseCases;
  mode: "local" | "cloud";
  demo: boolean;
}
export function createRepositories(): Repositories {
  const client = firebaseConfigured ? createFirebaseClient() : null;
  const localDesigns = new LocalSavedDesignRepository(AsyncStorage);
  const designs =
    cloudStorageEnabled && client
      ? new CombinedSavedDesignRepository(
          localDesigns,
          new FirebaseSavedDesignRepository(client),
        )
      : localDesigns;
  const captures =
    cloudStorageEnabled && client
      ? new FirebaseCaptureStorage(client)
      : new LocalCaptureStorage();
  const artworks = new PersonalArtworkRepository(
    client
      ? new FirebaseArtworkRepository(client)
      : new MockArtworkRepository(),
    AsyncStorage,
    new PersonalImageStore(),
    () => Crypto.randomUUID(),
  );
  return {
    spaces: new WallSpaceRepository(AsyncStorage, new WallImageStore()),
    auth: client
      ? new FirebaseAuthRepository(client)
      : new UnavailableAuthRepository(),
    artworks,
    customArtworks: artworks,
    favorites: client
      ? new FirebaseFavoriteRepository(client)
      : new UnavailableFavoriteRepository(),
    designs,
    designActions: new DesignUseCases(
      designs,
      captures,
      new LocalCaptureStorage(),
    ),
    mode: cloudStorageEnabled ? ("cloud" as const) : ("local" as const),
    demo: !client,
  };
}
