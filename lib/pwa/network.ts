export function isAppOnline() {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

export function isNetworkError(error: unknown) {
  if (error instanceof TypeError) {
    return true;
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);
    return code === "unavailable" || code === "network-request-failed";
  }

  return false;
}
