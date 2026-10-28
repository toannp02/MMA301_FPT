import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { ViroARScene, ViroARPlane, ViroImage, ViroQuad, type ViroAnchor } from "@reactvision/react-viro";
import { ARScene, ARSceneContext } from "../../src/features/ar/ARScene";
import { WallPlaneSelector } from "../../src/features/ar/WallPlaneSelector";

// Keep the actual pinned selector's anchor map, hit conversion and selection
// logic. Only mock native rendering leaves, so a broad Viro mock cannot hide
// an omitted native alignment prop again.
jest.mock("@reactvision/react-viro/dist/components/ViroNode", () => ({ ViroNode: "MockNode" }));
jest.mock("@reactvision/react-viro/dist/components/ViroQuad", () => ({ ViroQuad: "MockQuad" }));
jest.mock("@reactvision/react-viro/dist/components/ViroPolygon", () => ({ ViroPolygon: "MockPolygon" }));
jest.mock("@reactvision/react-viro/dist/components/AR/ViroARPlane", () => ({ ViroARPlane: "MockPlane" }));
jest.mock("@reactvision/react-viro/dist/components/Material/ViroMaterials", () => ({ ViroMaterials: { createMaterials: jest.fn() } }));
jest.mock("@reactvision/react-viro/dist/components/Utilities/ViroPlatform", () => ({ isQuest: false }));
jest.mock("@reactvision/react-viro", () => ({
  ViroARPlaneSelector: jest.requireActual("@reactvision/react-viro/dist/components/AR/ViroARPlaneSelector").ViroARPlaneSelector,
  ViroARPlane: "MockPlane",
  ViroARScene: "MockScene",
  ViroImage: "MockImage", ViroQuad: "MockQuad",
}));

const wall: ViroAnchor = {
  anchorId: "wall-1", type: "plane", alignment: "Vertical",
  position: [0, 1, -2], rotation: [90, 0, 0], scale: [1, 1, 1],
  width: 2, height: 2, center: [0, 0, 0],
};

function setup() {
  const state = {
    artwork: { id: "art-01", imageUri: "file:///art.png", widthCm: 60, heightCm: 90 },
    scale: 1, registerReset: jest.fn(), status: jest.fn(), selected: jest.fn(),
    texture: jest.fn(), error: jest.fn(),
  };
  const view = render(<ARSceneContext.Provider value={state}><ARScene /></ARSceneContext.Provider>);
  fireEvent(view.UNSAFE_getByType(ViroARScene), "anchorFound", wall);
  return { view, state };
}

test("wall discovery supplies Vertical to native plane and survives updates", () => {
  const { view, state } = setup();
  expect(view.UNSAFE_getByType(ViroARPlane).props.alignment).toBe("Vertical");
  expect(state.status).toHaveBeenCalledWith("wall-found");
  expect(view.UNSAFE_queryByType(ViroImage)).toBeNull();
  fireEvent(view.UNSAFE_getByType(ViroARScene), "anchorUpdated", { ...wall, width: 2.2 });
  expect(view.UNSAFE_getByType(ViroARPlane).props.anchorId).toBe(wall.anchorId);
  expect(view.UNSAFE_getByType(ViroARPlane).props.alignment).toBe("Vertical");
  // Tapping in world space is converted by the real selector into plane space.
  fireEvent(view.UNSAFE_getByType(ViroQuad), "clickState", 3, [0.3, 1.2, -2]);
  expect(state.selected).toHaveBeenCalledWith(true);
  const image = view.UNSAFE_getByType(ViroImage);
  expect(image.props.width).toBe(0.6);
  expect(image.props.height).toBe(0.9);
  const selector = view.UNSAFE_getByType(WallPlaneSelector).instance as WallPlaneSelector;
  expect(selector.state.tapLocalPosition?.[0]).toBeCloseTo(0.3);
  expect(selector.state.tapLocalPosition?.[2]).toBeCloseTo(-0.2);
  fireEvent(view.UNSAFE_getByType(ViroARScene), "anchorUpdated", { ...wall, width: 2.3 });
  expect(view.UNSAFE_getByType(ViroImage)).toBeTruthy();
  const reset = state.registerReset.mock.calls[0][0] as () => void;
  act(reset);
  expect(view.UNSAFE_queryByType(ViroImage)).toBeNull();
  expect(state.selected).toHaveBeenLastCalledWith(false);
});

test("floors cannot be selected as walls", () => {
  const { view } = setup();
  fireEvent(view.UNSAFE_getByType(ViroARScene), "anchorFound", { ...wall, anchorId: "floor", alignment: "HorizontalUpward" });
  expect(view.UNSAFE_getAllByType(ViroARPlane)).toHaveLength(1);
});

test("a failed native image-load completion never enables capture", () => {
  const { view, state } = setup();
  fireEvent(view.UNSAFE_getByType(ViroQuad), "clickState", 3, wall.position);
  fireEvent(view.UNSAFE_getByType(ViroImage), "loadEnd", { nativeEvent: { success: false } });
  expect(state.texture).toHaveBeenLastCalledWith(false);
  expect(state.error).toHaveBeenCalledWith(expect.stringContaining("texture failed"));
  fireEvent(view.UNSAFE_getByType(ViroImage), "loadEnd", { nativeEvent: { success: true } });
  expect(state.texture).toHaveBeenLastCalledWith(true);
});

test("removing the selected wall returns to scanning", () => {
  const { view, state } = setup();
  fireEvent(view.UNSAFE_getByType(ViroQuad), "clickState", 3, wall.position);
  fireEvent(view.UNSAFE_getByType(ViroARScene), "anchorRemoved", wall);
  expect(view.UNSAFE_queryByType(ViroImage)).toBeNull();
  expect(state.selected).toHaveBeenLastCalledWith(false);
  expect(state.status).toHaveBeenLastCalledWith("scanning");
});
