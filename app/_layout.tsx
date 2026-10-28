import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProviders } from "../src/bootstrap/AppProviders";
import { colors } from "../src/ui/theme";
import { StatusBar } from "expo-status-bar";
export { ErrorBoundary } from "expo-router";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="ar/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="artwork/[id]"
            options={{ title: "The collection" }}
          />
          <Stack.Screen name="capture-preview" options={{ title: "Preview" }} />
          <Stack.Screen
            name="design/[id]"
            options={{ title: "Saved design" }}
          />
          <Stack.Screen name="login" options={{ title: "Sign in" }} />
          <Stack.Screen
            name="import-artwork"
            options={{ title: "Import artwork" }}
          />
          <Stack.Screen name="register" options={{ title: "Join ArtSpace" }} />
        </Stack>
      </AppProviders>
    </SafeAreaProvider>
  );
}
