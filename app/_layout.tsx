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
        />
      </AppProviders>
    </SafeAreaProvider>
  );
}
