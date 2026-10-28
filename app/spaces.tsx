import { useLocalSearchParams } from "expo-router";
import { SpacesScreen } from "../src/ui/screens/SpacesScreen";
export default function Route() {
  const { artworkId, add } = useLocalSearchParams<{
    artworkId?: string;
    add?: string;
  }>();
  return (
    <SpacesScreen
      artworkId={typeof artworkId === "string" ? artworkId : undefined}
      initialAdd={add === "1"}
    />
  );
}
