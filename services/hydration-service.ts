import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Unsubscribe
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/config";
import { sanitizeForFirestore } from "@/lib/firestore-sanitize";
import {
  logHydrationSync,
  logHydrationSyncError
} from "@/lib/hydration-sync-log";
import { trackFirebaseEvent } from "@/services/firebase-analytics-service";
import type {
  Achievement,
  DailyHydration,
  FirestoreDailyStats,
  FirestoreHydrationLog,
  FirestoreMonthlyProgress,
  FirestoreStreak,
  HydrationPace,
  HydrationProfile,
  ReminderSettings
} from "@/types/hydration";

const SETTINGS = "settings";
const HYDRATION_LOGS = "hydration_logs";
const DAILY_STATS = "daily_stats";
const ACHIEVEMENTS = "achievements";
const STREAKS = "streaks";
const MONTHLY_PROGRESS = "monthly_progress";

const defaultSettings: ReminderSettings = {
  enabled: true,
  soundEnabled: false,
  browserNotificationsEnabled: false,
  reminderFrequencyMinutes: 70,
  animationIntensity: "cinematic",
  theme: "dark",
  units: "glasses",
  hasCompletedOnboarding: false,
  quietHoursStart: 22,
  quietHoursEnd: 7
};

export class HydrationPersistenceError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "HydrationPersistenceError";
    this.cause = cause;
  }
}

function requireFirestore(userId: string) {
  const db = getFirebaseDb();

  if (!db) {
    throw new HydrationPersistenceError("Firestore is not configured.");
  }

  if (!userId) {
    throw new HydrationPersistenceError("Cannot sync hydration without a user id.");
  }

  return db;
}

function toHydrationProfile(
  userId: string,
  data: DocumentData | undefined
): HydrationProfile | null {
  if (!data) {
    return null;
  }

  if (data.days && data.settings) {
    return {
      goal: Number(data.goal ?? 11),
      days: data.days as Record<string, DailyHydration>,
      settings: { ...defaultSettings, ...data.settings },
      unlockedAchievements: data.unlockedAchievements ?? {},
      userId,
      updatedAt: String(data.updatedAt ?? new Date().toISOString())
    };
  }

  // Backward compatibility with the first single-day document shape.
  return {
    goal: Number(data.goal ?? 11),
    days: {
      [String(data.date)]: {
        date: String(data.date),
        goal: Number(data.goal ?? 11),
        entries: Array.isArray(data.entries) ? data.entries : []
      }
    },
    settings: defaultSettings,
    unlockedAchievements: {},
    userId,
    updatedAt: new Date().toISOString()
  };
}

function settingsDoc(db: Firestore, userId: string) {
  return doc(db, SETTINGS, userId);
}

function withUser<T extends object>(payload: T, userId: string) {
  return sanitizeForFirestore({
    ...payload,
    userId
  });
}

export async function loadHydrationProfile(userId: string) {
  const db = requireFirestore(userId);

  logHydrationSync("read", `Loading hydration profile for ${userId}`);
  const snapshot = await getDoc(settingsDoc(db, userId));
  const profile = toHydrationProfile(userId, snapshot.data());

  logHydrationSync("read", `Hydration profile loaded`, {
    userId,
    exists: snapshot.exists(),
    dayCount: profile ? Object.keys(profile.days).length : 0
  });

  return profile;
}

export async function saveHydrationProfile(userId: string, profile: HydrationProfile) {
  const db = requireFirestore(userId);

  logHydrationSync("write", `Saving hydration profile for ${userId}`, {
    dayCount: Object.keys(profile.days).length,
    updatedAt: profile.updatedAt
  });

  try {
    await setDoc(settingsDoc(db, userId), withUser(profile, userId), { merge: true });
    logHydrationSync("write", `Hydration profile saved for ${userId}`);
  } catch (error) {
    logHydrationSyncError("write", `Failed to save hydration profile for ${userId}`, error);
    throw new HydrationPersistenceError("Failed to save hydration profile.", error);
  }
}

type SyncAnalyticsPayload = {
  profile: HydrationProfile;
  log: FirestoreHydrationLog;
  dailyStats: FirestoreDailyStats;
  streak: FirestoreStreak;
  monthlyProgress: FirestoreMonthlyProgress;
  achievements?: Achievement[];
};

export async function syncHydrationAnalytics(
  userId: string,
  payload: SyncAnalyticsPayload
) {
  const db = requireFirestore(userId);

  logHydrationSync("write", `Syncing hydration analytics for ${userId}`, {
    action: payload.log.action,
    glassesDelta: payload.log.glassesDelta,
    date: payload.log.date
  });

  const batch = writeBatch(db);

  batch.set(settingsDoc(db, userId), withUser(payload.profile, userId), {
    merge: true
  });
  batch.set(
    doc(collection(db, HYDRATION_LOGS), `${userId}_${payload.log.id}`),
    withUser(payload.log, userId)
  );
  batch.set(
    doc(collection(db, DAILY_STATS), `${userId}_${payload.dailyStats.date}`),
    withUser(payload.dailyStats, userId),
    {
      merge: true
    }
  );
  batch.set(doc(collection(db, STREAKS), userId), withUser(payload.streak, userId), {
    merge: true
  });
  batch.set(
    doc(collection(db, MONTHLY_PROGRESS), `${userId}_${payload.monthlyProgress.month}`),
    withUser(payload.monthlyProgress, userId),
    { merge: true }
  );

  payload.achievements?.forEach((achievement) => {
    batch.set(
      doc(collection(db, ACHIEVEMENTS), `${userId}_${achievement.id}`),
      {
        ...achievement,
        userId,
        unlockedAt: achievement.unlockedAt ?? new Date().toISOString()
      },
      { merge: true }
    );
  });

  try {
    await batch.commit();
    logHydrationSync("write", `Hydration analytics batch committed for ${userId}`, {
      action: payload.log.action
    });
  } catch (error) {
    logHydrationSyncError(
      "write",
      `Hydration analytics batch failed for ${userId}`,
      error
    );
    throw new HydrationPersistenceError("Failed to sync hydration analytics.", error);
  }

  await trackFirebaseEvent("hydration_log", {
    action: payload.log.action,
    glasses_consumed: payload.log.glassesConsumed,
    completion_percentage: payload.log.completionPercentage,
    hydration_pace: payload.log.hydrationPace
  });
}

export async function trackReminderEffectiveness(
  pace: HydrationPace,
  helped: boolean
) {
  await trackFirebaseEvent("hydration_reminder_effectiveness", {
    hydration_pace: pace,
    helped
  });
}

export function subscribeHydrationProfile(
  userId: string,
  handlers: {
    onProfile: (profile: HydrationProfile | null) => void;
    onError: (error: Error) => void;
  }
): Unsubscribe {
  const db = requireFirestore(userId);

  logHydrationSync("snapshot", `Subscribing to hydration profile for ${userId}`);

  return onSnapshot(
    settingsDoc(db, userId),
    (snapshot) => {
      const profile = toHydrationProfile(userId, snapshot.data());

      logHydrationSync("snapshot", `Hydration profile snapshot received`, {
        userId,
        exists: snapshot.exists(),
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        dayCount: profile ? Object.keys(profile.days).length : 0
      });

      handlers.onProfile(profile);
    },
    (error) => {
      logHydrationSyncError(
        "snapshot",
        `Hydration profile snapshot failed for ${userId}`,
        error
      );
      handlers.onError(error);
    }
  );
}
