import React, { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../bootstrap/AppProviders";
import { authenticate } from "../../features/auth/authUseCases";
import { Page, Input, Button, ErrorState } from "../components";
import { styles as s } from "../theme";
export function AuthScreen({
  register = false,
  returnTo,
}: {
  register?: boolean;
  returnTo?: string;
}) {
  const { repositories: r, setUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await authenticate(
        r.auth,
        email,
        password,
        register ? name : undefined,
      );
      if (result.ok) {
        setUser(result.data);
        if (returnTo === "/capture-preview") router.replace("/capture-preview");
        else if (returnTo?.startsWith("/artwork/"))
          router.replace({
            pathname: "/artwork/[id]",
            params: { id: returnTo.split("/")[2] },
          });
        else router.replace("/(tabs)/profile");
      } else setError(result.error.message);
    } catch {
      setError("Sign-in failed. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Text style={s.caption}>ARTSPACE AR</Text>
      <Text style={s.title}>
        {register ? "Create an account" : "Welcome back"}
      </Text>
      <Text style={s.body}>
        Keep your favorites together. AR previews are always open to guests.
      </Text>
      {r.demo && (
        <Text style={s.caption}>
          Account services need Firebase configuration. Browse and local saves
          remain available.
        </Text>
      )}
      {register && (
        <Input
          label="Display name"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          maxLength={60}
        />
      )}
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        maxLength={254}
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={register ? "new-password" : "current-password"}
        maxLength={128}
      />
      {error && <ErrorState message={error} />}
      <Button
        title={busy ? "Please wait…" : register ? "Create account" : "Sign in"}
        disabled={busy}
        onPress={() => {
          void submit();
        }}
      />
      <Button
        title={register ? "Already registered? Sign in" : "Create account"}
        secondary
        onPress={() =>
          router.replace({
            pathname: register ? "/login" : "/register",
            params: { returnTo: returnTo ?? "" },
          })
        }
      />
      <Button
        title="Continue as guest"
        secondary
        onPress={() => router.replace("/(tabs)")}
      />
    </Page>
  );
}
