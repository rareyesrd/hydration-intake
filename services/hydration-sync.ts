import { logHydrationSync } from "@/lib/hydration-sync-log";
import { subscribeHydrationProfile } from "@/services/hydration-service";
import { useHydrationStore } from "@/store/hydration-store";

let activeUserId: string | null = null;
let unsubscribeSnapshot: (() => void) | null = null;

export function startHydrationSync(userId: string) {
  if (activeUserId === userId && unsubscribeSnapshot) {
    logHydrationSync("state", `Hydration sync already active for ${userId}`);
    return;
  }

  stopHydrationSync();
  activeUserId = userId;

  logHydrationSync("state", `Starting hydration sync for ${userId}`);
  useHydrationStore.getState().beginRemoteSync(userId);

  unsubscribeSnapshot = subscribeHydrationProfile(userId, {
    onProfile: (profile) => {
      useHydrationStore.getState().applyRemoteProfile(profile);
    },
    onError: (error) => {
      useHydrationStore.getState().failRemoteSync(error.message);
    }
  });
}

export function stopHydrationSync() {
  if (unsubscribeSnapshot) {
    logHydrationSync("state", `Stopping hydration sync for ${activeUserId ?? "unknown"}`);
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }

  activeUserId = null;
  useHydrationStore.getState().clearRemoteSync();
}
