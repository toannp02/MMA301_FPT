import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Linking,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { newSpace } from "../../features/studio/createSpace";
import { prepareSpaceImage } from "../../infra/spaceImages";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import {
  constrainPreview,
  initialPreviewPose,
  previewBounds,
  type PreviewViewport,
} from "../../features/preview2d/geometry";
import { withTimeout } from "../../domain/async";
import type { Artwork } from "../../domain/models";
import { Button, ErrorState, Loading, Page } from "../components";
import { ImportArtworkScreen } from "./ImportArtworkScreen";
import { colors, styles as s } from "../theme";

type CollectionGroup = "mine" | "discover";
export interface PreviewCameraProps {
  onReady: (takePhoto?: () => Promise<string>) => void;
  onError: (message: string) => void;
  onStopped?: () => void;
}
export interface Preview2DProps {
  id: string;
  active: boolean;
  permission: { granted: boolean; canAskAgain: boolean } | null;
  requestPermission: () => Promise<unknown>;
  CameraFeed: React.ComponentType<PreviewCameraProps>;
}

export function Preview2DScreen({
  id,
  active,
  permission,
  requestPermission,
  CameraFeed,
}: Preview2DProps) {
  const { repositories } = useApp();
  const artwork = useResource(
    useCallback(
      () => repositories.artworks.getPublishedById(id),
      [repositories, id],
    ),
  );
  const [chosen, setChosen] = useState<Artwork | null>(null);
  const [group, setGroup] = useState<CollectionGroup | null>(null);
  const [importing, setImporting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const requestBusy = useRef(false);
  const selected = chosen ?? artwork.data;
  const screen =
    selected && permission?.granted ? (
      <PreviewCanvas
        artwork={selected}
        active={active && !importing}
        CameraFeed={CameraFeed}
        group={
          group ?? (selected.sourceKind === "custom" ? "mine" : "discover")
        }
        onGroup={setGroup}
        onChoose={setChosen}
        onAdd={() => setImporting(true)}
      />
    ) : (
      <Page>
        <Text style={s.caption}>ARTSPACE</Text>
        <Text style={s.title}>Your space, ready for art.</Text>
        <Text style={s.body}>
          2D Preview: capture a room photo, then compare artworks. This preview
          does not scan or track walls.
        </Text>
        {artwork.loading && !selected ? (
          <Loading />
        ) : artwork.error && !selected ? (
          <ErrorState
            message={artwork.error}
            retry={() => {
              void artwork.refresh();
            }}
          />
        ) : !selected ? (
          <ErrorState message="Artwork no longer available." />
        ) : !active ? (
          <Text style={s.body}>
            Camera paused while this screen is inactive.
          </Text>
        ) : !permission ? (
          <Loading />
        ) : (
          <>
            <Text style={s.body}>
              Camera access is needed for the live 2D background.
            </Text>
            {permissionError && <ErrorState message={permissionError} />}
            {permission.canAskAgain ? (
              <Button
                title="Enable camera for 2D Preview"
                disabled={requesting}
                onPress={() => {
                  if (requestBusy.current) return;
                  requestBusy.current = true;
                  setRequesting(true);
                  setPermissionError(null);
                  void requestPermission()
                    .catch(() =>
                      setPermissionError(
                        "Camera permission could not be requested. Please retry.",
                      ),
                    )
                    .finally(() => {
                      requestBusy.current = false;
                      setRequesting(false);
                    });
                }}
              />
            ) : (
              <Button
                title="Open camera settings"
                onPress={() => {
                  void Linking.openSettings().catch(() =>
                    setPermissionError(
                      "Open device Settings and allow camera access for Expo Go.",
                    ),
                  );
                }}
              />
            )}
          </>
        )}
        <Button
          title="Add your artwork"
          secondary
          onPress={() => setImporting(true)}
        />
        <Button
          title="Back to artwork"
          secondary
          onPress={() => router.back()}
        />
      </Page>
    );
  return (
    <>
      {screen}
      <Modal
        visible={importing}
        animationType="slide"
        onRequestClose={() => setImporting(false)}
      >
        {importing && (
          <ImportArtworkScreen
            onClose={() => setImporting(false)}
            onImported={(added) => {
              setChosen(added);
              setGroup("mine");
              setImporting(false);
            }}
          />
        )}
      </Modal>
    </>
  );
}

interface CanvasProps {
  artwork: Artwork;
  active: boolean;
  CameraFeed: React.ComponentType<PreviewCameraProps>;
  group: CollectionGroup;
  onGroup: (group: CollectionGroup) => void;
  onChoose: (artwork: Artwork) => void;
  onAdd: () => void;
}
function PreviewCanvas({
  artwork,
  active,
  CameraFeed,
  group,
  onGroup,
  onChoose,
  onAdd,
}: CanvasProps) {
  const { repositories } = useApp();
  const catalogue = useResource(
    useCallback(() => repositories.artworks.listPublished(), [repositories]),
  );
  const { refresh: refreshCatalogue } = catalogue;
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && !wasActive.current) void refreshCatalogue();
    wasActive.current = active;
  }, [active, refreshCatalogue]);
  const items =
    catalogue.data?.filter(
      (item) => (item.sourceKind === "custom") === (group === "mine"),
    ) ?? [];
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [viewport, setViewport] = useState<PreviewViewport>({
    width: 0,
    height: 0,
  });
  const [placement, setPlacement] = useState({
    pose: initialPreviewPose,
    origin: initialPreviewPose,
  });
  const { pose } = placement;
  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [takePhoto, setTakePhoto] = useState<(() => Promise<string>) | null>(
    null,
  );
  const [roomPhoto, setRoomPhoto] = useState<string | null>(null);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoBusy = useRef(false);
  const imageError = failedImage === artwork.imageUrl;
  const showArtwork = !!roomPhoto || (active && ready);
  const stopped = useCallback(() => {
    setReady(false);
    setTakePhoto(null);
  }, []);
  useEffect(() => {
    if (ready || cameraError || roomPhoto || !active) return;
    const timeout = setTimeout(
      () =>
        setCameraError(
          "Camera did not start. Close other camera apps and retry.",
        ),
      20000,
    );
    return () => clearTimeout(timeout);
  }, [ready, cameraError, cameraAttempt, active, roomPhoto]);
  const ratio = artwork.widthCm / artwork.heightCm;
  const bounds = previewBounds(viewport, ratio, pose);
  const drag = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setPlacement((current) => ({
            ...current,
            origin: constrainPreview(viewport, ratio, current.pose),
          }));
        },
        onPanResponderMove: (_event, gesture) => {
          if (!viewport.width || !viewport.height) return;
          setPlacement((current) => ({
            ...current,
            pose: constrainPreview(viewport, ratio, {
              ...current.origin,
              x: current.origin.x + gesture.dx / viewport.width,
              y: current.origin.y + gesture.dy / viewport.height,
            }),
          }));
        },
      }),
    [viewport, ratio, setPlacement],
  );
  const changeSize = (delta: number) =>
    setPlacement((current) => ({
      ...current,
      pose: constrainPreview(viewport, ratio, {
        ...current.pose,
        scale: current.pose.scale + delta,
      }),
    }));
  async function saveRoom() {
    if (!roomPhoto || photoBusy.current) return;
    photoBusy.current = true;
    setTakingPhoto(true);
    setPhotoError(null);
    try {
      const image = await prepareSpaceImage(roomPhoto);
      const result = await repositories.spaces.save(
        newSpace(
          Crypto.randomUUID(),
          "My wall",
          { uri: image.uri, width: image.width, height: image.height },
          artwork,
        ),
      );
      if (!result.ok) throw new Error(result.error.message);
      router.push({ pathname: "/space/[id]", params: { id: result.data.id } });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Could not save room.");
    } finally {
      photoBusy.current = false;
      setTakingPhoto(false);
    }
  }
  async function captureRoom() {
    if (!takePhoto || photoBusy.current) return;
    photoBusy.current = true;
    setTakingPhoto(true);
    setPhotoError(null);
    try {
      const uri = await withTimeout(
        takePhoto(),
        20000,
        "Room photo timed out. Please retry.",
      );
      setRoomPhoto(uri);
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : "Room photo failed. Please retry.",
      );
    } finally {
      photoBusy.current = false;
      setTakingPhoto(false);
    }
  }
  return (
    <View
      style={[
        local.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={local.header}>
        <Text style={s.heading}>Your wall, your art.</Text>
        <Text style={s.caption}>
          2D Preview · no wall tracking or real-world scale
        </Text>
      </View>
      <View
        testID="preview2d-stage"
        style={local.stage}
        onLayout={(event) => {
          const { width, height: stageHeight } = event.nativeEvent.layout;
          setViewport((current) =>
            current.width === width && current.height === stageHeight
              ? current
              : { width, height: stageHeight },
          );
        }}
      >
        {roomPhoto ? (
          <Image
            accessibilityLabel="Your captured room"
            source={{ uri: roomPhoto }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            onError={() => {
              setRoomPhoto(null);
              setPhotoError(
                "Room photo is no longer available. Capture it again.",
              );
            }}
          />
        ) : active && !cameraError ? (
          <CameraFeed
            key={cameraAttempt}
            onReady={(capture) => {
              setReady(true);
              setTakePhoto(() => capture ?? null);
            }}
            onStopped={stopped}
            onError={setCameraError}
          />
        ) : null}
        {!active && !roomPhoto && (
          <View style={local.center}>
            <Text style={s.caption}>
              Camera paused while this screen is inactive.
            </Text>
          </View>
        )}
        {active && !ready && !cameraError && !roomPhoto && (
          <View pointerEvents="none" style={local.center}>
            <Loading />
          </View>
        )}
        {showArtwork && !cameraError && !imageError && viewport.width > 0 && (
          <View
            accessibilityLabel="Drag artwork in 2D Preview"
            testID="preview2d-artwork"
            style={[local.artwork, bounds]}
            {...drag.panHandlers}
          >
            <Image
              key={`${artwork.imageUrl}:${imageAttempt}`}
              source={{ uri: artwork.imageUrl }}
              accessibilityLabel="2D artwork overlay"
              contentFit="contain"
              onError={() => setFailedImage(artwork.imageUrl)}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}
        {(cameraError || imageError) && (
          <View style={local.center}>
            <ErrorState
              message={cameraError ?? "Artwork image could not load."}
              retry={() => {
                if (cameraError) {
                  setReady(false);
                  setCameraError(null);
                  setCameraAttempt((value) => value + 1);
                } else {
                  setFailedImage(null);
                  setImageAttempt((value) => value + 1);
                }
              }}
            />
          </View>
        )}
      </View>
      <ScrollView
        style={{ flexGrow: 0, maxHeight: height * 0.49 }}
        contentContainerStyle={local.panel}
        keyboardShouldPersistTaps="handled"
      >
        <Text numberOfLines={1} style={s.body}>
          {artwork.title}
        </Text>
        <View style={s.row}>
          <Button
            title={
              roomPhoto
                ? "Retake room"
                : takingPhoto
                  ? "Capturing…"
                  : "Capture room"
            }
            secondary
            disabled={
              takingPhoto || (!roomPhoto && (!ready || !takePhoto || !active))
            }
            onPress={() => {
              if (roomPhoto) {
                setRoomPhoto(null);
                setPhotoError(null);
                setCameraError(null);
                setReady(false);
              } else void captureRoom();
            }}
          />
          <Button
            title="Add your artwork"
            onPress={onAdd}
            disabled={takingPhoto}
          />
        </View>
        {roomPhoto && (
          <Button
            title="Edit & save this wall"
            disabled={takingPhoto}
            onPress={() => {
              void saveRoom();
            }}
          />
        )}
        {photoError && <ErrorState message={photoError} />}
        <View style={s.row}>
          <Button
            title="My artworks"
            secondary={group !== "mine"}
            onPress={() => onGroup("mine")}
          />
          <Button
            title="Discover"
            secondary={group !== "discover"}
            onPress={() => onGroup("discover")}
          />
        </View>
        {catalogue.loading ? (
          <Loading />
        ) : catalogue.error ? (
          <ErrorState
            message={catalogue.error}
            retry={() => {
              void catalogue.refresh();
            }}
          />
        ) : !items.length ? (
          <Text style={s.caption}>
            Add your first artwork from your photos.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Preview ${item.title}`}
                accessibilityState={{ selected: artwork.id === item.id }}
                onPress={() => onChoose(item)}
                style={[
                  local.thumbnail,
                  {
                    borderColor:
                      item.id === artwork.id ? colors.accent : colors.line,
                  },
                ]}
              >
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  contentFit="contain"
                  style={{ width: 66, height: 62 }}
                />
                <Text numberOfLines={1} style={local.thumbLabel}>
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <View style={s.row}>
          <Button
            title="Smaller"
            secondary
            disabled={!showArtwork || pose.scale <= 0.5}
            onPress={() => changeSize(-0.1)}
          />
          <Button
            title="Larger"
            secondary
            disabled={!showArtwork || pose.scale >= 2}
            onPress={() => changeSize(0.1)}
          />
          <Button
            title="Reset position"
            secondary
            onPress={() =>
              setPlacement({
                pose: initialPreviewPose,
                origin: initialPreviewPose,
              })
            }
          />
        </View>
        <Text style={s.caption}>
          Drag to position · Size: {Math.round(pose.scale * 100)}% of preview.
        </Text>
        <Button
          title="Back to artwork"
          secondary
          onPress={() => router.back()}
        />
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 10, gap: 4 },
  panel: { padding: 12, gap: 10 },
  stage: {
    flex: 1,
    minHeight: 120,
    overflow: "hidden",
    backgroundColor: "#090A0B",
  },
  center: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  artwork: { position: "absolute", borderColor: "#E5E1D8", borderWidth: 2 },
  thumbnail: {
    width: 76,
    padding: 3,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  thumbLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
});
