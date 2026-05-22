import type {
  Achievement,
  FirestoreDailyStats,
  FirestoreHydrationLog,
  FirestoreMonthlyProgress,
  FirestoreStreak,
  HydrationProfile
} from "@/types/hydration";

export type QueuedHydrationSync = {
  id: string;
  userId: string;
  profile: HydrationProfile;
  log: FirestoreHydrationLog;
  dailyStats: FirestoreDailyStats;
  streak: FirestoreStreak;
  monthlyProgress: FirestoreMonthlyProgress;
  achievements: Achievement[];
  createdAt: string;
};
