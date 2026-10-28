import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Modal,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import Svg, { Polygon } from "react-native-svg";
import Slider from "@react-native-community/slider";
import { usePreventRemove } from "expo-router/react-navigation";
import { router, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUnsavedReloadGuard } from "../studio/useUnsavedReloadGuard";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import {
  makePiece,
  defaultAppearance,
  validQuad,
  type WallSpace,
  type PlacedArtwork,
  type ForegroundStroke,
  type Point,
  type LayoutKind,
  type ArtAppearance,
  type StudioFrame,
} from "../../domain/spaces";
import type { Artwork } from "../../domain/models";
import {
  fitSpace,
  homography,
  invert,
  layoutPieces,
  pieceQuad,
  project,
} from "../../features/studio/geometry";
import { applyEditorChange } from "../../features/studio/editorState";
import { placeArtworkInRoom } from "../../features/studio/placeArtwork";
import { ok } from "../../domain/models";
import { pointString } from "../../features/studio/rendering";
import { exportSpacePNG, shareSpacePNG } from "../../infra/exportSpace";
import { ArtworkFilters } from "../studio/ArtworkFilters";
import { emptyQuery, filterArtworks } from "../../features/studio/discovery";
import { ForegroundPainter } from "../studio/ForegroundPainter";
import { SpaceCanvas } from "../studio/SpaceCanvas";
import { LayoutPicker } from "../studio/LayoutPicker";
import { FramePicker } from "../studio/FramePicker";
import { ArtworkDimensions } from "../studio/ArtworkDimensions";
import {
  resizeArtwork,
  effectiveDimensions,
  roomViewport,
} from "../../features/studio/styleEditing";
import { artworkAtPoint } from "../../features/studio/directManipulation";
import { useDirectManipulation } from "../studio/useDirectManipulation";
import { StudioDragArea } from "../studio/StudioDragArea";
import { ImportArtworkScreen } from "./ImportArtworkScreen";
import {
  Page,
  Button,
  Input,
  ArtImage,
  Loading,
  ErrorState,
} from "../components";
import { colors, styles as s } from "../theme";

type EditorTab = "Art" | "Layout" | "Frame" | "Wall";
interface EditorState {
  space: WallSpace;
  selected: string | null;
  dirty: boolean;
  stage: { width: number; height: number };
  drag: { token: string; origin: Point; original?: PlacedArtwork } | null;
  mode: "move" | "wall" | "foreground";
}
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
function fit(state: EditorState) {
  const ratio = state.space.room.width / state.space.room.height;
  const width = Math.min(state.stage.width, state.stage.height * ratio);
  const height = width / ratio;
  return {
    width,
    height,
    left: (state.stage.width - width) / 2,
    top: (state.stage.height - height) / 2,
  };
}
export function SpaceEditorScreen({
  id,
  artworkId,
}: {
  id: string;
  artworkId?: string;
}) {
  const { repositories: r } = useApp();
  const space = useResource(useCallback(() => r.spaces.get(id), [r, id]));
  const art = useResource(
    useCallback(
      () =>
        artworkId
          ? r.artworks.getPublishedById(artworkId)
          : Promise.resolve(ok<Artwork | null>(null)),
      [r, artworkId],
    ),
  );
  return space.loading || art.loading ? (
    <Page>
      <Loading />
    </Page>
  ) : space.error ? (
    <Page>
      <ErrorState
        message={space.error}
        retry={() => {
          void space.refresh();
        }}
      />
      <Button title="My walls" onPress={() => router.replace("/spaces")} />
    </Page>
  ) : art.error ? (
    <Page>
      <ErrorState
        message={art.error}
        retry={() => {
          void art.refresh();
        }}
      />
      <Button title="My walls" onPress={() => router.replace("/spaces")} />
    </Page>
  ) : artworkId && !art.data ? (
    <Page>
      <ErrorState message="This artwork is no longer available." />
      <Button
        title="Choose another artwork"
        onPress={() => router.replace("/(tabs)")}
      />
    </Page>
  ) : !space.data ? (
    <Page>
      <ErrorState message="This saved wall is no longer available." />
      <Button title="My walls" onPress={() => router.replace("/spaces")} />
    </Page>
  ) : (
    <Editor
      key={`${space.data.id}:${artworkId ?? ""}`}
      initial={art.data ? placeArtworkInRoom(space.data, art.data) : space.data}
      initialDirty={!!art.data}
    />
  );
}
function Editor({
  initial,
  initialDirty = false,
}: {
  initial: WallSpace;
  initialDirty?: boolean;
}) {
  const { repositories: r } = useApp();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [editor, rawSetEditor] = useState<EditorState>({
    space: initial,
    selected: null,
    dirty: initialDirty,
    stage: { width: 0, height: 0 },
    drag: null,
    mode: "move",
  });
  const setEditor = useCallback(
    (action: React.SetStateAction<EditorState>) =>
      rawSetEditor((current) => {
        const changed = typeof action === "function" ? action(current) : action;
        return applyEditorChange(current, changed);
      }),
    [],
  );
  const [tab, setTab] = useState<EditorTab>("Art"),
    [group, setGroup] = useState<"mine" | "discover">("discover"),
    [importing, setImporting] = useState(false),
    [inspect, setInspect] = useState(false),
    [leave, setLeave] = useState(false);
  const [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState<string | null>(null),
    [imagesReady, setImagesReady] = useState(false),
    [compare, setCompare] = useState(false),
    [exportQuality, setExportQuality] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [canvasAttempt, setCanvasAttempt] = useState(0);
  const [wallWidth, setWallWidth] = useState(String(initial.wall.widthCm)),
    [wallHeight, setWallHeight] = useState(String(initial.wall.heightCm));
  const navigation = useNavigation();
  const [discarding, setDiscarding] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    Parameters<typeof navigation.dispatch>[0] | null
  >(null);
  usePreventRemove((editor.dirty || busy) && !discarding, ({ data }) => {
    setPendingAction(data.action);
    setLeave(true);
  });
  useEffect(() => {
    if (discarding) {
      if (pendingAction) navigation.dispatch(pendingAction);
      else router.replace("/spaces");
    }
  }, [discarding, pendingAction, navigation]);
  useUnsavedReloadGuard(editor.dirty);
  const snapshot = useRef<View>(null);
  const saving = useRef(false);
  const catalogue = useResource(
    useCallback(() => r.artworks.listPublished(), [r]),
  );
  const [roomZoom, setRoomZoom] = useState(1),
    [roomPan, setRoomPan] = useState({ x: 0, y: 0 });
  const space = useMemo(() => fitSpace(editor.space), [editor.space]),
    selected = space.pieces.find((p) => p.id === editor.selected),
    imageFit = exportQuality
      ? fit(editor)
      : roomViewport(
          editor.stage,
          space.room.width / space.room.height,
          roomZoom,
          roomPan,
        );
  const [styleTab, setStyleTab] = useState<"Frame" | "Image" | "Light">(
    "Image",
  );
  const [brush, setBrush] = useState(0.035);
  const [query, setQuery] = useState({ ...emptyQuery });
  const grouped = useMemo(
    () =>
      catalogue.data?.filter(
        (a) => (a.sourceKind === "custom") === (group === "mine"),
      ) ?? [],
    [catalogue.data, group],
  );
  const pool = useMemo(() => filterArtworks(grouped, query), [grouped, query]);
  const update = useCallback(
    (change: (space: WallSpace) => WallSpace) =>
      setEditor((current) => ({
        ...current,
        space: fitSpace(change(current.space)),
        dirty: true,
      })),
    [setEditor],
  );
  const addStroke = useCallback(
    (stroke: ForegroundStroke) =>
      setEditor((current) => ({
        ...current,
        dirty: true,
        space: {
          ...current.space,
          wall: {
            ...current.space.wall,
            foregroundStrokes: [
              ...(current.space.wall.foregroundStrokes ?? []),
              stroke,
            ].slice(-100),
          },
        },
      })),
    [setEditor],
  );
  function chooseArt(art: Artwork) {
    setEditor((current) => {
      const active = current.space.pieces.find(
        (p) => p.id === current.selected,
      );
      if (!active) {
        const space = placeArtworkInRoom(current.space, art);
        return {
          ...current,
          space,
          selected: space.pieces[0]?.id ?? null,
          dirty: true,
        };
      }
      return {
        ...current,
        space: {
          ...current.space,
          pieces: current.space.pieces.map((p) =>
            p.id === active.id
              ? { ...p, artwork: makePiece(art, p.id).artwork }
              : p,
          ),
        },
        dirty: true,
      };
    });
  }
  const start = useCallback(
    (token: string) =>
      setEditor((current) => {
        const [kind, id, corner] = token.split(":");
        const piece = current.space.pieces.find((p) => p.id === id);
        const origin =
          kind === "wall"
            ? current.space.wall.corners[Number(id)]
            : kind === "size" && piece
              ? pieceQuad(
                  current.space,
                  piece,
                  piece.appearance.mountCm +
                    (piece.appearance.frame === "none"
                      ? 0
                      : piece.appearance.frameCm),
                )[Number(corner)]
              : piece
                ? project(homography(current.space.wall.corners), piece.center)
                : null;
        return origin
          ? {
              ...current,
              selected:
                kind === "art" || kind === "size" ? id : current.selected,
              drag: { token, origin, original: piece },
            }
          : current;
      }),
    [setEditor],
  );
  const move = useCallback(
    (dx: number, dy: number) =>
      setEditor((current) => {
        if (!current.drag) return current;
        const dimensions = roomViewport(
          current.stage,
          current.space.room.width / current.space.room.height,
          roomZoom,
          roomPan,
        );
        if (!dimensions.width || !dimensions.height) return current;
        const next = {
          x: current.drag.origin.x + dx / dimensions.width,
          y: current.drag.origin.y + dy / dimensions.height,
        };
        const [kind, id] = current.drag.token.split(":");
        if (kind === "wall") {
          const corners = current.space.wall.corners.map((p, i) =>
            i === Number(id)
              ? { x: clamp(next.x, 0, 1), y: clamp(next.y, 0, 1) }
              : p,
          ) as WallSpace["wall"]["corners"];
          return validQuad(corners)
            ? {
                ...current,
                space: {
                  ...current.space,
                  wall: { ...current.space.wall, corners },
                },
                dirty: true,
              }
            : current;
        }
        if (kind === "size" && current.drag.original) {
          const original = current.drag.original,
            center = project(
              homography(current.space.wall.corners),
              original.center,
            );
          const before = Math.hypot(
            (current.drag.origin.x - center.x) * dimensions.width,
            (current.drag.origin.y - center.y) * dimensions.height,
          );
          const after = Math.hypot(
            (next.x - center.x) * dimensions.width,
            (next.y - center.y) * dimensions.height,
          );
          return {
            ...current,
            dirty: true,
            space: {
              ...current.space,
              layout: "custom",
              pieces: current.space.pieces.map((piece) =>
                piece.id === id
                  ? {
                      ...piece,
                      scale: clamp(
                        (original.scale * after) / Math.max(1, before),
                        0.001,
                        5,
                      ),
                    }
                  : piece,
              ),
            },
          };
        }
        if (current.mode !== "move") return current;
        let center: Point;
        try {
          center = project(
            invert(homography(current.space.wall.corners)),
            next,
          );
        } catch {
          return current;
        }
        if (!Number.isFinite(center.x) || !Number.isFinite(center.y))
          return current;
        return {
          ...current,
          space: {
            ...current.space,
            layout: "custom",
            pieces: current.space.pieces.map((p) =>
              p.id === id
                ? {
                    ...p,
                    center: {
                      x: clamp(center.x, 0, 1),
                      y: clamp(center.y, 0, 1),
                    },
                  }
                : p,
            ),
          },
          dirty: true,
        };
      }),
    [setEditor, roomZoom, roomPan],
  );
  const end = useCallback(
    () => setEditor((current) => ({ ...current, drag: null })),
    [setEditor],
  );
  const zoomResponder = useDirectManipulation({
    disabled:
      busy ||
      compare ||
      exportQuality ||
      editor.mode === "wall" ||
      editor.mode === "foreground",
    selected: editor.selected,
    zoom: roomZoom,
    pan: roomPan,
    hit: (point) => {
      let id = artworkAtPoint(space, imageFit, point),
        token: string | null = null;
      if (selected) {
        const padding =
          selected.appearance.mountCm +
          (selected.appearance.frame === "none"
            ? 0
            : selected.appearance.frameCm);
        const corners = pieceQuad(space, selected, padding);
        const corner = corners.findIndex(
          (p) =>
            Math.hypot(
              imageFit.left + p.x * imageFit.width - point.x,
              imageFit.top + p.y * imageFit.height - point.y,
            ) <= 16,
        );
        if (corner >= 0) {
          id = selected.id;
          token = `size:${id}:${corner}`;
        }
      }
      return {
        id,
        token: token ?? (id ? `art:${id}` : null),
        scale: space.pieces.find((p) => p.id === id)?.scale ?? 1,
      };
    },
    select: (id) => {
      if (!id) setTab("Art");
      setEditor((current) => ({ ...current, selected: id }));
    },
    start,
    move,
    finish: () => setEditor((current) => ({ ...current, drag: null })),
    scale: (id, scale) =>
      update((current) => ({
        ...current,
        layout: "custom",
        pieces: current.pieces.map((p) =>
          p.id === id ? { ...p, scale: clamp(scale, 0.001, 5) } : p,
        ),
      })),
    view: (zoom, pan) => {
      setRoomZoom(zoom);
      setRoomPan(pan);
    },
  });
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await r.spaces.save(fitSpace(space));
      if (!result.ok) throw new Error(result.error.message);
      setEditor((current) => ({
        ...current,
        space: result.data,
        dirty: false,
      }));
      setMessage("Space saved on this device.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Space could not be saved.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function share() {
    if (saving.current || !imagesReady) return;
    saving.current = true;
    setBusy(true);
    setError(null);
    setCompare(false);
    setExportQuality(true);
    try {
      const uri = await exportSpacePNG(snapshot, space);
      await shareSpacePNG(uri);
      setMessage(
        "Design image exported. Your editable wall stays in My walls after saving.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed. Please retry.");
    } finally {
      setExportQuality(false);
      saving.current = false;
      setBusy(false);
    }
  }
  const appearance = (change: Partial<ArtAppearance>) =>
    update((current) => ({
      ...current,
      pieces: current.pieces.map((p) =>
        p.id === editor.selected
          ? { ...p, appearance: { ...p.appearance, ...change } }
          : p,
      ),
    }));
  const applyLayout = (kind: LayoutKind, count: number) =>
    setEditor((current) => {
      const next = fitSpace({
        ...current.space,
        layout: kind,
        pieces: layoutPieces(current.space, kind, count),
      });
      return {
        ...current,
        space: next,
        selected: next.pieces.some((p) => p.id === current.selected)
          ? current.selected
          : (next.pieces[0]?.id ?? null),
        dirty: true,
      };
    });
  const visibleSpace = compare ? { ...space, pieces: [] } : space;
  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.header}>
        <Button
          title="My walls"
          disabled={busy}
          secondary
          onPress={() =>
            editor.dirty ? setLeave(true) : router.replace("/spaces")
          }
        />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={s.body}>
            {space.name}
            {editor.dirty ? " •" : ""}
          </Text>
          <Text style={styles.small}>
            {space.wall.measurement === "approximate"
              ? space.wall.photoAssist
                ? "Suggested wall - confirm size for scale"
                : "Photo preview - set wall size for scale"
              : `${space.wall.widthCm} × ${space.wall.heightCm} cm · ${space.wall.measurement}`}
          </Text>
        </View>
        <Button
          title={busy ? "Working…" : "Save"}
          disabled={busy}
          onPress={() => {
            void save();
          }}
        />
      </View>
      <View
        style={styles.stage}
        testID="studio-surface"
        accessible
        accessibilityRole="imagebutton"
        accessibilityLabel="Room canvas. Tap artwork to edit"
        accessibilityActions={[
          ...space.pieces.map((piece) => ({
            name: `select:${piece.id}`,
            label: `Select ${piece.artwork.title}`,
          })),
          { name: "deselect", label: "Deselect artwork" },
        ]}
        onAccessibilityAction={(event) => {
          const id = event.nativeEvent.actionName.startsWith("select:")
            ? event.nativeEvent.actionName.slice(7)
            : null;
          setTab("Art");
          setEditor((current) => ({
            ...current,
            selected: current.selected === id ? null : id,
            drag: null,
          }));
        }}
        {...zoomResponder}
        pointerEvents={busy ? "none" : "auto"}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setEditor((current) =>
            current.stage.width === width && current.stage.height === height
              ? current
              : { ...current, stage: { width, height } },
          );
        }}
      >
        {!!imageFit.width && (
          <View
            ref={snapshot}
            pointerEvents="none"
            collapsable={false}
            style={{
              position: "absolute",
              left: imageFit.left,
              top: imageFit.top,
              width: imageFit.width,
              height: imageFit.height,
            }}
          >
            <SpaceCanvas
              key={canvasAttempt}
              onError={setCanvasError}
              space={visibleSpace}
              width={imageFit.width}
              height={imageFit.height}
              onReady={setImagesReady}
              exportQuality={exportQuality}
            />
          </View>
        )}
        {!compare && !exportQuality && !!imageFit.width && (
          <>
            {editor.mode === "foreground" ? (
              <ForegroundPainter
                width={imageFit.width}
                height={imageFit.height}
                left={imageFit.left}
                top={imageFit.top}
                radius={brush}
                onStroke={addStroke}
              />
            ) : editor.mode === "wall" ? (
              <>
                <Svg
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: imageFit.left,
                    top: imageFit.top,
                  }}
                  width={imageFit.width}
                  height={imageFit.height}
                >
                  <Polygon
                    points={pointString(
                      space.wall.corners.map((p) => ({
                        x: p.x * imageFit.width,
                        y: p.y * imageFit.height,
                      })),
                    )}
                    fill="rgba(215,188,131,0.08)"
                    stroke={colors.accent}
                    strokeWidth={2}
                  />
                </Svg>
                {space.wall.corners.map((p, i) => (
                  <StudioDragArea
                    key={i}
                    token={`wall:${i}`}
                    corner
                    start={start}
                    move={move}
                    end={end}
                    left={imageFit.left + p.x * imageFit.width - 24}
                    top={imageFit.top + p.y * imageFit.height - 24}
                  />
                ))}
              </>
            ) : null}
          </>
        )}
        {!compare &&
          !exportQuality &&
          selected &&
          editor.mode !== "wall" &&
          editor.mode !== "foreground" &&
          !!imageFit.width &&
          (() => {
            const padding =
                selected.appearance.mountCm +
                (selected.appearance.frame === "none"
                  ? 0
                  : selected.appearance.frameCm),
              q = pieceQuad(space, selected, padding);
            const top = Math.min(...q.map((p) => p.y)) * imageFit.height,
              left = ((q[0].x + q[1].x) / 2) * imageFit.width;
            return (
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Svg
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: imageFit.left,
                    top: imageFit.top,
                  }}
                  width={imageFit.width}
                  height={imageFit.height}
                >
                  <Polygon
                    points={pointString(
                      q.map((p) => ({
                        x: p.x * imageFit.width,
                        y: p.y * imageFit.height,
                      })),
                    )}
                    fill="none"
                    stroke={colors.accent}
                    strokeWidth={1.5}
                  />
                </Svg>
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: clamp(
                      imageFit.left + left - 65,
                      0,
                      Math.max(0, editor.stage.width - 130),
                    ),
                    top: Math.max(imageFit.top, imageFit.top + top - 28),
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.accent,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 10 }}>
                    {space.wall.measurement === "approximate" ? "~ " : ""}
                    {(selected.artwork.widthCm * selected.scale).toFixed(
                      1,
                    )} x{" "}
                    {(selected.artwork.heightCm * selected.scale).toFixed(1)} cm
                  </Text>
                </View>
                {q.map((p, i) => (
                  <StudioDragArea
                    key={`resize${i}`}
                    token={`size:${selected.id}:${i}`}
                    corner
                    square
                    start={start}
                    move={move}
                    end={end}
                    left={imageFit.left + p.x * imageFit.width - 24}
                    top={imageFit.top + p.y * imageFit.height - 24}
                  />
                ))}
              </View>
            );
          })()}
        {!space.pieces.length &&
          editor.mode !== "wall" &&
          !!imageFit.width &&
          (() => {
            const center = project(homography(space.wall.corners), {
                x: 0.5,
                y: 0.5,
              }),
              width = Math.min(140, imageFit.width * 0.25),
              height = width * 1.3;
            return (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: imageFit.left + center.x * imageFit.width - width / 2,
                  top: imageFit.top + center.y * imageFit.height - height / 2,
                  width,
                  height,
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 32, color: colors.accent }}>+</Text>
              </View>
            );
          })()}
      </View>
      <ScrollView
        pointerEvents={busy ? "none" : "auto"}
        style={{ maxHeight: windowHeight * 0.43, flexGrow: 0 }}
        contentContainerStyle={styles.panel}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.caption}>
          Tap artwork to edit; tap it again or the background to deselect. Pinch
          what you touch to zoom.
        </Text>
        {roomZoom > 1.01 && (
          <Button
            title="Reset view"
            secondary
            onPress={() => {
              setRoomZoom(1);
              setRoomPan({ x: 0, y: 0 });
            }}
          />
        )}
        <View style={s.row}>
          {(["Art", "Layout", "Frame", "Wall"] as EditorTab[]).map((name) => (
            <Button
              key={name}
              title={
                name === "Frame"
                  ? "Style"
                  : name === "Layout"
                    ? "Layouts"
                    : name
              }
              disabled={(name === "Frame" || name === "Layout") && !selected}
              secondary={tab !== name}
              onPress={() => {
                setTab(name);
                setEditor((current) => ({
                  ...current,
                  mode: name === "Wall" ? "wall" : "move",
                }));
              }}
            />
          ))}
        </View>
        {error && <ErrorState message={error} />}
        {canvasError && (
          <ErrorState
            message={canvasError}
            retry={() => {
              setImagesReady(false);
              setCanvasError(null);
              setCanvasAttempt((value) => value + 1);
            }}
          />
        )}
        {message && (
          <Text accessibilityRole="alert" style={s.caption}>
            {message}
          </Text>
        )}
        {tab === "Art" && (
          <>
            {!selected && !space.pieces.length && (
              <Button
                title="Choose from library"
                onPress={() => router.replace("/(tabs)")}
              />
            )}
            <View style={s.row}>
              <Button
                title="My artworks"
                secondary={group !== "mine"}
                onPress={() => setGroup("mine")}
              />
              <Button
                title="Discover"
                secondary={group !== "discover"}
                onPress={() => setGroup("discover")}
              />
              <Button title="Add artwork" onPress={() => setImporting(true)} />
            </View>
            <Text style={s.caption}>
              {selected?.artwork.title ??
                (space.pieces.length
                  ? "Tap a painting to edit"
                  : "Choose an artwork")}{" "}
              ·{" "}
              {selected
                ? "drag to position or pull a corner to resize"
                : "editing disabled"}
            </Text>
            {catalogue.loading ? (
              <Loading />
            ) : catalogue.error ? (
              <ErrorState
                message={catalogue.error}
                retry={() => {
                  void catalogue.refresh();
                }}
              />
            ) : !pool.length ? (
              <Text style={s.caption}>
                Add artwork photos to start your collection.
              </Text>
            ) : (
              <ScrollView horizontal contentContainerStyle={{ gap: 10 }}>
                {pool.map((art) => (
                  <Pressable
                    key={art.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Place ${art.title}`}
                    onPress={() => chooseArt(art)}
                    style={[
                      styles.thumb,
                      {
                        borderColor:
                          selected?.artwork.id === art.id
                            ? colors.accent
                            : colors.line,
                      },
                    ]}
                  >
                    <ArtImage uri={art.thumbnailUrl} ratio={1} />
                    <Text numberOfLines={1} style={styles.small}>
                      {art.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <ArtworkFilters
              compact
              query={query}
              onChange={setQuery}
              items={grouped}
            />
            <View style={s.row}>
              <Button
                title="Inspect artwork"
                secondary
                disabled={!selected}
                onPress={() => setInspect(true)}
              />
              <Button
                title="Add another piece"
                secondary
                disabled={!selected || space.pieces.length >= 9}
                onPress={() => {
                  if (selected)
                    update((current) => ({
                      ...current,
                      layout: "custom",
                      pieces: [
                        ...current.pieces,
                        {
                          ...selected,
                          id: `${current.id}_art${Date.now()}`,
                          center: {
                            x: clamp(selected.center.x + 0.1, 0, 1),
                            y: clamp(selected.center.y + 0.1, 0, 1),
                          },
                        },
                      ],
                    }));
                }}
              />
            </View>
          </>
        )}
        {tab === "Layout" && (
          <>
            <Text style={s.heading}>Layouts</Text>
            <LayoutPicker
              kind={space.layout}
              count={space.pieces.length}
              disabled={!selected}
              onChoose={applyLayout}
            />
            <Text style={s.caption}>
              Pieces: {space.pieces.length}/9 - gap up to{" "}
              {space.gapCm.toFixed(0)} cm
            </Text>
            <View style={s.row}>
              <Button
                title="Fewer pieces"
                secondary
                disabled={!selected || space.pieces.length <= 1}
                onPress={() =>
                  applyLayout(
                    space.pieces.length <= 2
                      ? "single"
                      : space.layout === "single"
                        ? "row"
                        : space.layout,
                    space.pieces.length - 1,
                  )
                }
              />
              <Button
                title="More pieces"
                secondary
                disabled={!selected || space.pieces.length >= 9}
                onPress={() =>
                  applyLayout(
                    space.layout === "single" ||
                      space.layout === "custom" ||
                      space.layout === "pair"
                      ? "row"
                      : space.layout === "stack"
                        ? "column"
                        : space.layout,
                    space.pieces.length + 1,
                  )
                }
              />
            </View>
            <Slider
              accessibilityLabel="Artwork gap"
              disabled={!selected}
              minimumValue={0}
              maximumValue={40}
              step={1}
              value={space.gapCm}
              minimumTrackTintColor={colors.accent}
              thumbTintColor={colors.accent}
              onValueChange={(value) =>
                update((current) => {
                  const changed = { ...current, gapCm: value };
                  return {
                    ...changed,
                    layout:
                      changed.layout === "custom" ? "grid" : changed.layout,
                    pieces: layoutPieces(
                      changed,
                      changed.layout === "custom" ? "grid" : changed.layout,
                      changed.pieces.length,
                    ),
                  };
                })
              }
            />
          </>
        )}
        {tab === "Frame" && selected && (
          <>
            <View style={s.row}>
              {(["Frame", "Image", "Light"] as const).map((section) => (
                <Button
                  key={section}
                  title={section}
                  secondary={styleTab !== section}
                  onPress={() => setStyleTab(section)}
                />
              ))}
            </View>
            {styleTab === "Frame" && (
              <>
                <FramePicker
                  appearance={selected.appearance}
                  onChange={appearance}
                />
                <View style={s.row}>
                  {(["none", "black", "white", "wood"] as StudioFrame[]).map(
                    (frame) => (
                      <Button
                        key={frame}
                        title={frame}
                        secondary={selected.appearance.frame !== frame}
                        onPress={() =>
                          appearance({ frame, frameProfile: undefined })
                        }
                      />
                    ),
                  )}
                </View>
                <Control
                  label="Frame width (cm)"
                  value={selected.appearance.frameCm}
                  min={0}
                  max={10}
                  onChange={(frameCm) => appearance({ frameCm })}
                />
                <Control
                  label="Mount width (cm)"
                  value={selected.appearance.mountCm}
                  min={0}
                  max={20}
                  onChange={(mountCm) => appearance({ mountCm })}
                />
                <Button
                  title={
                    selected.appearance.glazing ? "Glazing on" : "Glazing off"
                  }
                  secondary
                  onPress={() =>
                    appearance({ glazing: !selected.appearance.glazing })
                  }
                />
              </>
            )}
            {styleTab === "Image" && (
              <>
                <View style={s.row}>
                  <Button
                    title="Reset image"
                    secondary
                    onPress={() =>
                      appearance({
                        brightness: 0,
                        contrast: 1,
                        saturation: 1,
                        warmth: 0,
                        hue: 0,
                      })
                    }
                  />
                  {space.wall.photoAssist && (
                    <Button
                      title="Match room tone"
                      secondary
                      onPress={() =>
                        appearance({
                          brightness: space.wall.photoAssist?.brightness ?? 0,
                          warmth: space.wall.photoAssist?.warmth ?? 0,
                        })
                      }
                    />
                  )}
                </View>
                <Control
                  label="Luminance"
                  neutral={0}
                  value={selected.appearance.brightness}
                  min={-0.5}
                  max={0.5}
                  onChange={(brightness) => appearance({ brightness })}
                />
                <Control
                  label="Contrast"
                  neutral={1}
                  value={selected.appearance.contrast}
                  min={0.5}
                  max={1.5}
                  onChange={(contrast) => appearance({ contrast })}
                />
                <Control
                  label="Saturation"
                  neutral={1}
                  value={selected.appearance.saturation}
                  min={0}
                  max={2}
                  onChange={(saturation) => appearance({ saturation })}
                />
                <Control
                  label="Warmth"
                  neutral={0}
                  value={selected.appearance.warmth}
                  min={-1}
                  max={1}
                  onChange={(warmth) => appearance({ warmth })}
                />
                <Control
                  label="Hue"
                  neutral={0}
                  value={selected.appearance.hue}
                  min={-180}
                  max={180}
                  onChange={(hue) => appearance({ hue })}
                />
              </>
            )}
            {styleTab === "Light" && (
              <>
                <Button
                  title="Reset light"
                  secondary
                  onPress={() =>
                    appearance({
                      shadow: defaultAppearance.shadow,
                      shadowOffset: 1,
                      shadowAngle: 56.31,
                      shadowSoftness: 8,
                    })
                  }
                />
                <Control
                  label="Shadow angle (degrees)"
                  min={-180}
                  max={180}
                  value={selected.appearance.shadowAngle ?? 56.31}
                  onChange={(shadowAngle) => appearance({ shadowAngle })}
                />
                <Control
                  label="Shadow softness"
                  min={0}
                  max={40}
                  value={selected.appearance.shadowSoftness ?? 8}
                  onChange={(shadowSoftness) => appearance({ shadowSoftness })}
                />
                <Control
                  label="Artwork depth (cm)"
                  value={selected.appearance.depthCm ?? 1.8}
                  min={0}
                  max={10}
                  onChange={(depthCm) => appearance({ depthCm })}
                />
                <Control
                  label="Shadow intensity"
                  percent
                  value={selected.appearance.shadow}
                  min={0}
                  max={1}
                  onChange={(shadow) => appearance({ shadow })}
                />
                <Control
                  label="Shadow offset"
                  percent
                  value={selected.appearance.shadowOffset ?? 1}
                  min={0}
                  max={3}
                  onChange={(shadowOffset) => appearance({ shadowOffset })}
                />
                <Button
                  title={
                    space.wall.occlusionEnabled !== false
                      ? "Occlusion on"
                      : "Occlusion off"
                  }
                  secondary
                  onPress={() =>
                    update((current) => ({
                      ...current,
                      wall: {
                        ...current.wall,
                        occlusionEnabled:
                          current.wall.occlusionEnabled === false,
                      },
                    }))
                  }
                />
                <Text style={s.caption}>
                  {space.wall.occlusionMaskUri
                    ? "Photo-assisted foreground mask. Review its edges for your photo."
                    : "No automatic mask for this photo. Paint foreground objects to keep them in front of the art."}
                </Text>
                <Button
                  title="Adjust foreground mask"
                  secondary
                  onPress={() => {
                    setTab("Wall");
                    setEditor((current) => ({
                      ...current,
                      mode: "foreground",
                    }));
                  }}
                />
              </>
            )}
            <Button
              title="Done"
              onPress={() => {
                setTab("Art");
                setEditor((current) => ({ ...current, mode: "move" }));
              }}
            />
          </>
        )}
        {tab === "Wall" && (
          <>
            <Text style={s.body}>
              Drag the four wall corner handles to match the surface in your
              photo.
            </Text>
            <Text style={s.caption}>
              Perspective is calculated from this quadrilateral. Dimensions stay
              approximate until you enter a measured size.
            </Text>
            <Button
              title={
                editor.mode === "foreground"
                  ? "Finish foreground masking"
                  : "Protect foreground objects"
              }
              secondary
              onPress={() =>
                setEditor((current) => ({
                  ...current,
                  mode: current.mode === "foreground" ? "wall" : "foreground",
                }))
              }
            />
            {editor.mode === "foreground" && (
              <>
                <Text style={s.caption}>
                  Paint over a lamp, sofa or plant in the photo to keep it in
                  front of your art. This mask is manual and saved with the
                  wall.
                </Text>
                <Control
                  label="Foreground brush"
                  value={brush}
                  min={0.005}
                  max={0.12}
                  onChange={setBrush}
                />
              </>
            )}
            <Button
              title="Undo last mask stroke"
              secondary
              disabled={!space.wall.foregroundStrokes?.length}
              onPress={() =>
                update((current) => ({
                  ...current,
                  wall: {
                    ...current.wall,
                    foregroundStrokes: current.wall.foregroundStrokes?.slice(
                      0,
                      -1,
                    ),
                  },
                }))
              }
            />
            <Button
              title="Clear foreground mask"
              secondary
              disabled={!space.wall.foregroundStrokes?.length}
              onPress={() =>
                update((current) => ({
                  ...current,
                  wall: { ...current.wall, foregroundStrokes: [] },
                }))
              }
            />
            {space.wall.occlusionMaskUri && (
              <Button
                title="Use manual foreground mask"
                secondary
                onPress={() =>
                  update((current) => ({
                    ...current,
                    wall: {
                      ...current.wall,
                      occlusionMaskUri: undefined,
                      occlusionEnabled: true,
                    },
                  }))
                }
              />
            )}
            <Input
              label="Space name"
              value={space.name}
              maxLength={80}
              onChangeText={(name) =>
                update((current) => ({ ...current, name }))
              }
            />
            <Input
              label="Wall width (cm)"
              value={wallWidth}
              keyboardType="decimal-pad"
              onChangeText={setWallWidth}
            />
            <Input
              label="Wall height (cm)"
              value={wallHeight}
              keyboardType="decimal-pad"
              onChangeText={setWallHeight}
            />
            <Button
              title="Apply measured wall size"
              onPress={() => {
                const width = Number(wallWidth.replace(",", ".")),
                  height = Number(wallHeight.replace(",", "."));
                if (
                  ![width, height].every(
                    (value) =>
                      Number.isFinite(value) && value >= 10 && value <= 5000,
                  )
                ) {
                  setError("Wall dimensions must be between 10 and 5000 cm.");
                  return;
                }
                setError(null);
                update((current) => ({
                  ...current,
                  wall: {
                    ...current.wall,
                    widthCm: width,
                    heightCm: height,
                    measurement: "manual",
                  },
                }));
              }}
            />
          </>
        )}
        {selected && (
          <>
            <ArtworkDimensions
              key={`${selected.id}:${selected.artwork.widthCm}:${selected.artwork.heightCm}:${selected.scale}`}
              {...effectiveDimensions(selected)}
              onApply={(width, height) =>
                update((current) =>
                  resizeArtwork(current, selected.id, width, height),
                )
              }
            />
            <Control
              label="Artwork scale"
              value={selected.scale}
              min={0.1}
              max={3}
              onChange={(scale) =>
                update((current) => ({
                  ...current,
                  layout: "custom",
                  pieces: current.pieces.map((p) =>
                    p.id === selected.id ? { ...p, scale } : p,
                  ),
                }))
              }
            />
            <Control
              label="Rotation"
              value={selected.rotation}
              min={-45}
              max={45}
              onChange={(rotation) =>
                update((current) => ({
                  ...current,
                  layout: "custom",
                  pieces: current.pieces.map((p) =>
                    p.id === selected.id ? { ...p, rotation } : p,
                  ),
                }))
              }
            />
          </>
        )}
        <View style={s.row}>
          <Button
            title={compare ? "Show design" : "Show original"}
            secondary
            onPress={() => setCompare((value) => !value)}
          />
          <Button
            title="Export / share PNG"
            disabled={busy || !imagesReady}
            onPress={() => {
              void share();
            }}
          />
          {selected && space.pieces.length > 1 && (
            <Button
              title="Remove selected piece"
              secondary
              onPress={() => {
                update((current) => ({
                  ...current,
                  layout: "custom",
                  pieces: current.pieces.filter((p) => p.id !== selected.id),
                }));
                setEditor((current) => ({
                  ...current,
                  selected:
                    current.space.pieces.find((p) => p.id !== selected.id)
                      ?.id ?? null,
                }));
              }}
            />
          )}
        </View>
      </ScrollView>
      <Modal
        visible={importing}
        animationType="slide"
        onRequestClose={() => setImporting(false)}
      >
        {importing && (
          <ImportArtworkScreen
            onClose={() => setImporting(false)}
            onImported={(art) => {
              chooseArt(art);
              setGroup("mine");
              setImporting(false);
              void catalogue.refresh();
            }}
          />
        )}
      </Modal>
      <Modal
        visible={inspect}
        animationType="fade"
        onRequestClose={() => setInspect(false)}
      >
        <Page>
          {selected && (
            <>
              <Text style={s.caption}>
                {(selected.artwork.widthCm * selected.scale).toFixed(1)} x{" "}
                {(selected.artwork.heightCm * selected.scale).toFixed(1)} cm -
                oversized pieces fit inside the wall
              </Text>
              <ArtImage
                uri={selected.artwork.imageUrl}
                ratio={selected.artwork.widthCm / selected.artwork.heightCm}
              />
              <Text style={s.heading}>{selected.artwork.title}</Text>
              <Text style={s.body}>
                {selected.artwork.widthCm} × {selected.artwork.heightCm} cm
              </Text>
            </>
          )}
          <Button title="Back to wall" onPress={() => setInspect(false)} />
        </Page>
      </Modal>
      <Modal visible={leave} transparent onRequestClose={() => setLeave(false)}>
        <View style={styles.scrim}>
          <View style={s.card}>
            <Text style={s.heading}>Unsaved changes</Text>
            <Text style={s.body}>Save this wall to keep editing it later.</Text>
            <Button title="Keep editing" onPress={() => setLeave(false)} />
            <Button
              title="Discard changes and leave"
              disabled={busy}
              secondary
              onPress={() => {
                setLeave(false);
                setDiscarding(true);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
function Control({
  label,
  value,
  min,
  max,
  onChange,
  percent = false,
  neutral,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  percent?: boolean;
  neutral?: number;
}) {
  const display =
    neutral !== undefined && Math.abs(value - neutral) < 0.005
      ? "Neutral"
      : percent
        ? `${Math.round(value * 100)}%`
        : String(Math.round(value * 100) / 100);
  return (
    <View>
      <Text style={s.caption}>
        {label}: {display}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => onChange(clamp(value - (max - min) / 100, min, max))}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={s.heading}>−</Text>
        </Pressable>
        <Slider
          style={{ flex: 1, minHeight: 44 }}
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value, text: display }}
          minimumValue={min}
          maximumValue={max}
          value={value}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.line}
          thumbTintColor={colors.accent}
          onValueChange={onChange}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={() => onChange(clamp(value + (max - min) / 100, min, max))}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={s.heading}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { padding: 8, gap: 8, flexDirection: "row", alignItems: "center" },
  small: { fontSize: 11, color: colors.muted },
  stage: {
    flex: 1,
    minHeight: 160,
    backgroundColor: "#08090a",
    overflow: "hidden",
  },
  panel: { padding: 12, gap: 10 },
  thumb: {
    width: 80,
    padding: 4,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  scrim: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
});
