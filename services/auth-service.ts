"use client";

import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";
import type { UserProfile } from "@/types/hydration";

const USERS_COLLECTION = "users";
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export function listenToAuthState(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();

  if (!auth) {
    callback(null);
    return () => undefined;
  }

  void setPersistence(auth, browserLocalPersistence);
  return onAuthStateChanged(auth, callback);
}

export async function handleGoogleRedirectResult() {
  const auth = getFirebaseAuth();

  if (!auth) {
    return null;
  }

  const result = await getRedirectResult(auth);

  if (result?.user) {
    await persistUserProfile(result.user);
  }

  return result?.user ?? null;
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error("Firebase is not configured.");
  }

  await setPersistence(auth, browserLocalPersistence);

  try {
    const result = await signInWithPopup(auth, googleProvider);
    await persistUserProfile(result.user);
    return result.user;
  } catch (error) {
    if (isPopupFallbackError(error)) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw error;
  }
}

export async function signOutUser() {
  const auth = getFirebaseAuth();

  if (!auth) {
    return;
  }

  await signOut(auth);
}

export async function persistUserProfile(user: User) {
  const db = getFirebaseDb();

  if (!db || !user.email) {
    return;
  }

  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snapshot = await getDoc(ref);
  const now = new Date().toISOString();
  const profile: UserProfile = {
    userId: user.uid,
    displayName: user.displayName ?? "Athlete",
    email: user.email,
    photoURL: user.photoURL ?? undefined,
    provider: "google",
    createdAt: snapshot.exists()
      ? String(snapshot.data().createdAt ?? now)
      : now,
    updatedAt: now
  };

  await setDoc(
    ref,
    {
      ...profile,
      updatedAt: serverTimestamp(),
      createdAt: snapshot.exists()
        ? snapshot.data().createdAt
        : serverTimestamp()
    },
    { merge: true }
  );
}

function isPopupFallbackError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    ["auth/popup-blocked", "auth/popup-closed-by-user", "auth/cancelled-popup-request"].includes(
      error.code
    )
  );
}
