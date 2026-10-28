import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { AppProviders } from "../../src/bootstrap/AppProviders";
import { ArtworkDetailScreen } from "../../src/ui/screens/ArtworkDetailScreen";
import { GalleryScreen } from "../../src/ui/screens/GalleryScreen";
jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual(
    "@react-native-async-storage/async-storage/jest/async-storage-mock",
  ),
);
jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    router: { push: jest.fn(), replace: jest.fn() },
    useFocusEffect: function useMockFocus(effect: () => void | (() => void)) {
      React.useEffect(effect, [effect]);
    },
  };
});
beforeEach(() => jest.clearAllMocks());
test("photo details go directly to View on room without AR or duplicate preview", async () => {
  const view = await render(
    <AppProviders>
      <ArtworkDetailScreen id="sample-01" />
    </AppProviders>,
  );
  await fireEvent.press(await view.findByLabelText("View on room"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/view-on-room/[id]",
    params: { id: "sample-01" },
  });
  expect(view.queryByLabelText("View in AR")).toBeNull();
  expect(view.queryByLabelText("2D Preview")).toBeNull();
});
test("the root collection exposes the three core sections without account setup", async () => {
  const view = await render(
    <AppProviders>
      <GalleryScreen />
    </AppProviders>,
  );
  expect(await view.findByLabelText("View Chromatic Rhythm")).toBeTruthy();
  expect(view.getByLabelText("Add art")).toBeTruthy();
  expect(view.getByLabelText("Saved")).toBeTruthy();
  await fireEvent.press(view.getByLabelText("Interiors"));
  expect(router.replace).toHaveBeenCalledWith("/spaces");
  expect(view.queryByLabelText("Sign in")).toBeNull();
});
