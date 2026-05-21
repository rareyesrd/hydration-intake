import type { ReactNode } from "react";

import { AnimatedCard } from "@/components/ui/animated-card";
import { cn } from "@/lib/utils";

type ChartCardProps = {
  eyebrow: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ChartCard({
  eyebrow,
  title,
  action,
  children,
  className
}: ChartCardProps) {
  return (
    <AnimatedCard className={cn("overflow-hidden", className)}>
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">{eyebrow}</p>
            {title ? (
              <h3 className="mt-1 text-2xl font-black text-white">{title}</h3>
            ) : null}
          </div>
          {action}
        </div>
        {children}
      </div>
    </AnimatedCard>
  );
}
