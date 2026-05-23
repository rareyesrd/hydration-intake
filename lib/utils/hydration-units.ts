export const CUP_VOLUME_OUNCES = 8;
export const OUNCE_TO_LITERS = 0.0295735295625;
export const CUP_VOLUME_LITERS = CUP_VOLUME_OUNCES * OUNCE_TO_LITERS;

export type HydrationInputUnit = "cups" | "liters" | "ounces";
export type HydrationDisplayUnit =
  | "glasses"
  | "liters"
  | "ounces"
  | "milliliters";

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

  return normalized.toFixed(
    normalized * 10 === Math.round(normalized * 10) ? 1 : 2
  );
}

export function formatCupLabel(amount: number) {
  const formatted = formatCupAmount(amount);
  return `${formatted} ${formatted === "1" ? "cup" : "cups"}`;
}

export function formatLiterEquivalent(cups: number) {
  const liters = normalizeCupAmount(cups) * CUP_VOLUME_LITERS;
  return `${liters.toFixed(liters >= 1 ? 2 : 3)}L`;
}

export function cupsToDisplayAmount(cups: number, unit: HydrationDisplayUnit) {
  const normalizedCups = normalizeCupAmount(cups);

  if (unit === "liters") {
    return normalizedCups * CUP_VOLUME_LITERS;
  }

  if (unit === "milliliters") {
    return normalizedCups * CUP_VOLUME_LITERS * 1000;
  }

  if (unit === "ounces") {
    return normalizedCups * CUP_VOLUME_OUNCES;
  }

  return normalizedCups;
}

export function formatHydrationAmount(
  cups: number,
  unit: HydrationDisplayUnit
) {
  const amount = cupsToDisplayAmount(cups, unit);

  if (unit === "liters") {
    return amount.toFixed(amount >= 1 ? 2 : 3);
  }

  if (unit === "milliliters") {
    return String(Math.round(amount));
  }

  if (unit === "ounces") {
    return Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
  }

  return formatCupAmount(amount);
}

export function hydrationUnitLabel(
  unit: HydrationDisplayUnit,
  amount?: number
) {
  if (unit === "liters") {
    return "L";
  }

  if (unit === "milliliters") {
    return "ml";
  }

  if (unit === "ounces") {
    return "oz";
  }

  return amount === 1 ? "glass" : "glasses";
}

export function formatHydrationLabel(cups: number, unit: HydrationDisplayUnit) {
  const value = formatHydrationAmount(cups, unit);
  const numericValue = Number(value);
  return `${value} ${hydrationUnitLabel(unit, numericValue)}`;
}
