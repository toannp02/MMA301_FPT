import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ARScreen } from "../../src/ui/screens/ARScreen";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ARScreen id={typeof id === "string" ? id : ""} />;
}
