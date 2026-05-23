"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Droplets, Minus, Plus, Zap } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatCupLabel,
  formatLiterEquivalent,
  toCupAmount
} from "@/lib/utils/hydration-units";
import { useHydrationStore } from "@/store/hydration-store";

const inputUnits = ["cups", "liters", "ounces"] as const;

const customGlassSchema = z
  .object({
    amount: z.coerce.number().positive("Enter a positive amount."),
    unit: z.enum(inputUnits)
  })
  .superRefine(({ amount, unit }, context) => {
    const cups = toCupAmount(amount, unit);

    if (cups <= 0 || cups > 8) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add between 0.1 and 8 cups at once.",
        path: ["amount"]
      });
    }
  });

type CustomGlassForm = z.infer<typeof customGlassSchema>;

export function QuickAddForm() {
  const addGlass = useHydrationStore((state) => state.addGlass);
  const removeGlass = useHydrationStore((state) => state.removeGlass);
  const isSyncing = useHydrationStore((state) => state.isSyncing);
  const form = useForm<CustomGlassForm>({
    resolver: zodResolver(customGlassSchema),
    defaultValues: {
      amount: 1,
      unit: "cups"
    }
  });
  const selectedUnit = useWatch({ control: form.control, name: "unit" });
  const watchedAmount = useWatch({ control: form.control, name: "amount" });
  const previewCups = toCupAmount(Number(watchedAmount), selectedUnit);

  const quickAdds = [1, 2, 3];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {quickAdds.map((amount) => (
          <Button
            key={amount}
            type="button"
            variant={amount === 1 ? "default" : "secondary"}
            onClick={() => void addGlass(amount)}
            aria-label={`Add ${amount} glass${amount > 1 ? "es" : ""}`}
          >
            <Droplets />+{amount}
          </Button>
        ))}
      </div>
      <form
        className="rounded-3xl border border-white/10 bg-white/[0.04] p-3"
        onSubmit={form.handleSubmit(async ({ amount, unit }) => {
          await addGlass(toCupAmount(amount, unit));
          form.reset({ amount: unit === "liters" ? 0.25 : 1, unit });
        })}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {inputUnits.map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() =>
                  form.setValue("unit", unit, { shouldValidate: true })
                }
                className={cn(
                  "rounded-full border px-3 py-2 text-xs font-bold capitalize transition",
                  selectedUnit === unit
                    ? "border-cyan-200 bg-cyan-300 text-slate-950"
                    : "border-white/10 bg-white/[0.06] text-slate-300"
                )}
              >
                {unit}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              type="number"
              min={selectedUnit === "liters" ? 0.05 : 0.1}
              max={
                selectedUnit === "liters"
                  ? 2
                  : selectedUnit === "ounces"
                    ? 64
                    : 8
              }
              step={selectedUnit === "cups" ? 0.25 : 0.05}
              aria-label="Custom hydration amount"
              {...form.register("amount")}
            />
            <div className="grid grid-cols-2 gap-2 sm:w-64">
              <Button
                type="submit"
                variant="default"
                disabled={isSyncing}
                aria-label="Add Water button"
              >
                <Plus />
                Add
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void removeGlass()}
                disabled={isSyncing}
                aria-label="Remove Water button"
              >
                <Minus />
                Remove
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {Number.isFinite(previewCups) && previewCups > 0
              ? `${formatLiterEquivalent(previewCups)} fills ${formatCupLabel(previewCups)}. Partial 8oz cups stay partial.`
              : "Enter cups, liters, or ounces."}
          </p>
        </div>
      </form>
      <div className="text-glass-label flex items-center gap-2">
        <Zap className="size-3.5 text-cyan-200" />
        Quick add presets
      </div>
      {form.formState.errors.amount ? (
        <p className="text-sm text-rose-300">
          {form.formState.errors.amount.message}
        </p>
      ) : null}
    </div>
  );
}
