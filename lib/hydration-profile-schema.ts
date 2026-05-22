import { z } from "zod";

export const bodyMetricsSchema = z
  .object({
    weight: z.number().positive(),
    weightUnit: z.enum(["kg", "lbs"]),
    height: z.number().positive(),
    heightUnit: z.enum(["cm", "ft"]),
    bodyFatPercent: z.number().min(3).max(60).optional(),
    age: z.number().min(13).max(90).optional()
  })
  .superRefine((value, ctx) => {
    if (value.weightUnit === "kg" && (value.weight < 30 || value.weight > 200)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a weight between 30 and 200 kg.",
        path: ["weight"]
      });
    }

    if (value.weightUnit === "lbs" && (value.weight < 66 || value.weight > 440)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a weight between 66 and 440 lbs.",
        path: ["weight"]
      });
    }

    if (value.heightUnit === "cm" && (value.height < 120 || value.height > 230)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a height between 120 and 230 cm.",
        path: ["height"]
      });
    }

    if (value.heightUnit === "ft" && (value.height < 4 || value.height > 7.5)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a height between 4 and 7.5 ft.",
        path: ["height"]
      });
    }
  });

export const activitySchema = z.object({
  level: z.enum([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "highly_active",
    "athlete"
  ]),
  workoutDurationMinutes: z.number().min(0).max(240).optional(),
  workoutsPerWeek: z.number().min(0).max(14).optional()
});

export const climateSchema = z.object({
  climate: z.enum(["cold", "temperate", "hot", "hot_humid"]),
  sweatLevel: z.enum(["low", "medium", "high"]).optional(),
  outdoorTrainingPerWeek: z.number().min(0).max(14).optional()
});

export const lifestyleSchema = z.object({
  caffeineIntake: z.enum(["none", "low", "moderate", "high"]),
  alcoholIntake: z.enum(["none", "low", "moderate", "high"]),
  highProteinDiet: z.boolean(),
  creatineUsage: z.boolean(),
  ketogenicDiet: z.boolean(),
  fasting: z.boolean(),
  sodiumIntake: z.enum(["none", "low", "moderate", "high"])
});

export const performanceSchema = z.object({
  primaryGoal: z.enum([
    "general_wellness",
    "muscle_gain",
    "athletic_performance",
    "fat_loss",
    "recovery_optimization"
  ]),
  sleepQuality: z.enum(["poor", "fair", "good", "excellent"]).optional(),
  recoveryPriority: z.enum(["low", "medium", "high"]).optional(),
  energyLevels: z.enum(["low", "steady", "high"]).optional()
});

export function validateOnboardingStep(step: number, draft: unknown) {
  const data = draft as Record<string, unknown>;

  switch (step) {
    case 1:
      return { success: true as const };
    case 2:
      return bodyMetricsSchema.safeParse(data.bodyMetrics);
    case 3:
      return activitySchema.safeParse(data.activity);
    case 4:
      return climateSchema.safeParse(data.climate);
    case 5:
      return lifestyleSchema.safeParse(data.lifestyle);
    case 6:
      return performanceSchema.safeParse(data.performance);
    case 7:
      return { success: true as const };
    default:
      return { success: false as const, error: new z.ZodError([]) };
  }
}
