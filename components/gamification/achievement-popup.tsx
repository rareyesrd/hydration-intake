"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame, Medal, ShieldCheck, Sparkles, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Achievement } from "@/types/hydration";

type AchievementPopupProps = {
  achievement: Achievement | null;
  onDismiss: () => void;
};

const icons = {
  flame: Flame,
  trophy: Trophy,
  shield: ShieldCheck,
  sparkles: Sparkles,
  medal: Medal
};

export function AchievementPopup({
  achievement,
  onDismiss
}: AchievementPopupProps) {
  const Icon = achievement ? icons[achievement.icon] : Sparkles;

  return (
    <AnimatePresence>
      {achievement ? (
        <motion.div
          className="fixed inset-x-4 top-5 z-50 mx-auto max-w-md"
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative overflow-hidden rounded-[28px] border border-cyan-200/30 bg-slate-950/90 p-5 text-white shadow-[0_0_80px_rgba(34,211,238,0.3)] backdrop-blur-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(103,232,249,0.24),transparent_32%)]" />
            <div className="relative flex gap-4">
              <div className="grid size-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
                <Icon className="size-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100">
                  Achievement unlocked
                </p>
                <h2 className="mt-1 text-2xl font-black">{achievement.title}</h2>
                <p className="mt-1 text-sm text-slate-300">{achievement.description}</p>
              </div>
            </div>
            <div className="relative mt-4 flex justify-end">
              <Button type="button" size="sm" onClick={onDismiss}>
                Claim XP
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
