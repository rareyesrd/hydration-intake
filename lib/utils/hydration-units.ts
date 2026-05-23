export const CUP_VOLUME_OUNCES = 8;
export const OUNCE_TO_LITERS = 0.0295735295625;
export const CUP_VOLUME_LITERS = CUP_VOLUME_OUNCES * OUNCE_TO_LITERS;

export type HydrationInputUnit = "cups" | "liters" | "ounces";

export function litersToCups(liters: number) {
  return normalizeCupAmount(liters / CUP_VOLUME_LITERS);
}

export function ouncesToCups(ounces: number) {
  return normalizeCupAmount(ounces / CUP_VOLUME_OUNCES);
}

export function toCupAmount(amount: number, unit: HydrationInputUnit) {
  if (unit === "liters") {
    return litersToCups(amount);
  }

  if (unit === "ounces") {
    return ouncesToCups(amount);
  }

  return normalizeCupAmount(amount);
}

export function normalizeCupAmount(amount: number) {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(Math.max(0, amount) * 100) / 100;
}

export function cupFillRatio(consumed: number, cupIndex: number) {
  return Math.min(1, Math.max(0, consumed - cupIndex));
}

export function formatCupAmount(amount: number) {
  const normalized = normalizeCupAmount(amount);

  if (Number.isInteger(normalized)) {
    return String(normalized);
  }

  return normalized.toFixed(normalized * 10 === Math.round(normalized * 10) ? 1 : 2);
}

export function formatCupLabel(amount: number) {
  const formatted = formatCupAmount(amount);
  return `${formatted} ${formatted === "1" ? "cup" : "cups"}`;
}

export function formatLiterEquivalent(cups: number) {
  const liters = normalizeCupAmount(cups) * CUP_VOLUME_LITERS;
  return `${liters.toFixed(liters >= 1 ? 2 : 3)}L`;
}
