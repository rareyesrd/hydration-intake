"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BellRing,
  Cloud,
  Download,
  HardDrive,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Wifi
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { usePwaSync } from "@/hooks/use-pwa-sync";
import {
  buildSmartReminderSchedule,
  getCurrentDevicePushRegistration,
  getNotificationPermissionStatus,
  isFcmConfigured,
  isPushSupported,
  registerFcmTokenForUser,
  scheduleHydrationReminders,
  unregisterFcmTokenForUser
} from "@/services/notification-service";
import { useHydrationStore } from "@/store/hydration-store";
import { usePwaStore } from "@/store/pwa-store";

export function PwaSettings() {
  const { user } = useAuth();
  const { canInstall, isInstalled, promptInstall, resetDismiss } = usePwaInstall();
  const { isOnline, pendingSyncCount, flushQueue } = usePwaSync();
  const swReady = usePwaStore((state) => state.swReady);
  const lastFlushAt = usePwaStore((state) => state.lastFlushAt);
  const settings = useHydrationStore((state) => state.settings);
  const enableBrowserNotifications = useHydrationStore(
    (state) => state.enableBrowserNotifications
  );
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported" | "loading"
  >("loading");
  const [isPushRegistered, setIsPushRegistered] = useState(false);
  const [isPushBusy, setIsPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [fcmConfigured, setFcmConfigured] = useState(false);
  const smartSchedule = useMemo(() => buildSmartReminderSchedule(settings), [settings]);

  useEffect(() => {
    let active = true;
    const frame = window.requestAnimationFrame(() => {
      if (!active) {
        return;
      }

      setPushSupported(isPushSupported());
      setFcmConfigured(isFcmConfigured());
    });

    void getNotificationPermissionStatus().then((status) => {
      if (active) {
        setPermission(status);
      }
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      const frame = window.requestAnimationFrame(() => setIsPushRegistered(false));
      return () => window.cancelAnimationFrame(frame);
    }

    let active = true;

    void getCurrentDevicePushRegistration(user.uid).then((record) => {
      if (active) {
        setIsPushRegistered(Boolean(record));
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  async function enablePushReminders() {
    if (!user) {
      setPushMessage("Sign in first so this device can be linked to your profile.");
      return;
    }

    setIsPushBusy(true);
    setPushMessage(null);

    try {
      const result = await registerFcmTokenForUser(user.uid);

      if (!result.ok) {
        setPermission(await getNotificationPermissionStatus());
        setPushMessage(notificationFailureCopy(result.reason));
        return;
      }

      await Promise.all([
        scheduleHydrationReminders(user.uid, smartSchedule),
        enableBrowserNotifications()
      ]);
      setPermission("granted");
      setIsPushRegistered(true);
      setPushMessage("Smart push reminders are active on this device.");
    } finally {
      setIsPushBusy(false);
    }
  }

  async function disablePushReminders() {
    if (!user) {
      return;
    }

    setIsPushBusy(true);
    setPushMessage(null);

    try {
      await unregisterFcmTokenForUser(user.uid);
      await scheduleHydrationReminders(user.uid, {
        ...smartSchedule,
        enabled: false
      });
      setIsPushRegistered(false);
      setPushMessage("This device will no longer receive push reminders.");
    } finally {
      setIsPushBusy(false);
    }
  }

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
        <StatusTile
          icon={BellRing}
          label="Push"
          value={pushStatusLabel(permission, isPushRegistered)}
        />
        <StatusTile
          icon={Smartphone}
          label="PWA mode"
          value={isInstalled ? "Installed" : "Browser"}
        />
      </div>

      {lastFlushAt ? (
        <p className="text-glass-muted text-xs">Last sync flush: {new Date(lastFlushAt).toLocaleString()}</p>
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
        className="overflow-hidden rounded-2xl border border-cyan-200/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_42%),rgba(2,6,23,0.72)] p-4 text-sm text-slate-400"
        layout
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-semibold text-cyan-100">
              <BellRing className="size-4" />
              Smart push reminders
            </div>
            <p className="mt-2 max-w-md">
              FCM push is tied to this device and your hydration pace. If you fall
              behind, reminder windows tighten; if you are ahead, they back off.
            </p>
          </div>
          <div className="rounded-full border border-cyan-200/20 bg-cyan-200/10 p-2 text-cyan-100">
            <ShieldCheck className="size-4" />
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <MiniMetric label="Permission" value={permissionLabel(permission)} />
          <MiniMetric
            label="Cadence"
            value={`${smartSchedule.intervalMinutes}m smart`}
          />
          <MiniMetric
            label="Quiet hours"
            value={`${smartSchedule.quietHoursStart}:00-${smartSchedule.quietHoursEnd}:00`}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void enablePushReminders()}
            disabled={
              isPushBusy ||
              !user ||
              !pushSupported ||
              !fcmConfigured ||
              permission === "denied"
            }
          >
            {isPushBusy ? <Loader2 className="animate-spin" /> : <BellRing />}
            {isPushRegistered ? "Refresh push device" : "Enable push reminders"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void disablePushReminders()}
            disabled={isPushBusy || !user || !isPushRegistered}
          >
            Disable on this device
          </Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          {pushMessage ??
            pushSupportCopy({ pushSupported, fcmConfigured, permission, isInstalled })}
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
      <div className="text-glass-label flex items-center gap-2 font-semibold">
        <Icon className="size-3.5 text-cyan-200" />
        {label}
      </div>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cyan-100/55">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function permissionLabel(permission: NotificationPermission | "unsupported" | "loading") {
  if (permission === "loading") {
    return "Checking";
  }

  if (permission === "unsupported") {
    return "Unsupported";
  }

  return permission === "default" ? "Not asked" : permission;
}

function pushStatusLabel(
  permission: NotificationPermission | "unsupported" | "loading",
  registered: boolean
) {
  if (registered) {
    return "Registered";
  }

  if (permission === "granted") {
    return "Ready";
  }

  return permissionLabel(permission);
}

function pushSupportCopy({
  pushSupported,
  fcmConfigured,
  permission,
  isInstalled
}: {
  pushSupported: boolean;
  fcmConfigured: boolean;
  permission: NotificationPermission | "unsupported" | "loading";
  isInstalled: boolean;
}) {
  if (!fcmConfigured) {
    return "Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to enable Firebase Cloud Messaging in this environment.";
  }

  if (!pushSupported) {
    return "This browser does not expose PushManager. On iOS, install the app to the Home Screen before enabling push.";
  }

  if (permission === "denied") {
    return "Notifications are blocked for this site. Re-enable them in browser or OS settings.";
  }

  if (!isInstalled) {
    return "For the best iOS and Android behavior, install the app as a PWA before enabling reminders.";
  }

  return "Foreground reminders appear in-app; background reminders are delivered by the service worker when this PWA is closed.";
}

function notificationFailureCopy(reason: string) {
  const failures: Record<string, string> = {
    denied: "Notifications are blocked for this site. Re-enable permission in browser settings.",
    default: "Notification permission was not granted.",
    "unsupported-or-unconfigured":
      "Push is not available on this device or Firebase Cloud Messaging is not configured.",
    "firebase-unavailable": "Firebase is not available in this environment.",
    "token-unavailable": "Firebase did not return a device token. Try again after reinstalling the PWA."
  };

  return failures[reason] ?? "Push reminders could not be enabled on this device.";
}
