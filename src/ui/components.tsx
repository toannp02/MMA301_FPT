import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, styles as s } from "./theme";
export function Page({
  children,
  footer,
}: React.PropsWithChildren<{ footer?: React.ReactNode }>) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.page}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {footer}
    </SafeAreaView>
  );
}
export function Button({
  title,
  onPress,
  disabled,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: secondary ? colors.surface : colors.accent,
        borderColor: colors.line,
        borderWidth: secondary ? 1 : 0,
        opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: secondary ? colors.text : colors.onAccent,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Input({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.body}>{label}</Text>
      <TextInput
        keyboardAppearance="dark"
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={s.input}
        {...props}
      />
    </View>
  );
}
export function Loading() {
  return (
    <View accessibilityLabel="Loading" style={{ padding: 32 }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <View style={s.card}>
      <Text accessibilityRole="alert" style={s.error}>
        {message}
      </Text>
      {retry && <Button title="Retry" onPress={retry} secondary />}
    </View>
  );
}
export function Empty({ message }: { message: string }) {
  return <Text style={s.caption}>{message}</Text>;
}
export function ArtImage({
  uri,
  ratio = 2 / 3,
  onPress,
  accessibilityLabel = "View artwork",
}: {
  uri: string;
  ratio?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <View
        style={{
          aspectRatio: ratio,
          backgroundColor: colors.line,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={s.caption}>Image unavailable</Text>
        <Button
          title="Reload image"
          secondary
          onPress={() => setFailed(false)}
        />
      </View>
    );
  const image = (
    <Image
      accessibilityLabel="Artwork preview"
      source={{ uri }}
      contentFit="contain"
      cachePolicy="disk"
      onError={() => setFailed(true)}
      style={{
        width: "100%",
        aspectRatio: ratio,
        borderRadius: 12,
        backgroundColor: colors.surface,
      }}
    />
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
    >
      {image}
    </Pressable>
  ) : (
    image
  );
}
