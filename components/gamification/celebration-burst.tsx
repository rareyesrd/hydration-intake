"use client";

import { AnimatePresence, motion } from "framer-motion";

type CelebrationBurstProps = {
  show: boolean;
};

export function CelebrationBurst({ show }: CelebrationBurstProps) {
  return (
    <AnimatePresence>
      {show ? (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          {Array.from({ length: 34 }, (_, index) => (
            <motion.span
              key={index}
              className="absolute left-1/2 top-1/2 h-2 w-1 rounded-full bg-cyan-200"
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
              animate={{
                x: Math.cos(index) * (120 + (index % 7) * 34),
                y: Math.sin(index * 1.7) * (110 + (index % 5) * 32),
                opacity: 0,
                rotate: 240,
                scale: [1, 1.8, 0.4]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>
      ) : null}
    </AnimatePresence>
  );
}
