import React, { useState } from "react";
import { View, Text } from "react-native";
import type { Artwork } from "../../domain/models";
import { emptyQuery, type ArtworkQuery } from "../../features/studio/discovery";
import { Button, Input } from "../components";
import { styles as s } from "../theme";
export function ArtworkFilters({
  query,
  onChange,
  items,
  compact = false,
}: {
  query: ArtworkQuery;
  onChange: (query: ArtworkQuery) => void;
  items: Artwork[];
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      {(!compact || expanded) && (
        <Input
          label="Search artworks"
          value={query.text}
          onChangeText={(text) => onChange({ ...query, text })}
        />
      )}
      <Button
        title={
          expanded
            ? "Hide filters"
            : compact
              ? "Search / filter artworks"
              : "Filter artworks"
        }
        secondary
        onPress={() => setExpanded((value) => !value)}
      />
      {expanded && (
        <>
          <Text style={s.caption}>Orientation</Text>
          <View style={s.row}>
            {(["all", "portrait", "landscape", "square"] as const).map(
              (orientation) => (
                <Button
                  key={orientation}
                  title={orientation}
                  secondary={query.orientation !== orientation}
                  onPress={() => onChange({ ...query, orientation })}
                />
              ),
            )}
          </View>
          <Input
            label="Maximum artwork width (cm)"
            keyboardType="decimal-pad"
            value={query.maxWidthCm}
            onChangeText={(maxWidthCm) => onChange({ ...query, maxWidthCm })}
          />
          <Text style={s.caption}>Collection category</Text>
          <View style={s.row}>
            {["all", ...new Set(items.map((art) => art.categoryId))].map(
              (category) => (
                <Button
                  key={category}
                  title={category}
                  secondary={query.category !== category}
                  onPress={() => onChange({ ...query, category })}
                />
              ),
            )}
          </View>
          <Button
            title="Clear filters"
            secondary
            onPress={() => onChange({ ...emptyQuery })}
          />
        </>
      )}
    </View>
  );
}
