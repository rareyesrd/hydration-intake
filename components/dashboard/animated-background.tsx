"use client";

import { motion } from "framer-motion";

import { useHydrationStore } from "@/store/hydration-store";

export function AnimatedBackground() {
  const intensity = useHydrationStore((state) => state.settings.animationIntensity);
  const cinematic = intensity === "cinematic";
  const calm = intensity === "calm";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.28),transparent_32%),radial-gradient(circle_at_72%_12%,rgba(56,189,248,0.22),transparent_30%),linear-gradient(135deg,#020617_0%,#07111f_48%,#031019_100%)] light:bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_32%),radial-gradient(circle_at_72%_12%,rgba(20,184,166,0.16),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#e8f7fb_48%,#effdf7_100%)]" />
      <motion.div
        className="absolute left-[-12%] top-[10%] h-72 w-72 rounded-full bg-cyan-300/14 blur-3xl"
        animate={calm ? undefined : { x: [0, cinematic ? 80 : 40, 0], y: [0, 24, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: cinematic ? 10 : 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-16%] right-[-10%] h-96 w-96 rounded-full bg-emerald-300/12 blur-3xl"
        animate={calm ? undefined : { x: [0, cinematic ? -90 : -45, 0], y: [0, -28, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: cinematic ? 12 : 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
    </div>
  );
}
