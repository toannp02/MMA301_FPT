import { useLocalSearchParams } from "expo-router";
import { ViewOnRoomScreen } from "../../src/ui/screens/ViewOnRoomScreen";
export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ViewOnRoomScreen artworkId={typeof id === "string" ? id : ""} />;
}
