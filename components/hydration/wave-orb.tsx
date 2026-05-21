"use client";

import { motion } from "framer-motion";

type WaveOrbProps = {
  progress: number;
};

export function WaveOrb({ progress }: WaveOrbProps) {
  const fillLevel = 100 - progress;

  return (
    <div className="relative size-24 overflow-hidden rounded-full border border-cyan-200/20 bg-slate-950 shadow-inner shadow-cyan-950 sm:size-28">
      <motion.div
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-500 via-sky-400 to-emerald-200"
        initial={{ top: "100%" }}
        animate={{ top: `${fillLevel}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="absolute -top-4 left-1/2 h-8 w-[180%] -translate-x-1/2 rounded-[100%] bg-cyan-100/70"
          animate={{ x: ["-50%", "-44%", "-50%"] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_24%,rgba(255,255,255,0.5),transparent_18%),radial-gradient(circle_at_68%_70%,rgba(255,255,255,0.12),transparent_20%)]" />
    </div>
  );
}
