/**
 * Push notification foundation — wiring only.
 * Backend (FCM) and permission flows will be added in a future release.
 */

export type HydrationReminderSchedule = {
  enabled: boolean;
  intervalMinutes: number;
  quietHoursStart: number;
  quietHoursEnd: number;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function getNotificationPermissionStatus() {
  if (!isPushSupported()) {
    return "unsupported" as const;
  }

  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isPushSupported()) {
    return "unsupported" as const;
  }

  return Notification.requestPermission();
}

/** Placeholder for future FCM / Web Push subscription persistence. */
export async function registerPushSubscription(_payload: PushSubscriptionPayload) {
  return { ok: false as const, reason: "not-implemented" };
}

/** Placeholder for scheduling local reminder checks via service worker. */
export async function scheduleHydrationReminders(_schedule: HydrationReminderSchedule) {
  return { ok: false as const, reason: "not-implemented" };
}
