"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getMe, logout as logoutApi } from "../api/authApi";
import { healthCheck } from "@/lib/api";
import type { AuthUser } from "../types";

export type ServerStatus = "checking" | "warming" | "ready" | "error";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  serverStatus: ServerStatus;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
  retryConnection: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  serverStatus: "checking",
  logout: async () => {},
  refresh: async () => null,
  retryConnection: () => {},
});

const MAX_RETRIES = 4;
const RETRY_INTERVAL = 3_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");

  const warmUpAndRefresh = useCallback(async (): Promise<AuthUser | null> => {
    setServerStatus("checking");

    const alive = await healthCheck();
    if (alive) {
      setServerStatus("ready");
    } else {
      setServerStatus("warming");
      let success = false;
      for (let i = 0; i < MAX_RETRIES; i++) {
        await new Promise((r) => setTimeout(r, RETRY_INTERVAL));
        if (await healthCheck()) {
          success = true;
          break;
        }
      }
      if (!success) {
        setServerStatus("error");
        setIsLoading(false);
        return null;
      }
      setServerStatus("ready");
    }

    try {
      const me = await getMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retryConnection = useCallback(() => {
    setIsLoading(true);
    setUser(null);
    void warmUpAndRefresh();
  }, [warmUpAndRefresh]);

  useEffect(() => {
    void warmUpAndRefresh();
  }, [warmUpAndRefresh]);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, serverStatus, logout, refresh: warmUpAndRefresh, retryConnection }}
    >
      {children}
    </AuthContext.Provider>
  );
}
