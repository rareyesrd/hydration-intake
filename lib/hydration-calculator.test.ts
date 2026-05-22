import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateActivityAdjustmentLiters,
  calculateHydrationTarget,
  calculateLifestyleAdjustmentLiters,
  qualifiesForIntenseDay,
  workoutDurationLiters
} from "@/lib/hydration-calculator";
import type { AthleteHydrationProfile } from "@/types/athlete-hydration-profile";

function athleticProfile(overrides: Partial<AthleteHydrationProfile> = {}): AthleteHydrationProfile {
  return {
    bodyMetrics: { weight: 80, weightUnit: "kg", height: 180, heightUnit: "cm" },
    activity: {
      level: "athlete",
      workoutDurationMinutes: 75,
      workoutsPerWeek: 5
    },
    climate: { climate: "hot_humid", sweatLevel: "high" },
    lifestyle: {
      caffeineIntake: "high",
      alcoholIntake: "low",
      highProteinDiet: true,
      creatineUsage: true,
      ketogenicDiet: false,
      fasting: false,
      sodiumIntake: "moderate"
    },
    performance: {
      primaryGoal: "athletic_performance",
      recoveryPriority: "high",
      sleepQuality: "good",
      energyLevels: "steady"
    },
    ...overrides
  };
}

describe("hydration calculator", () => {
  it("caps activity adjustments at 1.5L", () => {
    const liters = calculateActivityAdjustmentLiters(athleticProfile());
    assert.equal(liters, 1.5);
  });

  it("maps workout duration tiers", () => {
    assert.equal(workoutDurationLiters(20), 0.25);
    assert.equal(workoutDurationLiters(45), 0.5);
    assert.equal(workoutDurationLiters(75), 0.75);
    assert.equal(workoutDurationLiters(100), 1);
  });

  it("caps lifestyle adjustments at 0.75L", () => {
    const liters = calculateLifestyleAdjustmentLiters(athleticProfile().lifestyle);
    assert.equal(liters, 0.75);
  });

  it("does not recommend unrealistic standard-day targets for athletic users", () => {
    const target = calculateHydrationTarget(athleticProfile());
    assert.ok(target.optimalLiters <= 5.5);
    assert.ok(target.glassesPerDay <= 22);
    assert.ok(target.rangeMaxLiters <= 5.5);
    const intense = target.dayModes.find((m) => m.mode === "intense_athlete_day");
    assert.ok(intense && intense.liters <= 6.5);
    assert.match(target.rangeLabel, /L$/);
  });

  it("keeps standard 80kg moderate profile in a realistic band", () => {
    const target = calculateHydrationTarget(
      athleticProfile({
        activity: { level: "moderately_active", workoutDurationMinutes: 45, workoutsPerWeek: 3 },
        climate: { climate: "temperate", sweatLevel: "medium" },
        lifestyle: {
          caffeineIntake: "moderate",
          alcoholIntake: "none",
          highProteinDiet: false,
          creatineUsage: false,
          ketogenicDiet: false,
          fasting: false,
          sodiumIntake: "low"
        }
      })
    );

    assert.ok(target.optimalLiters >= 2.5 && target.optimalLiters <= 4.5);
    assert.ok(target.glassesPerDay >= 10 && target.glassesPerDay <= 18);
  });

  it("exposes day modes with training boost", () => {
    const target = calculateHydrationTarget(athleticProfile());
    const training = target.dayModes.find((mode) => mode.mode === "training_day");
    assert.ok(training);
    assert.ok(training.liters > target.standardDayLiters);
  });

  it("flags intense athlete days only for extreme profiles", () => {
    assert.equal(qualifiesForIntenseDay(athleticProfile()), true);
    assert.equal(
      qualifiesForIntenseDay(
        athleticProfile({
          activity: { level: "lightly_active" },
          climate: { climate: "temperate", sweatLevel: "low" }
        })
      ),
      false
    );
  });
});
