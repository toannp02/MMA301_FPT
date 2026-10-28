import React from "react";
import { Text, View, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import { colors, styles as s } from "../theme";
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
export function StudioControl({
  label,
  value,
  min,
  max,
  onChange,
  percent = false,
  neutral,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  percent?: boolean;
  neutral?: number;
}) {
  const display =
    neutral !== undefined && Math.abs(value - neutral) < 0.005
      ? "Neutral"
      : percent
        ? `${Math.round(value * 100)}%`
        : String(Math.round(value * 100) / 100);
  return (
    <View>
      <Text style={s.caption}>
        {label}: {display}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => onChange(clamp(value - (max - min) / 100, min, max))}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={s.heading}>−</Text>
        </Pressable>
        <Slider
          style={{ flex: 1, minHeight: 44 }}
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value, text: display }}
          minimumValue={min}
          maximumValue={max}
          value={value}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.line}
          thumbTintColor={colors.accent}
          onValueChange={onChange}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={() => onChange(clamp(value + (max - min) / 100, min, max))}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={s.heading}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
