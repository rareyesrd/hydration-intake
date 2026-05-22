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
import { resetOfflineQueueForSignOut } from "@/services/pwa-sync-service";
import { startHydrationSync, stopHydrationSync } from "@/services/hydration-sync";
import {
  startUserHydrationProfileSync,
  stopUserHydrationProfileSync
} from "@/services/user-hydration-profile-sync";
import { ensureUserHydrationDocument } from "@/services/user-hydration-profile-service";
import { useHydrationProfileStore } from "@/store/hydration-profile-store";
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
          startUserHydrationProfileSync(nextUser.uid);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to start hydration sync.";
          useHydrationStore.getState().failRemoteSync(message);
          useHydrationProfileStore.getState().failRemoteSync(message);
        }
        void persistUserProfile(nextUser);
        void ensureUserHydrationDocument(
          nextUser.uid,
          nextUser.displayName ?? "Athlete",
          nextUser.email ?? "",
          nextUser.photoURL ?? undefined
        );
        return;
      }

      stopHydrationSync();
      stopUserHydrationProfileSync();
    });

    return () => {
      active = false;
      stopHydrationSync();
      stopUserHydrationProfileSync();
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
    stopUserHydrationProfileSync();
    resetOfflineQueueForSignOut();
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
