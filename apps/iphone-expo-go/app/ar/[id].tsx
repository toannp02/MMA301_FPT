import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ARUnavailableScreen } from "../../src/ARUnavailableScreen";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ARUnavailableScreen id={typeof id === "string" ? id : ""} />;
}
