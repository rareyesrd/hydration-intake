"use client";

import {
  Activity,
  Brain,
  Dumbbell,
  Flame,
  Moon,
  Mountain,
  Sun,
  Target,
  ThermometerSun,
  Trophy,
  Waves
} from "lucide-react";

import { HydrationResultReveal } from "@/components/onboarding/hydration-result-reveal";
import {
  FieldGroup,
  PillToggle,
  SelectableCard,
  StepHeader,
  fieldClassName
} from "@/components/onboarding/onboarding-ui";
import type {
  ActivityLevel,
  CalculatedHydrationTarget,
  ClimateType,
  IntakeLevel,
  OnboardingDraft,
  PrimaryHydrationGoal,
  SweatLevel
} from "@/types/athlete-hydration-profile";

type StepPanelProps = {
  draft: OnboardingDraft;
  previewTarget: CalculatedHydrationTarget | null;
  onChange: (partial: Partial<OnboardingDraft>) => void;
};

const activityOptions: {
  value: ActivityLevel;
  title: string;
  description: string;
  icon: typeof Activity;
}[] = [
  {
    value: "sedentary",
    title: "Sedentary",
    description: "Desk-heavy days with minimal structured training.",
    icon: Moon
  },
  {
    value: "lightly_active",
    title: "Lightly active",
    description: "1–2 sessions weekly or frequent walking.",
    icon: Waves
  },
  {
    value: "moderately_active",
    title: "Moderately active",
    description: "Consistent training 3–4 days per week.",
    icon: Activity
  },
  {
    value: "highly_active",
    title: "Highly active",
    description: "Hard sessions 5+ days weekly.",
    icon: Flame
  },
  {
    value: "athlete",
    title: "Athlete",
    description: "Competitive output, double sessions, or sport-specific blocks.",
    icon: Trophy
  }
];

const climateOptions: {
  value: ClimateType;
  title: string;
  description: string;
  icon: typeof Sun;
}[] = [
  { value: "cold", title: "Cold", description: "Cool climate, lower sweat losses.", icon: Mountain },
  {
    value: "temperate",
    title: "Temperate",
    description: "Balanced seasons with moderate heat.",
    icon: Sun
  },
  { value: "hot", title: "Hot", description: "Warm environment increases fluid demand.", icon: ThermometerSun },
  {
    value: "hot_humid",
    title: "Hot & humid",
    description: "Humidity limits cooling — hydrate aggressively.",
    icon: Flame
  }
];

const goalOptions: {
  value: PrimaryHydrationGoal;
  title: string;
  description: string;
  icon: typeof Target;
}[] = [
  {
    value: "general_wellness",
    title: "General wellness",
    description: "Stable energy and daily health.",
    icon: Brain
  },
  {
    value: "muscle_gain",
    title: "Muscle gain",
    description: "Support hypertrophy and nutrient delivery.",
    icon: Dumbbell
  },
  {
    value: "athletic_performance",
    title: "Athletic performance",
    description: "Peak output for training and competition.",
    icon: Trophy
  },
  {
    value: "fat_loss",
    title: "Fat loss",
    description: "Metabolic efficiency without under-hydrating.",
    icon: Flame
  },
  {
    value: "recovery_optimization",
    title: "Recovery optimization",
    description: "Rebuild faster between hard sessions.",
    icon: Activity
  }
];

const intakeOptions: { value: IntakeLevel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" }
];

export function renderOnboardingStep(step: number, props: StepPanelProps) {
  switch (step) {
    case 1:
      return <WelcomeStep />;
    case 2:
      return <BodyMetricsStep draft={props.draft} onChange={props.onChange} />;
    case 3:
      return <ActivityStep draft={props.draft} onChange={props.onChange} />;
    case 4:
      return <ClimateStep draft={props.draft} onChange={props.onChange} />;
    case 5:
      return <LifestyleStep draft={props.draft} onChange={props.onChange} />;
    case 6:
      return <PerformanceStep draft={props.draft} onChange={props.onChange} />;
    case 7:
      return <ResultStep previewTarget={props.previewTarget} />;
    default:
      return null;
  }
}

function WelcomeStep() {
  return (
    <div className="space-y-8">
      <StepHeader
        eyebrow="Performance hydration"
        title="Your hydration should adapt to your body."
        description="Hydration is performance. We will calculate your optimal intake using body metrics, training load, climate, and lifestyle factors."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          "Let’s calculate your optimal intake.",
          "Built for athletes who train with intent.",
          "Every glass becomes a measurable edge."
        ].map((line, index) => (
          <div
            key={line}
            className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 text-sm leading-relaxed text-slate-300"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function BodyMetricsStep({
  draft,
  onChange
}: {
  draft: OnboardingDraft;
  onChange: StepPanelProps["onChange"];
}) {
  const { bodyMetrics } = draft;

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow="Body metrics"
        title="Start with the physiology."
        description="Weight and height anchor your baseline. Optional fields sharpen precision."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Weight">
          <div className="flex gap-2">
            <input
              type="number"
              className={fieldClassName}
              value={bodyMetrics.weight}
              min={30}
              max={250}
              onChange={(event) =>
                onChange({
                  bodyMetrics: { ...bodyMetrics, weight: Number(event.target.value) }
                })
              }
            />
            <PillToggle
              value={bodyMetrics.weightUnit}
              options={[
                { value: "kg", label: "kg" },
                { value: "lbs", label: "lbs" }
              ]}
              onChange={(weightUnit) => onChange({ bodyMetrics: { ...bodyMetrics, weightUnit } })}
            />
          </div>
        </FieldGroup>
        <FieldGroup label="Height">
          <div className="flex gap-2">
            <input
              type="number"
              className={fieldClassName}
              value={bodyMetrics.height}
              min={100}
              max={250}
              onChange={(event) =>
                onChange({
                  bodyMetrics: { ...bodyMetrics, height: Number(event.target.value) }
                })
              }
            />
            <PillToggle
              value={bodyMetrics.heightUnit}
              options={[
                { value: "cm", label: "cm" },
                { value: "ft", label: "ft" }
              ]}
              onChange={(heightUnit) => onChange({ bodyMetrics: { ...bodyMetrics, heightUnit } })}
            />
          </div>
        </FieldGroup>
        <FieldGroup label="Body fat % (optional)" hint="Improves precision for lean mass estimates.">
          <input
            type="number"
            className={fieldClassName}
            value={bodyMetrics.bodyFatPercent ?? ""}
            placeholder="e.g. 14"
            onChange={(event) =>
              onChange({
                bodyMetrics: {
                  ...bodyMetrics,
                  bodyFatPercent: event.target.value
                    ? Number(event.target.value)
                    : undefined
                }
              })
            }
          />
        </FieldGroup>
        <FieldGroup label="Age (optional)">
          <input
            type="number"
            className={fieldClassName}
            value={bodyMetrics.age ?? ""}
            placeholder="e.g. 28"
            onChange={(event) =>
              onChange({
                bodyMetrics: {
                  ...bodyMetrics,
                  age: event.target.value ? Number(event.target.value) : undefined
                }
              })
            }
          />
        </FieldGroup>
      </div>
    </div>
  );
}

function ActivityStep({
  draft,
  onChange
}: {
  draft: OnboardingDraft;
  onChange: StepPanelProps["onChange"];
}) {
  const { activity } = draft;

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow="Training load"
        title="How hard are you training?"
        description="Activity level drives the largest adjustment to your hydration target."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {activityOptions.map((option) => (
          <SelectableCard
            key={option.value}
            selected={activity.level === option.value}
            title={option.title}
            description={option.description}
            icon={option.icon}
            onClick={() => onChange({ activity: { ...activity, level: option.value } })}
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Workout duration (minutes)">
          <input
            type="range"
            min={0}
            max={120}
            step={5}
            value={activity.workoutDurationMinutes ?? 0}
            className="w-full accent-cyan-300"
            onChange={(event) =>
              onChange({
                activity: {
                  ...activity,
                  workoutDurationMinutes: Number(event.target.value)
                }
              })
            }
          />
          <span className="text-sm text-slate-400">
            {activity.workoutDurationMinutes ?? 0} min / session
          </span>
        </FieldGroup>
        <FieldGroup label="Workouts per week">
          <input
            type="range"
            min={0}
            max={14}
            value={activity.workoutsPerWeek ?? 0}
            className="w-full accent-cyan-300"
            onChange={(event) =>
              onChange({
                activity: {
                  ...activity,
                  workoutsPerWeek: Number(event.target.value)
                }
              })
            }
          />
          <span className="text-sm text-slate-400">
            {activity.workoutsPerWeek ?? 0} sessions
          </span>
        </FieldGroup>
      </div>
    </div>
  );
}

function ClimateStep({
  draft,
  onChange
}: {
  draft: OnboardingDraft;
  onChange: StepPanelProps["onChange"];
}) {
  const { climate } = draft;

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow="Environment"
        title="Climate and sweat profile."
        description="Heat, humidity, and sweat rate change how aggressively you need to replenish."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {climateOptions.map((option) => (
          <SelectableCard
            key={option.value}
            selected={climate.climate === option.value}
            title={option.title}
            description={option.description}
            icon={option.icon}
            onClick={() => onChange({ climate: { ...climate, climate: option.value } })}
          />
        ))}
      </div>
      <FieldGroup label="Sweat level (optional)">
        <PillToggle
          value={climate.sweatLevel ?? "medium"}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" }
          ]}
          onChange={(sweatLevel) =>
            onChange({ climate: { ...climate, sweatLevel: sweatLevel as SweatLevel } })
          }
        />
      </FieldGroup>
      <FieldGroup label="Outdoor training days / week">
        <input
          type="range"
          min={0}
          max={7}
          value={climate.outdoorTrainingPerWeek ?? 0}
          className="w-full accent-cyan-300"
          onChange={(event) =>
            onChange({
              climate: {
                ...climate,
                outdoorTrainingPerWeek: Number(event.target.value)
              }
            })
          }
        />
      </FieldGroup>
    </div>
  );
}

function LifestyleStep({
  draft,
  onChange
}: {
  draft: OnboardingDraft;
  onChange: StepPanelProps["onChange"];
}) {
  const { lifestyle } = draft;
  const toggles = [
    ["highProteinDiet", "High protein diet"],
    ["creatineUsage", "Creatine usage"],
    ["ketogenicDiet", "Ketogenic diet"],
    ["fasting", "Fasting protocol"]
  ] as const;

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow="Lifestyle"
        title="Dial in daily factors."
        description="Nutrition and stimulants shift fluid needs — capture what applies to you."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Caffeine intake">
          <PillToggle
            value={lifestyle.caffeineIntake}
            options={intakeOptions}
            onChange={(caffeineIntake) =>
              onChange({ lifestyle: { ...lifestyle, caffeineIntake } })
            }
          />
        </FieldGroup>
        <FieldGroup label="Alcohol intake">
          <PillToggle
            value={lifestyle.alcoholIntake}
            options={intakeOptions}
            onChange={(alcoholIntake) =>
              onChange({ lifestyle: { ...lifestyle, alcoholIntake } })
            }
          />
        </FieldGroup>
        <FieldGroup label="Sodium intake">
          <PillToggle
            value={lifestyle.sodiumIntake}
            options={intakeOptions}
            onChange={(sodiumIntake) =>
              onChange({ lifestyle: { ...lifestyle, sodiumIntake } })
            }
          />
        </FieldGroup>
      </div>
      <div className="flex flex-wrap gap-2">
        {toggles.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              onChange({ lifestyle: { ...lifestyle, [key]: !lifestyle[key] } })
            }
            className={
              lifestyle[key]
                ? "rounded-full border border-cyan-200 bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
                : "rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-300"
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PerformanceStep({
  draft,
  onChange
}: {
  draft: OnboardingDraft;
  onChange: StepPanelProps["onChange"];
}) {
  const { performance } = draft;

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow="Performance focus"
        title="What are you optimizing for?"
        description="Your primary goal fine-tunes the hydration strategy around training and recovery."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {goalOptions.map((option) => (
          <SelectableCard
            key={option.value}
            selected={performance.primaryGoal === option.value}
            title={option.title}
            description={option.description}
            icon={option.icon}
            onClick={() =>
              onChange({ performance: { ...performance, primaryGoal: option.value } })
            }
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <FieldGroup label="Sleep quality">
          <PillToggle
            value={performance.sleepQuality ?? "good"}
            options={[
              { value: "poor", label: "Poor" },
              { value: "fair", label: "Fair" },
              { value: "good", label: "Good" },
              { value: "excellent", label: "Excellent" }
            ]}
            onChange={(sleepQuality) =>
              onChange({
                performance: {
                  ...performance,
                  sleepQuality: sleepQuality as typeof performance.sleepQuality
                }
              })
            }
          />
        </FieldGroup>
        <FieldGroup label="Recovery priority">
          <PillToggle
            value={performance.recoveryPriority ?? "medium"}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" }
            ]}
            onChange={(recoveryPriority) =>
              onChange({
                performance: {
                  ...performance,
                  recoveryPriority: recoveryPriority as typeof performance.recoveryPriority
                }
              })
            }
          />
        </FieldGroup>
        <FieldGroup label="Energy levels">
          <PillToggle
            value={performance.energyLevels ?? "steady"}
            options={[
              { value: "low", label: "Low" },
              { value: "steady", label: "Steady" },
              { value: "high", label: "High" }
            ]}
            onChange={(energyLevels) =>
              onChange({
                performance: {
                  ...performance,
                  energyLevels: energyLevels as typeof performance.energyLevels
                }
              })
            }
          />
        </FieldGroup>
      </div>
    </div>
  );
}

function ResultStep({ previewTarget }: { previewTarget: CalculatedHydrationTarget | null }) {
  if (!previewTarget) {
    return null;
  }

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow="Your protocol"
        title="Your personalized hydration range is ready."
        description="You will see a realistic daily range, training-day guidance, and adaptive day modes — not inflated chug targets."
      />
      <HydrationResultReveal target={previewTarget} />
    </div>
  );
}
