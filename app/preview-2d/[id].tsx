import { useLocalSearchParams } from "expo-router";
import { Preview2DCameraScreen } from "../../src/ui/screens/Preview2DCameraScreen";
export default function PreviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Preview2DCameraScreen id={id} />;
}
