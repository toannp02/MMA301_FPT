import React, { useEffect } from "react";
import { Text } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { AuthScreen } from "../../src/ui/screens/AuthScreen";
import { AppProviders, useApp } from "../../src/bootstrap/AppProviders";
import { createRepositories } from "../../src/bootstrap/repositories";
import { ok, type UserProfile } from "../../src/domain/models";
import type { AuthRepository } from "../../src/domain/repositories";
// Jest must load the native-module mock within its hoisted factory.

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../../src/infra/firebase/client", () => ({
  createFirebaseClient: jest.fn(),
}));
jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  useFocusEffect: jest.fn(),
}));
test("guest auth form is accessible and presents validation errors", async () => {
  const view = render(
    <AppProviders dependencies={createRepositories()}>
      <AuthScreen />
    </AppProviders>,
  );
  expect(view.getByLabelText("Email")).toBeTruthy();
  expect(view.getByLabelText("Password")).toBeTruthy();
  fireEvent.press(view.getByLabelText("Sign in"));
  expect(await view.findByText("Enter a valid email address.")).toBeTruthy();
  expect(view.getByLabelText("Continue as guest")).toBeTruthy();
});
test("successful authentication returns to captured draft without discarding it", async () => {
  const profile: UserProfile = {
    uid: "A",
    email: "a@example.com",
    displayName: "Alice",
    avatarUrl: null,
    createdAt: "2026-10-27T00:00:00.000Z",
    updatedAt: "2026-10-27T00:00:00.000Z",
  };
  const auth: AuthRepository = {
    getCurrentUser: async () => null,
    signIn: jest.fn(async () => ok(profile)),
    signUp: jest.fn(async () => ok(profile)),
    signOut: jest.fn(async () => ok(undefined)),
    updateProfile: jest.fn(async () => ok(profile)),
    observeAuth: (cb) => {
      cb(null);
      return () => undefined;
    },
  };
  function DraftProbe() {
    const { draft, setDraft, user } = useApp();
    useEffect(() => {
      setDraft({
        id: "draft-one",
        userId: "guest",
        artworkId: "art-01",
        sourceKind: "catalog",
        sourceImageUri: null,
        capturedImageUri: "file:///tmp.jpg",
        imageStoragePath: null,
        storageMode: "local",
        widthCm: 60,
        heightCm: 90,
        scaleFactor: 1,
        frameStyle: "none",
        createdAt: "2026-10-27T00:00:00.000Z",
      });
    }, [setDraft]);
    return <Text>{`${draft?.id ?? "none"}:${user?.uid ?? "guest"}`}</Text>;
  }
  const view = render(
    <AppProviders dependencies={{ ...createRepositories(), auth }}>
      <AuthScreen returnTo="/capture-preview" />
      <DraftProbe />
    </AppProviders>,
  );
  fireEvent.changeText(view.getByLabelText("Email"), "a@example.com");
  fireEvent.changeText(view.getByLabelText("Password"), "longpassword");
  fireEvent.press(view.getByLabelText("Sign in"));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith("/capture-preview"),
  );
  expect(view.getByText("draft-one:A")).toBeTruthy();
});

