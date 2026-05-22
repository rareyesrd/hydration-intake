"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, RefreshCcw, RotateCcw, Target, Zap } from "lucide-react";

import { HydrationResultReveal } from "@/components/onboarding/hydration-result-reveal";
import { fieldClassName, PillToggle } from "@/components/onboarding/onboarding-ui";
import { Button } from "@/components/ui/button";
import { DEFAULT_TRAINING_DAY_BOOST_L } from "@/lib/hydration-constants";
import {
  calculateHydrationTarget,
  draftToAthleteProfile
} from "@/lib/hydration-calculator";
import { useHydrationProfileStore } from "@/store/hydration-profile-store";
import type { OnboardingDraft } from "@/types/athlete-hydration-profile";

export function HydrationProfileSettings() {
  const document = useHydrationProfileStore((state) => state.document);
  const draft = useHydrationProfileStore((state) => state.draft);
  const isSaving = useHydrationProfileStore((state) => state.isSaving);
  const updateDraft = useHydrationProfileStore((state) => state.updateDraft);
  const saveAthleteProfile = useHydrationProfileStore((state) => state.saveAthleteProfile);
  const setDynamicGoalEnabled = useHydrationProfileStore((state) => state.setDynamicGoalEnabled);
  const setManualGoal = useHydrationProfileStore((state) => state.setManualGoal);
  const setActiveDayMode = useHydrationProfileStore((state) => state.setActiveDayMode);
  const setAthleteModeEnabled = useHydrationProfileStore((state) => state.setAthleteModeEnabled);
  const setWorkoutDayBoost = useHydrationProfileStore((state) => state.setWorkoutDayBoost);
  const resetOnboarding = useHydrationProfileStore((state) => state.resetOnboarding);
  const openOnboarding = useHydrationProfileStore((state) => state.openOnboarding);
  const recalculatePreview = useHydrationProfileStore((state) => state.recalculatePreview);
  const effectiveGoal = useHydrationProfileStore((state) => state.effectiveGoal);

  const [localDraft, setLocalDraft] = useState<OnboardingDraft>(draft);

  useEffect(() => {
    setLocalDraft(draft);
  }, [draft]);

  const liveTarget = useMemo(
    () =>
      calculateHydrationTarget(draftToAthleteProfile(localDraft), {
        athleteModeEnabled: document?.athleteModeEnabled,
        workoutDayBoostLiters: document?.workoutDayBoostLiters
      }),
    [document?.athleteModeEnabled, document?.workoutDayBoostLiters, localDraft]
  );

  if (!document) {
    return null;
  }

  const dynamicEnabled = document.dynamicGoalEnabled;
  const activeDayMode = document.activeDayMode ?? "standard_day";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/60">
          Hydration profile
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">Personal protocol</h3>
        <p className="mt-2 text-sm text-slate-400">
          Realistic, capped targets with ranges and training-day modes — not inflated totals.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ModeCard
          active={dynamicEnabled}
          title="Dynamic goal"
          caption={`${effectiveGoal()} glasses · ${liveTarget.rangeLabel}`}
          onClick={() => void setDynamicGoalEnabled(true)}
        />
        <ModeCard
          active={!dynamicEnabled}
          title="Manual goal"
          caption="Lock your own glass target"
          onClick={() => void setDynamicGoalEnabled(false)}
        />
      </div>

      {!dynamicEnabled ? (
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-cyan-100">Manual glasses / day</span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={6}
              max={22}
              value={document.manualGoal ?? document.hydrationGoal}
              className="w-full accent-cyan-300"
              onChange={(event) => void setManualGoal(Number(event.target.value))}
            />
            <span className="w-10 text-right text-xl font-black text-white">
              {document.manualGoal ?? document.hydrationGoal}
            </span>
          </div>
        </label>
      ) : (
        <>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-cyan-100">Active day mode</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {liveTarget.dayModes.map((mode) => (
                <button
                  key={mode.mode}
                  type="button"
                  onClick={() => void setActiveDayMode(mode.mode)}
                  className={
                    activeDayMode === mode.mode
                      ? "rounded-2xl border border-cyan-200 bg-cyan-300/15 p-3 text-left"
                      : "rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left"
                  }
                >
                  <p className="font-bold text-white">{mode.label}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {mode.liters}L · {mode.glasses} glasses
                  </p>
                </button>
              ))}
            </div>
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <span>
              <span className="flex items-center gap-2 font-semibold text-white">
                <Zap className="size-4 text-amber-200" />
                Custom athlete mode
              </span>
              <span className="mt-1 block text-sm text-slate-400">
                Unlocks intense-day ceiling (up to 6.5L) when profile supports it.
              </span>
            </span>
            <input
              type="checkbox"
              checked={document.athleteModeEnabled ?? false}
              onChange={(event) => void setAthleteModeEnabled(event.target.checked)}
              className="size-5 accent-cyan-300"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-cyan-100">
              Workout-day boost (+L on training days)
            </span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.25}
                max={1.25}
                step={0.05}
                value={document.workoutDayBoostLiters ?? DEFAULT_TRAINING_DAY_BOOST_L}
                className="w-full accent-cyan-300"
                onChange={(event) => void setWorkoutDayBoost(Number(event.target.value))}
              />
              <span className="w-14 text-right text-lg font-black text-white">
                +{document.workoutDayBoostLiters ?? DEFAULT_TRAINING_DAY_BOOST_L}L
              </span>
            </div>
          </label>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Weight"
          value={localDraft.bodyMetrics.weight}
          suffix={localDraft.bodyMetrics.weightUnit}
          onChange={(weight) =>
            setLocalDraft({
              ...localDraft,
              bodyMetrics: { ...localDraft.bodyMetrics, weight }
            })
          }
        />
        <Field
          label="Height"
          value={localDraft.bodyMetrics.height}
          suffix={localDraft.bodyMetrics.heightUnit}
          onChange={(height) =>
            setLocalDraft({
              ...localDraft,
              bodyMetrics: { ...localDraft.bodyMetrics, height }
            })
          }
        />
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-cyan-100">Activity level</span>
        <PillToggle
          value={localDraft.activity.level}
          options={[
            { value: "sedentary", label: "Sedentary" },
            { value: "lightly_active", label: "Light" },
            { value: "moderately_active", label: "Moderate" },
            { value: "highly_active", label: "High" },
            { value: "athlete", label: "Athlete" }
          ]}
          onChange={(level) =>
            setLocalDraft({
              ...localDraft,
              activity: { ...localDraft.activity, level }
            })
          }
        />
      </label>

      <motion.div
        className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3"
        layout
      >
        <HydrationResultReveal target={liveTarget} />
      </motion.div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            updateDraft(localDraft);
            recalculatePreview();
          }}
        >
          <RefreshCcw />
          Preview changes
        </Button>
        <Button
          type="button"
          disabled={isSaving}
          onClick={() =>
            void saveAthleteProfile(draftToAthleteProfile(localDraft)).then(() =>
              updateDraft(localDraft)
            )
          }
        >
          <Calculator />
          Save & recalculate
        </Button>
        <Button type="button" variant="ghost" onClick={() => void resetOnboarding()}>
          <RotateCcw />
          Reset onboarding
        </Button>
        <Button type="button" variant="ghost" onClick={openOnboarding}>
          Re-open onboarding
        </Button>
      </div>
    </div>
  );
}

function ModeCard({
  active,
  title,
  caption,
  onClick
}: {
  active: boolean;
  title: string;
  caption: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-2xl border border-cyan-200 bg-cyan-300/15 p-4 text-left"
          : "rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left"
      }
    >
      <p className="flex items-center gap-2 font-bold text-white">
        <Target className="size-4" />
        {title}
      </p>
      <p className="mt-1 text-sm text-slate-400">{caption}</p>
    </button>
  );
}

function Field({
  label,
  value,
  suffix,
  onChange
}: {
  label: string;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-cyan-100">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className={fieldClassName}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span className="text-sm text-slate-400">{suffix}</span>
      </div>
    </label>
  );
}
