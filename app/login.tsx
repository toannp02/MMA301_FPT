import React from "react";
import { useLocalSearchParams } from "expo-router";
import { AuthScreen } from "../src/ui/screens/AuthScreen";
export default function Route() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  return <AuthScreen returnTo={returnTo} />;
}
