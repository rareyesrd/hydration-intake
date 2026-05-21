import {
  collection,
  doc,
  getDoc,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/config";
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

const COLLECTION = "personal-hydration";
const DOCUMENT = "athlete-dashboard";
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
    updatedAt: new Date().toISOString()
  };
}

function dashboardDoc(db: Firestore) {
  return doc(db, COLLECTION, DOCUMENT);
}

export async function loadHydrationProfile() {
  const db = getFirebaseDb();

  if (!db) {
    return null;
  }

  const snapshot = await getDoc(dashboardDoc(db));
  return toHydrationProfile(snapshot.data());
}

export async function saveHydrationProfile(profile: HydrationProfile) {
  const db = getFirebaseDb();

  if (!db) {
    return;
  }

  await setDoc(dashboardDoc(db), profile, { merge: true });
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

  if (!db) {
    return;
  }

  const batch = writeBatch(db);

  batch.set(dashboardDoc(db), payload.profile, { merge: true });
  batch.set(doc(collection(db, HYDRATION_LOGS), payload.log.id), payload.log);
  batch.set(doc(collection(db, DAILY_STATS), payload.dailyStats.date), payload.dailyStats, {
    merge: true
  });
  batch.set(doc(collection(db, STREAKS), payload.streak.id), payload.streak, {
    merge: true
  });
  batch.set(
    doc(collection(db, MONTHLY_PROGRESS), payload.monthlyProgress.month),
    payload.monthlyProgress,
    { merge: true }
  );

  payload.achievements?.forEach((achievement) => {
    batch.set(
      doc(collection(db, ACHIEVEMENTS), achievement.id),
      {
        ...achievement,
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
