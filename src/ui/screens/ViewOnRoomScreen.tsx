import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import { Page, Button, ArtImage, ErrorState, Loading } from "../components";
import { styles as s } from "../theme";

export function ViewOnRoomScreen({ artworkId }: { artworkId: string }) {
  const { repositories: r, activeRoomId, setActiveRoomId } = useApp();
  const spaces = useResource(useCallback(() => r.spaces.list(), [r]));
  const art = useResource(
    useCallback(() => r.artworks.getPublishedById(artworkId), [r, artworkId]),
  );
  const [choosing, setChoosing] = useState(false);
  const locked = useRef(false);
  const automaticRoom =
    spaces.data?.find((room) => room.id === activeRoomId) ??
    (spaces.data?.length === 1 ? spaces.data[0] : null);
  useEffect(() => {
    if (!automaticRoom || !art.data || locked.current) return;
    locked.current = true;
    router.replace({
      pathname: "/space/[id]",
      params: { id: automaticRoom.id, artworkId },
    });
  }, [automaticRoom, art.data, artworkId]);
  const choose = (id: string) => {
    if (locked.current) return;
    locked.current = true;
    setActiveRoomId(id);
    setChoosing(true);
    router.replace({ pathname: "/space/[id]", params: { id, artworkId } });
  };
  if (automaticRoom && art.data)
    return (
      <Page>
        <Loading />
        <Text style={s.caption}>
          Applying artwork to {automaticRoom.name}...
        </Text>
      </Page>
    );
  return (
    <Page>
      <Text style={s.caption}>ARTSPACE / VIEW ON ROOM</Text>
      <Text style={s.title}>Choose your wall.</Text>
      {art.loading ? (
        <Loading />
      ) : art.error ? (
        <ErrorState
          message={art.error}
          retry={() => {
            void art.refresh();
          }}
        />
      ) : !art.data ? (
        <ErrorState message="This artwork is no longer available." />
      ) : (
        <>
          <View style={{ width: 76, alignSelf: "center" }}>
            <ArtImage
              uri={art.data.thumbnailUrl}
              ratio={art.data.widthCm / art.data.heightCm}
            />
          </View>
          <Text style={s.heading}>{art.data.title}</Text>
          <Text style={s.body}>
            Choose a room to apply this artwork at its saved wall position. Your
            previous design changes only when you save.
          </Text>
          <Button
            title="Add your room"
            disabled={choosing}
            onPress={() =>
              router.push({
                pathname: "/spaces",
                params: { artworkId, add: "1" },
              })
            }
          />
          {spaces.loading ? (
            <Loading />
          ) : spaces.error ? (
            <ErrorState
              message={spaces.error}
              retry={() => {
                void spaces.refresh();
              }}
            />
          ) : !spaces.data?.length ? (
            <Text style={s.caption}>
              Take a wall photo or choose one from Photos to start.
            </Text>
          ) : (
            spaces.data.map((space) => (
              <View key={space.id} style={s.card}>
                <ArtImage
                  uri={space.room.uri}
                  ratio={space.room.width / space.room.height}
                  accessibilityLabel={`Room ${space.name}`}
                  onPress={() => choose(space.id)}
                />
                <Text style={s.heading}>{space.name}</Text>
                <Button
                  title={`View on ${space.name}`}
                  disabled={choosing}
                  onPress={() => choose(space.id)}
                />
              </View>
            ))
          )}
        </>
      )}
      <Button title="Back to artwork" secondary onPress={() => router.back()} />
    </Page>
  );
}
