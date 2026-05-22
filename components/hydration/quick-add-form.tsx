"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Droplets, Plus, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHydrationStore } from "@/store/hydration-store";

const customGlassSchema = z.object({
  amount: z.coerce.number().int().min(1).max(6)
});

type CustomGlassForm = z.infer<typeof customGlassSchema>;

export function QuickAddForm() {
  const addGlass = useHydrationStore((state) => state.addGlass);
  const isSyncing = useHydrationStore((state) => state.isSyncing);
  const form = useForm<CustomGlassForm>({
    resolver: zodResolver(customGlassSchema),
    defaultValues: {
      amount: 1
    }
  });

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
            <Droplets />
            +{amount}
          </Button>
        ))}
      </div>
      <form
        className="flex gap-3"
        onSubmit={form.handleSubmit(async ({ amount }) => {
          await addGlass(amount);
          form.reset({ amount: 1 });
        })}
      >
        <Input
          type="number"
          min={1}
          max={6}
          aria-label="Custom glasses"
          {...form.register("amount")}
        />
        <Button type="submit" variant="secondary" disabled={isSyncing}>
          <Plus />
          Add
        </Button>
      </form>
      <div className="text-glass-label flex items-center gap-2">
        <Zap className="size-3.5 text-cyan-200" />
        Quick add presets
      </div>
      {form.formState.errors.amount ? (
        <p className="text-sm text-rose-300">{form.formState.errors.amount.message}</p>
      ) : null}
    </div>
  );
}
