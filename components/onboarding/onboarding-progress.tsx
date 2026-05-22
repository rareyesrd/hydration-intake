"use client";

import { motion } from "framer-motion";

import { ONBOARDING_STEP_COUNT } from "@/types/athlete-hydration-profile";

type OnboardingProgressProps = {
  step: number;
  isSaving?: boolean;
};

const labels = [
  "Welcome",
  "Body",
  "Activity",
  "Climate",
  "Lifestyle",
  "Goals",
  "Result"
];

export function OnboardingProgress({ step, isSaving }: OnboardingProgressProps) {
  const progress = (step / ONBOARDING_STEP_COUNT) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
        <span>
          Step {step} of {ONBOARDING_STEP_COUNT}
        </span>
        <span className="text-cyan-100">{isSaving ? "Saving…" : labels[step - 1]}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-200"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
