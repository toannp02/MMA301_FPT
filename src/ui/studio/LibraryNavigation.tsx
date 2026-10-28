import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import { router } from "expo-router";
import { colors } from "../theme";
export function LibraryNavigation({
  active,
}: {
  active: "artworks" | "interiors" | "saved";
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.background,
        paddingVertical: 8,
      }}
    >
      {(
        [
          { id: "artworks", title: "Artworks", route: "/(tabs)" },
          { id: "interiors", title: "Interiors", route: "/spaces" },
          { id: "saved", title: "Saved", route: "/saved-walls" },
        ] as const
      ).map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          accessibilityState={{ selected: active === item.id }}
          onPress={() => router.replace(item.route)}
          style={{
            flex: 1,
            minHeight: 56,
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <Svg
            width={25}
            height={25}
            viewBox="0 0 24 24"
            fill="none"
            stroke={active === item.id ? colors.accent : colors.muted}
            strokeWidth={1.5}
          >
            {item.id === "artworks" ? (
              <>
                {[2, 13].flatMap((x) =>
                  [2, 13].map((y) => (
                    <Rect key={`${x}_${y}`} x={x} y={y} width={8} height={8} />
                  )),
                )}
              </>
            ) : item.id === "interiors" ? (
              <>
                <Path d="M12 2 2 8l10 6 10-6-10-6Z" />
                <Path d="m2 13 10 6 10-6M2 18l10 6 10-6" />
              </>
            ) : (
              <Path d="M12 21S2 15 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13Z" />
            )}
          </Svg>
          <Text
            style={{
              fontSize: 10,
              letterSpacing: 1,
              color: active === item.id ? colors.accent : colors.muted,
              textTransform: "uppercase",
            }}
          >
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
