import React, { useCallback, useRef, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import type { ImportedImage } from "../../domain/repositories";
import { importValidation } from "../../domain/customArtworks";
import { pickArtworkImage } from "../../infra/pickArtworkImage";
import {
  Page,
  Input,
  Button,
  ArtImage,
  ErrorState,
  Loading,
} from "../components";
import { styles as s } from "../theme";
import type { Artwork } from "../../domain/models";
export function ImportArtworkScreen({
  onImported,
  onClose,
}: { onImported?: (artwork: Artwork) => void; onClose?: () => void } = {}) {
  const { repositories: r } = useApp();
  const [image, setImage] = useState<ImportedImage | null>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [title, setTitle] = useState("");
  const [width, setWidth] = useState("60");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const imports = useResource(useCallback(() => r.customArtworks.list(), [r]));
  const duplicate = image?.contentHash
    ? imports.data?.find((item) => item.contentHash === image.contentHash)
    : undefined;
  const widthCm = Number(width.replace(",", "."));
  async function choose(source: "library" | "camera" = "library") {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    setCameraDenied(false);
    try {
      const picked = await pickArtworkImage(source);
      if (picked) {
        setImage(picked);
        setAllowDuplicate(false);
        setTitle((current) => (current.trim() ? current : "My artwork"));
      }
    } catch (e) {
      setCameraDenied(e instanceof Error && e.name === "CameraPermissionError");
      setError(
        e instanceof Error
          ? e.message
          : "Could not open this photo. Try another image.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function save() {
    if (!image || locked.current) return;
    const invalid = importValidation(title, widthCm, image);
    if (invalid) {
      setError(invalid);
      return;
    }
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await r.customArtworks.add(title, widthCm, {
        ...image,
        allowDuplicate,
      });
      if (!result.ok) setError(result.error.message);
      else {
        setImage(null);
        if (onImported) {
          onImported(result.data);
          return;
        }
        router.replace({
          pathname: "/artwork/[id]",
          params: { id: result.data.id },
        });
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await r.customArtworks.remove(id);
      if (!result.ok) setError(result.error.message);
      else {
        setConfirmId(null);
        await imports.refresh();
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <Page>
      <Text style={s.title}>Add your artwork</Text>
      <Text style={s.body}>
        Choose a photo from your library or an image file. Enter its intended
        width; height follows the original proportions.
      </Text>
      <Text style={s.caption}>
        Only on this device · up to 10 artworks. Your original photo stays
        unchanged.
      </Text>
      <Button
        title={
          busy ? "Working…" : image ? "Choose another image" : "Choose image"
        }
        disabled={busy}
        onPress={() => {
          void choose();
        }}
      />
      {Platform.OS !== "web" && (
        <Button
          title="Take artwork photo"
          secondary
          disabled={busy}
          onPress={() => {
            void choose("camera");
          }}
        />
      )}
      {cameraDenied && (
        <Button
          title="Open camera settings"
          secondary
          onPress={() => {
            void Linking.openSettings().catch(() =>
              setError("Open device Settings and allow camera access."),
            );
          }}
        />
      )}
      {image && (
        <>
          <View
            style={{
              width: Math.min(220, (220 * image.width) / image.height),
              maxWidth: "100%",
              alignSelf: "center",
            }}
          >
            <ArtImage
              key={image.uri}
              uri={image.uri}
              ratio={image.width / image.height}
            />
          </View>
          {duplicate && (
            <View style={s.card}>
              <Text style={s.body}>
                This photo matches {duplicate.title} in your collection.
                Original photos are never changed.
              </Text>
              <Button
                title="Use existing artwork"
                secondary
                onPress={() =>
                  onImported
                    ? onImported(duplicate)
                    : router.replace({
                        pathname: "/artwork/[id]",
                        params: { id: duplicate.id },
                      })
                }
              />
              <Button
                title={
                  allowDuplicate
                    ? "Another copy allowed"
                    : "Import another copy"
                }
                secondary
                onPress={() => setAllowDuplicate((value) => !value)}
              />
            </View>
          )}
          <Input
            label="Artwork title"
            value={title}
            maxLength={60}
            editable={!busy}
            onChangeText={setTitle}
            placeholder="My painting"
          />
          <Input
            label="Width (cm)"
            value={width}
            editable={!busy}
            keyboardType="decimal-pad"
            onChangeText={setWidth}
          />
          <Text style={s.caption}>
            Height:{" "}
            {Number.isFinite(widthCm) && widthCm > 0
              ? ((widthCm * image.height) / image.width).toFixed(1)
              : "—"}{" "}
            cm · proportions locked
          </Text>
          <Button
            title={onImported ? "Use this artwork" : "Save imported artwork"}
            disabled={busy || (!!duplicate && !allowDuplicate)}
            onPress={() => {
              void save();
            }}
          />
        </>
      )}
      {error && <ErrorState message={error} />}
      <Text style={s.heading}>My imports</Text>
      <Button
        title={onClose ? "Back to preview" : "Back to collection"}
        secondary
        disabled={busy}
        onPress={onClose ?? (() => router.replace("/"))}
      />
      {imports.loading ? (
        <Loading />
      ) : imports.error ? (
        <ErrorState
          message={imports.error}
          retry={() => {
            void imports.refresh();
          }}
        />
      ) : (
        <>
          {!imports.data?.some((a) => a.sourceKind === "custom") && (
            <Text style={s.caption}>No imported artworks yet.</Text>
          )}
          {imports.data
            ?.filter((a) => a.sourceKind === "custom")
            .map((a) => (
              <View key={a.id} style={s.card}>
                <ArtImage uri={a.imageUrl} ratio={a.widthCm / a.heightCm} />
                <Text style={s.heading}>{a.title}</Text>
                <Button
                  title={`Open ${a.title}`}
                  secondary
                  disabled={busy}
                  onPress={() =>
                    router.push({
                      pathname: "/artwork/[id]",
                      params: { id: a.id },
                    })
                  }
                />
                {confirmId === a.id ? (
                  <>
                    <Text style={s.body}>
                      Remove this imported image? Existing AR capture images
                      stay saved; this source will no longer be available for
                      retaking.
                    </Text>
                    <Button
                      title="Confirm remove import"
                      disabled={busy}
                      onPress={() => {
                        void remove(a.id);
                      }}
                    />
                    <Button
                      title="Cancel removal"
                      secondary
                      disabled={busy}
                      onPress={() => setConfirmId(null)}
                    />
                  </>
                ) : (
                  <Button
                    title={`Remove ${a.title}`}
                    secondary
                    disabled={busy}
                    onPress={() => setConfirmId(a.id)}
                  />
                )}
              </View>
            ))}
        </>
      )}
    </Page>
  );
}
