import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type DocumentData,
  type Unsubscribe
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/config";
import { sanitizeForFirestore } from "@/lib/firestore-sanitize";
import { logHydrationSync, logHydrationSyncError } from "@/lib/hydration-sync-log";
import { createDefaultUserHydrationFields } from "@/lib/hydration-profile-defaults";
import type {
  AthleteHydrationProfile,
  CalculatedHydrationTarget,
  HydrationDayMode,
  LifestyleFactors,
  OnboardingDraft,
  UserHydrationDocument
} from "@/types/athlete-hydration-profile";
import { DEFAULT_TRAINING_DAY_BOOST_L } from "@/lib/hydration-constants";
import { PROFILE_VERSION } from "@/types/athlete-hydration-profile";

const USERS_COLLECTION = "users";

export class UserHydrationProfileError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "UserHydrationProfileError";
    this.cause = cause;
  }
}

function userDoc(db: ReturnType<typeof getFirebaseDb>, userId: string) {
  if (!db) {
    throw new UserHydrationProfileError("Firestore is not configured.");
  }

  return doc(db, USERS_COLLECTION, userId);
}

function toUserHydrationDocument(
  userId: string,
  data: DocumentData | undefined
): UserHydrationDocument | null {
  if (!data) {
    return null;
  }

  return {
    userId,
    displayName: String(data.displayName ?? "Athlete"),
    email: String(data.email ?? ""),
    photoURL: typeof data.photoURL === "string" ? data.photoURL : undefined,
    provider: "google",
    createdAt: String(data.createdAt ?? new Date().toISOString()),
    updatedAt: String(data.updatedAt ?? new Date().toISOString()),
    profileVersion: Number(data.profileVersion ?? PROFILE_VERSION),
    onboardingCompleted: Boolean(data.onboardingCompleted),
    onboardingStep: Number(data.onboardingStep ?? 1),
    hydrationProfile: data.hydrationProfile as AthleteHydrationProfile | undefined,
    lifestyleFactors: data.lifestyleFactors as LifestyleFactors | undefined,
    calculatedHydrationTarget: data.calculatedHydrationTarget as
      | CalculatedHydrationTarget
      | undefined,
    hydrationGoal: Number(data.hydrationGoal ?? 11),
    dynamicGoalEnabled: data.dynamicGoalEnabled !== false,
    manualGoal:
      typeof data.manualGoal === "number" ? Number(data.manualGoal) : undefined,
    athleteModeEnabled: Boolean(data.athleteModeEnabled),
    workoutDayBoostLiters: Number(
      data.workoutDayBoostLiters ?? DEFAULT_TRAINING_DAY_BOOST_L
    ),
    activeDayMode: (data.activeDayMode as HydrationDayMode | undefined) ?? "standard_day"
  };
}

export async function loadUserHydrationDocument(userId: string) {
  const db = getFirebaseDb();

  if (!db) {
    return null;
  }

  const snapshot = await getDoc(userDoc(db, userId));
  return toUserHydrationDocument(userId, snapshot.data());
}

export function subscribeUserHydrationDocument(
  userId: string,
  handlers: {
    onDocument: (document: UserHydrationDocument | null) => void;
    onError: (error: Error) => void;
  }
): Unsubscribe {
  const db = getFirebaseDb();

  if (!db) {
    handlers.onError(new UserHydrationProfileError("Firestore is not configured."));
    return () => undefined;
  }

  logHydrationSync("snapshot", `Subscribing to user hydration profile ${userId}`);

  return onSnapshot(
    userDoc(db, userId),
    (snapshot) => {
      const document = toUserHydrationDocument(userId, snapshot.data());
      logHydrationSync("snapshot", `User hydration profile snapshot`, {
        userId,
        exists: snapshot.exists(),
        onboardingCompleted: document?.onboardingCompleted ?? false,
        step: document?.onboardingStep ?? 1
      });
      handlers.onDocument(document);
    },
    (error) => {
      logHydrationSyncError("snapshot", "User hydration profile snapshot failed", error);
      handlers.onError(error);
    }
  );
}

export async function saveUserHydrationDocument(
  userId: string,
  payload: Partial<UserHydrationDocument>
) {
  const db = getFirebaseDb();

  if (!db) {
    throw new UserHydrationProfileError("Firestore is not configured.");
  }

  const existing = await getDoc(userDoc(db, userId));
  const now = new Date().toISOString();
  const base = existing.exists()
    ? toUserHydrationDocument(userId, existing.data())
    : null;

  const document: Partial<UserHydrationDocument> = {
    ...base,
    ...payload,
    userId,
    updatedAt: now,
    profileVersion: PROFILE_VERSION
  };

  logHydrationSync("write", `Saving user hydration document`, {
    userId,
    onboardingStep: document.onboardingStep,
    onboardingCompleted: document.onboardingCompleted
  });

  await setDoc(userDoc(db, userId), sanitizeForFirestore(document), { merge: true });
}

export async function ensureUserHydrationDocument(
  userId: string,
  displayName: string,
  email: string,
  photoURL?: string
) {
  const db = getFirebaseDb();

  if (!db) {
    return;
  }

  const ref = userDoc(db, userId);
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    return toUserHydrationDocument(userId, snapshot.data());
  }

  const seed = {
    ...createDefaultUserHydrationFields(userId, displayName, email, photoURL),
    userId
  };

  await setDoc(ref, sanitizeForFirestore(seed), { merge: true });
  return toUserHydrationDocument(userId, seed);
}

export async function saveOnboardingDraft(userId: string, draft: OnboardingDraft) {
  await saveUserHydrationDocument(userId, {
    onboardingStep: draft.step,
    hydrationProfile: {
      bodyMetrics: draft.bodyMetrics,
      activity: draft.activity,
      climate: draft.climate,
      lifestyle: draft.lifestyle,
      performance: draft.performance
    },
    lifestyleFactors: draft.lifestyle
  });
}

export async function completeUserOnboarding(
  userId: string,
  profile: AthleteHydrationProfile,
  target: CalculatedHydrationTarget,
  hydrationGoal: number,
  dynamicGoalEnabled: boolean,
  manualGoal?: number
) {
  await saveUserHydrationDocument(userId, {
    hydrationProfile: profile,
    lifestyleFactors: profile.lifestyle,
    calculatedHydrationTarget: target,
    hydrationGoal,
    dynamicGoalEnabled,
    manualGoal,
    onboardingCompleted: true,
    onboardingStep: 7
  });
}
