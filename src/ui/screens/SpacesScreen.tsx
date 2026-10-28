import React, { useCallback, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import { newSpace } from "../../features/studio/createSpace";
import { prepareSpaceImage } from "../../infra/spaceImages";
import { analyzeRoomPhoto } from "../../infra/analyzeRoomPhoto";
import { sampleRooms } from "../../data/mock/rooms";
import { LibraryNavigation } from "../studio/LibraryNavigation";
import {
  Page,
  Button,
  Input,
  ArtImage,
  Loading,
  ErrorState,
} from "../components";
import { colors, styles as s } from "../theme";
export function SpacesScreen({
  artworkId,
  savedOnly = false,
  initialAdd = false,
}: { artworkId?: string; savedOnly?: boolean; initialAdd?: boolean } = {}) {
  const { repositories: r, activeRoomId, setActiveRoomId } = useApp();
  const spaces = useResource(useCallback(() => r.spaces.list(), [r]));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [name, setName] = useState(""),
    [adding, setAdding] = useState(initialAdd),
    [samples, setSamples] = useState(false),
    [active, setActive] = useState<string | null>(null),
    [confirm, setConfirm] = useState<string | null>(null);
  const locked = useRef(false);
  const rooms =
    spaces.data?.filter((space) => !savedOnly || space.pieces.length > 0) ?? [];
  const chosen =
    rooms.find((room) => room.id === active) ??
    rooms.find((room) => room.id === activeRoomId) ??
    rooms[0];
  const open = (id: string) => {
    setActiveRoomId(id);
    router.push({
      pathname: "/space/[id]",
      params: { id, ...(artworkId ? { artworkId } : {}) },
    });
  };
  async function create(source: string) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const sample = sampleRooms.find((room) => room.id === source);
      let raw: { uri: string; width: number; height: number };
      if (sample) raw = sample;
      else {
        if (source === "camera") {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted)
            throw new Error(
              "Allow camera access in Settings, or choose a room image from Photos.",
            );
        }
        const options: ImagePicker.ImagePickerOptions = {
          mediaTypes: ["images"],
          allowsMultipleSelection: false,
          exif: false,
        };
        const picked =
          source === "camera"
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);
        if (picked.canceled) return;
        const asset = picked.assets[0];
        if (
          !asset ||
          !asset.width ||
          !asset.height ||
          asset.width * asset.height > 40_000_000 ||
          (asset.fileSize ?? 0) > 30 * 1024 * 1024
        )
          throw new Error("Choose a photo under 30 MB and 40 megapixels.");
        raw = asset;
      }
      const image = await prepareSpaceImage(raw.uri);
      const room = {
        uri: image.base64
          ? `data:image/jpeg;base64,${image.base64}`
          : image.uri,
        width: image.width,
        height: image.height,
      };
      let space = newSpace(
        Crypto.randomUUID(),
        name.trim() ||
          (sample ? sample.name : `Wall ${(spaces.data?.length ?? 0) + 1}`),
        room,
      );
      try {
        const suggestion = await analyzeRoomPhoto(room);
        if (suggestion) {
          const q = suggestion.corners;
          const ratio =
            ((q[3].y - q[0].y) * room.height) /
            ((q[1].x - q[0].x) * room.width);
          space = {
            ...space,
            wall: {
              ...space.wall,
              corners: q,
              heightCm: Math.max(
                10,
                Math.min(5000, space.wall.widthCm * ratio),
              ),
              photoAssist: {
                confidence: suggestion.confidence,
                brightness: suggestion.brightness,
                warmth: suggestion.warmth,
              },
              occlusionMaskUri: suggestion.occlusionMaskUri,
              occlusionEnabled: true,
            },
          };
        }
      } catch {
        /* Keep manual wall alignment available if analysis cannot read this image. */
      }
      const result = await r.spaces.save(space);
      if (!result.ok) throw new Error(result.error.message);
      setAdding(false);
      open(result.data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add this room.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Page
        footer={
          <LibraryNavigation active={savedOnly ? "saved" : "interiors"} />
        }
      >
        <Text style={[s.heading, { textAlign: "center", letterSpacing: 6 }]}>
          ARTSPACE
        </Text>
        <Text style={s.caption}>
          {savedOnly ? "SAVED DESIGNS" : "YOUR SPACES"}
          {artworkId ? " / CHOOSE A ROOM" : ""}
        </Text>
        {spaces.loading ? (
          <Loading />
        ) : spaces.error ? (
          <ErrorState
            message={spaces.error}
            retry={() => {
              void spaces.refresh();
            }}
          />
        ) : chosen ? (
          <View style={{ gap: 12 }}>
            <ArtImage
              uri={chosen.room.uri}
              ratio={chosen.room.width / chosen.room.height}
              accessibilityLabel={`Open room ${chosen.name}`}
              onPress={() => open(chosen.id)}
            />
            <Text style={s.title}>{chosen.name}</Text>
            <Text style={s.caption}>
              {chosen.wall.photoAssist
                ? "Photo-assisted wall position"
                : "Saved wall"}{" "}
              -{" "}
              {chosen.wall.measurement === "approximate"
                ? "size estimated"
                : `${chosen.wall.widthCm} x ${chosen.wall.heightCm} cm`}
            </Text>
            <Button
              title={
                artworkId
                  ? "View on this room"
                  : savedOnly
                    ? "Open saved design"
                    : "Tap to hang something"
              }
              onPress={() => open(chosen.id)}
            />
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.title}>
              {savedOnly
                ? "Your designs, kept here."
                : "Your room. Your walls."}
            </Text>
            <Text style={s.body}>
              {savedOnly
                ? "Save a wall design to return to it here."
                : "Photograph a wall or choose a room image. Then choose View on room from any artwork."}
            </Text>
          </View>
        )}
        {!savedOnly && (
          <>
            <View style={s.row}>
              <Button
                title="My interiors"
                secondary={samples}
                onPress={() => setSamples(false)}
              />
              <Button
                title="Sample walls"
                secondary={!samples}
                onPress={() => setSamples(true)}
              />
            </View>
            <ScrollView horizontal contentContainerStyle={{ gap: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add your room"
                onPress={() => setAdding(true)}
                style={{
                  width: 130,
                  minHeight: 150,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.line,
                  padding: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 36, color: colors.accent }}>+</Text>
                <Text style={s.body}>Add your room</Text>
              </Pressable>
              {samples
                ? sampleRooms.map((room) => (
                    <View key={room.id} style={{ width: 130, gap: 6 }}>
                      <ArtImage
                        uri={room.uri}
                        ratio={0.9}
                        onPress={() => {
                          void create(room.id);
                        }}
                        accessibilityLabel={`Use sample ${room.name}`}
                      />
                      <Text style={s.caption}>{room.name} - illustration</Text>
                    </View>
                  ))
                : rooms.map((room) => (
                    <View
                      key={room.id}
                      style={{
                        width: 130,
                        gap: 6,
                        borderBottomWidth: chosen?.id === room.id ? 3 : 0,
                        borderColor: colors.accent,
                      }}
                    >
                      <ArtImage
                        uri={room.room.uri}
                        ratio={0.9}
                        accessibilityLabel={`Select ${room.name}`}
                        onPress={() => {
                          setActive(room.id);
                          setActiveRoomId(room.id);
                        }}
                      />
                      <Text style={s.caption}>{room.name}</Text>
                    </View>
                  ))}
            </ScrollView>
          </>
        )}
        {savedOnly &&
          rooms.map((room) => (
            <View key={room.id} style={s.card}>
              <Text style={s.heading}>{room.name}</Text>
              <Text style={s.caption}>{room.pieces.length} artworks</Text>
              <Button
                title={`Edit ${room.name}`}
                onPress={() => open(room.id)}
              />
            </View>
          ))}
        {chosen && (
          <>
            <Button
              title="Manage this room"
              secondary
              onPress={() =>
                setConfirm(confirm === chosen.id ? null : chosen.id)
              }
            />
            {confirm === chosen.id && (
              <View style={s.card}>
                <Text style={s.body}>
                  Delete this saved room and its app-owned images? Original
                  photos stay unchanged.
                </Text>
                <Button
                  title="Confirm delete room"
                  disabled={busy}
                  secondary
                  onPress={() => {
                    if (locked.current) return;
                    locked.current = true;
                    setBusy(true);
                    void r.spaces
                      .remove(chosen.id)
                      .then(async (result) => {
                        if (!result.ok) setError(result.error.message);
                        else {
                          setConfirm(null);
                          await spaces.refresh();
                        }
                      })
                      .finally(() => {
                        locked.current = false;
                        setBusy(false);
                      });
                  }}
                />
                <Button
                  title="Keep room"
                  secondary
                  onPress={() => setConfirm(null)}
                />
              </View>
            )}
          </>
        )}
        {busy && <Loading />}
        {error && <ErrorState message={error} />}
        <Text style={s.caption}>
          Photo suggestions are approximate. Confirm the wall corners and enter
          a measured size for accurate scale.
        </Text>
        {artworkId && (
          <Button
            title="Back to room selection"
            secondary
            onPress={() => router.back()}
          />
        )}
      </Page>
      <Modal
        visible={adding}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setAdding(false);
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,.65)",
          }}
        >
          <View
            style={[
              s.card,
              { margin: 16, padding: 24, gap: 14, borderRadius: 24 },
            ]}
          >
            <Text style={s.heading}>Add your room</Text>
            <Text style={s.body}>
              Photograph a wall now or choose an existing room image.
            </Text>
            <Input
              label="Room name (optional)"
              value={name}
              maxLength={80}
              editable={!busy}
              onChangeText={setName}
            />
            {Platform.OS !== "web" && (
              <Button
                title="Take a Photo"
                disabled={busy}
                onPress={() => {
                  void create("camera");
                }}
              />
            )}
            <Button
              title="Choose from Photos"
              disabled={busy}
              onPress={() => {
                void create("photo");
              }}
            />
            {busy ? (
              <>
                <Loading />
                <Text style={s.caption}>
                  Preparing your room and suggesting a wall...
                </Text>
              </>
            ) : (
              <Button
                title="Cancel"
                secondary
                onPress={() => setAdding(false)}
              />
            )}
            {error && <ErrorState message={error} />}
          </View>
        </View>
      </Modal>
    </>
  );
}
