"use client";

import { create } from "zustand";
import { format, subDays } from "date-fns";

import { logHydrationSync, logHydrationSyncError } from "@/lib/hydration-sync-log";
import { isAppOnline, isNetworkError } from "@/lib/pwa/network";
import {
  saveHydrationProfile,
  syncHydrationAnalytics
} from "@/services/hydration-service";
import { enqueueHydrationSync } from "@/services/offline-hydration-queue";
import { usePwaStore } from "@/store/pwa-store";
import type {
  Achievement,
  ConsistencyPoint,
  DailyHydration,
  HydrationEntry,
  FirestoreDailyStats,
  FirestoreHydrationLog,
  FirestoreMonthlyProgress,
  FirestoreStreak,
  HydrationProfile,
  HydrationReminder,
  HydrationStats,
  ReminderSettings
} from "@/types/hydration";

const DAILY_GOAL = 11;
const ACTIVE_START_HOUR = 7;
const ACTIVE_END_HOUR = 22;
export const getHydrationDateKey = (date = new Date()) => format(date, "yyyy-MM-dd");
const todayKey = () => getHydrationDateKey();

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

const achievementCatalog: Achievement[] = [
  {
    id: "three-day-streak",
    title: "3 Day Streak",
    description: "Hit the hydration goal three days in a row.",
    icon: "flame"
  },
  {
    id: "perfect-day",
    title: "Perfect Hydration Day",
    description: "Complete all 11 glasses in a single day.",
    icon: "trophy"
  },
  {
    id: "hydration-warrior",
    title: "Hydration Warrior",
    description: "Drink 77 lifetime glasses.",
    icon: "shield"
  },
  {
    id: "elite-consistency",
    title: "Elite Athlete Consistency",
    description: "Win at least five days in the last week.",
    icon: "medal"
  }
];

type RemoteSyncStatus = "idle" | "loading" | "ready" | "error";

type HydrationState = HydrationProfile & {
  activeAchievement: Achievement | null;
  isSyncing: boolean;
  lastSyncedAt?: string;
  hasLoadedRemote: boolean;
  remoteSyncStatus: RemoteSyncStatus;
  syncError: string | null;
  setSessionUser: (userId: string | null) => void;
  beginRemoteSync: (userId: string) => void;
  applyRemoteProfile: (profile: HydrationProfile | null) => void;
  applyEffectiveGoal: (goal: number) => void;
  markOnboardingComplete: () => Promise<void>;
  failRemoteSync: (message: string) => void;
  clearRemoteSync: () => void;
  addGlass: (amount?: number) => Promise<void>;
  removeGlass: () => Promise<void>;
  resetToday: () => Promise<void>;
  toggleSound: () => Promise<void>;
  setDailyGoal: (goal: number) => Promise<void>;
  setReminderFrequency: (minutes: number) => Promise<void>;
  setAnimationIntensity: (intensity: ReminderSettings["animationIntensity"]) => Promise<void>;
  setTheme: (theme: ReminderSettings["theme"]) => Promise<void>;
  setUnits: (units: ReminderSettings["units"]) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  enableBrowserNotifications: () => Promise<void>;
  dismissAchievement: () => void;
  stats: () => HydrationStats;
  history: () => ConsistencyPoint[];
  reminder: (now?: Date) => HydrationReminder;
};

function createEmptyDay(date = todayKey(), goal = DAILY_GOAL): DailyHydration {
  return {
    date,
    goal,
    entries: []
  };
}

function createInitialProfile(userId?: string): Pick<
  HydrationProfile,
  "userId" | "goal" | "days" | "settings" | "unlockedAchievements" | "updatedAt"
> {
  return {
    userId,
    goal: DAILY_GOAL,
    days: {
      [todayKey()]: createEmptyDay()
    },
    settings: defaultSettings,
    unlockedAchievements: {},
    updatedAt: new Date().toISOString()
  };
}

function buildEntry(amount: number): HydrationEntry {
  return {
    id: crypto.randomUUID(),
    amount,
    createdAt: new Date().toISOString()
  };
}

function dayTotal(day: DailyHydration | undefined) {
  return day?.entries.reduce((total, entry) => total + entry.amount, 0) ?? 0;
}

function todaysDay(days: Record<string, DailyHydration>) {
  return days[todayKey()] ?? createEmptyDay();
}

export function calculateHydrationHistory(
  days: Record<string, DailyHydration>
): ConsistencyPoint[] {
  return Array.from({ length: 30 }, (_, index) => {
    const date = subDays(new Date(), 29 - index);
    const key = format(date, "yyyy-MM-dd");
    const day = days[key];

    return {
      day: format(date, "MMM d"),
      glasses: dayTotal(day),
      goal: day?.goal ?? DAILY_GOAL
    };
  });
}

function calculateStreak(days: Record<string, DailyHydration>) {
  let streak = 0;

  for (let index = 0; index < 365; index += 1) {
    const key = format(subDays(new Date(), index), "yyyy-MM-dd");
    const day = days[key];

    if (!day || dayTotal(day) < day.goal) {
      if (index === 0) {
        continue;
      }

      break;
    }

    streak += 1;
  }

  return streak;
}

function lifetimeGlasses(days: Record<string, DailyHydration>) {
  return Object.values(days).reduce((total, day) => total + dayTotal(day), 0);
}

function weeklyWins(days: Record<string, DailyHydration>) {
  return Array.from({ length: 7 }, (_, index) => {
    const key = format(subDays(new Date(), index), "yyyy-MM-dd");
    const day = days[key];
    return day && dayTotal(day) >= day.goal ? 1 : 0;
  }).reduce<number>((total, win) => total + win, 0);
}

function getUnlockedAchievements(
  days: Record<string, DailyHydration>,
  unlockedAchievements: Record<string, string>
) {
  const streak = calculateStreak(days);
  const today = todaysDay(days);
  const lifetime = lifetimeGlasses(days);
  const wins = weeklyWins(days);
  const unlocked = { ...unlockedAchievements };
  const newlyUnlocked: Achievement[] = [];

  const checks: Record<string, boolean> = {
    "three-day-streak": streak >= 3,
    "perfect-day": dayTotal(today) >= today.goal,
    "hydration-warrior": lifetime >= 77,
    "elite-consistency": wins >= 5
  };

  achievementCatalog.forEach((achievement) => {
    if (checks[achievement.id] && !unlocked[achievement.id]) {
      unlocked[achievement.id] = new Date().toISOString();
      newlyUnlocked.push({
        ...achievement,
        unlockedAt: unlocked[achievement.id]
      });
    }
  });

  return { unlocked, newlyUnlocked };
}

function normalizeDay(day: DailyHydration): DailyHydration {
  const normalized: DailyHydration = {
    date: day.date,
    goal: day.goal,
    entries: day.entries
  };

  if (day.completedAt) {
    normalized.completedAt = day.completedAt;
  }

  return normalized;
}

function normalizeDays(days: Record<string, DailyHydration>) {
  return Object.fromEntries(
    Object.entries(days).map(([date, day]) => [date, normalizeDay(day)])
  );
}

function buildProfileSnapshot(state: HydrationState): HydrationProfile {
  return {
    userId: state.userId,
    goal: state.goal,
    days: normalizeDays(state.days),
    settings: state.settings,
    unlockedAchievements: state.unlockedAchievements,
    updatedAt: new Date().toISOString()
  };
}

function bestStreak(days: Record<string, DailyHydration>) {
  let best = 0;
  let current = 0;
  const sortedDays = Object.values(days).sort((a, b) => a.date.localeCompare(b.date));

  sortedDays.forEach((day) => {
    if (dayTotal(day) >= day.goal) {
      current += 1;
      best = Math.max(best, current);
      return;
    }

    current = 0;
  });

  return best;
}

function buildDailyStats(day: DailyHydration): FirestoreDailyStats {
  const consumed = dayTotal(day);
  const completionPercentage = Math.min(100, Math.round((consumed / day.goal) * 100));
  const reminder = calculateHydrationReminder(day);

  return {
    date: day.date,
    glassesConsumed: consumed,
    goal: day.goal,
    completionPercentage,
    completed: consumed >= day.goal,
    ...(day.completedAt ? { completedAt: day.completedAt } : {}),
    hydrationPace: reminder.pace,
    updatedAt: new Date().toISOString()
  };
}

function buildMonthlyProgress(
  days: Record<string, DailyHydration>,
  month = format(new Date(), "yyyy-MM")
): FirestoreMonthlyProgress {
  const monthDays = Object.values(days).filter((day) => day.date.startsWith(month));
  const totalGlasses = monthDays.reduce((total, day) => total + dayTotal(day), 0);
  const completedDays = monthDays.filter((day) => dayTotal(day) >= day.goal).length;
  const activeDays = monthDays.filter((day) => day.entries.length > 0).length;
  const averageCompletion = monthDays.length
    ? Math.round(
        monthDays.reduce(
          (total, day) => total + Math.min(100, (dayTotal(day) / day.goal) * 100),
          0
        ) / monthDays.length
      )
    : 0;

  return {
    month,
    totalGlasses,
    completedDays,
    activeDays,
    averageCompletion,
    hydrationScore: Math.min(100, Math.round(averageCompletion * 0.8 + completedDays * 2)),
    updatedAt: new Date().toISOString()
  };
}

async function persistProfile(userId: string, profile: HydrationProfile, set: PartialSetter) {
  set({ isSyncing: true, syncError: null });

  if (!isAppOnline()) {
    set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
    usePwaStore.getState().refreshPendingCount();
    logHydrationSync("write", "Profile save deferred while offline");
    return;
  }

  try {
    await saveHydrationProfile(userId, profile);
    set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    if (isNetworkError(error)) {
      set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Failed to save hydration profile.";
    logHydrationSyncError("write", message, error);
    set({ isSyncing: false, syncError: message, remoteSyncStatus: "error" });
    throw error;
  }
}

async function persistHydrationAction(
  userId: string,
  profile: HydrationProfile,
  log: FirestoreHydrationLog,
  achievements: Achievement[],
  set: PartialSetter
) {
  const day = profile.days[todayKey()] ?? createEmptyDay();
  const dailyStats = buildDailyStats(day);
  const streak: FirestoreStreak = {
    id: "current",
    currentStreak: calculateStreak(profile.days),
    bestStreak: bestStreak(profile.days),
    lastUpdatedAt: new Date().toISOString()
  };

  const monthlyProgress = buildMonthlyProgress(profile.days);
  const payload = {
    profile,
    log,
    dailyStats,
    streak,
    monthlyProgress,
    achievements
  };

  set({ isSyncing: true, syncError: null });

  if (!isAppOnline()) {
    enqueueHydrationSync({ userId, ...payload });
    usePwaStore.getState().refreshPendingCount();
    set({
      isSyncing: false,
      lastSyncedAt: new Date().toISOString(),
      syncError: null
    });
    logHydrationSync("write", "Hydration action queued for offline sync", {
      action: log.action
    });
    return;
  }

  try {
    await syncHydrationAnalytics(userId, payload);
    set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    if (isNetworkError(error)) {
      enqueueHydrationSync({ userId, ...payload });
      usePwaStore.getState().refreshPendingCount();
      set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
      logHydrationSync("write", "Network failure — queued hydration action", {
        action: log.action
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Failed to sync hydration analytics.";
    logHydrationSyncError("write", message, error);
    set({ isSyncing: false, syncError: message, remoteSyncStatus: "error" });
    throw error;
  }
}

function requireUserId(userId: string | undefined): userId is string {
  if (!userId) {
    logHydrationSync("state", "Hydration mutation skipped because no user is signed in.");
    return false;
  }

  return true;
}

type PartialSetter = (
  partial:
    | Partial<HydrationState>
    | ((state: HydrationState) => Partial<HydrationState>)
) => void;

export function calculateHydrationStats(
  day: DailyHydration,
  days: Record<string, DailyHydration>,
  unlockedAchievements: Record<string, string>
): HydrationStats {
  const consumed = dayTotal(day);
  const progress = Math.min(100, Math.round((consumed / day.goal) * 100));
  const remaining = Math.max(0, day.goal - consumed);
  const history = calculateHydrationHistory(days);
  const monthHits = history.filter((point) => point.glasses >= point.goal).length;
  const monthlyConsistency = Math.round((monthHits / history.length) * 100);
  const xp = lifetimeGlasses(days) * 15 + weeklyWins(days) * 40;
  const level = Math.floor(xp / 250) + 1;
  const achievements = achievementCatalog
    .filter((achievement) => unlockedAchievements[achievement.id])
    .map((achievement) => ({
      ...achievement,
      unlockedAt: unlockedAchievements[achievement.id]
    }));

  return {
    consumed,
    remaining,
    progress,
    streak: calculateStreak(days),
    hydrationScore: Math.min(
      100,
      Math.round(progress * 0.68 + monthlyConsistency * 0.32)
    ),
    monthlyConsistency,
    xp,
    level,
    levelProgress: xp % 250,
    weeklyWins: weeklyWins(days),
    achievements
  };
}

export function calculateHydrationReminder(
  day: DailyHydration,
  now = new Date()
): HydrationReminder {
  const consumed = dayTotal(day);
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const activeHours = ACTIVE_END_HOUR - ACTIVE_START_HOUR;
  const elapsedRatio = Math.min(
    1,
    Math.max(0, (currentHour - ACTIVE_START_HOUR) / activeHours)
  );
  const expectedGlasses = Math.min(day.goal, Math.ceil(day.goal * elapsedRatio));
  const deficit = Math.max(0, expectedGlasses - consumed);
  const remainingActiveHours = Math.max(0.25, ACTIVE_END_HOUR - currentHour);
  const pacePerHour = consumed / Math.max(0.5, currentHour - ACTIVE_START_HOUR);
  const forecastGlasses =
    consumed >= day.goal
      ? consumed
      : Math.min(day.goal, Math.round(consumed + pacePerHour * remainingActiveHours));

  if (consumed >= day.goal) {
    return {
      pace: "complete",
      expectedGlasses,
      deficit: 0,
      nextReminderMinutes: Math.max(120, day.goal * 12),
      shouldDrinkNow: false,
      forecastGlasses: consumed,
      forecastLabel: "Goal complete. Maintenance reminders only."
    };
  }

  const pace =
    deficit >= 3
      ? "critical"
      : deficit >= 2
        ? "behind"
        : consumed >= expectedGlasses + 1
          ? "ahead"
          : "on-track";

  const nextReminderMinutes =
    pace === "critical" ? 25 : pace === "behind" ? 40 : pace === "ahead" ? 110 : 70;

  return {
    pace,
    expectedGlasses,
    deficit,
    nextReminderMinutes,
    shouldDrinkNow: deficit > 0,
    forecastGlasses,
    forecastLabel:
      forecastGlasses >= day.goal
        ? "On pace to finish all 11 glasses."
        : `Forecasting ${forecastGlasses}/${day.goal} by bedtime.`
  };
}

export const useHydrationStore = create<HydrationState>()((set, get) => ({
  ...createInitialProfile(),
  activeAchievement: null,
  isSyncing: false,
  hasLoadedRemote: false,
  remoteSyncStatus: "idle",
  syncError: null,
  setSessionUser: (userId) => {
    if (get().userId === userId) {
      return;
    }

    logHydrationSync("auth", `Hydration session user changed`, {
      previousUserId: get().userId ?? null,
      nextUserId: userId
    });

    if (!userId) {
      set({
        ...createInitialProfile(),
        activeAchievement: null,
        hasLoadedRemote: false,
        isSyncing: false,
        lastSyncedAt: undefined,
        remoteSyncStatus: "idle",
        syncError: null
      });
      return;
    }

    set({
      ...createInitialProfile(userId),
      activeAchievement: null,
      hasLoadedRemote: false,
      isSyncing: false,
      lastSyncedAt: undefined,
      remoteSyncStatus: "loading",
      syncError: null
    });
  },
  beginRemoteSync: (userId) => {
    if (get().userId !== userId) {
      get().setSessionUser(userId);
      return;
    }

    set({
      remoteSyncStatus: "loading",
      syncError: null
    });
  },
  applyRemoteProfile: (profile) => {
    const userId = get().userId;

    if (!userId) {
      return;
    }

    if (!profile) {
      logHydrationSync("state", `No remote hydration profile yet for ${userId}`);
      set({
        ...createInitialProfile(userId),
        hasLoadedRemote: true,
        remoteSyncStatus: "ready",
        syncError: null
      });
      return;
    }

    logHydrationSync("state", `Applying remote hydration profile for ${userId}`, {
      dayCount: Object.keys(profile.days).length,
      updatedAt: profile.updatedAt
    });

    const today = profile.days[todayKey()] ?? createEmptyDay();
    const mergedToday = { ...today, goal: profile.goal };

    set({
      userId,
      goal: profile.goal,
      days: {
        ...profile.days,
        [todayKey()]: mergedToday
      },
      settings: profile.settings,
      unlockedAchievements: profile.unlockedAchievements,
      updatedAt: profile.updatedAt,
      hasLoadedRemote: true,
      remoteSyncStatus: "ready",
      syncError: null
    });
  },
  applyEffectiveGoal: (goal) => {
    const userId = get().userId;
    const safeGoal = Math.min(24, Math.max(6, Math.round(goal)));
    const today = todaysDay(get().days);

    set({
      goal: safeGoal,
      days: {
        ...get().days,
        [todayKey()]: {
          ...today,
          goal: safeGoal,
          completedAt:
            dayTotal(today) >= safeGoal
              ? today.completedAt ?? new Date().toISOString()
              : undefined
        }
      },
      updatedAt: new Date().toISOString()
    });

    logHydrationSync("state", `Effective hydration goal applied`, {
      userId: userId ?? null,
      goal: safeGoal
    });

    if (userId) {
      void persistProfile(
        userId,
        buildProfileSnapshot({
          ...get(),
          goal: safeGoal,
          days: get().days
        } as HydrationState),
        set
      ).catch(() => null);
    }
  },
  markOnboardingComplete: async () => {
    const userId = get().userId;

    if (!userId) {
      return;
    }

    set({
      settings: {
        ...get().settings,
        hasCompletedOnboarding: true
      }
    });

    await persistProfile(userId, buildProfileSnapshot(get()), set);
  },
  failRemoteSync: (message) => {
    logHydrationSyncError("error", "Remote hydration sync failed", message);
    set({
      remoteSyncStatus: "error",
      syncError: message,
      hasLoadedRemote: true
    });
  },
  clearRemoteSync: () => {
    set({
      hasLoadedRemote: false,
      remoteSyncStatus: "idle",
      syncError: null,
      isSyncing: false,
      lastSyncedAt: undefined
    });
  },
  addGlass: async (amount = 1) => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    const today = todaysDay(state.days);
    const cappedAmount = Math.min(amount, Math.max(0, today.goal - dayTotal(today)));

    if (cappedAmount <= 0) {
      return;
    }

    const nextDay = {
      ...today,
      entries: [...today.entries, buildEntry(cappedAmount)]
    };

    if (dayTotal(nextDay) >= nextDay.goal && !nextDay.completedAt) {
      nextDay.completedAt = new Date().toISOString();
    }

    const nextDays = { ...state.days, [todayKey()]: nextDay };
    const { unlocked, newlyUnlocked } = getUnlockedAchievements(
      nextDays,
      state.unlockedAchievements
    );
    set({
      days: nextDays,
      unlockedAchievements: unlocked,
      updatedAt: new Date().toISOString()
    });

    const nextProfile = buildProfileSnapshot(get());

    await persistHydrationAction(
      userId,
      nextProfile,
      {
        id: `${nextDay.date}-${Date.now()}-add`,
        date: nextDay.date,
        timestamp: new Date().toISOString(),
        action: "add",
        glassesDelta: cappedAmount,
        glassesConsumed: buildDailyStats(nextDay).glassesConsumed,
        completionPercentage: buildDailyStats(nextDay).completionPercentage,
        hydrationPace: buildDailyStats(nextDay).hydrationPace,
        reminderEffectiveness:
          calculateHydrationReminder(nextDay).shouldDrinkNow ? "helped" : "not-needed"
      },
      newlyUnlocked,
      set
    );

    if (newlyUnlocked[0]) {
      set({ activeAchievement: newlyUnlocked[0] });
    }
  },
  removeGlass: async () => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    const today = todaysDay(state.days);

    if (!today.entries.length) {
      return;
    }

    const nextEntries = today.entries.slice(0, -1);
    const nextDay = normalizeDay({
      ...today,
      entries: nextEntries,
      completedAt:
        dayTotal({ ...today, entries: nextEntries }) >= today.goal
          ? today.completedAt
          : undefined
    });
    const nextDays = { ...state.days, [todayKey()]: nextDay };

    set({
      days: nextDays,
      updatedAt: new Date().toISOString()
    });

    const nextProfile = buildProfileSnapshot(get());

    await persistHydrationAction(
      userId,
      nextProfile,
      {
        id: `${nextDay.date}-${Date.now()}-remove`,
        date: nextDay.date,
        timestamp: new Date().toISOString(),
        action: "remove",
        glassesDelta: -1,
        glassesConsumed: buildDailyStats(nextDay).glassesConsumed,
        completionPercentage: buildDailyStats(nextDay).completionPercentage,
        hydrationPace: buildDailyStats(nextDay).hydrationPace
      },
      [],
      set
    );
  },
  resetToday: async () => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    const nextDays = { ...state.days, [todayKey()]: createEmptyDay() };

    set({
      days: nextDays,
      updatedAt: new Date().toISOString()
    });

    const nextProfile = buildProfileSnapshot(get());

    await persistHydrationAction(
      userId,
      nextProfile,
      {
        id: `${todayKey()}-${Date.now()}-reset`,
        date: todayKey(),
        timestamp: new Date().toISOString(),
        action: "reset",
        glassesDelta: 0,
        glassesConsumed: 0,
        completionPercentage: 0,
        hydrationPace: calculateHydrationReminder(createEmptyDay()).pace
      },
      [],
      set
    );
  },
  toggleSound: async () => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    set({
      settings: {
        ...state.settings,
        soundEnabled: !state.settings.soundEnabled
      },
      updatedAt: new Date().toISOString()
    });

    await persistProfile(userId, buildProfileSnapshot(get()), set);
  },
  setDailyGoal: async (goal) => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    const safeGoal = Math.min(24, Math.max(1, Math.round(goal)));
    const today = todaysDay(state.days);
    const nextDay = normalizeDay({
      ...today,
      goal: safeGoal,
      completedAt:
        dayTotal(today) >= safeGoal
          ? today.completedAt ?? new Date().toISOString()
          : undefined
    });

    set({
      goal: safeGoal,
      days: {
        ...state.days,
        [todayKey()]: nextDay
      },
      updatedAt: new Date().toISOString()
    });

    await persistProfile(userId, buildProfileSnapshot(get()), set);
  },
  setReminderFrequency: async (minutes) => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    set({
      settings: {
        ...state.settings,
        reminderFrequencyMinutes: Math.min(180, Math.max(15, Math.round(minutes)))
      },
      updatedAt: new Date().toISOString()
    });

    await persistProfile(userId, buildProfileSnapshot(get()), set);
  },
  setAnimationIntensity: async (animationIntensity) => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    set({
      settings: {
        ...state.settings,
        animationIntensity
      },
      updatedAt: new Date().toISOString()
    });

    await persistProfile(userId, buildProfileSnapshot(get()), set);
  },
  setTheme: async (theme) => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    set({
      settings: {
        ...state.settings,
        theme
      },
      updatedAt: new Date().toISOString()
    });

    await persistProfile(userId, buildProfileSnapshot(get()), set);
  },
  setUnits: async (units) => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    set({
      settings: {
        ...state.settings,
        units
      },
      updatedAt: new Date().toISOString()
    });

    await persistProfile(userId, buildProfileSnapshot(get()), set);
  },
  completeOnboarding: async () => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    set({
      settings: {
        ...state.settings,
        hasCompletedOnboarding: true
      },
      updatedAt: new Date().toISOString()
    });

    await persistProfile(userId, buildProfileSnapshot(get()), set);
  },
  enableBrowserNotifications: async () => {
    const state = get();
    const userId = state.userId;

    if (!requireUserId(userId)) {
      return;
    }

    if (!("Notification" in window)) {
      return;
    }

    const permission = await Notification.requestPermission();

    set({
      settings: {
        ...state.settings,
        browserNotificationsEnabled: permission === "granted"
      },
      updatedAt: new Date().toISOString()
    });

    await persistProfile(userId, buildProfileSnapshot(get()), set);
  },
  dismissAchievement: () => set({ activeAchievement: null }),
  stats: () =>
    calculateHydrationStats(
      todaysDay(get().days),
      get().days,
      get().unlockedAchievements
    ),
  history: () => calculateHydrationHistory(get().days),
  reminder: (now = new Date()) => calculateHydrationReminder(todaysDay(get().days), now)
}));
