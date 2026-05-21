"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Droplets, Sparkles, Target, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReminderSettings } from "@/types/hydration";

type CinematicOnboardingProps = {
  isOpen: boolean;
  dailyGoal: number;
  animationIntensity: ReminderSettings["animationIntensity"];
  onComplete: () => void;
};

const onboardingCards = [
  {
    icon: Target,
    title: "Performance starts with water.",
    copy: "Your daily hydration target becomes a visible training metric."
  },
  {
    icon: Timer,
    title: "Smart reminders adapt.",
    copy: "Behind pace gets sharper nudges. Ahead of pace gets breathing room."
  },
  {
    icon: Droplets,
    title: "Every glass should feel earned.",
    copy: "Tap, fill, glow, and build momentum through the day."
  }
];

export function CinematicOnboarding({
  isOpen,
  dailyGoal,
  animationIntensity,
  onComplete
}: CinematicOnboardingProps) {
  const cinematic = animationIntensity === "cinematic";

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-slate-950/92 px-4 text-white backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(103,232,249,0.28),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.18),transparent_30%)]"
            animate={cinematic ? { scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] } : undefined}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative w-full max-w-4xl"
            initial={{ y: 28, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-cyan-100">
              <Sparkles className="size-4" />
              Athlete hydration system
            </div>
            <h2 className="max-w-3xl text-5xl font-black leading-[0.95] sm:text-7xl">
              Hydrate like an athlete.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              Your goal is {dailyGoal} glasses today. The cockpit tracks pace,
              consistency, streaks, and recovery signals in real time.
            </p>
            <div className="mt-9 grid gap-3 md:grid-cols-3">
              {onboardingCards.map(({ icon: Icon, title, copy }, index) => (
                <motion.div
                  key={title}
                  className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.08 }}
                >
                  <div className="grid size-11 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-5 text-lg font-black">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{copy}</p>
                </motion.div>
              ))}
            </div>
            <Button type="button" className="mt-9 h-13 px-7 text-base" onClick={onComplete}>
              Enter cockpit
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
