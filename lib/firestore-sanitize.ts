/** Firestore rejects `undefined` field values; omit them before writes. */
export function sanitizeForFirestore<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as T;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, sanitizeForFirestore(entry)])
  ) as T;
}
