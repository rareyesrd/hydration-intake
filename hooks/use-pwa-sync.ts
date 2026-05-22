"use client";

import { useCallback, useEffect } from "react";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { flushOfflineHydrationQueue } from "@/services/pwa-sync-service";
import { usePwaStore } from "@/store/pwa-store";

export function usePwaSync() {
  const isOnline = useOnlineStatus();
  const pendingSyncCount = usePwaStore((state) => state.pendingSyncCount);
  const refreshPendingCount = usePwaStore((state) => state.refreshPendingCount);
  const markFlushComplete = usePwaStore((state) => state.markFlushComplete);

  const flushQueue = useCallback(async () => {
    const result = await flushOfflineHydrationQueue();
    markFlushComplete();
    return result;
  }, [markFlushComplete]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (!isOnline || pendingSyncCount === 0) {
      return;
    }

    void flushQueue();
  }, [flushQueue, isOnline, pendingSyncCount]);

  return {
    isOnline,
    pendingSyncCount,
    flushQueue
  };
}
