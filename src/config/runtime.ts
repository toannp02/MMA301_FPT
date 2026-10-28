import Constants from "expo-constants";
// Explicit project capability; executionEnvironment can also identify dev clients.
export const isExpoGoPreview =
  Constants.expoConfig?.extra?.expoGoPreview === true;
