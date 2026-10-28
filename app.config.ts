import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "ArtSpace",
  slug: "artspace-ar",
  version: "1.0.0",
  scheme: "artspace",
  owner: "nguyenphutoan1",
  extra: { eas: { projectId: "189b9e68-6e66-4aae-b46c-77d7ab9a588b" } },
  orientation: "portrait",
  userInterfaceStyle: "dark",
  icon: "./assets/icon.png",
  android: {
    package: "com.artspacear.mma301",
    allowBackup: false,
    permissions: ["android.permission.CAMERA"],
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#111315",
    },
  },
  plugins: [
    "expo-sharing",
    "expo-router",
    "expo-asset",
    "expo-font",
    [
      "expo-image-picker",
      {
        photosPermission: "Choose a photo to preview as wall art.",
        cameraPermission: "Allow ArtSpace to photograph your room and artwork.",
        microphonePermission: false,
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#111315",
        image: "./assets/splash-icon.png",
        imageWidth: 160,
      },
    ],
  ],
};
export default config;
