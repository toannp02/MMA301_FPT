import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { AppProviders } from "../../src/bootstrap/AppProviders";
import { createRepositories } from "../../src/bootstrap/repositories";
import { ArtworkDetailScreen } from "../../src/ui/screens/ArtworkDetailScreen";
import { GalleryScreen } from "../../src/ui/screens/GalleryScreen";
import { SavedScreen } from "../../src/ui/screens/DesignScreens";
jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual(
    "@react-native-async-storage/async-storage/jest/async-storage-mock",
  ),
);
jest.mock("../../src/infra/firebase/client", () => ({
  createFirebaseClient: jest.fn(),
}));
jest.mock("../../src/config/runtime", () => ({ isExpoGoPreview: true }));
jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    router: { push: jest.fn() },
    useFocusEffect: function useMockFocus(effect: () => void | (() => void)) {
      React.useEffect(effect, [effect]);
    },
  };
});
const wrap = (screen: React.ReactNode) => (
  <AppProviders dependencies={createRepositories()}>{screen}</AppProviders>
);
test("Expo Go details focus on 2D preview without unrelated account actions", async () => {
  const view = render(wrap(<ArtworkDetailScreen id="art-01" />));
  expect(await view.findByLabelText("2D Preview")).toBeTruthy();
  fireEvent.press(view.getByLabelText("2D Preview"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/preview-2d/[id]",
    params: { id: "art-01" },
  });
  expect(view.queryByLabelText("View in AR")).toBeNull();
  expect(view.getByText(/2D only; no wall tracking/)).toBeTruthy();
});
test("Expo Go gallery identifies the limited runtime", async () => {
  const view = render(wrap(<GalleryScreen />));
  expect(view.getByText(/Expo Go preview/)).toBeTruthy();
  expect(await view.findByLabelText("View Terracotta Sun")).toBeTruthy();
});
test("Expo Go empty saves do not promise capture within Expo Go", async () => {
  const view = render(wrap(<SavedScreen />));
  expect(
    await view.findByText(/No saved designs in this Expo Go installation/),
  ).toBeTruthy();
});
