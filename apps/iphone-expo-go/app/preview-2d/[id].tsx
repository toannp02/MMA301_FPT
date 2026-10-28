import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Preview2DCameraScreen } from "../../src/Preview2DCameraScreen";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <><Stack.Screen options={{ headerShown: false }} /><Preview2DCameraScreen id={typeof id === "string" ? id : ""} /></>;
}
