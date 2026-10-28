import React, { createContext, useContext, useEffect, useState } from "react";
import type { SavedDesign, UserProfile } from "../domain/models";
import { createRepositories, type Repositories } from "./repositories";
interface AppContextValue {
  repositories: Repositories;
  user: UserProfile | null;
  authReady: boolean;
  setUser: (user: UserProfile | null) => void;
  draft: SavedDesign | null;
  setDraft: (draft: SavedDesign | null) => void;
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
}
const AppContext = createContext<AppContextValue | null>(null);
export function AppProviders({
  children,
  dependencies,
}: React.PropsWithChildren<{ dependencies?: Repositories }>) {
  const [repositories] = useState(() => dependencies ?? createRepositories());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [draft, setDraft] = useState<SavedDesign | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  useEffect(
    () =>
      repositories.auth.observeAuth((u) => {
        setUser(u);
        setAuthReady(true);
      }),
    [repositories],
  );
  return (
    <AppContext.Provider
      value={{
        repositories,
        user,
        setUser,
        authReady,
        draft,
        setDraft,
        activeRoomId,
        setActiveRoomId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppProviders missing");
  return ctx;
}
