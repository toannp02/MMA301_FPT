import React from "react";
import { BackHandler } from "react-native";
import { act, render, fireEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { AppProviders } from "../../src/bootstrap/AppProviders";
import { createRepositories } from "../../src/bootstrap/repositories";
import { ViewOnRoomScreen } from "../../src/ui/screens/ViewOnRoomScreen";
import { SpaceEditorScreen } from "../../src/ui/screens/SpaceEditorScreen";
import { ArtworkDetailScreen } from "../../src/ui/screens/ArtworkDetailScreen";
import { SpacesScreen } from "../../src/ui/screens/SpacesScreen";
import { newSpace } from "../../src/features/studio/createSpace";
import { ok, type Artwork } from "../../src/domain/models";
import type { WallSpace } from "../../src/domain/spaces";
jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual(
    "@react-native-async-storage/async-storage/jest/async-storage-mock",
  ),
);
jest.mock("../../src/infra/exportSpace", () => ({
  exportSpacePNG: jest.fn(),
  shareSpacePNG: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: jest.requireActual("react-native").View,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useNavigation: () => ({ dispatch: jest.fn() }),
    useFocusEffect: function useMockFocus(effect: () => void | (() => void)) {
      React.useEffect(effect, [effect]);
    },
  };
});
jest.mock("expo-router/react-navigation", () => ({
  usePreventRemove: jest.fn(),
}));
const art: Artwork = {
  id: "a2",
  title: "New artwork",
  description: "",
  categoryId: "test",
  imageUrl: "file:///new.jpg",
  thumbnailUrl: "file:///new.jpg",
  widthCm: 60,
  heightCm: 90,
  status: "published",
  isFeatured: false,
};
function setup(count = 1) {
  const room = newSpace("room1", "My room", {
    uri: "file:///room.jpg",
    width: 1200,
    height: 900,
  });
  const save = jest.fn(async (value: WallSpace) => ok(value));
  const dependencies = {
    ...createRepositories(),
    artworks: {
      listPublished: async () => ok([art]),
      getPublishedById: async () => ok(art),
      listCategories: async () => ok([]),
    },
    spaces: {
      list: async () =>
        ok(
          count === 1
            ? [room]
            : [room, { ...room, id: "room2", name: "Other room" }],
        ),
      get: async () => ok(room),
      save,
      remove: async () => ok(undefined),
    },
  };
  return {
    room,
    save,
    dependencies,
    wrap: (element: React.ReactNode) => (
      <AppProviders dependencies={dependencies}>{element}</AppProviders>
    ),
  };
}
beforeEach(() => jest.clearAllMocks());

test("tools collapse independently and full-room preview restores the editing session", async () => {
  const x = setup();
  const view = await render(
    x.wrap(<SpaceEditorScreen id="room1" artworkId="a2" />),
  );
  const surface = await view.findByTestId("studio-surface");
  const selectAction = surface.props.accessibilityActions.find(
    (action: { name: string }) => action.name.startsWith("select:"),
  );
  await fireEvent(surface, "accessibilityAction", {
    nativeEvent: { actionName: selectAction.name },
  });
  await fireEvent.press(view.getByLabelText("Style"));
  await fireEvent.press(view.getByLabelText("Light"));
  await fireEvent.press(view.getByLabelText("Increase Artwork depth (cm)"));
  await fireEvent.press(view.getByLabelText("Hide tools"));
  expect(view.queryByTestId("studio-tools")).toBeNull();
  await fireEvent.press(view.getByLabelText("View full"));
  expect(view.queryByLabelText("My walls")).toBeNull();
  expect(view.getByTestId("studio-surface").props.pointerEvents).toBe("none");
  expect(x.save).not.toHaveBeenCalled();
  await fireEvent.press(view.getByLabelText("Shrink view"));
  expect(view.queryByTestId("studio-tools")).toBeNull();
  await fireEvent.press(view.getByLabelText("Show tools"));
  expect(view.getByLabelText("Increase Artwork depth (cm)")).toBeTruthy();
  await fireEvent.press(view.getByLabelText("Save"));
  await waitFor(() => expect(x.save).toHaveBeenCalledTimes(1));
  expect(x.save.mock.calls[0][0].pieces).toHaveLength(1);
  expect(x.save.mock.calls[0][0].pieces[0].appearance.depthCm).toBeGreaterThan(
    0,
  );
});

test("Android Back shrinks full-room preview before leaving the editor", async () => {
  const remove = jest.fn();
  const back = jest
    .spyOn(BackHandler, "addEventListener")
    .mockReturnValue({ remove });
  try {
    const x = setup();
    const view = await render(
      x.wrap(<SpaceEditorScreen id="room1" artworkId="a2" />),
    );
    await fireEvent.press(await view.findByLabelText("View full"));
    const callback = back.mock.calls.find(
      ([event]) => event === "hardwareBackPress",
    )?.[1];
    expect(callback).toBeDefined();
    await act(() => {
      expect(
        callback?.({ type: "hardwareBackPress", timeStamp: Date.now() }),
      ).toBe(true);
    });
    expect(view.getByLabelText("View full")).toBeTruthy();
    expect(view.queryByLabelText("Shrink view")).toBeNull();
    expect(remove).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  } finally {
    back.mockRestore();
  }
});
test("art details offer View on room with the selected artwork identity", async () => {
  const x = setup(),
    view = await render(x.wrap(<ArtworkDetailScreen id={art.id} />));
  await fireEvent.press(await view.findByLabelText("View on room"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/view-on-room/[id]",
    params: { id: art.id },
  });
});
test("room selection forwards artwork and room without overwriting stored design", async () => {
  const x = setup(2),
    view = await render(x.wrap(<ViewOnRoomScreen artworkId={art.id} />));
  await fireEvent.press(await view.findByLabelText("View on My room"));
  expect(router.replace).toHaveBeenCalledWith({
    pathname: "/space/[id]",
    params: { id: "room1", artworkId: "a2" },
  });
  expect(x.save).not.toHaveBeenCalled();
  expect(x.room.pieces).toHaveLength(0);
});
test("native editor applies selected artwork and saves Light controls only on Save", async () => {
  const x = setup(),
    view = await render(
      x.wrap(<SpaceEditorScreen id="room1" artworkId="a2" />),
    );
  await view.findByTestId("studio-surface");
  expect(view.getByTestId("studio-surface").props.accessibilityActions).toEqual(
    expect.arrayContaining([
      { name: "select:room1_art0", label: "Select New artwork" },
    ]),
  );
  await fireEvent(view.getByTestId("studio-surface"), "accessibilityAction", {
    nativeEvent: { actionName: "select:room1_art0" },
  });
  await view.findByText(/New artwork.*drag to position/);
  expect(x.save).not.toHaveBeenCalled();
  await fireEvent.press(view.getByLabelText("Style"));
  await fireEvent.press(view.getByLabelText("Light"));
  await fireEvent(view.getByLabelText("Shadow offset"), "valueChange", 1.27);
  await fireEvent.press(view.getByLabelText("Save"));
  await waitFor(() => expect(x.save).toHaveBeenCalled());
  const saved = x.save.mock.calls[0][0];
  expect(saved.pieces[0].artwork.id).toBe("a2");
  expect(saved.pieces[0].appearance.shadowOffset).toBeCloseTo(1.27);
  expect(x.room.pieces).toHaveLength(0);
});
test("Interiors add-room sheet exposes camera and photo library without permission on mount", async () => {
  const x = setup(),
    view = await render(x.wrap(<SpacesScreen />));
  await fireEvent.press(await view.findByLabelText("Add your room"));
  expect(view.getByLabelText("Take a Photo")).toBeTruthy();
  expect(view.getByLabelText("Choose from Photos")).toBeTruthy();
  expect(x.save).not.toHaveBeenCalled();
});

test("dimensions, image/light and visual frame edits persist while room zoom stays view-only", async () => {
  const x = setup(),
    view = await render(
      x.wrap(<SpaceEditorScreen id="room1" artworkId="a2" />),
    );
  await view.findByTestId("studio-surface");
  expect(view.getByTestId("studio-surface").props.accessibilityActions).toEqual(
    expect.arrayContaining([
      { name: "select:room1_art0", label: "Select New artwork" },
    ]),
  );
  await fireEvent(view.getByTestId("studio-surface"), "accessibilityAction", {
    nativeEvent: { actionName: "select:room1_art0" },
  });
  await view.findByText(/New artwork.*drag to position/);
  await fireEvent.press(view.getByLabelText("Style"));
  await fireEvent.press(view.getByLabelText("Light"));
  await fireEvent(
    view.getByLabelText("Shadow angle (degrees)"),
    "valueChange",
    -22,
  );
  await fireEvent(view.getByLabelText("Shadow softness"), "valueChange", 14);
  await fireEvent.press(view.getByLabelText("Image"));
  await fireEvent.press(view.getByLabelText("Increase Luminance"));
  await fireEvent.press(view.getByLabelText("Frame"));
  await fireEvent.press(view.getByLabelText("Classic frame"));
  await fireEvent.press(view.getByLabelText("Keep proportions on"));
  await fireEvent.changeText(view.getByLabelText("Artwork width (cm)"), "78,4");
  await fireEvent.changeText(view.getByLabelText("Artwork height (cm)"), "66");
  await fireEvent.press(view.getByLabelText("Apply artwork size"));
  expect(view.queryByLabelText("Zoom room")).toBeNull();
  expect(view.queryByLabelText("Zoom artwork")).toBeNull();
  expect(x.save).not.toHaveBeenCalled();
  await fireEvent.press(view.getByLabelText("Save"));
  await waitFor(() => expect(x.save).toHaveBeenCalledTimes(1));
  const saved = x.save.mock.calls[0][0];
  expect(saved.pieces[0].appearance).toMatchObject({
    frameProfile: "classic",
    shadowAngle: -22,
    shadowSoftness: 14,
    brightness: 0.01,
  });
  expect(saved.pieces[0].artwork).toMatchObject({
    widthCm: 78.4,
    heightCm: 66,
  });
  expect(saved.room).toEqual(x.room.room);
  expect(saved.wall).toEqual(x.room.wall);
});

test("View on room automatically applies to the only saved room", async () => {
  const x = setup();
  await render(x.wrap(<ViewOnRoomScreen artworkId={art.id} />));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/space/[id]",
      params: { id: "room1", artworkId: "a2" },
    }),
  );
  expect(x.save).not.toHaveBeenCalled();
});
