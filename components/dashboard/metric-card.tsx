import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
};

export function MetricCard({ icon: Icon, label, value, caption }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="grid size-10 place-items-center rounded-2xl bg-white/10">
            <Icon className="size-5 text-cyan-200" />
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-400">
            Live
          </span>
        </div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-white">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}
