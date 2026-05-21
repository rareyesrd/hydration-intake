const PREFIX = "[hydration-sync]";

type HydrationSyncPhase =
  | "auth"
  | "read"
  | "write"
  | "snapshot"
  | "state"
  | "error";

export function logHydrationSync(
  phase: HydrationSyncPhase,
  message: string,
  details?: unknown
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  if (details === undefined) {
    console.info(`${PREFIX} [${phase}] ${message}`);
    return;
  }

  console.info(`${PREFIX} [${phase}] ${message}`, details);
}

export function logHydrationSyncError(
  phase: HydrationSyncPhase,
  message: string,
  error: unknown
) {
  console.error(`${PREFIX} [${phase}] ${message}`, error);
}
