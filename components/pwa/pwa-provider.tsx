"use client";

import { useEffect, type ReactNode } from "react";

import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { PwaStatusBar } from "@/components/pwa/pwa-status-bar";
import { usePwaSync } from "@/hooks/use-pwa-sync";
import { usePwaStore } from "@/store/pwa-store";

export function PwaProvider({ children }: { children: ReactNode }) {
  usePwaSync();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.ready.then(() => {
      usePwaStore.getState().setSwReady(true);
    });
  }, []);

  return (
    <>
      <PwaStatusBar />
      {children}
      <PwaInstallPrompt />
    </>
  );
}
