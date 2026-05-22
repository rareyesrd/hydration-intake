"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

type ProgressProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  /** Visible or screen-reader label for the progressbar. */
  label?: string;
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, label, "aria-label": ariaLabel, ...props }, ref) => {
  const roundedValue = value == null ? 0 : Math.round(value);
  const accessibleName =
    ariaLabel ?? label ?? `Progress: ${roundedValue} percent complete`;

  return (
  <ProgressPrimitive.Root
    ref={ref}
    aria-label={accessibleName}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-white/10",
      className
    )}
    value={value}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full rounded-full bg-cyan-300 transition-all duration-700 ease-out"
      style={{ width: `${value || 0}%` }}
    />
  </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
