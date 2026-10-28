import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { ArtAppearance } from "../../domain/spaces";
import { frameProfiles } from "../../features/studio/styleEditing";
import { colors, styles as s } from "../theme";
export function FramePicker({
  appearance,
  onChange,
}: {
  appearance: ArtAppearance;
  onChange: (value: Partial<ArtAppearance>) => void;
}) {
  return (
    <ScrollView horizontal contentContainerStyle={{ gap: 10 }}>
      {frameProfiles.map((profile) => {
        const selected =
          appearance.frameProfile === profile.appearance.frameProfile;
        return (
          <Pressable
            key={profile.name}
            accessibilityRole="button"
            accessibilityLabel={`${profile.name} frame`}
            accessibilityState={{ selected }}
            onPress={() => onChange(profile.appearance)}
            style={{
              width: 86,
              gap: 8,
              padding: 6,
              borderWidth: 1,
              borderColor: selected ? colors.accent : colors.line,
              borderRadius: 8,
            }}
          >
            <View
              style={{
                height: 76,
                padding: profile.name === "Classic" ? 9 : 4,
                backgroundColor:
                  profile.name === "Bare"
                    ? colors.surface
                    : profile.name === "Float"
                      ? "#9b744c"
                      : profile.name === "Canvas"
                        ? "#ddd8ce"
                        : "#101010",
              }}
            >
              <View
                style={{
                  flex: 1,
                  padding: profile.name === "Classic" ? 8 : 2,
                  backgroundColor: "#eee8dd",
                }}
              >
                <View style={{ flex: 1, backgroundColor: "#6d8587" }} />
              </View>
            </View>
            <Text
              style={[
                s.caption,
                {
                  textAlign: "center",
                  color: selected ? colors.accent : colors.text,
                },
              ]}
            >
              {profile.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
