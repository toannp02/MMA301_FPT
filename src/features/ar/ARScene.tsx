import React, { createContext, useContext, useRef, useEffect } from "react";
import {
  ViroARScene,
  ViroImage,
} from "@reactvision/react-viro";
import { WallPlaneSelector } from "./WallPlaneSelector";
import type { ARArtworkInput, ARStatus } from "./arTypes";
import { dimensionsMeters } from "../../domain/validators";
interface SceneState {
  artwork: ARArtworkInput;
  scale: number;
  registerReset: (reset: (() => void) | null) => void;
  status: (status: ARStatus) => void;
  selected: (selected: boolean) => void;
  texture: (loaded: boolean) => void;
  error: (message: string) => void;
}
export const ARSceneContext = createContext<SceneState | null>(null);
export function ARScene() {
  const data = useContext(ARSceneContext);
  const selector = useRef<WallPlaneSelector>(null);
  const selectedId = useRef<string | null>(null);
  useEffect(() => {
    if (!data) return;
    data.registerReset(() => {
      selector.current?.reset();
      selectedId.current = null;
      data.selected(false);
      data.status("scanning");
    });
    return () => data.registerReset(null);
  }, [data]);
  if (!data) throw new Error("AR scene context missing");
  const size = dimensionsMeters(
    data.artwork.widthCm,
    data.artwork.heightCm,
    data.scale,
  );
  return (
    <ViroARScene
      anchorDetectionTypes={["PlanesVertical"]}
      onTrackingUpdated={(state) => {
        if (state === 3 && !selectedId.current) data.status("scanning");
      }}
      onAnchorFound={(a) => selector.current?.handleAnchorFound(a)}
      onAnchorUpdated={(a) => selector.current?.handleAnchorUpdated(a)}
      onAnchorRemoved={(a) => {
        if (a) selector.current?.handleAnchorRemoved(a);
      }}
    >
      <WallPlaneSelector
        ref={selector}
        alignment="Vertical"
        minWidth={0.15}
        minHeight={0.15}
        onPlaneDetected={() => {
          if (!selectedId.current) data.status("wall-found");
          return true;
        }}
        onPlaneSelected={(a) => {
          selectedId.current = a.anchorId;
          data.selected(true);
          data.status("placed");
        }}
        onPlaneRemoved={(id) => {
          if (selectedId.current === id) {
            selectedId.current = null;
            data.selected(false);
            data.status("scanning");
          }
        }}
      >
        {/* Plane local Y is the outward normal; rotate image XY into plane XZ. Validate upright orientation on hardware. */}
        <ViroImage
          key={data.artwork.imageUri}
          source={{ uri: data.artwork.imageUri }}
          width={size.width}
          height={size.height}
          position={[0, 0.008, 0]}
          rotation={[-90, 0, 0]}
          onLoadStart={() => data.texture(false)}
          onLoadEnd={(event) => {
            const loaded = event.nativeEvent.success;
            data.texture(loaded);
            if (!loaded)
              data.error(
                "Artwork texture failed to load. Reset or choose another artwork.",
              );
          }}
          onError={() => {
            data.texture(false);
            data.error(
              "Artwork texture failed to load. Reset or choose another artwork.",
            );
          }}
        />
      </WallPlaneSelector>
    </ViroARScene>
  );
}
