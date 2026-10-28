import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig, firebaseConfigured } from "../../config/env";
export function createFirebaseClient() {
  if (!firebaseConfigured) throw new Error("Firebase not configured");
  const existing = getApps()[0];
  const app = existing ?? initializeApp(firebaseConfig);
  const auth = existing
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
  return { auth, db: getFirestore(app), storage: getStorage(app) };
}
export type FirebaseClient = ReturnType<typeof createFirebaseClient>;
