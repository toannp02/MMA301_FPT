import React, { useCallback, useEffect, useState } from "react";
import { Modal, Text } from "react-native";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import { resolveARAsset } from "../../features/ar/arAssetResolver";
import { ARViewer } from "../../features/ar/ARViewer";
import type { ARArtworkInput } from "../../features/ar/arTypes";
import { Page, Button, Loading, ErrorState } from "../components";
import { styles as s } from "../theme";
import { withTimeout } from "../../domain/async";
export function ARScreen({ id }: { id: string }) {
  const { repositories: r, setDraft, user } = useApp();
  const [activeId, setActiveId] = useState(id);
  const [input, setInput] = useState<ARArtworkInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [switching, setSwitching] = useState(false);
  const art = useResource(
    useCallback(() => r.artworks.getPublishedById(activeId), [r, activeId]),
  );
  const catalogue = useResource(
    useCallback(() => r.artworks.listPublished(), [r]),
  );
  useEffect(() => {
    let live = true;
    if (art.data) {
      const a = art.data;
      withTimeout(
        resolveARAsset(a.id, a.imageUrl),
        20000,
        "Artwork preparation timed out. Retry or choose another artwork.",
      )
        .then((uri) => {
          if (live) {
            setError(null);
            setInput({
              sourceKind: a.sourceKind ?? "catalog",
              id: a.id,
              imageUri: uri,
              widthCm: a.widthCm,
              heightCm: a.heightCm,
            });
            setSwitching(false);
          }
        })
        .catch(() => {
          if (live)
            setError(
              "Artwork download failed. Check your connection and retry.",
            );
        });
    }
    return () => {
      live = false;
    };
  }, [art.data, retry]);
  if (!input)
    return (
      <Page>
        {error || art.error ? (
          <ErrorState
            message={error ?? art.error ?? ""}
            retry={() => {
              setRetry((v) => v + 1);
              void art.refresh();
            }}
          />
        ) : art.loading || art.data ? (
          <Loading />
        ) : (
          <ErrorState message="Artwork unavailable." />
        )}
        <Button
          title="Back to gallery"
          onPress={() => router.replace("/(tabs)")}
        />
      </Page>
    );
  return (
    <>
      <ARViewer
        artwork={input}
        onBack={() => router.back()}
        onChange={() => setSwitching(true)}
        onError={setError}
        onCapture={(uri, p) => {
          setDraft({
            id: Crypto.randomUUID(),
            userId: user?.uid ?? "guest",
            artworkId: p.artworkId,
            sourceKind: input.sourceKind ?? "catalog",
            sourceImageUri:
              input.sourceKind === "custom" ? input.imageUri : null,
            capturedImageUri: uri,
            imageStoragePath: null,
            storageMode: "local",
            widthCm: p.widthCm,
            heightCm: p.heightCm,
            scaleFactor: p.scaleFactor,
            frameStyle: p.frameStyle,
            createdAt: new Date().toISOString(),
          });
          // Replace releases native camera/GL resources while the capture draft lives in the provider.
          router.replace("/capture-preview");
        }}
      />
      <Modal
        visible={switching}
        animationType="slide"
        onRequestClose={() => setSwitching(false)}
      >
        <Page>
          <Text style={s.title}>Choose a different piece</Text>
          {art.loading && <Loading />}
          {error && (
            <ErrorState
              message={error}
              retry={() => {
                setRetry((v) => v + 1);
              }}
            />
          )}
          {catalogue.error && (
            <ErrorState
              message={catalogue.error}
              retry={() => {
                void catalogue.refresh();
              }}
            />
          )}
          {catalogue.data?.map((a) => (
            <Button
              key={a.id}
              title={a.title}
              secondary
              onPress={() => setActiveId(a.id)}
            />
          ))}
          <Button
            title="Keep current artwork"
            onPress={() => setSwitching(false)}
          />
        </Page>
      </Modal>
    </>
  );
}
