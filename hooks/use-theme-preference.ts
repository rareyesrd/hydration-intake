"use client";

import { useEffect } from "react";

import type { ReminderSettings } from "@/types/hydration";

export function useThemePreference(theme: ReminderSettings["theme"]) {
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
}
