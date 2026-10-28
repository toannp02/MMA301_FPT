import React from "react";
import { Pressable, Text, View } from "react-native";
import type { LayoutKind } from "../../domain/spaces";
import { colors } from "../theme";
const presets: {
  name: string;
  kind: LayoutKind;
  count: number;
  columns: number;
}[] = [
  { name: "Single", kind: "single", count: 1, columns: 1 },
  { name: "Pair", kind: "pair", count: 2, columns: 2 },
  { name: "Stacked", kind: "stack", count: 2, columns: 1 },
  { name: "Row of 3", kind: "row", count: 3, columns: 3 },
  { name: "Column of 3", kind: "column", count: 3, columns: 1 },
  { name: "Grid of 4", kind: "grid", count: 4, columns: 2 },
  { name: "Grid of 6", kind: "grid", count: 6, columns: 3 },
  { name: "Grid of 9", kind: "grid", count: 9, columns: 3 },
];
export function LayoutPicker({
  kind,
  count,
  disabled,
  onChoose,
}: {
  kind: LayoutKind;
  count: number;
  disabled?: boolean;
  onChoose: (kind: LayoutKind, count: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {presets.map((p) => {
        const selected = kind === p.kind && count === p.count,
          rows = Math.ceil(p.count / p.columns);
        return (
          <Pressable
            key={p.name}
            accessibilityRole="button"
            accessibilityLabel={p.name}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChoose(p.kind, p.count)}
            style={{
              width: "23%",
              padding: 5,
              gap: 7,
              opacity: disabled ? 0.4 : 1,
            }}
          >
            <View
              style={{
                aspectRatio: 0.78,
                borderWidth: 2,
                borderColor: selected ? colors.accent : colors.line,
                padding: 5,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 3,
              }}
            >
              {Array.from({ length: p.count }, (_, i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${6 + ((i % p.columns) * 88) / p.columns}%`,
                    top: `${6 + (Math.floor(i / p.columns) * 88) / rows}%`,
                    width: `${88 / p.columns - 4}%`,
                    height: `${88 / rows - 4}%`,
                    backgroundColor: selected ? colors.accent : colors.muted,
                  }}
                />
              ))}
            </View>
            <Text
              style={{
                fontSize: 9,
                textAlign: "center",
                color: selected ? colors.accent : colors.muted,
                textTransform: "uppercase",
              }}
            >
              {p.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
