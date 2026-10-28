import React, { memo, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import type { WallSpace } from "../../domain/spaces";
import { SpaceCanvas } from "./SpaceCanvas";

/** Saved composites use a small raster; old designs retain a composed fallback. */
export const RoomPreview = memo(function RoomPreview({
  space,
}: {
  space: WallSpace;
}) {
  const [width, setWidth] = useState(0);
  const ratio = space.room.width / space.room.height;
  return (
    <View
      pointerEvents="none"
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        setWidth((current) => (current === next ? current : next));
      }}
      style={{
        width: "100%",
        aspectRatio: 1,
        overflow: "hidden",
        backgroundColor: "#08090a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {space.previewUri ? (
        <Image
          source={{ uri: space.previewUri }}
          cachePolicy="memory-disk"
          contentFit="contain"
          style={{ width: "100%", height: "100%" }}
          accessibilityLabel={`Saved design ${space.name}`}
        />
      ) : width > 0 ? (
        <SpaceCanvas
          space={space}
          width={Math.min(width, width * ratio)}
          height={Math.min(width, width / ratio)}
        />
      ) : null}
    </View>
  );
});
