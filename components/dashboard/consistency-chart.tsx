"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import type { ConsistencyPoint } from "@/types/hydration";

type ConsistencyChartProps = {
  data: ConsistencyPoint[];
};

export function ConsistencyChart({ data }: ConsistencyChartProps) {
  return (
    <Card>
      <CardContent>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Monthly consistency</p>
            <h2 className="mt-1 text-2xl font-black text-white">Training hydration rhythm</h2>
          </div>
          <div className="rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-100">
            30 days
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -24, right: 6, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="glassFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#67e8f9" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#67e8f9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ stroke: "rgba(103,232,249,0.22)" }}
                contentStyle={{
                  background: "rgba(2, 6, 23, 0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 18,
                  color: "#fff"
                }}
              />
              <Area
                type="monotone"
                dataKey="glasses"
                stroke="#67e8f9"
                strokeWidth={3}
                fill="url(#glassFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
