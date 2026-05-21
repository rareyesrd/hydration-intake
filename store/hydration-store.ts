"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, subDays } from "date-fns";

import {
  loadHydrationProfile,
  saveHydrationProfile,
  syncHydrationAnalytics
} from "@/services/hydration-service";
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

type HydrationState = HydrationProfile & {
  activeAchievement: Achievement | null;
  isSyncing: boolean;
  lastSyncedAt?: string;
  hasLoadedRemote: boolean;
  addGlass: (amount?: number) => Promise<void>;
  removeGlass: () => Promise<void>;
  hydrateFromRemote: () => Promise<void>;
  resetToday: () => Promise<void>;
  toggleSound: () => void;
  setDailyGoal: (goal: number) => void;
  setReminderFrequency: (minutes: number) => void;
  setAnimationIntensity: (intensity: ReminderSettings["animationIntensity"]) => void;
  setTheme: (theme: ReminderSettings["theme"]) => void;
  setUnits: (units: ReminderSettings["units"]) => void;
  completeOnboarding: () => void;
  enableBrowserNotifications: () => Promise<void>;
  dismissAchievement: () => void;
  stats: () => HydrationStats;
  history: () => ConsistencyPoint[];
  reminder: (now?: Date) => HydrationReminder;
};

function createEmptyDay(date = todayKey()): DailyHydration {
  return {
    date,
    goal: DAILY_GOAL,
    entries: []
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

function buildProfileSnapshot(state: HydrationState): HydrationProfile {
  return {
    ownerId: state.ownerId,
    goal: state.goal,
    days: state.days,
    settings: state.settings,
    unlockedAchievements: state.unlockedAchievements,
    updatedAt: new Date().toISOString()
  };
}

async function syncProfile(get: () => HydrationState, set: PartialSetter) {
  set({ isSyncing: true });

  try {
    await saveHydrationProfile(buildProfileSnapshot(get()));
    set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
  } catch {
    set({ isSyncing: false });
  }
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
    completedAt: day.completedAt,
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

async function syncHydrationCollections(
  get: () => HydrationState,
  set: PartialSetter,
  action: FirestoreHydrationLog["action"],
  glassesDelta: number,
  achievements: Achievement[] = []
) {
  const state = get();
  const day = todaysDay(state.days);
  const dailyStats = buildDailyStats(day);
  const log: FirestoreHydrationLog = {
    id: `${day.date}-${Date.now()}-${action}`,
    date: day.date,
    timestamp: new Date().toISOString(),
    action,
    glassesDelta,
    glassesConsumed: dailyStats.glassesConsumed,
    completionPercentage: dailyStats.completionPercentage,
    hydrationPace: dailyStats.hydrationPace,
    reminderEffectiveness:
      action === "add" && calculateHydrationReminder(day).shouldDrinkNow
        ? "helped"
        : "not-needed"
  };
  const streak: FirestoreStreak = {
    id: "current",
    currentStreak: calculateStreak(state.days),
    bestStreak: bestStreak(state.days),
    lastUpdatedAt: new Date().toISOString()
  };

  set({ isSyncing: true });

  try {
    await syncHydrationAnalytics({
      profile: buildProfileSnapshot(state),
      log,
      dailyStats,
      streak,
      monthlyProgress: buildMonthlyProgress(state.days),
      achievements
    });
    set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
  } catch {
    set({ isSyncing: false });
  }
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

export const useHydrationStore = create<HydrationState>()(
  persist(
    (set, get) => ({
      goal: DAILY_GOAL,
      ownerId: undefined,
      days: {
        [todayKey()]: createEmptyDay()
      },
      settings: defaultSettings,
      unlockedAchievements: {},
      updatedAt: new Date().toISOString(),
      activeAchievement: null,
      isSyncing: false,
      hasLoadedRemote: false,
      addGlass: async (amount = 1) => {
        const today = todaysDay(get().days);
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

        const nextDays = { ...get().days, [todayKey()]: nextDay };
        const { unlocked, newlyUnlocked } = getUnlockedAchievements(
          nextDays,
          get().unlockedAchievements
        );

        set({
          days: nextDays,
          unlockedAchievements: unlocked,
          activeAchievement: newlyUnlocked[0] ?? null,
          updatedAt: new Date().toISOString()
        });

        void syncHydrationCollections(get, set, "add", cappedAmount, newlyUnlocked);
      },
      removeGlass: async () => {
        const today = todaysDay(get().days);

        if (!today.entries.length) {
          return;
        }

        const nextEntries = today.entries.slice(0, -1);
        const nextDay = {
          ...today,
          entries: nextEntries,
          completedAt:
            dayTotal({ ...today, entries: nextEntries }) >= today.goal
              ? today.completedAt
              : undefined
        };

        set({
          days: { ...get().days, [todayKey()]: nextDay },
          updatedAt: new Date().toISOString()
        });

        void syncHydrationCollections(get, set, "remove", -1);
      },
      hydrateFromRemote: async () => {
        if (get().hasLoadedRemote) {
          return;
        }

        set({ isSyncing: true });

        try {
          const remoteProfile = await loadHydrationProfile();

          if (remoteProfile) {
            set({
              ...remoteProfile,
              days: {
                ...remoteProfile.days,
                [todayKey()]: remoteProfile.days[todayKey()] ?? createEmptyDay()
              }
            });
          }
        } finally {
          set({ hasLoadedRemote: true, isSyncing: false });
        }
      },
      resetToday: async () => {
        set({
          days: { ...get().days, [todayKey()]: createEmptyDay() },
          updatedAt: new Date().toISOString()
        });

        void syncHydrationCollections(get, set, "reset", 0);
      },
      toggleSound: () => {
        set({
          settings: {
            ...get().settings,
            soundEnabled: !get().settings.soundEnabled
          }
        });
        void syncProfile(get, set);
      },
      setDailyGoal: (goal) => {
        const safeGoal = Math.min(24, Math.max(1, Math.round(goal)));
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

        void syncProfile(get, set);
      },
      setReminderFrequency: (minutes) => {
        set({
          settings: {
            ...get().settings,
            reminderFrequencyMinutes: Math.min(180, Math.max(15, Math.round(minutes)))
          }
        });
        void syncProfile(get, set);
      },
      setAnimationIntensity: (animationIntensity) => {
        set({
          settings: {
            ...get().settings,
            animationIntensity
          }
        });
        void syncProfile(get, set);
      },
      setTheme: (theme) => {
        set({
          settings: {
            ...get().settings,
            theme
          }
        });
        void syncProfile(get, set);
      },
      setUnits: (units) => {
        set({
          settings: {
            ...get().settings,
            units
          }
        });
        void syncProfile(get, set);
      },
      completeOnboarding: () => {
        set({
          settings: {
            ...get().settings,
            hasCompletedOnboarding: true
          }
        });
        void syncProfile(get, set);
      },
      enableBrowserNotifications: async () => {
        if (!("Notification" in window)) {
          return;
        }

        const permission = await Notification.requestPermission();

        set({
          settings: {
            ...get().settings,
            browserNotificationsEnabled: permission === "granted"
          }
        });

        void syncProfile(get, set);
      },
      dismissAchievement: () => set({ activeAchievement: null }),
      stats: () =>
        calculateHydrationStats(
          todaysDay(get().days),
          get().days,
          get().unlockedAchievements
        ),
      history: () => calculateHydrationHistory(get().days),
      reminder: (now = new Date()) =>
        calculateHydrationReminder(todaysDay(get().days), now)
    }),
    {
      name: "hydration-athlete-store",
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<HydrationState> | undefined;

        return {
          ...current,
          ...persistedState,
          settings: {
            ...current.settings,
            ...persistedState?.settings
          },
          days: {
            ...current.days,
            ...persistedState?.days
          }
        };
      },
      partialize: (state) => ({
        goal: state.goal,
        days: state.days,
        settings: state.settings,
        unlockedAchievements: state.unlockedAchievements,
        updatedAt: state.updatedAt
      })
    }
  )
);
