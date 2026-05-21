"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

export function AnimatedCard({
  className,
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/[0.065] shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl",
        className
      )}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.8 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
