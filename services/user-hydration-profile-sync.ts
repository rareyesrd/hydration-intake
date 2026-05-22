import { logHydrationSync } from "@/lib/hydration-sync-log";
import { subscribeUserHydrationDocument } from "@/services/user-hydration-profile-service";
import { useHydrationProfileStore } from "@/store/hydration-profile-store";

let activeUserId: string | null = null;
let unsubscribeSnapshot: (() => void) | null = null;

export function startUserHydrationProfileSync(userId: string) {
  if (activeUserId === userId && unsubscribeSnapshot) {
    return;
  }

  stopUserHydrationProfileSync();
  activeUserId = userId;

  logHydrationSync("state", `Starting user hydration profile sync for ${userId}`);
  useHydrationProfileStore.getState().setSessionUser(userId);

  unsubscribeSnapshot = subscribeUserHydrationDocument(userId, {
    onDocument: (document) => {
      useHydrationProfileStore.getState().applyRemoteDocument(document);
    },
    onError: (error) => {
      useHydrationProfileStore.getState().failRemoteSync(error.message);
    }
  });
}

export function stopUserHydrationProfileSync() {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }

  activeUserId = null;
  useHydrationProfileStore.getState().clearRemoteSync();
}
