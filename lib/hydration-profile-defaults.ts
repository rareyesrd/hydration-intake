import type { OnboardingDraft, UserHydrationDocument } from "@/types/athlete-hydration-profile";
import { DEFAULT_TRAINING_DAY_BOOST_L } from "@/lib/hydration-constants";
import { PROFILE_VERSION } from "@/types/athlete-hydration-profile";

export function createDefaultOnboardingDraft(step = 1): OnboardingDraft {
  return {
    step,
    bodyMetrics: {
      weight: 75,
      weightUnit: "kg",
      height: 175,
      heightUnit: "cm"
    },
    activity: {
      level: "moderately_active",
      workoutDurationMinutes: 45,
      workoutsPerWeek: 4
    },
    climate: {
      climate: "temperate",
      sweatLevel: "medium",
      outdoorTrainingPerWeek: 2
    },
    lifestyle: {
      caffeineIntake: "moderate",
      alcoholIntake: "low",
      highProteinDiet: false,
      creatineUsage: false,
      ketogenicDiet: false,
      fasting: false,
      sodiumIntake: "moderate"
    },
    performance: {
      primaryGoal: "athletic_performance",
      sleepQuality: "good",
      recoveryPriority: "high",
      energyLevels: "steady"
    }
  };
}

export function createDefaultUserHydrationFields(
  userId: string,
  displayName: string,
  email: string,
  photoURL?: string
): Pick<
  UserHydrationDocument,
  | "userId"
  | "displayName"
  | "email"
  | "photoURL"
  | "provider"
  | "profileVersion"
  | "onboardingCompleted"
  | "onboardingStep"
  | "hydrationGoal"
  | "dynamicGoalEnabled"
  | "athleteModeEnabled"
  | "workoutDayBoostLiters"
  | "activeDayMode"
> & { createdAt: string; updatedAt: string } {
  const now = new Date().toISOString();

  return {
    userId,
    displayName,
    email,
    photoURL,
    provider: "google",
    createdAt: now,
    updatedAt: now,
    profileVersion: PROFILE_VERSION,
    onboardingCompleted: false,
    onboardingStep: 1,
    hydrationGoal: 11,
    dynamicGoalEnabled: true,
    athleteModeEnabled: false,
    workoutDayBoostLiters: DEFAULT_TRAINING_DAY_BOOST_L,
    activeDayMode: "standard_day"
  };
}
