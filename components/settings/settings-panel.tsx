"use client";

import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect } from "react";
import {
  Bell,
  Gauge,
  Moon,
  Ruler,
  Settings2,
  Sun,
  Volume2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HydrationProfileSettings } from "@/components/settings/hydration-profile-settings";
import { PwaSettings } from "@/components/settings/pwa-settings";
import { cn } from "@/lib/utils";
import type { ReminderSettings } from "@/types/hydration";

type SettingsPanelProps = {
  isOpen: boolean;
  goal: number;
  settings: ReminderSettings;
  onToggle: () => void;
  onGoalChange: (goal: number) => void;
  onReminderFrequencyChange: (minutes: number) => void;
  onAnimationIntensityChange: (
    intensity: ReminderSettings["animationIntensity"]
  ) => void;
  onThemeChange: (theme: ReminderSettings["theme"]) => void;
  onUnitsChange: (units: ReminderSettings["units"]) => void;
  onToggleSound: () => void;
};

const intensities: ReminderSettings["animationIntensity"][] = [
  "calm",
  "balanced",
  "cinematic"
];

const units: ReminderSettings["units"][] = ["glasses", "ounces", "milliliters"];

export function SettingsPanel({
  isOpen,
  goal,
  settings,
  onToggle,
  onGoalChange,
  onReminderFrequencyChange,
  onAnimationIntensityChange,
  onThemeChange,
  onUnitsChange,
  onToggleSound
}: SettingsPanelProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={onToggle}>
          <Settings2 />
          Settings
        </Button>
      </div>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] overflow-hidden bg-slate-950/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
          >
            <motion.aside
              className="absolute top-0 right-0 flex h-dvh max-h-dvh w-full max-w-xl flex-col overflow-hidden border-l border-white/10 bg-slate-950/88 shadow-[0_0_80px_rgba(8,47,73,0.45)] backdrop-blur-2xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="shrink-0 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-6 sm:pt-6 sm:pb-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm tracking-[0.24em] text-cyan-100/60 uppercase">
                      Control surface
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-white">
                      Settings
                    </h2>
                  </div>
                  <Button type="button" variant="ghost" onClick={onToggle}>
                    Close
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
                <Card>
                  <CardContent className="grid gap-6">
                    <PwaSettings />
                    <HydrationProfileSettings />
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                        <Gauge className="size-4" />
                        Daily goal
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <input
                          aria-label="Daily hydration goal"
                          type="range"
                          min={6}
                          max={18}
                          value={goal}
                          onChange={(event) =>
                            onGoalChange(Number(event.target.value))
                          }
                          className="w-full accent-cyan-300"
                        />
                        <span className="w-12 text-right text-2xl font-black text-white">
                          {goal}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                        <Bell className="size-4" />
                        Reminder frequency
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <input
                          aria-label="Reminder frequency"
                          type="range"
                          min={15}
                          max={180}
                          step={5}
                          value={settings.reminderFrequencyMinutes}
                          onChange={(event) =>
                            onReminderFrequencyChange(
                              Number(event.target.value)
                            )
                          }
                          className="w-full accent-cyan-300"
                        />
                        <span className="w-16 text-right text-xl font-black text-white">
                          {settings.reminderFrequencyMinutes}m
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                        <Volume2 className="size-4" />
                        Sound
                      </div>
                      <Button
                        type="button"
                        variant={
                          settings.soundEnabled ? "default" : "secondary"
                        }
                        className="mt-4 w-full"
                        onClick={onToggleSound}
                      >
                        {settings.soundEnabled ? "Sound on" : "Sound off"}
                      </Button>
                    </div>

                    <SegmentedSetting
                      icon={<Settings2 className="size-4" />}
                      label="Animation intensity"
                      values={intensities}
                      active={settings.animationIntensity}
                      onChange={onAnimationIntensityChange}
                    />

                    <div>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-100">
                        {settings.theme === "dark" ? (
                          <Moon className="size-4" />
                        ) : (
                          <Sun className="size-4" />
                        )}
                        Theme
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {(["dark", "light"] as const).map((theme) => (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => onThemeChange(theme)}
                            className={cn(
                              "rounded-full border px-4 py-2 text-sm font-semibold capitalize transition",
                              settings.theme === theme
                                ? "border-cyan-200 bg-cyan-300 text-slate-950"
                                : "border-white/10 bg-white/[0.06] text-slate-300"
                            )}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>

                    <SegmentedSetting
                      icon={<Ruler className="size-4" />}
                      label="Hydration units"
                      values={units}
                      active={settings.units}
                      onChange={onUnitsChange}
                    />
                  </CardContent>
                </Card>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SegmentedSetting<T extends string>({
  icon,
  label,
  values,
  active,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  values: T[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-100">
        {icon}
        {label}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={cn(
              "min-w-0 rounded-full border px-3 py-2 text-xs font-semibold capitalize transition sm:text-sm",
              active === value
                ? "border-cyan-200 bg-cyan-300 text-slate-950"
                : "border-white/10 bg-white/[0.06] text-slate-300"
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
