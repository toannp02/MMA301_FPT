import { isExpoGoPreview } from "../../config/runtime";
import React, { useCallback } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import { Page, Button, ArtImage, Loading, ErrorState } from "../components";
import { styles } from "../theme";

export function ARUnavailableScreen({ id }: { id: string }) {
  const { repositories } = useApp();
  const artwork = useResource(
    useCallback(
      () => repositories.artworks.getPublishedById(id),
      [repositories, id],
    ),
  );
  return (
    <Page>
      <Text style={styles.title}>
        {isExpoGoPreview ? "Expo Go on iPhone" : "AR on your phone"}
      </Text>
      <Text style={styles.body}>
        You can browse the collection, search, view artwork details and use
        account features when Firebase is configured.
      </Text>
      <Text accessibilityRole="alert" style={styles.body}>
        Wall scanning, AR placement and AR captures require the native Viro
        application. They are unavailable in this preview.
      </Text>
      {artwork.loading ? (
        <Loading />
      ) : artwork.error ? (
        <ErrorState
          message={artwork.error}
          retry={() => {
            void artwork.refresh();
          }}
        />
      ) : artwork.data ? (
        <>
          <ArtImage
            uri={artwork.data.imageUrl}
            ratio={artwork.data.widthCm / artwork.data.heightCm}
          />
          <Text style={styles.heading}>{artwork.data.title}</Text>
          {isExpoGoPreview && <Button title="Open 2D Preview" onPress={() => router.push({ pathname: "/preview-2d/[id]", params: { id } })} />}
          <Text style={styles.caption}>
            {artwork.data.widthCm} × {artwork.data.heightCm} cm · catalogue
            image, not an AR capture
          </Text>
        </>
      ) : (
        <Text style={styles.caption}>Artwork no longer available.</Text>
      )}
      <Button title="Back to artwork" onPress={() => router.back()} />
      <Button
        title="Browse collection"
        secondary
        onPress={() => router.replace("/(tabs)")}
      />
    </Page>
  );
}
