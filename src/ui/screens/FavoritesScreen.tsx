import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../bootstrap/AppProviders";
import { useResource } from "../../features/useResource";
import { ok } from "../../domain/models";
import { Page, Button, Empty, Loading, ErrorState } from "../components";
import { styles as s } from "../theme";
export function FavoritesScreen() {
  const { user } = useApp();
  return <FavoritesContent key={user?.uid ?? "guest"} />;
}
function FavoritesContent() {
  const { repositories: r, user, authReady } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const favorites = useResource(
    useCallback(
      () => (user ? r.favorites.list(user.uid) : Promise.resolve(ok([]))),
      [r, user],
    ),
  );
  async function remove(id: string) {
    if (!user || busy) return;
    setBusy(id);
    setError(null);
    setHidden((ids) => [...ids, id]);
    const result = await r.favorites.remove(user.uid, id);
    if (!result.ok) setError(result.error.message);
    else await favorites.refresh();
    setHidden((ids) => ids.filter((value) => value !== id));
    setBusy(null);
  }
  return (
    <Page>
      <Text style={s.title}>Your favorites</Text>
      {!authReady ? (
        <Loading />
      ) : !user ? (
        <>
          <Empty message="Sign in to collect your favorite artworks." />
          <Button title="Sign in" onPress={() => router.push("/login")} />
        </>
      ) : favorites.loading ? (
        <Loading />
      ) : favorites.error ? (
        <ErrorState
          message={favorites.error}
          retry={() => {
            void favorites.refresh();
          }}
        />
      ) : (
        <>
          {favorites.data?.length === 0 && (
            <Empty message="No favorites yet. Find something in the gallery." />
          )}
          {favorites.data
            ?.filter((f) => !hidden.includes(f.artworkId))
            .map((f) => (
              <View key={f.artworkId} style={s.card}>
                <Button
                  title={`Open ${f.artworkId}`}
                  secondary
                  onPress={() =>
                    router.push({
                      pathname: "/artwork/[id]",
                      params: { id: f.artworkId },
                    })
                  }
                />
                <Button
                  title="Remove favorite"
                  disabled={busy !== null}
                  secondary
                  onPress={() => {
                    void remove(f.artworkId);
                  }}
                />
              </View>
            ))}
        </>
      )}
      {error && <ErrorState message={error} />}
    </Page>
  );
}
