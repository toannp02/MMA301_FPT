import "firebase/auth";
import type { Persistence } from "firebase/auth";
import type AsyncStorage from "@react-native-async-storage/async-storage";
// Firebase 12's public barrel omits this RN export from its types; installed
// @firebase/auth/dist/rn/index.rn.d.ts declares it. Metro selects that RN implementation.
declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: typeof AsyncStorage,
  ): Persistence;
}
