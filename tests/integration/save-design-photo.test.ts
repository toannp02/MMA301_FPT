import { Platform } from "react-native";
import * as MediaLibrary from "expo-media-library/legacy";
import { saveDesignPhoto } from "../../src/infra/saveDesignPhoto";
jest.mock("react-native", () => ({ Platform: { OS: "ios", Version: "18" } }));
jest.mock("expo-media-library/legacy", () => ({
  requestPermissionsAsync: jest.fn(),
  saveToLibraryAsync: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());
test("iOS asks only for add permission at download time", async () => {
  Object.assign(Platform, { OS: "ios", Version: "18" });
  jest
    .mocked(MediaLibrary.requestPermissionsAsync)
    .mockResolvedValue({ granted: true } as Awaited<
      ReturnType<typeof MediaLibrary.requestPermissionsAsync>
    >);
  await saveDesignPhoto("file:///design.png");
  expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalledWith(true, [
    "photo",
  ]);
  expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith(
    "file:///design.png",
  );
});
test("permission denial leaves the gallery unchanged and gives a retry instruction", async () => {
  Object.assign(Platform, { OS: "ios" });
  jest
    .mocked(MediaLibrary.requestPermissionsAsync)
    .mockResolvedValue({ granted: false } as Awaited<
      ReturnType<typeof MediaLibrary.requestPermissionsAsync>
    >);
  await expect(saveDesignPhoto("file:///design.png")).rejects.toThrow(
    "Settings",
  );
  expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
});
test("modern Android saves without requesting broad gallery read permission", async () => {
  Object.assign(Platform, { OS: "android", Version: 33 });
  await saveDesignPhoto("file:///design.png");
  expect(MediaLibrary.requestPermissionsAsync).not.toHaveBeenCalled();
  expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith(
    "file:///design.png",
  );
});
