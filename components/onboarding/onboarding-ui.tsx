"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StepHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-3"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/70">
        {eyebrow}
      </p>
      <h2 className="max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="max-w-2xl text-base leading-relaxed text-slate-300">{description}</p>
    </motion.div>
  );
}

export function SelectableCard({
  selected,
  title,
  description,
  icon: Icon,
  onClick
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[22px] border p-4 text-left transition backdrop-blur-xl",
        selected
          ? "border-cyan-200/80 bg-cyan-300/15 shadow-[0_0_40px_rgba(103,232,249,0.2)]"
          : "border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.09]"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 place-items-center rounded-2xl",
            selected ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-cyan-100"
          )}
        >
          <Icon className="size-5" />
        </span>
        <span>
          <span className="block text-sm font-bold text-white">{title}</span>
          <span className="mt-1 block text-sm leading-relaxed text-slate-400">
            {description}
          </span>
        </span>
      </div>
    </button>
  );
}

export function FieldGroup({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-cyan-100">{label}</span>
      {children}
      {hint ? <span className="text-glass-muted block text-xs">{hint}</span> : null}
    </label>
  );
}

export function PillToggle<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
            value === option.value
              ? "border-cyan-200 bg-cyan-300 text-slate-950"
              : "border-white/10 bg-white/[0.06] text-slate-300"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export const fieldClassName =
  "w-full rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-200/70 focus:ring-2 focus:ring-cyan-300/30";
