"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Droplet, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GlassGridProps = {
  consumed: number;
  goal: number;
  onAdd: () => void;
  onRemove: () => void;
};

export function GlassGrid({ consumed, goal, onAdd, onRemove }: GlassGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
        {Array.from({ length: goal }, (_, index) => {
          const filled = index < consumed;

          return (
            <motion.button
              key={index}
              type="button"
              aria-label={`Glass ${index + 1} ${filled ? "complete" : "empty"}`}
              onClick={index < consumed ? onRemove : onAdd}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "group relative grid aspect-[0.72] place-items-center overflow-hidden rounded-b-2xl rounded-t-lg border transition",
                filled
                  ? "border-cyan-200/50 bg-cyan-300/18 shadow-[0_0_24px_rgba(103,232,249,0.25)]"
                  : "border-white/10 bg-white/[0.045] hover:border-cyan-200/30 hover:bg-white/10"
              )}
            >
              <motion.div
                className="absolute inset-x-1 bottom-1 rounded-b-xl rounded-t-[100%] bg-gradient-to-t from-cyan-400 via-sky-300 to-emerald-200"
                initial={false}
                animate={{ height: filled ? "82%" : "8%", opacity: filled ? 1 : 0.22 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              />
              <AnimatePresence>
                {filled ? (
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
                  filled ? "fill-cyan-950 text-cyan-950" : "text-slate-400"
                )}
              />
            </motion.button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" onClick={onAdd} aria-label="Add Water button">
          <Plus />
          Add Water
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onRemove}
          aria-label="Remove Water button"
        >
          <Minus />
          Remove Water
        </Button>
      </div>
    </div>
  );
}
