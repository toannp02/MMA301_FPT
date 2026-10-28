import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { AppProviders } from "../../src/bootstrap/AppProviders";
import { createRepositories } from "../../src/bootstrap/repositories";
import { ImportArtworkScreen } from "../../src/ui/screens/ImportArtworkScreen";
import { pickArtworkImage } from "../../src/infra/pickArtworkImage";
jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual(
    "@react-native-async-storage/async-storage/jest/async-storage-mock",
  ),
);
jest.mock("../../src/infra/pickArtworkImage", () => ({
  pickArtworkImage: jest.fn(),
}));
jest.mock("../../src/infra/personalImages", () => ({
  PersonalImageStore: class {
    async persist(id: string) {
      return `file:///documents/${id}.jpg`;
    }
    async remove() {}
  },
}));
jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    router: { replace: jest.fn(), push: jest.fn() },
    useFocusEffect: function useMockFocus(effect: () => void | (() => void)) {
      React.useEffect(effect, [effect]);
    },
  };
});
const pick = jest.mocked(pickArtworkImage);
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});
async function setup() {
  const repositories = createRepositories();
  const view = await render(
    <AppProviders dependencies={repositories}>
      <ImportArtworkScreen />
    </AppProviders>,
  );
  return { view, repositories };
}
test("cancel and picker failure do not create an imported artwork", async () => {
  pick
    .mockResolvedValueOnce(null)
    .mockRejectedValueOnce(new Error("Unsupported image"));
  const { view, repositories } = await setup();
  await fireEvent.press(view.getByLabelText("Choose image"));
  await waitFor(() => expect(view.getByLabelText("Choose image")).toBeTruthy());
  expect(view.queryByLabelText("Save imported artwork")).toBeNull();
  await fireEvent.press(view.getByLabelText("Choose image"));
  expect(await view.findByText("Unsupported image")).toBeTruthy();
  expect(await repositories.customArtworks.list()).toEqual({
    ok: true,
    data: [],
  });
});
test("pick, validate and save routes to a durable custom artwork with locked proportions", async () => {
  pick.mockResolvedValue({
    uri: "file:///cache/photo.jpg",
    width: 1200,
    height: 800,
    bytes: 10000,
  });
  const { view, repositories } = await setup();
  await fireEvent.press(view.getByLabelText("Choose image"));
  await view.findByLabelText("Artwork title");
  await fireEvent.changeText(view.getByLabelText("Artwork title"), "");
  await fireEvent.press(view.getByLabelText("Save imported artwork"));
  expect(
    await view.findByText("Use a title with 2–60 characters."),
  ).toBeTruthy();
  await fireEvent.changeText(
    view.getByLabelText("Artwork title"),
    "Personal landscape",
  );
  await fireEvent.changeText(view.getByLabelText("Width (cm)"), "90");
  await fireEvent.press(view.getByLabelText("Save imported artwork"));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/artwork/[id]",
      params: { id: expect.stringMatching(/^custom-/) },
    }),
  );
  const imports = await repositories.customArtworks.list();
  expect(imports).toMatchObject({
    ok: true,
    data: [
      {
        title: "Personal landscape",
        widthCm: 90,
        heightCm: 60,
        sourceKind: "custom",
      },
    ],
  });
});

test("taking an artwork photo uses the camera source and handles permission denial", async () => {
  const denied = new Error("Allow camera access in Settings.");
  denied.name = "CameraPermissionError";
  pick.mockRejectedValueOnce(denied);
  const { view } = await setup();
  await fireEvent.press(view.getByLabelText("Take artwork photo"));
  expect(
    await view.findByText("Allow camera access in Settings."),
  ).toBeTruthy();
  expect(pick).toHaveBeenCalledWith("camera");
  expect(view.getByLabelText("Open camera settings")).toBeTruthy();
  expect(view.queryByLabelText("Save imported artwork")).toBeNull();
});
