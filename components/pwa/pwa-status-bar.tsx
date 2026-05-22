"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CloudOff, RefreshCcw, Wifi } from "lucide-react";

import { getPwaConnectivityLabel, usePwaStore } from "@/store/pwa-store";

export function PwaStatusBar() {
  const isOnline = usePwaStore((state) => state.isOnline);
  const pendingSyncCount = usePwaStore((state) => state.pendingSyncCount);
  const label = getPwaConnectivityLabel({ isOnline, pendingSyncCount });

  const show = !isOnline || pendingSyncCount > 0;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))]"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
        >
          <div
            className={
              isOnline
                ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3 py-1.5 text-xs font-semibold text-cyan-50 backdrop-blur-xl"
                : "inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-50 backdrop-blur-xl"
            }
          >
            {isOnline ? <RefreshCcw className="size-3.5" /> : <CloudOff className="size-3.5" />}
            {label}
            {!isOnline ? <Wifi className="size-3.5 opacity-60" /> : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
