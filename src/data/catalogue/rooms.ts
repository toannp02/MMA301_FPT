import { Asset } from "expo-asset";
export const sampleRooms = [
  {
    id: "living",
    name: "Living room",
    asset: require("../../../assets/rooms/living.png"),
  },
  {
    id: "bedroom",
    name: "Bedroom",
    asset: require("../../../assets/rooms/bedroom.png"),
  },
  {
    id: "gallery",
    name: "Gallery",
    asset: require("../../../assets/rooms/gallery.png"),
  },
].map((room) => ({
  ...room,
  uri: Asset.fromModule(room.asset).uri,
  width: 1280,
  height: 960,
}));
