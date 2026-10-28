import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ArtworkDetailScreen } from "../../src/ui/screens/ArtworkDetailScreen";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ArtworkDetailScreen id={typeof id === "string" ? id : ""} />;
}
