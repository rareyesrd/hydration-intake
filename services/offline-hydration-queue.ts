import type { QueuedHydrationSync } from "@/types/offline-hydration";

const QUEUE_KEY = "hydration-offline-sync-queue";

function readQueue(): QueuedHydrationSync[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as QueuedHydrationSync[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedHydrationSync[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getOfflineQueueCount() {
  return readQueue().length;
}

export function enqueueHydrationSync(entry: Omit<QueuedHydrationSync, "id" | "createdAt">) {
  const queue = readQueue();

  queue.push({
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  });

  writeQueue(queue);
  return queue.length;
}

export function peekOfflineQueue() {
  return readQueue();
}

export function clearOfflineQueue() {
  writeQueue([]);
}

export function dequeueHydrationSyncBatch(limit = 20) {
  const queue = readQueue();
  const batch = queue.slice(0, limit);
  writeQueue(queue.slice(limit));
  return batch;
}
