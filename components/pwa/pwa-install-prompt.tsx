"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Smartphone, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { PWA_APP_NAME } from "@/lib/pwa/constants";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallPrompt() {
  const mounted = useMounted();
  const {
    canInstall,
    isInstalled,
    isDismissed,
    installSuccess,
    promptInstall,
    dismissInstall
  } = usePwaInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  const showBanner = mounted && canInstall && !isDismissed && !isInstalled;

  useEffect(() => {
    if (!installSuccess) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.sessionStorage.removeItem("hydration-pwa-install-success");
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [installSuccess]);

  return (
    <>
      <AnimatePresence>
        {showBanner ? (
          <motion.div
            className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] mx-auto max-w-lg"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
          >
            <div className="overflow-hidden rounded-[26px] border border-cyan-200/25 bg-slate-950/90 p-5 shadow-[0_0_60px_rgba(8,47,73,0.55)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(103,232,249,0.22),transparent_40%)]" />
              <div className="relative flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
                  <Smartphone className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
                    <Sparkles className="size-3.5" />
                    Install app
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">Install {PWA_APP_NAME}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Track hydration like a pro. Add to your home screen for a native,
                    offline-ready experience.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={isInstalling}
                      onClick={() => {
                        setIsInstalling(true);
                        void promptInstall().finally(() => setIsInstalling(false));
                      }}
                    >
                      <Download />
                      {isInstalling ? "Installing…" : "Install App"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={dismissInstall}>
                      Not now
                    </Button>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  onClick={dismissInstall}
                  aria-label="Dismiss install prompt"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {mounted && installSuccess ? (
          <motion.div
            className="fixed inset-x-4 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-[70] mx-auto max-w-sm rounded-2xl border border-emerald-300/30 bg-emerald-500/15 px-4 py-3 text-center text-sm font-semibold text-emerald-100 backdrop-blur-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            Hydration Coach installed — welcome to the native experience.
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
