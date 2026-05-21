"use client";

import { logEvent } from "firebase/analytics";

import { getFirebaseAnalytics } from "@/lib/firebase/config";

export async function trackFirebaseEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  const analytics = await getFirebaseAnalytics();

  if (!analytics) {
    return;
  }

  logEvent(analytics, eventName, params);
}
