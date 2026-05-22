"use client";

import { Bell, BellRing, Clock, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { HydrationReminder, ReminderSettings } from "@/types/hydration";

type ReminderPanelProps = {
  reminder: HydrationReminder;
  settings: ReminderSettings;
  onEnableNotifications: () => void;
  onToggleSound: () => void;
};

const paceLabels = {
  ahead: "Ahead of pace",
  "on-track": "On track",
  behind: "Behind pace",
  critical: "Drink now",
  complete: "Goal complete"
};

export function ReminderPanel({
  reminder,
  settings,
  onEnableNotifications,
  onToggleSound
}: ReminderPanelProps) {
  const forecastProgress = Math.round(
    (reminder.forecastGlasses / reminder.goal) * 100
  );
  const nextPing = Math.min(
    reminder.nextReminderMinutes,
    settings.reminderFrequencyMinutes
  );

  return (
    <Card className={cn(reminder.shouldDrinkNow && "border-cyan-200/30")}>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-cyan-100">
              {reminder.shouldDrinkNow ? (
                <BellRing className="size-4 animate-pulse" />
              ) : (
                <Bell className="size-4" />
              )}
              Smart reminder engine
            </div>
            <h2 className="mt-2 text-2xl font-black text-white">
              {paceLabels[reminder.pace]}
            </h2>
          </div>
          {reminder.shouldDrinkNow ? (
            <div className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950 shadow-[0_0_30px_rgba(103,232,249,0.45)]">
              Drink now
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/[0.06] p-4">
            <p className="text-glass-label">Expected</p>
            <p className="mt-2 text-2xl font-black text-white">
              {reminder.expectedGlasses}
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.06] p-4">
            <p className="text-glass-label">Deficit</p>
            <p className="mt-2 text-2xl font-black text-white">{reminder.deficit}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.06] p-4">
            <p className="text-glass-label">Next ping</p>
            <p className="mt-2 text-2xl font-black text-white">{nextPing}m</p>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-slate-400">Hydration forecast</span>
            <span className="font-semibold text-cyan-100">
              {reminder.forecastGlasses}/{reminder.goal}
            </span>
          </div>
          <Progress
            value={forecastProgress}
            label={`Hydration forecast: ${reminder.forecastGlasses} of ${reminder.goal} glasses`}
          />
          <p className="mt-3 text-sm text-slate-400">{reminder.forecastLabel}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={onEnableNotifications}>
            <Clock aria-hidden />
            {settings.browserNotificationsEnabled ? "Notifications on" : "Enable alerts"}
          </Button>
          <Button
            type="button"
            variant={settings.soundEnabled ? "default" : "secondary"}
            onClick={onToggleSound}
          >
            {settings.soundEnabled ? (
              <Volume2 aria-hidden />
            ) : (
              <VolumeX aria-hidden />
            )}
            Gentle sound
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
