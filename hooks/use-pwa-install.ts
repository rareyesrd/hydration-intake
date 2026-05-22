"use client";

import { useCallback, useEffect, useState } from "react";

import { INSTALL_DISMISS_KEY, INSTALL_SUCCESS_KEY } from "@/lib/pwa/constants";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setIsDismissed(window.localStorage.getItem(INSTALL_DISMISS_KEY) === "1");
      setInstallSuccess(window.sessionStorage.getItem(INSTALL_SUCCESS_KEY) === "1");

      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator &&
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

      setIsInstalled(standalone);
    });

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallSuccess(true);
      window.sessionStorage.setItem(INSTALL_SUCCESS_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const canInstall = Boolean(deferredPrompt) && !isInstalled;

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallSuccess(true);
      window.sessionStorage.setItem(INSTALL_SUCCESS_KEY, "1");
      setDeferredPrompt(null);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  const dismissInstall = useCallback(() => {
    setIsDismissed(true);
    window.localStorage.setItem(INSTALL_DISMISS_KEY, "1");
  }, []);

  const resetDismiss = useCallback(() => {
    setIsDismissed(false);
    window.localStorage.removeItem(INSTALL_DISMISS_KEY);
  }, []);

  return {
    canInstall,
    isInstalled,
    isDismissed,
    installSuccess,
    promptInstall,
    dismissInstall,
    resetDismiss
  };
}
