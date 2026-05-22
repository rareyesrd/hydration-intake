"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";

import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { renderOnboardingStep } from "@/components/onboarding/onboarding-step-panels";
import { WaterBackground } from "@/components/onboarding/water-background";
import { Button } from "@/components/ui/button";
import { validateOnboardingStep } from "@/lib/hydration-profile-schema";
import { useHydrationProfileStore } from "@/store/hydration-profile-store";
import { ONBOARDING_STEP_COUNT } from "@/types/athlete-hydration-profile";

type PremiumOnboardingWizardProps = {
  isOpen: boolean;
};

export function PremiumOnboardingWizard({ isOpen }: PremiumOnboardingWizardProps) {
  const draft = useHydrationProfileStore((state) => state.draft);
  const previewTarget = useHydrationProfileStore((state) => state.previewTarget);
  const isSaving = useHydrationProfileStore((state) => state.isSaving);
  const updateDraft = useHydrationProfileStore((state) => state.updateDraft);
  const setDraftStep = useHydrationProfileStore((state) => state.setDraftStep);
  const completeOnboarding = useHydrationProfileStore((state) => state.completeOnboarding);
  const recalculatePreview = useHydrationProfileStore((state) => state.recalculatePreview);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const step = draft.step;
  const isLastStep = step === ONBOARDING_STEP_COUNT;

  const panel = useMemo(
    () =>
      renderOnboardingStep(step, {
        draft,
        previewTarget,
        onChange: updateDraft
      }),
    [draft, previewTarget, step, updateDraft]
  );

  const goNext = async () => {
    const validation = validateOnboardingStep(step, draft);

    if ("success" in validation && validation.success === false) {
      setError(validation.error.issues[0]?.message ?? "Please complete the required fields.");
      return;
    }

    setError(null);

    if (step === 6) {
      recalculatePreview();
    }

    if (!isLastStep) {
      setDraftStep(step + 1);
      return;
    }

    setIsCompleting(true);

    try {
      await completeOnboarding();
    } catch {
      setError("We could not save your profile. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setError(null);
      setDraftStep(step - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 text-white backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Hydration onboarding"
        >
          <WaterBackground />
          <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10">
            <div className="mb-6 inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-cyan-100">
              <Sparkles className="size-4" />
              Personalized hydration protocol
            </div>

            <OnboardingProgress step={step} isSaving={isSaving} />

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                className="mt-8 flex-1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                {panel}
              </motion.div>
            </AnimatePresence>

            {error ? (
              <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={step === 1 || isCompleting}
              >
                <ArrowLeft />
                Back
              </Button>
              <Button type="button" onClick={() => void goNext()} disabled={isCompleting}>
                {isCompleting ? <Loader2 className="animate-spin" /> : null}
                {isLastStep ? "Start my protocol" : "Continue"}
                {!isCompleting ? <ArrowRight /> : null}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
