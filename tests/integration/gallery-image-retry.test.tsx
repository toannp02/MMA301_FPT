import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { router } from "expo-router";
import { AppProviders } from "../../src/bootstrap/AppProviders";
import { createRepositories } from "../../src/bootstrap/repositories";
import { GalleryScreen } from "../../src/ui/screens/GalleryScreen";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual(
    "@react-native-async-storage/async-storage/jest/async-storage-mock",
  ),
);
jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    router: { push: jest.fn() },
    useFocusEffect: function useMockFocus(effect: () => void | (() => void)) {
      React.useEffect(effect, [effect]);
    },
  };
});

test("gallery image errors allow retry without nested buttons or navigation", async () => {
  const view = await render(
    <AppProviders dependencies={createRepositories()}>
      <GalleryScreen />
    </AppProviders>,
  );
  const imageLink = await view.findByLabelText(
    "View image of Chromatic Rhythm",
  );
  await fireEvent.press(imageLink);
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/artwork/[id]",
    params: { id: "sample-01" },
  });
  jest.mocked(router.push).mockClear();
  await fireEvent(view.getAllByLabelText("Artwork preview")[0], "error", {
    nativeEvent: { error: "Image request failed" },
  });
  expect(view.getByText("Image unavailable")).toBeTruthy();
  // On web these Pressables become buttons. Assert the failed-image branch
  // has no interactive ancestor, which previously caused invalid HTML.
  for (const button of view.getAllByRole("button")) {
    let ancestor = button.parent;
    while (ancestor) {
      expect(
        ancestor.type === button.type &&
          ancestor.props.accessibilityRole === "button",
      ).toBe(false);
      ancestor = ancestor.parent;
    }
  }
  await fireEvent.press(view.getByLabelText("Reload image"));
  expect(router.push).not.toHaveBeenCalled();
  expect(view.queryByText("Image unavailable")).toBeNull();
  await fireEvent.press(view.getByLabelText("View Chromatic Rhythm"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/artwork/[id]",
    params: { id: "sample-01" },
  });
});
