import {
  ACTIVITY_LEVEL_LITERS,
  BASE_HYDRATION_COEFFICIENT,
  CLIMATE_LITERS,
  DEFAULT_TRAINING_DAY_BOOST_L,
  INTENSE_MAX_DAILY_LITERS,
  LIFESTYLE_FACTOR_L,
  MAX_ACTIVITY_ADJUSTMENT_L,
  MAX_CLIMATE_ADJUSTMENT_L,
  MAX_LIFESTYLE_ADJUSTMENT_L,
  MAX_SWEAT_ADJUSTMENT_L,
  MIN_DAILY_LITERS,
  NORMAL_MAX_DAILY_LITERS,
  RANGE_SPREAD_L,
  RECOVERY_DAY_REDUCTION_L,
  SWEAT_LITERS
} from "@/lib/hydration-constants";
import { GLASS_VOLUME_LITERS } from "@/types/athlete-hydration-profile";
import type {
  AthleteHydrationProfile,
  CalculatedHydrationTarget,
  ClimateType,
  DayModeTarget,
  HydrationAdjustment,
  HydrationDayMode,
  HydrationInsight,
  HydrationRecommendationLabel,
  LifestyleFactors,
  PerformanceFocus,
  SweatLevel
} from "@/types/athlete-hydration-profile";

export type HydrationCalculationOptions = {
  workoutDayBoostLiters?: number;
  athleteModeEnabled?: boolean;
};

export function weightToKg(weight: number, unit: "kg" | "lbs") {
  return unit === "kg" ? weight : weight * 0.453592;
}

export function heightToCm(height: number, unit: "cm" | "ft") {
  return unit === "cm" ? height : height * 30.48;
}

export function litersToGlasses(liters: number) {
  return Math.max(6, Math.min(22, Math.round(liters / GLASS_VOLUME_LITERS)));
}

function roundLiters(value: number) {
  return Math.round(value * 10) / 10;
}

function clampLiters(value: number, maxLiters: number) {
  return Math.min(maxLiters, Math.max(MIN_DAILY_LITERS, value));
}

function pushAdjustment(
  adjustments: HydrationAdjustment[],
  id: string,
  label: string,
  impactLiters: number,
  description: string
) {
  if (Math.abs(impactLiters) < 0.01) {
    return;
  }

  adjustments.push({ id, label, impactLiters: roundLiters(impactLiters), description });
}

/** Workout duration bonus — does not stack beyond activity cap. */
export function workoutDurationLiters(durationMinutes: number) {
  if (durationMinutes < 30) {
    return 0.25;
  }

  if (durationMinutes < 60) {
    return 0.5;
  }

  if (durationMinutes < 90) {
    return 0.75;
  }

  return 1;
}

/** Activity level + workout duration, capped at +1.5L total. */
export function calculateActivityAdjustmentLiters(profile: AthleteHydrationProfile) {
  const levelLiters = ACTIVITY_LEVEL_LITERS[profile.activity.level];
  const duration = profile.activity.workoutDurationMinutes ?? 0;
  const workoutLiters = duration > 0 ? workoutDurationLiters(duration) : 0;

  return Math.min(MAX_ACTIVITY_ADJUSTMENT_L, levelLiters + workoutLiters);
}

export function calculateClimateAdjustmentLiters(climate: ClimateType) {
  return Math.min(MAX_CLIMATE_ADJUSTMENT_L, CLIMATE_LITERS[climate]);
}

export function calculateSweatAdjustmentLiters(sweatLevel?: SweatLevel) {
  if (!sweatLevel) {
    return 0;
  }

  return Math.min(MAX_SWEAT_ADJUSTMENT_L, SWEAT_LITERS[sweatLevel]);
}

/** Lifestyle factors capped at +0.75L combined. */
export function calculateLifestyleAdjustmentLiters(lifestyle: LifestyleFactors) {
  let total = 0;

  if (lifestyle.caffeineIntake === "high") {
    total += LIFESTYLE_FACTOR_L;
  }

  if (lifestyle.alcoholIntake === "moderate" || lifestyle.alcoholIntake === "high") {
    total += LIFESTYLE_FACTOR_L;
  }

  if (lifestyle.highProteinDiet) {
    total += LIFESTYLE_FACTOR_L;
  }

  if (lifestyle.creatineUsage) {
    total += LIFESTYLE_FACTOR_L;
  }

  if (lifestyle.ketogenicDiet) {
    total += LIFESTYLE_FACTOR_L;
  }

  return Math.min(MAX_LIFESTYLE_ADJUSTMENT_L, total);
}

export function qualifiesForIntenseDay(profile: AthleteHydrationProfile) {
  const duration = profile.activity.workoutDurationMinutes ?? 0;
  const hotClimate =
    profile.climate.climate === "hot" || profile.climate.climate === "hot_humid";

  return (
    profile.activity.level === "athlete" &&
    hotClimate &&
    (profile.climate.sweatLevel === "high" || duration >= 60)
  );
}

/** Standard-day ceiling — intense caps apply only to intense_athlete_day mode. */
export function resolveStandardMaxLiters() {
  return NORMAL_MAX_DAILY_LITERS;
}

function buildRange(optimalLiters: number, maxLiters: number) {
  const rangeMinLiters = roundLiters(Math.max(MIN_DAILY_LITERS, optimalLiters - RANGE_SPREAD_L));
  const rangeMaxLiters = roundLiters(Math.min(maxLiters, optimalLiters + RANGE_SPREAD_L));

  return {
    rangeMinLiters,
    rangeMaxLiters,
    rangeLabel: `${rangeMinLiters}–${rangeMaxLiters}L`
  };
}

function buildRecommendationLabel(
  profile: AthleteHydrationProfile,
  standardLiters: number
): HydrationRecommendationLabel {
  if (
    profile.performance.primaryGoal === "recovery_optimization" ||
    profile.performance.recoveryPriority === "high"
  ) {
    return "recovery_optimized";
  }

  if (qualifiesForIntenseDay(profile)) {
    return "aggressive_athlete";
  }

  if (profile.activity.level === "sedentary" || profile.activity.level === "lightly_active") {
    return "conservative";
  }

  if (standardLiters >= 4.8) {
    return "recommended";
  }

  return "recommended";
}

function buildConfidenceScore(profile: AthleteHydrationProfile) {
  let score = 68;

  if (profile.bodyMetrics.age) {
    score += 4;
  }
  if (profile.bodyMetrics.bodyFatPercent) {
    score += 4;
  }
  if (profile.activity.workoutsPerWeek) {
    score += 5;
  }
  if (profile.climate.sweatLevel) {
    score += 5;
  }
  if (profile.performance.sleepQuality) {
    score += 4;
  }

  return Math.min(96, score);
}

function buildInsights(
  profile: AthleteHydrationProfile,
  activityLiters: number,
  climateLiters: number,
  lifestyleLiters: number
): HydrationInsight[] {
  const insights: HydrationInsight[] = [];

  if (climateLiters > 0) {
    insights.push({
      id: "climate",
      message: "Your climate increases fluid loss — pace intake across the day.",
      category: "climate"
    });
  }

  if (activityLiters >= 0.5) {
    insights.push({
      id: "activity",
      message: "High activity days require additional hydration around sessions.",
      category: "activity"
    });
  }

  if (profile.lifestyle.creatineUsage) {
    insights.push({
      id: "creatine",
      message: "Creatine usage may increase water demand — spread intake steadily.",
      category: "lifestyle"
    });
  }

  if (lifestyleLiters > 0) {
    insights.push({
      id: "lifestyle",
      message: "Lifestyle factors modestly raise your baseline — stay consistent.",
      category: "lifestyle"
    });
  }

  insights.push({
    id: "recovery",
    message: "Consistent hydration improves recovery and training quality.",
    category: "recovery"
  });

  return insights;
}

function buildDayModes(
  standardLiters: number,
  trainingBoost: number,
  intenseLiters: number,
  intenseEligible: boolean
): DayModeTarget[] {
  const recoveryLiters = clampLiters(
    standardLiters - RECOVERY_DAY_REDUCTION_L,
    NORMAL_MAX_DAILY_LITERS
  );
  const trainingCap = intenseEligible
    ? INTENSE_MAX_DAILY_LITERS
    : Math.min(NORMAL_MAX_DAILY_LITERS + 0.5, 6);
  const trainingLiters = clampLiters(standardLiters + trainingBoost, trainingCap);
  const intenseCapped = clampLiters(intenseLiters, INTENSE_MAX_DAILY_LITERS);

  return [
    {
      mode: "recovery_day",
      liters: recoveryLiters,
      glasses: litersToGlasses(recoveryLiters),
      label: "Recovery Day",
      guidance: "Lighter training or rest — slightly reduce volume while staying consistent."
    },
    {
      mode: "standard_day",
      liters: standardLiters,
      glasses: litersToGlasses(standardLiters),
      label: "Standard Day",
      guidance: "Your balanced daily target for typical training and lifestyle."
    },
    {
      mode: "training_day",
      liters: trainingLiters,
      glasses: litersToGlasses(trainingLiters),
      label: "Training Day",
      guidance: `On practice or workout days, increase intake by ~${roundLiters(trainingBoost)}L.`
    },
    {
      mode: "intense_athlete_day",
      liters: intenseCapped,
      glasses: litersToGlasses(intenseCapped),
      label: "Intense Athlete Day",
      guidance: "Reserved for heavy sweat, heat, and long sessions — upper safe range only."
    }
  ];
}

function buildAdjustments(
  profile: AthleteHydrationProfile,
  baseLiters: number,
  activityLiters: number,
  climateLiters: number,
  sweatLiters: number,
  lifestyleLiters: number
) {
  const adjustments: HydrationAdjustment[] = [];

  pushAdjustment(
    adjustments,
    "base",
    "Baseline",
    baseLiters,
    `Body-weight baseline at ${BASE_HYDRATION_COEFFICIENT}L per kg.`
  );

  if (activityLiters > 0) {
    pushAdjustment(
      adjustments,
      "activity",
      "Activity & training",
      activityLiters,
      "Combined activity level and session duration (capped at +1.5L)."
    );
  }

  if (climateLiters > 0) {
    pushAdjustment(
      adjustments,
      "climate",
      "Climate",
      climateLiters,
      "Environmental heat increases daily fluid needs (capped at +0.75L)."
    );
  }

  if (sweatLiters > 0) {
    pushAdjustment(
      adjustments,
      "sweat",
      "Sweat rate",
      sweatLiters,
      "Sweat profile adds a controlled hydration bump (capped at +0.5L)."
    );
  }

  if (lifestyleLiters > 0) {
    pushAdjustment(
      adjustments,
      "lifestyle",
      "Lifestyle factors",
      lifestyleLiters,
      "Diet and stimulant factors combined (capped at +0.75L)."
    );
  }

  return adjustments;
}

function buildWorkoutGuidance(
  profile: AthleteHydrationProfile,
  trainingBoost: number
) {
  const duration = profile.activity.workoutDurationMinutes ?? 0;
  const frequency = profile.activity.workoutsPerWeek ?? 0;

  if (duration <= 0 || frequency <= 0) {
    return "Add workout duration in your profile to unlock training-day guidance.";
  }

  return `On training days (~${frequency}x/week, ${duration} min), increase intake by ~${roundLiters(trainingBoost)}L.`;
}

function buildSummary(rangeLabel: string, glassesPerDay: number, label: HydrationRecommendationLabel) {
  const tone =
    label === "conservative"
      ? "Conservative"
      : label === "aggressive_athlete"
        ? "Athlete upper range"
        : label === "recovery_optimized"
          ? "Recovery optimized"
          : "Recommended";

  return `${tone} daily hydration: ${rangeLabel} (~${glassesPerDay} glasses at your optimal target).`;
}

/**
 * Weighted, capped hydration model.
 * Base: weightKg * 0.035 + controlled additive adjustments with safety ceilings.
 */
export function calculateHydrationTarget(
  profile: AthleteHydrationProfile,
  options: HydrationCalculationOptions = {}
): CalculatedHydrationTarget {
  const weightKg = weightToKg(
    profile.bodyMetrics.weight,
    profile.bodyMetrics.weightUnit
  );
  const baseLiters = roundLiters(weightKg * BASE_HYDRATION_COEFFICIENT);
  const maxLiters = resolveStandardMaxLiters();
  const trainingBoost = options.workoutDayBoostLiters ?? DEFAULT_TRAINING_DAY_BOOST_L;
  const intenseEligible =
    qualifiesForIntenseDay(profile) || (options.athleteModeEnabled ?? false);

  const activityLiters = calculateActivityAdjustmentLiters(profile);
  const climateLiters = calculateClimateAdjustmentLiters(profile.climate.climate);
  const sweatLiters = calculateSweatAdjustmentLiters(profile.climate.sweatLevel);
  const lifestyleLiters = calculateLifestyleAdjustmentLiters(profile.lifestyle);

  const rawStandard = baseLiters + activityLiters + climateLiters + sweatLiters + lifestyleLiters;
  const standardDayLiters = roundLiters(clampLiters(rawStandard, maxLiters));
  const intenseDayLiters = intenseEligible
    ? roundLiters(
        clampLiters(standardDayLiters + trainingBoost + 0.5, INTENSE_MAX_DAILY_LITERS)
      )
    : roundLiters(clampLiters(standardDayLiters + trainingBoost, maxLiters));

  const { rangeMinLiters, rangeMaxLiters, rangeLabel } = buildRange(standardDayLiters, maxLiters);
  const optimalLiters = standardDayLiters;
  const glassesPerDay = litersToGlasses(optimalLiters);
  const recommendationLabel = buildRecommendationLabel(profile, standardDayLiters);
  const adjustments = buildAdjustments(
    profile,
    baseLiters,
    activityLiters,
    climateLiters,
    sweatLiters,
    lifestyleLiters
  );
  const insights = buildInsights(profile, activityLiters, climateLiters, lifestyleLiters);
  const dayModes = buildDayModes(
    standardDayLiters,
    trainingBoost,
    intenseDayLiters,
    intenseEligible
  );

  return {
    baseLiters,
    optimalLiters,
    litersPerDay: optimalLiters,
    adjustedLiters: optimalLiters,
    rangeMinLiters,
    rangeMaxLiters,
    rangeLabel,
    glassesPerDay,
    glassesMin: litersToGlasses(rangeMinLiters),
    glassesMax: litersToGlasses(rangeMaxLiters),
    millilitersPerDay: Math.round(optimalLiters * 1000),
    hydrationScore: Math.min(
      100,
      Math.round(58 + glassesPerDay * 1.8 + (profile.activity.level === "athlete" ? 6 : 0))
    ),
    confidenceScore: buildConfidenceScore(profile),
    recommendationLabel,
    standardDayLiters,
    trainingDayBoostLiters: trainingBoost,
    workoutDayGuidance: buildWorkoutGuidance(profile, trainingBoost),
    dayModes,
    adjustments,
    insights,
    summary: buildSummary(rangeLabel, glassesPerDay, recommendationLabel),
    calculatedAt: new Date().toISOString()
  };
}

export function resolveLitersForDayMode(
  target: CalculatedHydrationTarget,
  mode: HydrationDayMode = "standard_day"
) {
  const match = target.dayModes.find((entry) => entry.mode === mode);
  return match?.liters ?? target.optimalLiters;
}

export function draftToAthleteProfile(draft: {
  bodyMetrics: AthleteHydrationProfile["bodyMetrics"];
  activity: AthleteHydrationProfile["activity"];
  climate: AthleteHydrationProfile["climate"];
  lifestyle: LifestyleFactors;
  performance: PerformanceFocus;
}): AthleteHydrationProfile {
  return {
    bodyMetrics: draft.bodyMetrics,
    activity: draft.activity,
    climate: draft.climate,
    lifestyle: draft.lifestyle,
    performance: draft.performance
  };
}

export function getEffectiveDailyGoal(document: {
  dynamicGoalEnabled: boolean;
  manualGoal?: number;
  calculatedHydrationTarget?: CalculatedHydrationTarget;
  hydrationGoal: number;
  activeDayMode?: HydrationDayMode;
  athleteModeEnabled?: boolean;
  workoutDayBoostLiters?: number;
  hydrationProfile?: AthleteHydrationProfile;
}) {
  if (!document.dynamicGoalEnabled && document.manualGoal) {
    return document.manualGoal;
  }

  if (document.calculatedHydrationTarget) {
    const mode = document.activeDayMode ?? "standard_day";
    const liters = resolveLitersForDayMode(document.calculatedHydrationTarget, mode);
    return litersToGlasses(liters);
  }

  if (document.hydrationProfile) {
    const target = calculateHydrationTarget(document.hydrationProfile, {
      athleteModeEnabled: document.athleteModeEnabled,
      workoutDayBoostLiters: document.workoutDayBoostLiters
    });
    const mode = document.activeDayMode ?? "standard_day";
    return litersToGlasses(resolveLitersForDayMode(target, mode));
  }

  return document.hydrationGoal ?? 11;
}
