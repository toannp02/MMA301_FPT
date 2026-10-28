import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button, Input } from "../components";
import { styles as s } from "../theme";
export function ArtworkDimensions({
  width,
  height,
  onApply,
}: {
  width: number;
  height: number;
  onApply: (width: number, height: number) => void;
}) {
  const [w, setW] = useState(width.toFixed(1)),
    [h, setH] = useState(height.toFixed(1)),
    [locked, setLocked] = useState(true),
    [error, setError] = useState<string | null>(null);
  const number = (value: string) => Number(value.trim().replace(",", "."));
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.heading}>Artwork dimensions</Text>
      <Text style={s.caption}>
        Width and height in cm. Oversized artwork fits inside the wall.
      </Text>
      <Input
        label="Artwork width (cm)"
        keyboardType="decimal-pad"
        value={w}
        onChangeText={(value) => {
          setW(value);
          if (locked && number(value) > 0)
            setH(((number(value) * height) / width).toFixed(1));
        }}
      />
      <Input
        label="Artwork height (cm)"
        keyboardType="decimal-pad"
        value={h}
        onChangeText={(value) => {
          setH(value);
          if (locked && number(value) > 0)
            setW(((number(value) * width) / height).toFixed(1));
        }}
      />
      <Button
        title={locked ? "Keep proportions on" : "Keep proportions off"}
        secondary
        onPress={() => setLocked((value) => !value)}
      />
      <Button
        title="Apply artwork size"
        onPress={() => {
          const values = [number(w), number(h)];
          if (
            !values.every((n) => Number.isFinite(n) && n >= 0.1 && n <= 1000)
          ) {
            setError("Enter dimensions between 0.1 and 1000 cm.");
            return;
          }
          setError(null);
          onApply(values[0], values[1]);
        }}
      />
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}
