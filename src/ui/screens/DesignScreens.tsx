import React, { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import { isExpoGoPreview } from "../../config/runtime";
import {
  Page,
  Button,
  ArtImage,
  Loading,
  ErrorState,
  Empty,
} from "../components";
import { styles as s } from "../theme";
export function SavedScreen() {
  const { repositories: r, user, authReady } = useApp();
  const uid = user?.uid ?? "guest";
  const designs = useResource(useCallback(() => r.designs.list(uid), [r, uid]));
  return (
    <Page>
      <Text style={s.title}>Saved spaces</Text>
      <Text style={s.caption}>
        {r.mode === "local"
          ? "Local on this device · current account only"
          : "Cloud catalogue captures + device-only imported artwork captures"}
      </Text>
      {r.mode === "cloud" && !user && (
        <Button
          title="Sign in for cloud designs"
          onPress={() => router.push("/login")}
        />
      )}
      {!authReady ? (
        <Loading />
      ) : designs.loading ? (
        <Loading />
      ) : designs.error ? (
        <ErrorState
          message={designs.error}
          retry={() => {
            void designs.refresh();
          }}
        />
      ) : (
        <>
          {designs.data?.length === 0 && (
            <Empty
              message={
                isExpoGoPreview
                  ? "No saved designs in this Expo Go installation. AR captures require the native app."
                  : "No saved designs yet. Capture a preview in AR to start."
              }
            />
          )}
          {designs.data?.map((d) => (
            <View style={s.card} key={d.id}>
              <ArtImage uri={d.capturedImageUri} ratio={3 / 4} />
              <Text style={s.body}>
                {d.artworkId} ·{" "}
                {d.storageMode === "local" ? "On this device" : "Cloud saved"}
              </Text>
              <Button
                title="Open design"
                secondary
                onPress={() =>
                  router.push({
                    pathname: "/design/[id]",
                    params: { id: d.id },
                  })
                }
              />
            </View>
          ))}
        </>
      )}
    </Page>
  );
}
export function DesignDetailScreen({ id }: { id: string }) {
  const { repositories: r, user } = useApp();
  const uid = user?.uid ?? "guest";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const design = useResource(
    useCallback(() => r.designs.getById(uid, id), [r, uid, id]),
  );
  async function remove() {
    setBusy(true);
    const result = await r.designActions.delete(uid, id);
    setBusy(false);
    if (result.ok) router.replace("/(tabs)/saved");
    else setError(result.error.message);
  }
  return (
    <Page>
      <Text style={s.title}>Your wall preview</Text>
      {design.loading ? (
        <Loading />
      ) : design.error ? (
        <ErrorState
          message={design.error}
          retry={() => {
            void design.refresh();
          }}
        />
      ) : !design.data ? (
        <Empty message="Design not found in this account." />
      ) : (
        <>
          <ArtImage uri={design.data.capturedImageUri} ratio={3 / 4} />
          <Text style={s.body}>
            {Math.round(design.data.widthCm * design.data.scaleFactor)} ×{" "}
            {Math.round(design.data.heightCm * design.data.scaleFactor)} cm ·{" "}
            {design.data.scaleFactor.toFixed(1)}×
          </Text>
          <Text style={s.caption}>
            {new Date(design.data.createdAt).toLocaleString()} ·{" "}
            {design.data.storageMode === "local"
              ? "Local on this device"
              : "Cloud saved"}
          </Text>
          <Button
            title="Delete design"
            secondary
            disabled={busy}
            onPress={() =>
              Alert.alert(
                "Delete design?",
                "The saved image and metadata will be removed.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      void remove();
                    },
                  },
                ],
              )
            }
          />
        </>
      )}
      {error && (
        <ErrorState
          message={error}
          retry={() => {
            void remove();
          }}
        />
      )}
    </Page>
  );
}
export function CapturePreviewScreen() {
  const { repositories: r, user, draft, setDraft } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!draft || busy) return;
    if (r.mode === "cloud" && draft.sourceKind !== "custom" && !user) {
      router.push({
        pathname: "/login",
        params: { returnTo: "/capture-preview" },
      });
      return;
    }
    setBusy(true);
    setError(null);
    const uid = user?.uid ?? "guest";
    const result = await r.designActions.save(uid, { ...draft, userId: uid });
    setBusy(false);
    if (!result.ok) setError(result.error.message);
    else {
      setDraft(null);
      router.replace({
        pathname: "/design/[id]",
        params: { id: result.data.id },
      });
    }
  }
  return (
    <Page>
      <Text style={s.title}>A new perspective</Text>
      {!draft ? (
        <>
          <Empty message="No capture available. Return to an artwork and take a preview." />
          <Button
            title="Browse artworks"
            onPress={() => router.replace("/(tabs)")}
          />
        </>
      ) : (
        <>
          <ArtImage uri={draft.capturedImageUri} ratio={3 / 4} />
          <Text style={s.caption}>
            {draft.sourceKind === "custom"
              ? "This imported artwork capture stays on this device. "
              : ""}
            Check that your camera scene and artwork are both visible before
            saving.
          </Text>
          <Button
            title={
              busy
                ? "Saving…"
                : r.mode === "local" || draft.sourceKind === "custom"
                  ? "Save on this device"
                  : user
                    ? "Save to cloud"
                    : "Sign in to save to cloud"
            }
            disabled={busy}
            onPress={() => {
              void save();
            }}
          />
          <Button
            title="Retake"
            secondary
            disabled={busy}
            onPress={() => {
              const id = draft.artworkId;
              setDraft(null);
              if (id) router.replace({ pathname: "/ar/[id]", params: { id } });
            }}
          />
          {error && (
            <ErrorState
              message={error}
              retry={() => {
                void save();
              }}
            />
          )}
        </>
      )}
    </Page>
  );
}
