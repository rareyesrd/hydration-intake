"use client";

import { useMemo } from "react";

import type { HydrationReminder, HydrationStats } from "@/types/hydration";

const performanceLines = [
  "Hydrate like an athlete.",
  "Performance starts with water.",
  "Your body is waiting.",
  "Pause. Recover. Hydrate."
];

export function useDynamicCopy(stats: HydrationStats, reminder: HydrationReminder) {
  return useMemo(() => {
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? "Morning session" : hour < 17 ? "Afternoon reset" : "Evening recovery";

    const message =
      reminder.pace === "critical"
        ? "Pause. Recover. Hydrate."
        : reminder.pace === "behind"
          ? "Your body is waiting."
          : stats.progress >= 100
            ? "Perfect hydration day locked."
            : performanceLines[Math.min(3, Math.floor(stats.progress / 25))];

    return {
      greeting,
      hero: message,
      caption:
        stats.progress >= 100
          ? "Recovery mode is active. Keep the rhythm easy."
          : "Small, consistent inputs compound into better training output."
    };
  }, [reminder.pace, stats.progress]);
}
