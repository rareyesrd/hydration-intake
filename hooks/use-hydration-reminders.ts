"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  calculateHydrationReminder,
  getHydrationDateKey,
  useHydrationStore
} from "@/store/hydration-store";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function playGentleChime() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.18);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.5);
}

export function useHydrationReminders() {
  const [now, setNow] = useState(() => new Date());
  const settings = useHydrationStore((state) => state.settings);
  const days = useHydrationStore((state) => state.days);
  const today = getHydrationDateKey();
  const day = useMemo(
    () => days[today] ?? { date: today, goal: 11, entries: [] },
    [days, today]
  );
  const reminder = useMemo(() => calculateHydrationReminder(day, now), [day, now]);
  const lastReminderAt = useRef<number>(0);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!settings.enabled || !reminder.shouldDrinkNow) {
      return;
    }

    const notify = () => {
      const now = Date.now();
      const intervalMs =
        Math.min(reminder.nextReminderMinutes, settings.reminderFrequencyMinutes) *
        60 *
        1000;

      if (now - lastReminderAt.current < intervalMs) {
        return;
      }

      lastReminderAt.current = now;

      if (
        settings.browserNotificationsEnabled &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification("Hydration check", {
          body: reminder.deficit
            ? `You are ${reminder.deficit} glass${reminder.deficit > 1 ? "es" : ""} behind pace.`
            : "A quick glass keeps the day on track.",
          tag: "hydration-reminder"
        });
      }

      if (settings.soundEnabled) {
        playGentleChime();
      }
    };

    notify();
    const interval = window.setInterval(notify, 60_000);

    return () => window.clearInterval(interval);
  }, [reminder, settings]);
}
