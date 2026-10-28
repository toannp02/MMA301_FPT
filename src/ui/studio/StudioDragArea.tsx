import React, { useMemo } from "react";
import { PanResponder, View, StyleSheet } from "react-native";
import { colors } from "../theme";
export function StudioDragArea({
  token,
  start,
  move,
  end,
  left,
  top,
  width = 48,
  height = 48,
  corner = false,
  square = false,
}: {
  token: string;
  start: (token: string) => void;
  move: (dx: number, dy: number) => void;
  end: (dx: number, dy: number) => void;
  left: number;
  top: number;
  width?: number;
  height?: number;
  corner?: boolean;
  square?: boolean;
}) {
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => start(token),
        onPanResponderMove: (_event, g) => move(g.dx, g.dy),
        onPanResponderTerminate: () => end(0, 0),
        onPanResponderRelease: (_event, g) => end(g.dx, g.dy),
      }),
    [token, start, move, end],
  );
  return (
    <View
      accessibilityLabel={
        square
          ? `Resize artwork corner ${Number(token.split(":")[2]) + 1}`
          : corner
            ? `Wall corner ${Number(token.split(":")[1]) + 1}`
            : "Move or swipe artwork"
      }
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        justifyContent: "center",
        alignItems: "center",
      }}
      {...pan.panHandlers}
    >
      {corner && (
        <View
          style={[
            styles.corner,
            square
              ? { width: 10, height: 10, borderRadius: 0, borderWidth: 0 }
              : undefined,
          ]}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  corner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    borderColor: "#111315",
    borderWidth: 3,
  },
});
