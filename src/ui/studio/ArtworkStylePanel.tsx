import React, { useState } from "react";
import { Text, View } from "react-native";
import type {
  ArtAppearance,
  PlacedArtwork,
  WallSurface,
  StudioFrame,
} from "../../domain/spaces";
import { defaultAppearance } from "../../domain/spaces";
import { Button } from "../components";
import { styles as s } from "../theme";
import { FramePicker } from "./FramePicker";
import { StudioControl as Control } from "./StudioControl";
export function ArtworkStylePanel({
  selected,
  wall,
  onChange,
  onToggleOcclusion,
  onMask,
  onDone,
}: {
  selected: PlacedArtwork;
  wall: WallSurface;
  onChange: (value: Partial<ArtAppearance>) => void;
  onToggleOcclusion: () => void;
  onMask: () => void;
  onDone: () => void;
}) {
  const [styleTab, setStyleTab] = useState<"Frame" | "Image" | "Light">(
    "Image",
  );
  return (
    <>
      <View style={s.row}>
        {(["Frame", "Image", "Light"] as const).map((section) => (
          <Button
            key={section}
            title={section}
            secondary={styleTab !== section}
            onPress={() => setStyleTab(section)}
          />
        ))}
      </View>
      {styleTab === "Frame" && (
        <>
          <FramePicker appearance={selected.appearance} onChange={onChange} />
          <View style={s.row}>
            {(["none", "black", "white", "wood"] as StudioFrame[]).map(
              (frame) => (
                <Button
                  key={frame}
                  title={frame}
                  secondary={selected.appearance.frame !== frame}
                  onPress={() => onChange({ frame, frameProfile: undefined })}
                />
              ),
            )}
          </View>
          <Control
            label="Frame width (cm)"
            value={selected.appearance.frameCm}
            min={0}
            max={10}
            onChange={(frameCm) => onChange({ frameCm })}
          />
          <Control
            label="Mount width (cm)"
            value={selected.appearance.mountCm}
            min={0}
            max={20}
            onChange={(mountCm) => onChange({ mountCm })}
          />
          <Button
            title={selected.appearance.glazing ? "Glazing on" : "Glazing off"}
            secondary
            onPress={() => onChange({ glazing: !selected.appearance.glazing })}
          />
        </>
      )}
      {styleTab === "Image" && (
        <>
          <View style={s.row}>
            <Button
              title="Reset image"
              secondary
              onPress={() =>
                onChange({
                  brightness: 0,
                  contrast: 1,
                  saturation: 1,
                  warmth: 0,
                  hue: 0,
                })
              }
            />
            {wall.photoAssist && (
              <Button
                title="Match room tone"
                secondary
                onPress={() =>
                  onChange({
                    brightness: wall.photoAssist?.brightness ?? 0,
                    warmth: wall.photoAssist?.warmth ?? 0,
                  })
                }
              />
            )}
          </View>
          <Control
            label="Luminance"
            neutral={0}
            value={selected.appearance.brightness}
            min={-0.5}
            max={0.5}
            onChange={(brightness) => onChange({ brightness })}
          />
          <Control
            label="Contrast"
            neutral={1}
            value={selected.appearance.contrast}
            min={0.5}
            max={1.5}
            onChange={(contrast) => onChange({ contrast })}
          />
          <Control
            label="Saturation"
            neutral={1}
            value={selected.appearance.saturation}
            min={0}
            max={2}
            onChange={(saturation) => onChange({ saturation })}
          />
          <Control
            label="Warmth"
            neutral={0}
            value={selected.appearance.warmth}
            min={-1}
            max={1}
            onChange={(warmth) => onChange({ warmth })}
          />
          <Control
            label="Hue"
            neutral={0}
            value={selected.appearance.hue}
            min={-180}
            max={180}
            onChange={(hue) => onChange({ hue })}
          />
        </>
      )}
      {styleTab === "Light" && (
        <>
          <Button
            title="Reset light"
            secondary
            onPress={() =>
              onChange({
                shadow: defaultAppearance.shadow,
                shadowOffset: 1,
                shadowAngle: 56.31,
                shadowSoftness: 8,
              })
            }
          />
          <Control
            label="Shadow angle (degrees)"
            min={-180}
            max={180}
            value={selected.appearance.shadowAngle ?? 56.31}
            onChange={(shadowAngle) => onChange({ shadowAngle })}
          />
          <Control
            label="Shadow softness"
            min={0}
            max={40}
            value={selected.appearance.shadowSoftness ?? 8}
            onChange={(shadowSoftness) => onChange({ shadowSoftness })}
          />
          <Control
            label="Artwork depth (cm)"
            value={selected.appearance.depthCm ?? 1.8}
            min={0}
            max={10}
            onChange={(depthCm) => onChange({ depthCm })}
          />
          <Control
            label="Shadow intensity"
            percent
            value={selected.appearance.shadow}
            min={0}
            max={1}
            onChange={(shadow) => onChange({ shadow })}
          />
          <Control
            label="Shadow offset"
            percent
            value={selected.appearance.shadowOffset ?? 1}
            min={0}
            max={3}
            onChange={(shadowOffset) => onChange({ shadowOffset })}
          />
          <Button
            title={
              wall.occlusionEnabled !== false ? "Occlusion on" : "Occlusion off"
            }
            secondary
            onPress={onToggleOcclusion}
          />
          <Text style={s.caption}>
            {wall.occlusionMaskUri
              ? "Photo-assisted foreground mask. Review its edges for your photo."
              : "No automatic mask for this photo. Paint foreground objects to keep them in front of the art."}
          </Text>
          <Button title="Adjust foreground mask" secondary onPress={onMask} />
        </>
      )}
      <Button title="Done" onPress={onDone} />
    </>
  );
}
