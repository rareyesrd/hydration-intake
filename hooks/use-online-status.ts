"use client";

import { useEffect } from "react";

import { usePwaStore } from "@/store/pwa-store";

export function useOnlineStatus() {
  const isOnline = usePwaStore((state) => state.isOnline);
  const setOnline = usePwaStore((state) => state.setOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  return isOnline;
}
