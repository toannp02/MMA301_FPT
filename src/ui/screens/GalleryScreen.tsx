import React, { useCallback, useState } from "react";
import { Text, View, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import {
  Page,
  Button,
  ArtImage,
  Loading,
  ErrorState,
  Empty,
} from "../components";
import { styles as s } from "../theme";
import { ArtworkFilters } from "../studio/ArtworkFilters";
import { emptyQuery, filterArtworks } from "../../features/studio/discovery";
import { LibraryNavigation } from "../studio/LibraryNavigation";
import { isExpoGoPreview } from "../../config/runtime";

export function GalleryScreen() {
  const { repositories } = useApp();
  const [gridWidth, setGridWidth] = useState(0);
  const artworks = useResource(
    useCallback(() => repositories.artworks.listPublished(), [repositories]),
  );
  const [group, setGroup] = useState<"mine" | "discover">("discover");
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState({ ...emptyQuery });
  const grouped =
    artworks.data?.filter(
      (art) => (art.sourceKind === "custom") === (group === "mine"),
    ) ?? [];
  const visible = filterArtworks(grouped, query);
  return (
    <Page footer={<LibraryNavigation active="artworks" />}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Button
          title="Search"
          secondary
          onPress={() => setShowSearch((value) => !value)}
        />
        <Text style={[s.heading, { letterSpacing: 5 }]}>ARTSPACE</Text>
        <Button
          title="Add art"
          secondary
          onPress={() => router.push("/import-artwork")}
        />
      </View>
      {isExpoGoPreview && (
        <Text style={s.caption}>Expo Go preview - photo studio</Text>
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
      </View>
      {showSearch && (
        <ArtworkFilters query={query} onChange={setQuery} items={grouped} />
      )}
      <Text style={s.heading}>
        {group === "mine" ? "Your artworks" : "Discover artworks"}
      </Text>
      {artworks.loading ? (
        <Loading />
      ) : artworks.error ? (
        <ErrorState
          message={artworks.error}
          retry={() => {
            void artworks.refresh();
          }}
        />
      ) : !visible.length ? (
        <Empty
          message={
            grouped.length
              ? "No artworks match these filters."
              : "Your collection starts with a photo. Add your first artwork above."
          }
        />
      ) : (
        <View
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            setGridWidth((current) => (current === width ? current : width));
          }}
          style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}
        >
          {visible.map((art) => {
            const open = () =>
              router.push({
                pathname: "/artwork/[id]",
                params: { id: art.id },
              });
            return (
              <View
                key={art.id}
                style={[
                  {
                    backgroundColor: "#1C1F23",
                    padding: 8,
                    gap: 10,
                    borderWidth: 1,
                    borderColor: "#363A41",
                    borderRadius: 4,
                  },
                  { width: gridWidth > 12 ? (gridWidth - 12) / 2 : 160 },
                ]}
              >
                <ArtImage
                  uri={art.thumbnailUrl}
                  ratio={art.widthCm / art.heightCm}
                  accessibilityLabel={`View image of ${art.title}`}
                  onPress={open}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View ${art.title}`}
                  onPress={open}
                >
                  <Text
                    numberOfLines={2}
                    style={[
                      s.body,
                      {
                        fontSize: 21,
                        fontFamily:
                          Platform.OS === "android" ? "serif" : "Georgia",
                      },
                    ]}
                  >
                    {art.title}
                  </Text>
                  <Text style={s.caption}>
                    {art.widthCm} × {art.heightCm} cm
                  </Text>
                </Pressable>
                <Button
                  title="View on room"
                  secondary
                  onPress={() =>
                    router.push({
                      pathname: "/view-on-room/[id]",
                      params: { id: art.id },
                    })
                  }
                />
              </View>
            );
          })}
        </View>
      )}
    </Page>
  );
}
