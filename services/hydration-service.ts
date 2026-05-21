import {
  collection,
  doc,
  getDoc,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore
} from "firebase/firestore";

import { getFirebaseDb, getFirebaseUser } from "@/lib/firebase/config";
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
      ownerId: typeof data.ownerId === "string" ? data.ownerId : undefined,
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
    ownerId: undefined,
    updatedAt: new Date().toISOString()
  };
}

function dashboardDoc(db: Firestore, ownerId: string) {
  return doc(db, COLLECTION, ownerId);
}

function withOwner<T extends object>(payload: T, ownerId: string) {
  return {
    ...payload,
    ownerId
  };
}

export async function loadHydrationProfile() {
  const db = getFirebaseDb();

  const user = await getFirebaseUser();

  if (!db || !user) {
    return null;
  }

  const snapshot = await getDoc(dashboardDoc(db, user.uid));
  return toHydrationProfile(snapshot.data());
}

export async function saveHydrationProfile(profile: HydrationProfile) {
  const db = getFirebaseDb();

  const user = await getFirebaseUser();

  if (!db || !user) {
    return;
  }

  await setDoc(dashboardDoc(db, user.uid), withOwner(profile, user.uid), { merge: true });
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

  const user = await getFirebaseUser();

  if (!db || !user) {
    return;
  }

  const batch = writeBatch(db);

  batch.set(dashboardDoc(db, user.uid), withOwner(payload.profile, user.uid), {
    merge: true
  });
  batch.set(
    doc(collection(db, HYDRATION_LOGS), `${user.uid}_${payload.log.id}`),
    withOwner(payload.log, user.uid)
  );
  batch.set(
    doc(collection(db, DAILY_STATS), `${user.uid}_${payload.dailyStats.date}`),
    withOwner(payload.dailyStats, user.uid),
    {
      merge: true
    }
  );
  batch.set(
    doc(collection(db, STREAKS), user.uid),
    withOwner(payload.streak, user.uid),
    {
      merge: true
    }
  );
  batch.set(
    doc(collection(db, MONTHLY_PROGRESS), `${user.uid}_${payload.monthlyProgress.month}`),
    withOwner(payload.monthlyProgress, user.uid),
    { merge: true }
  );

  payload.achievements?.forEach((achievement) => {
    batch.set(
      doc(collection(db, ACHIEVEMENTS), `${user.uid}_${achievement.id}`),
      {
        ...achievement,
        ownerId: user.uid,
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
