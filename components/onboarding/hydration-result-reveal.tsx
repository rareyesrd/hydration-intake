"use client";

import { motion } from "framer-motion";
import { Droplets, Gauge, Sparkles, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CalculatedHydrationTarget } from "@/types/athlete-hydration-profile";

type HydrationResultRevealProps = {
  target: CalculatedHydrationTarget;
};

const labelCopy = {
  conservative: "Conservative",
  recommended: "Recommended",
  aggressive_athlete: "Aggressive Athlete",
  recovery_optimized: "Recovery Optimized"
} as const;

export function HydrationResultReveal({ target }: HydrationResultRevealProps) {
  const fill = Math.min(100, Math.round((target.optimalLiters / 5.5) * 100));

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <motion.div
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-6"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
          Recommended range
        </p>
        <p className="mt-2 text-4xl font-black text-white sm:text-5xl">{target.rangeLabel}</p>
        <p className="mt-2 text-sm text-slate-400">
          Optimal target{" "}
          <span className="font-semibold text-cyan-100">{target.optimalLiters}L</span> ·{" "}
          {target.glassesMin}–{target.glassesMax} glasses
        </p>

        <div className="relative mx-auto mt-8 grid size-48 place-items-center">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="52"
              className="fill-none stroke-white/10"
              strokeWidth="10"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              className="fill-none stroke-cyan-300"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={326.7}
              initial={{ strokeDashoffset: 326.7 }}
              animate={{ strokeDashoffset: 326.7 - (326.7 * fill) / 100 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <Droplets className="mx-auto size-7 text-cyan-200" />
            <p className="text-3xl font-black text-white">{target.optimalLiters}L</p>
            <p className="text-xs text-slate-400">optimal / day</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Metric label="Confidence" value={`${target.confidenceScore}%`} />
          <Metric label="Hydration score" value={`${target.hydrationScore}`} />
        </div>
      </motion.div>

      <div className="space-y-4">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
            target.recommendationLabel === "aggressive_athlete"
              ? "border-amber-300/40 bg-amber-300/10 text-amber-100"
              : "border-cyan-200/30 bg-cyan-300/10 text-cyan-100"
          )}
        >
          <Gauge className="size-4" />
          {labelCopy[target.recommendationLabel]}
        </div>

        <p className="text-lg leading-relaxed text-slate-300">{target.summary}</p>
        <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
          <TrendingUp className="mb-2 inline size-4 text-cyan-200" />{" "}
          {target.workoutDayGuidance}
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {target.dayModes.map((mode, index) => (
            <motion.div
              key={mode.mode}
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <p className="text-sm font-bold text-white">{mode.label}</p>
              <p className="mt-1 text-lg font-black text-cyan-100">
                {mode.liters}L · {mode.glasses} glasses
              </p>
              <p className="text-glass-muted mt-1 text-xs leading-relaxed">{mode.guidance}</p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-2 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <Sparkles className="size-4" />
            Hydration insights
          </div>
          {target.insights.map((insight) => (
            <p key={insight.id} className="text-sm text-slate-400">
              {insight.message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.05] px-3 py-2">
      <p className="text-glass-label-wide text-[10px]">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}
