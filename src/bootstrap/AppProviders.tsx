import React, { createContext, useContext, useState } from "react";
import { createRepositories, type Repositories } from "./repositories";
interface AppContextValue {
  repositories: Repositories;
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
}
const AppContext = createContext<AppContextValue | null>(null);
export function AppProviders({
  children,
  dependencies,
}: React.PropsWithChildren<{ dependencies?: Repositories }>) {
  const [repositories] = useState(() => dependencies ?? createRepositories());
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  return (
    <AppContext.Provider
      value={{ repositories, activeRoomId, setActiveRoomId }}
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
