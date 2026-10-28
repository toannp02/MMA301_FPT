import React, { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../bootstrap/AppProviders";
import { cleanName } from "../../domain/validators";
import { Page, Input, Button, Loading, ErrorState } from "../components";
import { styles as s } from "../theme";
export function ProfileScreen() {
  const { user } = useApp();
  return <ProfileContent key={user?.uid ?? "guest"} />;
}
function ProfileContent() {
  const { repositories: r, user, authReady, setUser } = useApp();
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function update() {
    const value = cleanName(name ?? user?.displayName ?? "");
    if (value.length < 2) {
      setError("Use a name with 2–60 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await r.auth.updateProfile(value);
    setBusy(false);
    if (result.ok) {
      setUser(result.data);
      setMessage("Profile updated.");
    } else setError(result.error.message);
  }
  async function logout() {
    setBusy(true);
    const result = await r.auth.signOut();
    setBusy(false);
    if (result.ok) setUser(null);
    else setError(result.error.message);
  }
  return (
    <Page>
      <Text style={s.title}>Your space</Text>
      {!authReady ? (
        <Loading />
      ) : user ? (
        <>
          <Text style={s.body}>{user.email}</Text>
          <Input
            label="Display name"
            value={name ?? user?.displayName ?? ""}
            onChangeText={setName}
            maxLength={60}
          />
          <Button
            title="Save profile"
            disabled={busy}
            onPress={() => {
              void update();
            }}
          />
          <Button
            title="Sign out"
            secondary
            disabled={busy}
            onPress={() => {
              void logout();
            }}
          />
          {message && <Text style={s.body}>{message}</Text>}
        </>
      ) : (
        <>
          <Text style={s.body}>Browsing as a guest</Text>
          <Button title="Sign in" onPress={() => router.push("/login")} />
          <Button
            title="Create account"
            secondary
            onPress={() => router.push("/register")}
          />
        </>
      )}
      {error && <ErrorState message={error} />}
      <Text style={s.caption}>
        Saved designs:{" "}
        {r.mode === "local" ? "on this device only" : "cloud storage enabled"}.
        No anchors are restored across AR sessions. App data and local images
        are removed when you uninstall.
      </Text>
    </Page>
  );
}
