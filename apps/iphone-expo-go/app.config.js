module.exports = {
  name: "ArtSpace · Expo Go",
  slug: "artspace-iphone-preview",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  icon: "../../assets/icon.png",
  scheme: "artspace-go",
  plugins: [
    "expo-sharing",
    "expo-router",
    "expo-asset",
    "expo-font",
    [
      "expo-camera",
      {
        cameraPermission:
          "Allow ArtSpace to show a live camera background for 2D Preview.",
        recordAudioAndroid: false,
        microphonePermission: false,
      },
    ],
  ],
  extra: { expoGoPreview: true },
};
