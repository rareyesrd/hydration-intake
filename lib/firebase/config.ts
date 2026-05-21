import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAnalytics,
  isSupported,
  type Analytics
} from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getAuth,
  type Auth,
} from "firebase/auth";

import { env, hasFirebaseConfig } from "@/lib/env";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let auth: Auth | null = null;

export function getFirebaseApp() {
  if (!hasFirebaseConfig) {
    return null;
  }

  if (!app) {
    app = getApps().length
      ? getApp()
      : initializeApp({
          apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
          measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
        });
  }

  return app;
}

export function getFirebaseDb() {
  const firebaseApp = getFirebaseApp();

  if (!firebaseApp) {
    return null;
  }

  if (!db) {
    db = getFirestore(firebaseApp);
  }

  return db;
}

export function getFirebaseAuth() {
  const firebaseApp = getFirebaseApp();

  if (!firebaseApp) {
    return null;
  }

  if (!auth) {
    auth = getAuth(firebaseApp);
  }

  return auth;
}

export function getCurrentFirebaseUser() {
  const firebaseAuth = getFirebaseAuth();

  return firebaseAuth?.currentUser ?? null;
}

export async function getFirebaseAnalytics() {
  const firebaseApp = getFirebaseApp();

  if (!firebaseApp || typeof window === "undefined") {
    return null;
  }

  if (!analytics && (await isSupported())) {
    analytics = getAnalytics(firebaseApp);
  }

  return analytics;
}
