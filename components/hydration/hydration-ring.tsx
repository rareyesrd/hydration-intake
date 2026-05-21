"use client";

import { motion } from "framer-motion";

type HydrationRingProps = {
  progress: number;
  consumed: number;
  goal: number;
};

export function HydrationRing({ progress, consumed, goal }: HydrationRingProps) {
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative grid place-items-center">
      <div className="absolute size-56 rounded-full bg-cyan-300/20 blur-3xl" />
      <svg
        className="relative size-60 -rotate-90 drop-shadow-[0_0_26px_rgba(34,211,238,0.28)] sm:size-64"
        viewBox="0 0 260 260"
        role="img"
        aria-label={`${progress}% hydration progress`}
      >
        <circle
          cx="130"
          cy="130"
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="18"
          fill="transparent"
        />
        <motion.circle
          cx="130"
          cy="130"
          r={radius}
          stroke="url(#hydrationGradient)"
          strokeWidth="18"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeOpacity={progress > 0 ? 1 : 0}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="hydrationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="45%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#a7f3d0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-sm font-medium uppercase tracking-[0.26em] text-cyan-100/60">
          Today
        </p>
        <p className="mt-2 text-5xl font-black text-white">{consumed}</p>
        <p className="text-sm text-slate-400">of {goal} glasses</p>
      </div>
    </div>
  );
}
