"use client";

import { useEffect } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  buildSmartReminderSchedule,
  listenForForegroundNotifications,
  refreshFcmTokenForUser,
  showForegroundHydrationNotification
} from "@/services/notification-service";
import { useHydrationStore } from "@/store/hydration-store";

export function useFcmNotifications() {
  const { user } = useAuth();
  const settings = useHydrationStore((state) => state.settings);

  useEffect(() => {
    return listenForForegroundNotifications((payload) => {
      void showForegroundHydrationNotification(payload);
    });
  }, []);

  useEffect(() => {
    if (!user || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    const schedule = buildSmartReminderSchedule(settings);
    void refreshFcmTokenForUser(user.uid, schedule);
  }, [settings, user]);
}
