export type WeightUnit = "kg" | "lbs";
export type HeightUnit = "cm" | "ft";
export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "highly_active"
  | "athlete";

export type ClimateType = "cold" | "temperate" | "hot" | "hot_humid";
export type SweatLevel = "low" | "medium" | "high";
export type PrimaryHydrationGoal =
  | "general_wellness"
  | "muscle_gain"
  | "athletic_performance"
  | "fat_loss"
  | "recovery_optimization";

export type IntakeLevel = "none" | "low" | "moderate" | "high";

export type HydrationDayMode =
  | "recovery_day"
  | "standard_day"
  | "training_day"
  | "intense_athlete_day";

export type HydrationRecommendationLabel =
  | "conservative"
  | "recommended"
  | "aggressive_athlete"
  | "recovery_optimized";

export type BodyMetrics = {
  weight: number;
  weightUnit: WeightUnit;
  height: number;
  heightUnit: HeightUnit;
  bodyFatPercent?: number;
  age?: number;
};

export type ActivityProfile = {
  level: ActivityLevel;
  workoutDurationMinutes?: number;
  workoutsPerWeek?: number;
};

export type ClimateProfile = {
  climate: ClimateType;
  sweatLevel?: SweatLevel;
  outdoorTrainingPerWeek?: number;
};

export type LifestyleFactors = {
  caffeineIntake: IntakeLevel;
  alcoholIntake: IntakeLevel;
  highProteinDiet: boolean;
  creatineUsage: boolean;
  ketogenicDiet: boolean;
  fasting: boolean;
  sodiumIntake: IntakeLevel;
};

export type PerformanceFocus = {
  primaryGoal: PrimaryHydrationGoal;
  sleepQuality?: "poor" | "fair" | "good" | "excellent";
  recoveryPriority?: "low" | "medium" | "high";
  energyLevels?: "low" | "steady" | "high";
};

export type AthleteHydrationProfile = {
  bodyMetrics: BodyMetrics;
  activity: ActivityProfile;
  climate: ClimateProfile;
  lifestyle: LifestyleFactors;
  performance: PerformanceFocus;
};

export type HydrationAdjustment = {
  id: string;
  label: string;
  impactLiters: number;
  description: string;
};

export type HydrationInsight = {
  id: string;
  message: string;
  category: "climate" | "activity" | "lifestyle" | "recovery" | "training";
};

export type DayModeTarget = {
  mode: HydrationDayMode;
  liters: number;
  glasses: number;
  label: string;
  guidance: string;
};

export type CalculatedHydrationTarget = {
  baseLiters: number;
  /** Optimal standard-day target (mid-range). */
  optimalLiters: number;
  litersPerDay: number;
  adjustedLiters: number;
  rangeMinLiters: number;
  rangeMaxLiters: number;
  rangeLabel: string;
  glassesPerDay: number;
  glassesMin: number;
  glassesMax: number;
  millilitersPerDay: number;
  hydrationScore: number;
  confidenceScore: number;
  recommendationLabel: HydrationRecommendationLabel;
  standardDayLiters: number;
  trainingDayBoostLiters: number;
  workoutDayGuidance: string;
  dayModes: DayModeTarget[];
  adjustments: HydrationAdjustment[];
  insights: HydrationInsight[];
  summary: string;
  calculatedAt: string;
};

export type UserHydrationDocument = {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  provider: "google";
  createdAt: string;
  updatedAt: string;
  profileVersion: number;
  onboardingCompleted: boolean;
  onboardingStep: number;
  hydrationProfile?: AthleteHydrationProfile;
  lifestyleFactors?: LifestyleFactors;
  calculatedHydrationTarget?: CalculatedHydrationTarget;
  hydrationGoal: number;
  dynamicGoalEnabled: boolean;
  manualGoal?: number;
  athleteModeEnabled?: boolean;
  workoutDayBoostLiters?: number;
  activeDayMode?: HydrationDayMode;
};

export type OnboardingDraft = {
  step: number;
  bodyMetrics: BodyMetrics;
  activity: ActivityProfile;
  climate: ClimateProfile;
  lifestyle: LifestyleFactors;
  performance: PerformanceFocus;
};

export const PROFILE_VERSION = 2;
export const GLASS_VOLUME_LITERS = 0.25;
export const ONBOARDING_STEP_COUNT = 7;
