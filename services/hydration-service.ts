import {
  collection,
  doc,
  getDoc,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore
} from "firebase/firestore";

import { getCurrentFirebaseUser, getFirebaseDb } from "@/lib/firebase/config";
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

function toHydrationProfile(data: DocumentData | undefined): HydrationProfile | null {
  if (!data) {
    return null;
  }

  if (data.days && data.settings) {
    return {
      goal: Number(data.goal ?? 11),
      days: data.days as Record<string, DailyHydration>,
      settings: { ...defaultSettings, ...data.settings },
      unlockedAchievements: data.unlockedAchievements ?? {},
      userId: typeof data.userId === "string" ? data.userId : undefined,
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
    userId: undefined,
    updatedAt: new Date().toISOString()
  };
}

function settingsDoc(db: Firestore, userId: string) {
  return doc(db, SETTINGS, userId);
}

function withUser<T extends object>(payload: T, userId: string) {
  return {
    ...payload,
    userId
  };
}

export async function loadHydrationProfile() {
  const db = getFirebaseDb();

  const user = getCurrentFirebaseUser();

  if (!db || !user) {
    return null;
  }

  const snapshot = await getDoc(settingsDoc(db, user.uid));
  return toHydrationProfile(snapshot.data());
}

export async function saveHydrationProfile(profile: HydrationProfile) {
  const db = getFirebaseDb();

  const user = getCurrentFirebaseUser();

  if (!db || !user) {
    return;
  }

  await setDoc(settingsDoc(db, user.uid), withUser(profile, user.uid), { merge: true });
}

type SyncAnalyticsPayload = {
  profile: HydrationProfile;
  log: FirestoreHydrationLog;
  dailyStats: FirestoreDailyStats;
  streak: FirestoreStreak;
  monthlyProgress: FirestoreMonthlyProgress;
  achievements?: Achievement[];
};

export async function syncHydrationAnalytics(payload: SyncAnalyticsPayload) {
  const db = getFirebaseDb();

  const user = getCurrentFirebaseUser();

  if (!db || !user) {
    return;
  }

  const batch = writeBatch(db);

  batch.set(settingsDoc(db, user.uid), withUser(payload.profile, user.uid), {
    merge: true
  });
  batch.set(
    doc(collection(db, HYDRATION_LOGS), `${user.uid}_${payload.log.id}`),
    withUser(payload.log, user.uid)
  );
  batch.set(
    doc(collection(db, DAILY_STATS), `${user.uid}_${payload.dailyStats.date}`),
    withUser(payload.dailyStats, user.uid),
    {
      merge: true
    }
  );
  batch.set(
    doc(collection(db, STREAKS), user.uid),
    withUser(payload.streak, user.uid),
    {
      merge: true
    }
  );
  batch.set(
    doc(collection(db, MONTHLY_PROGRESS), `${user.uid}_${payload.monthlyProgress.month}`),
    withUser(payload.monthlyProgress, user.uid),
    { merge: true }
  );

  payload.achievements?.forEach((achievement) => {
    batch.set(
      doc(collection(db, ACHIEVEMENTS), `${user.uid}_${achievement.id}`),
      {
        ...achievement,
        userId: user.uid,
        unlockedAt: achievement.unlockedAt ?? new Date().toISOString()
      },
      { merge: true }
    );
  });

  await batch.commit();

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
