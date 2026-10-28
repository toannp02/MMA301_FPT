import React, { useCallback } from "react";
import { Platform, Text } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import { Page, ArtImage, Button, Loading, ErrorState } from "../components";
import { styles as s } from "../theme";
import { isExpoGoPreview } from "../../config/runtime";

export function ArtworkDetailScreen({ id }: { id: string }) {
  const { repositories } = useApp();
  const artwork = useResource(
    useCallback(
      () => repositories.artworks.getPublishedById(id),
      [repositories, id],
    ),
  );
  return (
    <Page>
      {artwork.loading ? (
        <Loading />
      ) : artwork.error ? (
        <ErrorState
          message={artwork.error}
          retry={() => {
            void artwork.refresh();
          }}
        />
      ) : !artwork.data ? (
        <ErrorState message="Artwork not found or no longer published." />
      ) : (
        <>
          <ArtImage
            key={artwork.data.imageUrl}
            uri={artwork.data.imageUrl}
            ratio={artwork.data.widthCm / artwork.data.heightCm}
          />
          <Text style={s.title}>{artwork.data.title}</Text>
          <Text style={s.caption}>
            {artwork.data.widthCm} × {artwork.data.heightCm} cm
          </Text>
          <Button
            title="View on room"
            onPress={() =>
              router.push({ pathname: "/view-on-room/[id]", params: { id } })
            }
          />
          <Button
            title={
              isExpoGoPreview
                ? "2D Preview"
                : Platform.OS === "web"
                  ? "AR availability"
                  : "View in AR"
            }
            onPress={() =>
              router.push({
                pathname: isExpoGoPreview ? "/preview-2d/[id]" : "/ar/[id]",
                params: { id },
              })
            }
          />
          <Text style={s.caption}>
            {isExpoGoPreview
              ? "Capture your space, then switch artworks to compare. 2D only; no wall tracking or real-world scale."
              : "Wall placement needs an ARCore-supported Android phone and camera access."}
          </Text>
          {artwork.data.sourceKind === "custom" && (
            <Button
              title="Manage imports"
              secondary
              onPress={() => router.push("/import-artwork")}
            />
          )}
          <Button
            title="Back to collection"
            secondary
            onPress={() => router.replace("/(tabs)")}
          />
        </>
      )}
    </Page>
  );
}
