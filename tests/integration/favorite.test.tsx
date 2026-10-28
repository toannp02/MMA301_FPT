import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { AppProviders } from "../../src/bootstrap/AppProviders";
import { createRepositories } from "../../src/bootstrap/repositories";
import { ArtworkDetailScreen } from "../../src/ui/screens/ArtworkDetailScreen";
import { FavoritesScreen } from "../../src/ui/screens/FavoritesScreen";
import {
  ok,
  fail,
  type Result,
  type UserProfile,
} from "../../src/domain/models";
import type {
  AuthRepository,
  FavoriteRepository,
} from "../../src/domain/repositories";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual(
    "@react-native-async-storage/async-storage/jest/async-storage-mock",
  ),
);
jest.mock("../../src/infra/firebase/client", () => ({
  createFirebaseClient: jest.fn(),
}));
jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    router: { push: jest.fn() },
    useFocusEffect: function useMockFocus(effect: () => void | (() => void)) {
      React.useEffect(effect, [effect]);
    },
  };
});
const profile: UserProfile = {
  uid: "A",
  email: "a@example.com",
  displayName: "Alice",
  avatarUrl: null,
  createdAt: "2026-10-27T00:00:00.000Z",
  updatedAt: "2026-10-27T00:00:00.000Z",
};
const auth: AuthRepository = {
  getCurrentUser: async () => profile,
  signIn: async () => ok(profile),
  signUp: async () => ok(profile),
  signOut: async () => ok(undefined),
  updateProfile: async () => ok(profile),
  observeAuth: (cb) => {
    cb(profile);
    return () => undefined;
  },
};
function setup(initiallyFavorite: boolean) {
  let finish: (value: Result<void>) => void = () => {
    throw new Error("Pending operation not initialized");
  };
  const pending = new Promise<Result<void>>((resolve) => {
    finish = resolve;
  });
  const favorites: FavoriteRepository = {
    list: async () =>
      ok(
        initiallyFavorite
          ? [{ artworkId: "art-01", createdAt: profile.createdAt }]
          : [],
      ),
    add: jest.fn(() => pending),
    remove: jest.fn(() => pending),
  };
  return { dependencies: { ...createRepositories(), auth, favorites }, finish };
}
test("core artwork details expose preview without favorite or account controls", async () => {
  const x = setup(true);
  const view = render(
    <AppProviders dependencies={x.dependencies}>
      <ArtworkDetailScreen id="art-01" />
    </AppProviders>,
  );
  expect(await view.findByLabelText("View in AR")).toBeTruthy();
  expect(view.queryByLabelText("Add to favorites")).toBeNull();
  expect(view.queryByLabelText("Remove from favorites")).toBeNull();
  expect(view.queryByLabelText("Sign in")).toBeNull();
});
test("failed removal restores an optimistically hidden favorite row", async () => {
  const x = setup(true);
  const view = render(
    <AppProviders dependencies={x.dependencies}>
      <FavoritesScreen />
    </AppProviders>,
  );
  expect(await view.findByLabelText("Open art-01")).toBeTruthy();
  fireEvent.press(view.getByLabelText("Remove favorite"));
  expect(view.queryByLabelText("Open art-01")).toBeNull();
  await act(async () => {
    x.finish(fail("offline", "Connection lost. Retry."));
  });
  expect(view.getByLabelText("Open art-01")).toBeTruthy();
});
