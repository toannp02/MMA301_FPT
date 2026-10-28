import { validateCapture } from "../../src/features/ar/arCapture";
import * as FS from "expo-file-system/legacy";
import { Image } from "react-native";
jest.mock("expo-file-system/legacy", () => ({ getInfoAsync: jest.fn() }));
beforeEach(() => {
  jest.restoreAllMocks();
});
test.each([
  null,
  {},
  { success: false, url: "/a.jpg" },
  { success: true },
  { success: true, url: 42 },
])("malformed native capture is rejected: %j", async (result) => {
  await expect(validateCapture(result)).rejects.toThrow();
});
test("missing and empty capture file rejected", async () => {
  jest
    .mocked(FS.getInfoAsync)
    .mockResolvedValue({
      exists: false,
      isDirectory: false,
      uri: "file:///a.jpg",
    });
  await expect(
    validateCapture({ success: true, url: "/a.jpg" }),
  ).rejects.toThrow(/missing/);
});
test("valid native path normalizes to file URI and checks decoder", async () => {
  jest
    .mocked(FS.getInfoAsync)
    .mockResolvedValue({
      exists: true,
      isDirectory: false,
      uri: "file:///a.jpg",
      size: 1024,
      modificationTime: 1,
    });
  jest.spyOn(Image, "getSize").mockImplementation((uri, success) => {
    success(600, 900);
  });
  expect(await validateCapture({ success: true, url: "/a.jpg" })).toBe(
    "file:///a.jpg",
  );
});
test("undecodable capture is rejected", async () => {
  jest
    .mocked(FS.getInfoAsync)
    .mockResolvedValue({
      exists: true,
      isDirectory: false,
      uri: "file:///a.jpg",
      size: 1024,
      modificationTime: 1,
    });
  jest.spyOn(Image, "getSize").mockImplementation((uri, success, failure) => {
    failure?.(new Error("bad image"));
  });
  await expect(
    validateCapture({ success: true, url: "/a.jpg" }),
  ).rejects.toThrow(/decoded/);
});
