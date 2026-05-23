"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Droplet } from "lucide-react";

import { cn } from "@/lib/utils";
import { cupFillRatio } from "@/lib/utils/hydration-units";

type GlassGridProps = {
  consumed: number;
  goal: number;
  onAdd: () => void;
  onRemove: () => void;
};

export function GlassGrid({ consumed, goal, onAdd, onRemove }: GlassGridProps) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
      {Array.from({ length: goal }, (_, index) => {
        const fillRatio = cupFillRatio(consumed, index);
        const filled = fillRatio >= 1;
        const active = fillRatio > 0;
        const fillPercent = Math.round(fillRatio * 100);

        return (
          <motion.button
            key={index}
            type="button"
            aria-label={`Cup ${index + 1} ${
              active ? `${fillPercent}% full` : "empty"
            }`}
            onClick={active ? onRemove : onAdd}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "group relative grid aspect-[0.72] place-items-center overflow-hidden rounded-t-lg rounded-b-2xl border transition",
              active
                ? "border-cyan-200/50 bg-cyan-300/18 shadow-[0_0_24px_rgba(103,232,249,0.25)]"
                : "border-white/10 bg-white/[0.045] hover:border-cyan-200/30 hover:bg-white/10"
            )}
          >
            <motion.div
              className="absolute inset-x-1 bottom-1 rounded-t-[100%] rounded-b-xl bg-gradient-to-t from-cyan-400 via-sky-300 to-emerald-200"
              initial={false}
              animate={{
                height: `${8 + fillRatio * 74}%`,
                opacity: active ? 1 : 0.22
              }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
            <AnimatePresence>
              {active ? (
                <motion.span
                  className="absolute size-7 rounded-full bg-white/25"
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
              ) : null}
            </AnimatePresence>
            <Droplet
              className={cn(
                "relative size-4 transition",
                filled
                  ? "fill-cyan-950 text-cyan-950"
                  : active
                    ? "fill-cyan-200/70 text-cyan-950"
                    : "text-slate-400"
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
