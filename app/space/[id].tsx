import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SpaceEditorScreen } from "../../src/ui/screens/SpaceEditorScreen";
export default function Route() {
  const { id, artworkId } = useLocalSearchParams<{
    id: string;
    artworkId?: string;
  }>();
  return (
    <SpaceEditorScreen
      id={typeof id === "string" ? id : ""}
      artworkId={typeof artworkId === "string" ? artworkId : undefined}
    />
  );
}
