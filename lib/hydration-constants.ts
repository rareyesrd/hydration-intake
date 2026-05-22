import type {
  ActivityLevel,
  ClimateType,
  SweatLevel
} from "@/types/athlete-hydration-profile";

/** Base metabolic hydration coefficient (L per kg body weight). */
export const BASE_HYDRATION_COEFFICIENT = 0.035;

export const MIN_DAILY_LITERS = 1.8;
export const NORMAL_MAX_DAILY_LITERS = 5.5;
export const INTENSE_MAX_DAILY_LITERS = 6.5;

export const MAX_ACTIVITY_ADJUSTMENT_L = 1.5;
export const MAX_CLIMATE_ADJUSTMENT_L = 0.75;
export const MAX_SWEAT_ADJUSTMENT_L = 0.5;
export const MAX_LIFESTYLE_ADJUSTMENT_L = 0.75;

export const RANGE_SPREAD_L = 0.3;
export const DEFAULT_TRAINING_DAY_BOOST_L = 0.75;
export const RECOVERY_DAY_REDUCTION_L = 0.35;

export const ACTIVITY_LEVEL_LITERS: Record<ActivityLevel, number> = {
  sedentary: 0,
  lightly_active: 0.25,
  moderately_active: 0.5,
  highly_active: 0.75,
  athlete: 1
};

export const CLIMATE_LITERS: Record<ClimateType, number> = {
  cold: 0,
  temperate: 0.25,
  hot: 0.5,
  hot_humid: 0.75
};

export const SWEAT_LITERS: Record<SweatLevel, number> = {
  low: 0,
  medium: 0.25,
  high: 0.5
};

export const LIFESTYLE_FACTOR_L = 0.25;
