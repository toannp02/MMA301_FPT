import React from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { Page, Button } from "../src/ui/components";
import { styles } from "../src/ui/theme";
export default function NotFound() {
  return (
    <Page>
      <Text style={styles.title}>Page not found</Text>
      <Button title="Back to gallery" onPress={() => router.replace("/")} />
    </Page>
  );
}
