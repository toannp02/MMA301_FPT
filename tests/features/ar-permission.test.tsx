import React from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { render } from "@testing-library/react-native";
import { isARSupportedOnDevice } from "@reactvision/react-viro";
import { ARViewer } from "../../src/features/ar/ARViewer";
jest.mock("../../src/features/ar/WallPlaneSelector", () => ({
  WallPlaneSelector: "MockSelector",
}));
jest.mock("@reactvision/react-viro", () => ({
  isARSupportedOnDevice: jest.fn(),
  ViroARSceneNavigator: "MockNavigator",
  ViroARScene: "MockScene",
  ViroARPlaneSelector: "MockSelector",
  ViroImage: "MockImage",
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: jest.requireActual("react-native").View,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
const artwork = {
  id: "art-01",
  imageUri: "file:///art.png",
  widthCm: 60,
  heightCm: 90,
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(Platform, "OS", "android");
});
afterEach(() => jest.restoreAllMocks());
test("camera denial offers settings/back without querying native AR support", async () => {
  jest.spyOn(PermissionsAndroid, "request").mockResolvedValue("denied");
  const view = render(
    <ARViewer
      artwork={artwork}
      onBack={jest.fn()}
      onCapture={jest.fn()}
      onError={jest.fn()}
      onChange={jest.fn()}
    />,
  );
  expect(await view.findByText(/Camera access is required/)).toBeTruthy();
  expect(view.getByLabelText("Open settings")).toBeTruthy();
  expect(view.getByLabelText("Back to artwork")).toBeTruthy();
  expect(isARSupportedOnDevice).not.toHaveBeenCalled();
});
test("unsupported native check keeps user in a recoverable state", async () => {
  jest.spyOn(PermissionsAndroid, "request").mockResolvedValue("granted");
  jest
    .mocked(isARSupportedOnDevice)
    .mockResolvedValue({ isARSupported: false });
  const view = render(
    <ARViewer
      artwork={artwork}
      onBack={jest.fn()}
      onCapture={jest.fn()}
      onError={jest.fn()}
      onChange={jest.fn()}
    />,
  );
  expect(await view.findByText(/does not support ARCore/)).toBeTruthy();
  expect(view.getByLabelText("Retry")).toBeTruthy();
});
