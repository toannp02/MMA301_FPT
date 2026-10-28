import { Platform } from "react-native";
import * as MediaLibrary from "expo-media-library/legacy";

/** Add-only access, requested only from the explicit download action. */
export async function saveDesignPhoto(uri: string) {
  if (
    Platform.OS === "ios" ||
    (Platform.OS === "android" && Number(Platform.Version) < 29)
  ) {
    const permission = await MediaLibrary.requestPermissionsAsync(true, [
      "photo",
    ]);
    if (!permission.granted)
      throw new Error(
        "Allow saving photos in Settings, then try Download to Photos again.",
      );
  }
  await MediaLibrary.saveToLibraryAsync(uri);
}
