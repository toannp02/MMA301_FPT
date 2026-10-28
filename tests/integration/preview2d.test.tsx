import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import { AppProviders } from "../../src/bootstrap/AppProviders";
import { createRepositories } from "../../src/bootstrap/repositories";
import {
  Preview2DScreen,
  type Preview2DProps,
  type PreviewCameraProps,
} from "../../src/ui/screens/Preview2DScreen";
import { pickArtworkImage } from "../../src/infra/pickArtworkImage";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual(
    "@react-native-async-storage/async-storage/jest/async-storage-mock",
  ),
);
jest.mock("../../src/infra/firebase/client", () => ({
  createFirebaseClient: jest.fn(),
}));
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
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: jest.requireActual("react-native").View,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    router: { back: jest.fn() },
    useFocusEffect: function useMockFocus(effect: () => void | (() => void)) {
      React.useEffect(effect, [effect]);
    },
  };
});
function FakeCamera(_props: PreviewCameraProps) {
  return <View testID="fake-camera" />;
}
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});
function setup(overrides: Partial<Preview2DProps> = {}) {
  const props: Preview2DProps = {
    id: "art-01",
    active: true,
    permission: { granted: true, canAskAgain: true },
    requestPermission: jest.fn(async () => undefined),
    CameraFeed: FakeCamera,
    ...overrides,
  };
  const repositories = createRepositories();
  const view = render(
    <AppProviders dependencies={repositories}>
      <Preview2DScreen {...props} />
    </AppProviders>,
  );
  return { view, props, repositories };
}

test("permission denial never opens camera and offers settings when blocked", async () => {
  const { view } = setup({
    permission: { granted: false, canAskAgain: false },
  });
  expect(await view.findByLabelText("Open camera settings")).toBeTruthy();
  expect(view.queryByTestId("fake-camera")).toBeNull();
  expect(view.getByText(/does not scan or track walls/)).toBeTruthy();
});

test("camera access is only requested by the explicit permission button", async () => {
  const { view, props } = setup({
    permission: { granted: false, canAskAgain: true },
  });
  const button = await view.findByLabelText("Enable camera for 2D Preview");
  expect(props.requestPermission).not.toHaveBeenCalled();
  await act(async () => fireEvent.press(button));
  expect(props.requestPermission).toHaveBeenCalledTimes(1);
});

test("2D overlay supports resize and reset and identifies screen-only scale", async () => {
  const { view } = setup();
  await view.findByTestId("fake-camera");
  act(() => view.UNSAFE_getByType(FakeCamera).props.onReady());
  fireEvent(view.getByTestId("preview2d-stage"), "layout", {
    nativeEvent: { layout: { width: 390, height: 360 } },
  });
  const initialWidth =
    view.getByTestId("preview2d-artwork").props.style[1].width;
  fireEvent.press(view.getByLabelText("Larger"));
  expect(
    view.getByTestId("preview2d-artwork").props.style[1].width,
  ).toBeGreaterThan(initialWidth);
  expect(view.getByText(/Size: 110%/)).toBeTruthy();
  fireEvent.press(view.getByLabelText("Reset position"));
  expect(view.getByTestId("preview2d-artwork").props.style[1].width).toBe(
    initialWidth,
  );
  expect(view.getByText(/no wall tracking or real-world scale/)).toBeTruthy();
});

test("camera failure can retry with a fresh camera instance", async () => {
  const { view } = setup();
  await view.findByTestId("fake-camera");
  act(() =>
    view.UNSAFE_getByType(FakeCamera).props.onError("Camera unavailable"),
  );
  expect(view.queryByTestId("fake-camera")).toBeNull();
  fireEvent.press(view.getByLabelText("Retry"));
  expect(view.getByTestId("fake-camera")).toBeTruthy();
});

test("drag gestures continue from the current position instead of jumping back", async () => {
  const { view } = setup();
  await view.findByTestId("fake-camera");
  act(() => view.UNSAFE_getByType(FakeCamera).props.onReady());
  fireEvent(view.getByTestId("preview2d-stage"), "layout", {
    nativeEvent: { layout: { width: 390, height: 360 } },
  });
  const event = (previousX: number, currentX: number, time: number) => ({
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: time,
      touchBank: [
        {
          touchActive: true,
          startPageX: 100,
          startPageY: 100,
          startTimeStamp: 1,
          previousPageX: previousX,
          previousPageY: 100,
          previousTimeStamp: time - 1,
          currentPageX: currentX,
          currentPageY: 100,
          currentTimeStamp: time,
        },
      ],
    },
  });
  const left = () =>
    view.getByTestId("preview2d-artwork").props.style[1].left as number;
  const initial = left();
  fireEvent(
    view.getByTestId("preview2d-artwork"),
    "responderGrant",
    event(100, 100, 1),
  );
  fireEvent(
    view.getByTestId("preview2d-artwork"),
    "responderMove",
    event(100, 150, 2),
  );
  expect(left()).toBeCloseTo(initial + 50);
  fireEvent(
    view.getByTestId("preview2d-artwork"),
    "responderMove",
    event(150, 200, 3),
  );
  expect(left()).toBeCloseTo(initial + 100);
  fireEvent(
    view.getByTestId("preview2d-artwork"),
    "responderRelease",
    event(200, 200, 4),
  );
  fireEvent(
    view.getByTestId("preview2d-artwork"),
    "responderGrant",
    event(200, 200, 5),
  );
  fireEvent(
    view.getByTestId("preview2d-artwork"),
    "responderMove",
    event(200, 170, 6),
  );
  expect(left()).toBeCloseTo(initial + 70);
});

test("inactive screens release the camera", async () => {
  const { view } = setup({ active: false });
  expect(await view.findByText(/Camera paused/)).toBeTruthy();
  expect(view.queryByTestId("fake-camera")).toBeNull();
});

test("invalid artwork IDs cannot start a camera", async () => {
  const { view } = setup({ id: "missing" });
  expect(await view.findByText("Artwork no longer available.")).toBeTruthy();
  expect(view.queryByTestId("fake-camera")).toBeNull();
});

test("capture a room and compare artworks without losing the photo or scale", async () => {
  const { view } = setup();
  const capture = jest.fn(async () => "file:///cache/room.jpg");
  await view.findByTestId("fake-camera");
  act(() => view.UNSAFE_getByType(FakeCamera).props.onReady(capture));
  fireEvent(view.getByTestId("preview2d-stage"), "layout", {
    nativeEvent: { layout: { width: 390, height: 360 } },
  });
  fireEvent.press(view.getByLabelText("Larger"));
  const oldBounds = view.getByTestId("preview2d-artwork").props.style[1];
  await act(async () => fireEvent.press(view.getByLabelText("Capture room")));
  expect(capture).toHaveBeenCalledTimes(1);
  expect(view.queryByTestId("fake-camera")).toBeNull();
  expect(view.getByLabelText("Your captured room").props.source[0].uri).toBe(
    "file:///cache/room.jpg",
  );
  fireEvent.press(await view.findByLabelText("Preview Quiet Arches"));
  expect(
    view.getByLabelText("Preview Quiet Arches").props.accessibilityState
      .selected,
  ).toBe(true);
  expect(
    view.getByLabelText("Preview Terracotta Sun").props.accessibilityState
      .selected,
  ).toBe(false);
  expect(view.getByTestId("preview2d-artwork").props.style[1]).toEqual(
    oldBounds,
  );
  expect(view.getByText(/Size: 110%/)).toBeTruthy();
  fireEvent.press(view.getByLabelText("Retake room"));
  expect(view.queryByLabelText("Your captured room")).toBeNull();
  expect(view.getByTestId("fake-camera")).toBeTruthy();
});

test("quick import stores personal artwork and selects it over the existing room", async () => {
  jest.mocked(pickArtworkImage).mockResolvedValue({
    uri: "file:///cache/art.jpg",
    width: 1200,
    height: 800,
    bytes: 10000,
  });
  const { view, repositories } = setup();
  await view.findByTestId("fake-camera");
  act(() =>
    view
      .UNSAFE_getByType(FakeCamera)
      .props.onReady(async () => "file:///cache/room.jpg"),
  );
  fireEvent(view.getByTestId("preview2d-stage"), "layout", {
    nativeEvent: { layout: { width: 390, height: 360 } },
  });
  fireEvent.press(view.getByLabelText("Larger"));
  await act(async () => fireEvent.press(view.getByLabelText("Capture room")));
  fireEvent.press(view.getByLabelText("Add your artwork"));
  fireEvent.press(await view.findByLabelText("Choose image"));
  await view.findByLabelText("Artwork title");
  fireEvent.changeText(view.getByLabelText("Artwork title"), "My own print");
  fireEvent.changeText(view.getByLabelText("Width (cm)"), "90");
  await act(async () =>
    fireEvent.press(view.getByLabelText("Use this artwork")),
  );
  expect(await view.findByLabelText("Preview My own print")).toBeTruthy();
  expect(view.getByLabelText("Your captured room").props.source[0].uri).toBe(
    "file:///cache/room.jpg",
  );
  expect(view.getByLabelText("2D artwork overlay").props.source[0].uri).toMatch(
    /^file:\/\/\/documents\/custom-/,
  );
  expect(view.getByText(/Size: 110%/)).toBeTruthy();
  const bounds = view.getByTestId("preview2d-artwork").props.style[1];
  expect(bounds.left + bounds.width / 2).toBeCloseTo(195);
  expect(await repositories.customArtworks.list()).toMatchObject({
    ok: true,
    data: [{ title: "My own print", widthCm: 90, heightCm: 60 }],
  });
});

test("a failed room photo keeps the camera available for retry", async () => {
  const { view } = setup();
  const capture = jest
    .fn()
    .mockRejectedValueOnce(new Error("Camera busy"))
    .mockResolvedValue("file:///room.jpg");
  await view.findByTestId("fake-camera");
  act(() => view.UNSAFE_getByType(FakeCamera).props.onReady(capture));
  await act(async () => fireEvent.press(view.getByLabelText("Capture room")));
  expect(view.getByText("Camera busy")).toBeTruthy();
  expect(view.getByTestId("fake-camera")).toBeTruthy();
  await act(async () => fireEvent.press(view.getByLabelText("Capture room")));
  expect(view.getByLabelText("Your captured room")).toBeTruthy();
});
