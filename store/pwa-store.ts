"use client";

import { create } from "zustand";

import { getOfflineQueueCount } from "@/services/offline-hydration-queue";
import { isAppOnline } from "@/lib/pwa/network";

type PwaState = {
  isOnline: boolean;
  pendingSyncCount: number;
  lastFlushAt?: string;
  swReady: boolean;
  setOnline: (online: boolean) => void;
  setSwReady: (ready: boolean) => void;
  refreshPendingCount: () => void;
  markFlushComplete: () => void;
};

export const usePwaStore = create<PwaState>()((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  pendingSyncCount: 0,
  swReady: false,
  setOnline: (online) => set({ isOnline: online }),
  setSwReady: (ready) => set({ swReady: ready }),
  refreshPendingCount: () =>
    set({ pendingSyncCount: getOfflineQueueCount() }),
  markFlushComplete: () =>
    set({
      pendingSyncCount: getOfflineQueueCount(),
      lastFlushAt: new Date().toISOString()
    })
}));

export function getPwaConnectivityLabel(state: {
  isOnline: boolean;
  pendingSyncCount: number;
}) {
  if (!state.isOnline) {
    return state.pendingSyncCount > 0
      ? `Offline · ${state.pendingSyncCount} pending`
      : "Offline";
  }

  if (state.pendingSyncCount > 0) {
    return `Syncing ${state.pendingSyncCount} pending`;
  }

  return "Online";
}
