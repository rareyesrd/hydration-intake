"use client";

import { logHydrationSync, logHydrationSyncError } from "@/lib/hydration-sync-log";
import { isAppOnline } from "@/lib/pwa/network";
import {
  clearOfflineQueue,
  dequeueHydrationSyncBatch,
  getOfflineQueueCount
} from "@/services/offline-hydration-queue";
import { syncHydrationAnalytics } from "@/services/hydration-service";

export type PwaSyncResult = {
  flushed: number;
  remaining: number;
};

export async function flushOfflineHydrationQueue(): Promise<PwaSyncResult> {
  if (!isAppOnline()) {
    return { flushed: 0, remaining: getOfflineQueueCount() };
  }

  let flushed = 0;

  while (isAppOnline()) {
    const batch = dequeueHydrationSyncBatch();

    if (!batch.length) {
      break;
    }

    for (const item of batch) {
      try {
        await syncHydrationAnalytics(item.userId, {
          profile: item.profile,
          log: item.log,
          dailyStats: item.dailyStats,
          streak: item.streak,
          monthlyProgress: item.monthlyProgress,
          achievements: item.achievements
        });
        flushed += 1;
        logHydrationSync("write", "Flushed offline hydration sync", { id: item.id });
      } catch (error) {
        logHydrationSyncError("write", "Failed flushing offline hydration item", error);
        throw error;
      }
    }
  }

  return {
    flushed,
    remaining: getOfflineQueueCount()
  };
}

export function resetOfflineQueueForSignOut() {
  clearOfflineQueue();
}
