"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { User } from "firebase/auth";

import { logHydrationSync } from "@/lib/hydration-sync-log";
import {
  handleGoogleRedirectResult,
  listenToAuthState,
  persistUserProfile,
  signInWithGoogle,
  signOutUser
} from "@/services/auth-service";
import { startHydrationSync, stopHydrationSync } from "@/services/hydration-sync";
import { useHydrationStore } from "@/store/hydration-store";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isSigningIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    let active = true;

    void handleGoogleRedirectResult().catch(() => null);

    const unsubscribe = listenToAuthState((nextUser) => {
      if (!active) {
        return;
      }

      logHydrationSync("auth", "Auth state changed", {
        uid: nextUser?.uid ?? null,
        email: nextUser?.email ?? null
      });

      setUser(nextUser);
      setIsLoading(false);
      useHydrationStore.getState().setSessionUser(nextUser?.uid ?? null);

      if (nextUser) {
        try {
          startHydrationSync(nextUser.uid);
        } catch (error) {
          useHydrationStore
            .getState()
            .failRemoteSync(
              error instanceof Error
                ? error.message
                : "Failed to start hydration sync."
            );
        }
        void persistUserProfile(nextUser);
        return;
      }

      stopHydrationSync();
    });

    return () => {
      active = false;
      stopHydrationSync();
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async () => {
    setIsSigningIn(true);

    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    stopHydrationSync();
    await signOutUser();
    setUser(null);
    useHydrationStore.getState().setSessionUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isSigningIn,
      signIn,
      signOut
    }),
    [isLoading, isSigningIn, signIn, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
