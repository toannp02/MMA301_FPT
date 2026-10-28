import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
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
jest.mock("../../src/infra/firebase/client", () => ({
  createFirebaseClient: jest.fn(),
}));
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
test("art details offer View on room with the selected artwork identity", async () => {
  const x = setup(),
    view = render(x.wrap(<ArtworkDetailScreen id={art.id} />));
  fireEvent.press(await view.findByLabelText("View on room"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/view-on-room/[id]",
    params: { id: art.id },
  });
});
test("room selection forwards artwork and room without overwriting stored design", async () => {
  const x = setup(2),
    view = render(x.wrap(<ViewOnRoomScreen artworkId={art.id} />));
  fireEvent.press(await view.findByLabelText("View on My room"));
  expect(router.replace).toHaveBeenCalledWith({
    pathname: "/space/[id]",
    params: { id: "room1", artworkId: "a2" },
  });
  expect(x.save).not.toHaveBeenCalled();
  expect(x.room.pieces).toHaveLength(0);
});
test("native editor applies selected artwork and saves Light controls only on Save", async () => {
  const x = setup(),
    view = render(x.wrap(<SpaceEditorScreen id="room1" artworkId="a2" />));
  await view.findByTestId("studio-surface");
  expect(view.getByTestId("studio-surface").props.accessibilityActions).toEqual(
    expect.arrayContaining([
      { name: "select:room1_art0", label: "Select New artwork" },
    ]),
  );
  fireEvent(view.getByTestId("studio-surface"), "accessibilityAction", {
    nativeEvent: { actionName: "select:room1_art0" },
  });
  await view.findByText(/New artwork.*drag to position/);
  expect(x.save).not.toHaveBeenCalled();
  fireEvent.press(view.getByLabelText("Style"));
  fireEvent.press(view.getByLabelText("Light"));
  fireEvent(view.getByLabelText("Shadow offset"), "valueChange", 1.27);
  fireEvent.press(view.getByLabelText("Save"));
  await waitFor(() => expect(x.save).toHaveBeenCalled());
  const saved = x.save.mock.calls[0][0];
  expect(saved.pieces[0].artwork.id).toBe("a2");
  expect(saved.pieces[0].appearance.shadowOffset).toBeCloseTo(1.27);
  expect(x.room.pieces).toHaveLength(0);
});
test("Interiors add-room sheet exposes camera and photo library without permission on mount", async () => {
  const x = setup(),
    view = render(x.wrap(<SpacesScreen />));
  fireEvent.press(await view.findByLabelText("Add your room"));
  expect(view.getByLabelText("Take a Photo")).toBeTruthy();
  expect(view.getByLabelText("Choose from Photos")).toBeTruthy();
  expect(x.save).not.toHaveBeenCalled();
});

test("dimensions, image/light and visual frame edits persist while room zoom stays view-only", async () => {
  const x = setup(),
    view = render(x.wrap(<SpaceEditorScreen id="room1" artworkId="a2" />));
  await view.findByTestId("studio-surface");
  expect(view.getByTestId("studio-surface").props.accessibilityActions).toEqual(
    expect.arrayContaining([
      { name: "select:room1_art0", label: "Select New artwork" },
    ]),
  );
  fireEvent(view.getByTestId("studio-surface"), "accessibilityAction", {
    nativeEvent: { actionName: "select:room1_art0" },
  });
  await view.findByText(/New artwork.*drag to position/);
  fireEvent.press(view.getByLabelText("Style"));
  fireEvent.press(view.getByLabelText("Light"));
  fireEvent(view.getByLabelText("Shadow angle (degrees)"), "valueChange", -22);
  fireEvent(view.getByLabelText("Shadow softness"), "valueChange", 14);
  fireEvent.press(view.getByLabelText("Image"));
  fireEvent.press(view.getByLabelText("Increase Luminance"));
  fireEvent.press(view.getByLabelText("Frame"));
  fireEvent.press(view.getByLabelText("Classic frame"));
  fireEvent.press(view.getByLabelText("Keep proportions on"));
  fireEvent.changeText(view.getByLabelText("Artwork width (cm)"), "78,4");
  fireEvent.changeText(view.getByLabelText("Artwork height (cm)"), "66");
  fireEvent.press(view.getByLabelText("Apply artwork size"));
  expect(view.queryByLabelText("Zoom room")).toBeNull();
  expect(view.queryByLabelText("Zoom artwork")).toBeNull();
  expect(x.save).not.toHaveBeenCalled();
  fireEvent.press(view.getByLabelText("Save"));
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
  render(x.wrap(<ViewOnRoomScreen artworkId={art.id} />));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/space/[id]",
      params: { id: "room1", artworkId: "a2" },
    }),
  );
  expect(x.save).not.toHaveBeenCalled();
});
