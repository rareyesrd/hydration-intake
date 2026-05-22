"use client";

import { deleteToken, getToken, onMessage, type MessagePayload } from "firebase/messaging";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import { getFirebaseDb, getFirebaseMessaging } from "@/lib/firebase/config";
import { env } from "@/lib/env";

export type HydrationReminderSchedule = {
  enabled: boolean;
  intervalMinutes: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  smartPacing: boolean;
};

export type FcmDeviceTokenRecord = {
  userId: string;
  token: string;
  deviceId: string;
  permission: NotificationPermission;
  platform: "ios-pwa" | "android-pwa" | "desktop-pwa" | "browser";
  userAgent: string;
  lastSeenAt: unknown;
  createdAt: unknown;
  updatedAt: unknown;
  schedule?: HydrationReminderSchedule;
};

const FCM_TOKENS_COLLECTION = "fcm_tokens";
const FCM_SCHEDULES_COLLECTION = "notification_schedules";
const DEVICE_ID_KEY = "hydration-fcm-device-id";

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function isFcmConfigured() {
  return Boolean(env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
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

export async function registerFcmTokenForUser(userId: string) {
  if (!isPushSupported() || !isFcmConfigured()) {
    return { ok: false as const, reason: "unsupported-or-unconfigured" };
  }

  const permission = await requestNotificationPermission();

  if (permission !== "granted") {
    return { ok: false as const, reason: permission };
  }

  const messaging = await getFirebaseMessaging();
  const db = getFirebaseDb();
  const registration = await navigator.serviceWorker.ready;

  if (!messaging || !db) {
    return { ok: false as const, reason: "firebase-unavailable" };
  }

  const token = await getToken(messaging, {
    vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration
  });

  if (!token) {
    return { ok: false as const, reason: "token-unavailable" };
  }

  const deviceId = getOrCreateDeviceId();
  const record: FcmDeviceTokenRecord = {
    userId,
    token,
    deviceId,
    permission,
    platform: getPwaPlatform(),
    userAgent: navigator.userAgent,
    lastSeenAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, FCM_TOKENS_COLLECTION, `${userId}_${deviceId}`), record, {
    merge: true
  });

  return { ok: true as const, token, deviceId };
}

export async function refreshFcmTokenForUser(
  userId: string,
  schedule?: HydrationReminderSchedule
) {
  if (!isPushSupported() || !isFcmConfigured() || Notification.permission !== "granted") {
    return { ok: false as const, reason: "permission-not-granted" };
  }

  const result = await registerFcmTokenForUser(userId);

  if (result.ok && schedule) {
    await scheduleHydrationReminders(userId, schedule);
    await persistDeviceSchedule(userId, result.deviceId, schedule);
  }

  return result;
}

export async function getCurrentDevicePushRegistration(userId: string) {
  const db = getFirebaseDb();
  const deviceId = getExistingDeviceId();

  if (!db || !deviceId) {
    return null;
  }

  const snapshot = await getDoc(doc(db, FCM_TOKENS_COLLECTION, `${userId}_${deviceId}`));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as FcmDeviceTokenRecord;
}

export async function unregisterFcmTokenForUser(userId: string) {
  const messaging = await getFirebaseMessaging();
  const db = getFirebaseDb();
  const deviceId = getExistingDeviceId();

  if (!messaging || !db || !deviceId) {
    return;
  }

  await deleteToken(messaging).catch(() => false);
  await deleteDoc(doc(db, FCM_TOKENS_COLLECTION, `${userId}_${deviceId}`));
}

export function listenForForegroundNotifications(
  callback: (payload: MessagePayload) => void
) {
  let unsubscribe: (() => void) | undefined;
  let active = true;

  void getFirebaseMessaging().then((messaging) => {
    if (!messaging || !active) {
      return;
    }

    unsubscribe = onMessage(messaging, callback);
  });

  return () => {
    active = false;
    unsubscribe?.();
  };
}

export async function showForegroundHydrationNotification(payload: MessagePayload) {
  if (Notification.permission !== "granted") {
    return;
  }

  const title = payload.notification?.title ?? "Hydration reminder";
  const body =
    payload.notification?.body ?? "Pause. Recover. Hydrate before the next block.";

  new Notification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/favicon-32.png",
    tag: payload.data?.tag ?? "hydration-reminder"
  });
}

export async function scheduleHydrationReminders(
  userId: string,
  schedule: HydrationReminderSchedule
) {
  const db = getFirebaseDb();

  if (!db) {
    return { ok: false as const, reason: "firebase-unavailable" };
  }

  await setDoc(
    doc(db, FCM_SCHEDULES_COLLECTION, userId),
    {
      userId,
      ...schedule,
      channel: "fcm",
      strategy: "smart-hydration-pace",
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return { ok: true as const };
}

export function buildSmartReminderSchedule(settings: {
  enabled: boolean;
  reminderFrequencyMinutes: number;
  quietHoursStart: number;
  quietHoursEnd: number;
}): HydrationReminderSchedule {
  return {
    enabled: settings.enabled,
    intervalMinutes: settings.reminderFrequencyMinutes,
    quietHoursStart: settings.quietHoursStart,
    quietHoursEnd: settings.quietHoursEnd,
    smartPacing: true
  };
}

async function persistDeviceSchedule(
  userId: string,
  deviceId: string,
  schedule: HydrationReminderSchedule
) {
  const db = getFirebaseDb();

  if (!db) {
    return;
  }

  await setDoc(
    doc(db, FCM_TOKENS_COLLECTION, `${userId}_${deviceId}`),
    {
      userId,
      schedule,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

function getOrCreateDeviceId() {
  const existing = getExistingDeviceId();

  if (existing) {
    return existing;
  }

  const next = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

function getExistingDeviceId() {
  return window.localStorage.getItem(DEVICE_ID_KEY);
}

function getPwaPlatform(): FcmDeviceTokenRecord["platform"] {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  const ua = navigator.userAgent.toLowerCase();

  if (standalone && /iphone|ipad|ipod/.test(ua)) {
    return "ios-pwa";
  }

  if (standalone && /android/.test(ua)) {
    return "android-pwa";
  }

  if (standalone) {
    return "desktop-pwa";
  }

  return "browser";
}
