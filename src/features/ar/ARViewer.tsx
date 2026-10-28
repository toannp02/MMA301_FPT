import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Linking,
  PermissionsAndroid,
  Platform,
  Text,
  View,
  StyleSheet,
} from "react-native";
import {
  isARSupportedOnDevice,
  ViroARSceneNavigator,
} from "@reactvision/react-viro";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ARScene, ARSceneContext } from "./ARScene";
import { validateCapture } from "./arCapture";
import type { ARStatus, ARViewerProps } from "./arTypes";
import { Button, ErrorState, Loading, Page } from "../../ui/components";
import { styles as s } from "../../ui/theme";
import { clampScale } from "../../domain/validators";
import { withTimeout } from "../../domain/async";
import { ensureARSupport } from "./arSupport";
export function ARViewer({
  artwork,
  onBack,
  onCapture,
  onError,
  onChange,
}: ARViewerProps & { onChange: () => void }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<ARStatus>("initializing");
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState(false);
  const [loadedUri, setLoadedUri] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const texture = loadedUri === artwork.imageUri;
  const setTexture = useCallback(
    (loaded: boolean) => setLoadedUri(loaded ? artwork.imageUri : null),
    [artwork.imageUri],
  );
  const navigator = useRef<ViroARSceneNavigator>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const insets = useSafeAreaInsets();
  const registerReset = useCallback((reset: (() => void) | null) => {
    resetRef.current = reset;
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      if (Platform.OS !== "android")
        throw new Error("ArtSpace AR requires a supported Android phone.");
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (permission !== PermissionsAndroid.RESULTS.GRANTED)
        throw new Error(
          "Camera access is required for AR. Enable Camera in Settings, then retry.",
        );
      await withTimeout(ensureARSupport(isARSupportedOnDevice), 15000);
      if (active) {
        setReady(true);
        setStatus("scanning");
      }
    })().catch((e: unknown) => {
      if (active)
        setError(
          e instanceof Error &&
            (e.message.includes("Camera") || e.message.includes("ARCore"))
            ? e.message
            : "AR could not start. Check camera permission, install/update Google Play Services for AR, and use an ARCore-supported Android device.",
        );
    });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    const timer = setTimeout(() => setHelp(true), 20000);
    return () => clearTimeout(timer);
  }, []);
  async function capture() {
    if (busy.current || !selected || !texture) return;
    busy.current = true;
    setStatus("capturing");
    try {
      if (!navigator.current)
        throw new Error("Camera scene is unavailable. Reopen AR.");
      const result: unknown = await withTimeout(
        navigator.current.arSceneNavigator.takeScreenshot(
          `artspace-${Date.now()}`,
          false,
        ) as Promise<unknown>,
        20000,
        "Capture timed out. Please retry.",
      );
      const uri = await validateCapture(result);
      if (mounted.current) {
        setStatus("captured");
        onCapture(uri, {
          artworkId: artwork.id,
          scaleFactor: scale,
          widthCm: artwork.widthCm,
          heightCm: artwork.heightCm,
          frameStyle: "none",
        });
      }
    } catch (e: unknown) {
      if (mounted.current) {
        const message =
          e instanceof Error ? e.message : "Capture failed. Retry.";
        setError(message);
        onError(message);
        setStatus("error");
      }
    } finally {
      busy.current = false;
    }
  }
  if (!ready)
    return (
      <Page>
        <Text style={s.heading}>View in your space</Text>
        {error ? (
          <ErrorState
            message={error}
            retry={() => {
              setError(null);
              setAttempt((a) => a + 1);
            }}
          />
        ) : (
          <Loading />
        )}
        <Button
          title="Open settings"
          secondary
          onPress={() => {
            void Linking.openSettings();
          }}
        />
        <Button title="Back to artwork" onPress={onBack} />
      </Page>
    );
  return (
    <ARSceneContext.Provider
      value={{
        artwork,
        scale,
        registerReset,
        status: setStatus,
        selected: setSelected,
        texture: setTexture,
        error: setError,
      }}
    >
      <View style={{ flex: 1 }}>
        <ViroARSceneNavigator
          ref={navigator}
          style={StyleSheet.absoluteFill}
          initialScene={{ scene: ARScene }}
          autofocus
        />
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 12,
            right: 12,
            gap: 8,
          }}
        >
          <Button title="Close AR" secondary onPress={onBack} />
          <View pointerEvents="none" style={s.card}>
            <Text style={s.body}>
              {selected
                ? `${status === "capturing" ? "Capturing…" : "Placed"} · ${Math.round(artwork.widthCm * scale)} × ${Math.round(artwork.heightCm * scale)} cm`
                : status === "wall-found"
                  ? "Wall found · tap the highlighted wall"
                  : "Move slowly to scan a vertical wall"}
            </Text>
            {help && !selected && (
              <Text style={s.caption}>
                Use good light and a textured wall. Plain white walls may be
                hard to detect.
              </Text>
            )}
            {error && (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            )}
          </View>
        </View>
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            bottom: insets.bottom + 12,
            left: 12,
            right: 12,
            gap: 8,
          }}
        >
          <View style={s.row}>
            <Button
              title="Smaller"
              disabled={!selected || status === "capturing" || scale <= 0.5}
              secondary
              onPress={() => {
                setScale((v) => clampScale(v - 0.1));
                setStatus("adjusting");
              }}
            />
            <Button
              title="Larger"
              disabled={!selected || status === "capturing" || scale >= 2}
              secondary
              onPress={() => {
                setScale((v) => clampScale(v + 0.1));
                setStatus("adjusting");
              }}
            />
            <Button
              title="Reset"
              disabled={status === "capturing"}
              secondary
              onPress={() => {
                setError(null);
                resetRef.current?.();
              }}
            />
            <Button
              title="Change art"
              disabled={status === "capturing"}
              secondary
              onPress={onChange}
            />
          </View>
          <Button
            title={
              status === "capturing"
                ? "Capturing…"
                : !texture && selected
                  ? "Loading artwork…"
                  : "Capture preview"
            }
            disabled={!selected || !texture || status === "capturing"}
            onPress={() => {
              void capture();
            }}
          />
        </View>
      </View>
    </ARSceneContext.Provider>
  );
}
