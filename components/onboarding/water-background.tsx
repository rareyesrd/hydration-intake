"use client";

import { motion } from "framer-motion";

export function WaterBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,0.28),transparent_42%),radial-gradient(circle_at_12%_88%,rgba(16,185,129,0.2),transparent_34%),radial-gradient(circle_at_88%_72%,rgba(56,189,248,0.16),transparent_30%)]"
        animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.03, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      {Array.from({ length: 14 }, (_, index) => (
        <motion.span
          key={index}
          aria-hidden
          className="absolute size-2 rounded-full bg-cyan-200/40"
          style={{
            left: `${6 + index * 6.5}%`,
            bottom: `${8 + (index % 5) * 10}%`
          }}
          animate={{ y: [0, -36, 0], opacity: [0.15, 0.75, 0.15], scale: [0.8, 1.2, 0.8] }}
          transition={{
            duration: 3.6 + index * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.18
          }}
        />
      ))}
    </div>
  );
}
