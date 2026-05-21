export type HydrationEntry = {
  id: string;
  amount: number;
  createdAt: string;
};

export type DailyHydration = {
  date: string;
  goal: number;
  entries: HydrationEntry[];
  completedAt?: string;
};

export type ConsistencyPoint = {
  day: string;
  glasses: number;
  goal: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlockedAt?: string;
  icon: "flame" | "trophy" | "shield" | "sparkles" | "medal";
};

export type ReminderSettings = {
  enabled: boolean;
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  reminderFrequencyMinutes: number;
  animationIntensity: "calm" | "balanced" | "cinematic";
  theme: "dark" | "light";
  units: "glasses" | "ounces" | "milliliters";
  hasCompletedOnboarding: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
};

export type HydrationPace = "ahead" | "on-track" | "behind" | "critical" | "complete";

export type HydrationReminder = {
  pace: HydrationPace;
  expectedGlasses: number;
  deficit: number;
  nextReminderMinutes: number;
  shouldDrinkNow: boolean;
  forecastGlasses: number;
  forecastLabel: string;
};

export type HydrationStats = {
  consumed: number;
  remaining: number;
  progress: number;
  streak: number;
  hydrationScore: number;
  monthlyConsistency: number;
  xp: number;
  level: number;
  levelProgress: number;
  weeklyWins: number;
  achievements: Achievement[];
};

export type HydrationProfile = {
  userId?: string;
  goal: number;
  days: Record<string, DailyHydration>;
  settings: ReminderSettings;
  unlockedAchievements: Record<string, string>;
  updatedAt: string;
};

export type FirestoreHydrationLog = {
  userId?: string;
  id: string;
  date: string;
  timestamp: string;
  action: "add" | "remove" | "reset" | "reminder";
  glassesDelta: number;
  glassesConsumed: number;
  completionPercentage: number;
  hydrationPace: HydrationPace;
  reminderEffectiveness?: "ignored" | "helped" | "not-needed";
};

export type FirestoreDailyStats = {
  userId?: string;
  date: string;
  glassesConsumed: number;
  goal: number;
  completionPercentage: number;
  completed: boolean;
  completedAt?: string;
  hydrationPace: HydrationPace;
  updatedAt: string;
};

export type FirestoreStreak = {
  userId?: string;
  id: "current";
  currentStreak: number;
  bestStreak: number;
  lastUpdatedAt: string;
};

export type FirestoreMonthlyProgress = {
  userId?: string;
  month: string;
  totalGlasses: number;
  completedDays: number;
  activeDays: number;
  averageCompletion: number;
  hydrationScore: number;
  updatedAt: string;
};

export type UserProfile = {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  provider: "google";
  createdAt: string;
  updatedAt: string;
};
