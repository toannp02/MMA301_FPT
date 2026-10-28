import React from "react";
import { useLocalSearchParams } from "expo-router";
import { DesignDetailScreen } from "../../src/ui/screens/DesignScreens";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DesignDetailScreen id={typeof id === "string" ? id : ""} />;
}
