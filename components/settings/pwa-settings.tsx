"use client";

import { motion } from "framer-motion";
import { BellRing, Cloud, Download, HardDrive, RefreshCcw, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { usePwaSync } from "@/hooks/use-pwa-sync";
import { isPushSupported } from "@/services/notification-service";
import { usePwaStore } from "@/store/pwa-store";

export function PwaSettings() {
  const { canInstall, isInstalled, promptInstall, resetDismiss } = usePwaInstall();
  const { isOnline, pendingSyncCount, flushQueue } = usePwaSync();
  const swReady = usePwaStore((state) => state.swReady);
  const lastFlushAt = usePwaStore((state) => state.lastFlushAt);

  return (
    <div className="space-y-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">App install</p>
        <h3 className="mt-2 text-xl font-black text-white">Progressive Web App</h3>
        <p className="mt-2 text-sm text-slate-400">
          Install for standalone mode, offline logging, and faster startup.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <StatusTile
          icon={Wifi}
          label="Connection"
          value={isOnline ? "Online" : "Offline"}
        />
        <StatusTile
          icon={RefreshCcw}
          label="Pending sync"
          value={pendingSyncCount > 0 ? `${pendingSyncCount} logs` : "Up to date"}
        />
        <StatusTile
          icon={HardDrive}
          label="Service worker"
          value={swReady ? "Active" : "Loading"}
        />
        <StatusTile
          icon={Cloud}
          label="Cache"
          value="Stale-while-revalidate"
        />
      </div>

      {lastFlushAt ? (
        <p className="text-xs text-slate-500">Last sync flush: {new Date(lastFlushAt).toLocaleString()}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canInstall ? (
          <Button type="button" onClick={() => void promptInstall()}>
            <Download />
            Install App
          </Button>
        ) : (
          <Button type="button" variant="secondary" disabled>
            <Download />
            {isInstalled ? "Installed" : "Install unavailable"}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={() => void flushQueue()}>
          <RefreshCcw />
          Sync now
        </Button>
        <Button type="button" variant="ghost" onClick={resetDismiss}>
          Show install prompt
        </Button>
      </div>

      <motion.div
        className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm text-slate-400"
        layout
      >
        <div className="flex items-center gap-2 font-semibold text-cyan-100">
          <BellRing className="size-4" />
          Push reminders (coming soon)
        </div>
        <p className="mt-2">
          {isPushSupported()
            ? "Architecture is ready for hydration reminders and background nudges."
            : "Push is not supported on this device yet."}
        </p>
      </motion.div>
    </div>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Wifi;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <Icon className="size-3.5 text-cyan-200" />
        {label}
      </div>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
