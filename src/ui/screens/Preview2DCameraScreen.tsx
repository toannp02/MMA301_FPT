import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Preview2DScreen, type PreviewCameraProps } from "./Preview2DScreen";

function CameraFeed({ onReady, onError, onStopped }: PreviewCameraProps) {
  const camera = useRef<CameraView>(null);
  useEffect(() => () => onStopped?.(), [onStopped]);
  return (
    <CameraView
      ref={camera}
      facing="back"
      mode="picture"
      mute
      style={StyleSheet.absoluteFill}
      onCameraReady={() =>
        onReady(async () => {
          const photo = await camera.current?.takePictureAsync({
            quality: 0.85,
            exif: false,
          });
          if (!photo?.uri)
            throw new Error("Room photo could not be captured. Please retry.");
          return photo.uri;
        })
      }
      onMountError={(event) => onError(event.message)}
    />
  );
}

export function Preview2DCameraScreen({ id }: { id: string }) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state === "active") void getPermission().catch(() => undefined);
    });
    return () => listener.remove();
  }, [getPermission]);
  return (
    <Preview2DScreen
      id={id}
      active={focused && foreground}
      permission={permission}
      requestPermission={requestPermission}
      CameraFeed={CameraFeed}
    />
  );
}
