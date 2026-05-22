"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, RotateCcw, Sparkles, Target, Waves, Zap } from "lucide-react";

import { ProfileMenu } from "@/components/auth/profile-menu";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { AchievementPopup } from "@/components/gamification/achievement-popup";
import { AchievementStrip } from "@/components/gamification/achievement-strip";
import { CelebrationBurst } from "@/components/gamification/celebration-burst";
import { GlassGrid } from "@/components/hydration/glass-grid";
import { HydrationRing } from "@/components/hydration/hydration-ring";
import { QuickAddForm } from "@/components/hydration/quick-add-form";
import { ReminderPanel } from "@/components/hydration/reminder-panel";
import { WaveOrb } from "@/components/hydration/wave-orb";
import { PremiumOnboardingWizard } from "@/components/onboarding/premium-onboarding-wizard";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useHydrationReminders } from "@/hooks/use-hydration-reminders";
import { useDynamicCopy } from "@/hooks/use-dynamic-copy";
import { useMounted } from "@/hooks/use-mounted";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { useAuth } from "@/components/auth/auth-provider";
import { useHydrationProfileStore } from "@/store/hydration-profile-store";
import {
  calculateHydrationReminder,
  calculateHydrationHistory,
  calculateHydrationStats,
  getHydrationDateKey,
  useHydrationStore
} from "@/store/hydration-store";
import { ConsistencyChart } from "./consistency-chart";
import { MetricCard } from "./metric-card";

const messages = [
  "Stack the next glass. Your muscles will notice before your mind does.",
  "Clean reps need clean hydration. Keep the streak alive.",
  "Small sip, big compound effect. Finish today strong.",
  "Your future workout starts with this glass."
];

export function HydrationDashboard() {
  const mounted = useMounted();
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const priorProgress = useRef(0);
  const goal = useHydrationStore((state) => state.goal);
  const days = useHydrationStore((state) => state.days);
  const settings = useHydrationStore((state) => state.settings);
  const unlockedAchievements = useHydrationStore(
    (state) => state.unlockedAchievements
  );
  const activeAchievement = useHydrationStore((state) => state.activeAchievement);
  const resetToday = useHydrationStore((state) => state.resetToday);
  const addGlass = useHydrationStore((state) => state.addGlass);
  const removeGlass = useHydrationStore((state) => state.removeGlass);
  const enableBrowserNotifications = useHydrationStore(
    (state) => state.enableBrowserNotifications
  );
  const toggleSound = useHydrationStore((state) => state.toggleSound);
  const setDailyGoal = useHydrationStore((state) => state.setDailyGoal);
  const setReminderFrequency = useHydrationStore(
    (state) => state.setReminderFrequency
  );
  const setAnimationIntensity = useHydrationStore(
    (state) => state.setAnimationIntensity
  );
  const setTheme = useHydrationStore((state) => state.setTheme);
  const setUnits = useHydrationStore((state) => state.setUnits);
  const showOnboarding = useHydrationProfileStore((state) => state.needsOnboarding());
  const profileHasLoaded = useHydrationProfileStore((state) => state.hasLoaded);
  const dismissAchievement = useHydrationStore((state) => state.dismissAchievement);
  const isSyncing = useHydrationStore((state) => state.isSyncing);
  const hasLoadedRemote = useHydrationStore((state) => state.hasLoadedRemote);
  const remoteSyncStatus = useHydrationStore((state) => state.remoteSyncStatus);
  const syncError = useHydrationStore((state) => state.syncError);
  const today = getHydrationDateKey();
  const day = useMemo(
    () => days[today] ?? { date: today, goal: 11, entries: [] },
    [days, today]
  );
  const stats = useMemo(
    () => calculateHydrationStats(day, days, unlockedAchievements),
    [day, days, unlockedAchievements]
  );
  const history = useMemo(() => calculateHydrationHistory(days), [days]);
  const reminder = useMemo(() => calculateHydrationReminder(day, now), [day, now]);
  const copy = useDynamicCopy(stats, reminder);
  const firstName = user?.displayName?.split(" ")[0] ?? "Athlete";

  useHydrationReminders();
  useThemePreference(settings.theme);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (priorProgress.current < 100 && stats.progress >= 100) {
      setShowCelebration(true);
      const timeout = window.setTimeout(() => setShowCelebration(false), 1500);
      priorProgress.current = stats.progress;
      return () => window.clearTimeout(timeout);
    }

    priorProgress.current = stats.progress;
    return undefined;
  }, [stats.progress]);

  const message = useMemo(
    () => messages[Math.min(messages.length - 1, Math.floor(stats.progress / 28))],
    [stats.progress]
  );

  const isHydrationReady =
    !user ||
    (hasLoadedRemote &&
      remoteSyncStatus !== "loading" &&
      profileHasLoaded);

  if (!mounted || !isHydrationReady) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="h-28 w-28 animate-pulse rounded-full bg-cyan-300/20" />
      </div>
    );
  }

  return (
    <motion.main
      className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 text-slate-950 dark:text-white sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <PremiumOnboardingWizard isOpen={showOnboarding} />
      <AchievementPopup
        achievement={activeAchievement}
        onDismiss={dismissAchievement}
      />
      <CelebrationBurst show={showCelebration} />
      <header className="flex flex-col gap-4 py-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-sm text-cyan-100 backdrop-blur-xl">
            <Sparkles className="size-4" />
            Welcome back, {firstName}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.98] text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            {copy.hero}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            {copy.caption} Your synced Google profile keeps every hydration record personal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProfileMenu />
          <Button
            type="button"
            variant="ghost"
            onClick={() => void resetToday()}
            aria-label="Reset today's glasses"
          >
            <RotateCcw />
            Reset
          </Button>
        </div>
      </header>

      <SettingsPanel
        isOpen={settingsOpen}
        goal={goal}
        settings={settings}
        onToggle={() => setSettingsOpen((value) => !value)}
        onGoalChange={setDailyGoal}
        onReminderFrequencyChange={setReminderFrequency}
        onAnimationIntensityChange={setAnimationIntensity}
        onThemeChange={setTheme}
        onUnitsChange={setUnits}
        onToggleSound={toggleSound}
      />

      <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden">
          <CardContent className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.88fr_1fr]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(103,232,249,0.16),transparent_24%),radial-gradient(circle_at_90%_80%,rgba(167,243,208,0.12),transparent_28%)]" />
            {stats.progress > 0 ? (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {Array.from({ length: 9 }, (_, index) => (
                  <motion.span
                    key={index}
                    className="absolute size-1.5 rounded-full bg-cyan-200/60"
                    style={{
                      left: `${12 + index * 9}%`,
                      bottom: `${10 + (index % 4) * 8}%`
                    }}
                    animate={{ y: [-4, -28, -4], opacity: [0.15, 0.8, 0.15] }}
                    transition={{
                      duration: 2.8 + index * 0.12,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            ) : null}
            <div className="relative grid place-items-center">
              <HydrationRing
                progress={stats.progress}
                consumed={stats.consumed}
                goal={day.goal}
              />
            </div>
            <div className="relative flex flex-col justify-center gap-6">
              <div className="flex items-center justify-between gap-5">
                <WaveOrb progress={stats.progress} />
                <div className="text-right">
                  <p className="text-sm text-slate-400">Remaining</p>
                  <p className="text-5xl font-black text-white">{stats.remaining}</p>
                  <p className="text-glass-caption">glasses to 11</p>
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Daily completion</span>
                  <span className="font-semibold text-cyan-100">{stats.progress}%</span>
                </div>
                <Progress
                  value={stats.progress}
                  label={`Daily hydration completion: ${stats.progress} percent`}
                />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={message}
                  className="rounded-3xl border border-white/10 bg-slate-950/30 p-5 text-lg font-medium leading-relaxed text-slate-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  {message}
                </motion.p>
              </AnimatePresence>
              <GlassGrid
                consumed={stats.consumed}
                goal={day.goal}
                onAdd={() => void addGlass(1)}
                onRemove={() => void removeGlass()}
              />
              <QuickAddForm />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <MetricCard
            icon={Target}
            label="Today's glasses"
            value={`${stats.consumed}`}
            caption={`${stats.remaining} left before recovery mode`}
          />
          <MetricCard
            icon={Activity}
            label="Hydration score"
            value={`${stats.hydrationScore}`}
            caption="Weighted from today and monthly rhythm"
          />
          <MetricCard
            icon={Waves}
            label="Sync state"
            value={
              syncError
                ? "Error"
                : isSyncing
                  ? "Saving"
                  : remoteSyncStatus === "ready"
                    ? "Synced"
                    : "Loading"
            }
            caption={
              syncError
                ? syncError
                : "Firestore realtime sync across your devices"
            }
          />
          <MetricCard
            icon={Zap}
            label="Level progress"
            value={`${stats.levelProgress}/250`}
            caption={`Level ${stats.level} hydration athlete`}
          />
        </div>
      </section>

      <ReminderPanel
        reminder={reminder}
        settings={settings}
        onEnableNotifications={() => void enableBrowserNotifications()}
        onToggleSound={toggleSound}
      />

      <AchievementStrip
        streak={stats.streak}
        hydrationScore={stats.hydrationScore}
        consistency={stats.monthlyConsistency}
        level={stats.level}
        xp={stats.xp}
        weeklyWins={stats.weeklyWins}
        unlockedCount={stats.achievements.length}
      />

      <ConsistencyChart data={history} />

      <AnalyticsDashboard days={days} achievements={stats.achievements} />
    </motion.main>
  );
}
