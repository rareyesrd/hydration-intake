"use client";

import { useMemo } from "react";
import {
  addDays,
  format,
  getDay,
  isWeekend,
  parseISO,
  startOfMonth,
  subDays,
  subMonths
} from "date-fns";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Award, CalendarDays, Flame, Target, Trophy, Waves } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { calculateHydrationReminder } from "@/store/hydration-store";
import type { Achievement, DailyHydration } from "@/types/hydration";

type AnalyticsDashboardProps = {
  days: Record<string, DailyHydration>;
  achievements: Achievement[];
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayTotal(day: DailyHydration | undefined) {
  return day?.entries.reduce((total, entry) => total + entry.amount, 0) ?? 0;
}

function completion(day: DailyHydration | undefined) {
  if (!day) {
    return 0;
  }

  return Math.min(100, Math.round((dayTotal(day) / day.goal) * 100));
}

function getRecentDayRows(days: Record<string, DailyHydration>, count = 90) {
  return Array.from({ length: count }, (_, index) => {
    const date = subDays(new Date(), count - 1 - index);
    const key = format(date, "yyyy-MM-dd");
    const day = days[key];
    const glasses = dayTotal(day);
    const goal = day?.goal ?? 11;

    return {
      key,
      label: format(date, "MMM d"),
      weekday: weekdayLabels[getDay(date)],
      date,
      glasses,
      goal,
      completion: Math.min(100, Math.round((glasses / goal) * 100)),
      completed: glasses >= goal
    };
  });
}

function average(values: number[]) {
  return values.length
    ? Math.round(values.reduce((total, value) => total + value, 0) / values.length)
    : 0;
}

function buildAnalytics(days: Record<string, DailyHydration>) {
  const rows = getRecentDayRows(days);
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const today = days[todayKey] ?? { date: todayKey, goal: 11, entries: [] };
  const lastSeven = rows.slice(-7);
  const lastThirty = rows.slice(-30);
  const priorThirty = rows.slice(-60, -30);
  const monthlyConsistency = average(lastThirty.map((row) => row.completion));
  const priorConsistency = average(priorThirty.map((row) => row.completion));
  const monthlyDelta = monthlyConsistency - priorConsistency;

  const weekly = weekdayLabels.map((weekday, index) => {
    const matches = rows.filter((row) => getDay(row.date) === index);
    return {
      weekday,
      completion: average(matches.map((row) => row.completion)),
      glasses: average(matches.map((row) => row.glasses))
    };
  });

  const monthly = Array.from({ length: 6 }, (_, index) => {
    const monthStart = startOfMonth(subMonths(new Date(), 5 - index));
    const monthKey = format(monthStart, "yyyy-MM");
    const monthDays = Object.values(days).filter((day) => day.date.startsWith(monthKey));

    return {
      month: format(monthStart, "MMM"),
      score: average(monthDays.map((day) => completion(day))),
      glasses: monthDays.reduce((total, day) => total + dayTotal(day), 0),
      completedDays: monthDays.filter((day) => dayTotal(day) >= day.goal).length
    };
  });

  let runningStreak = 0;
  const streakSeries = rows.map((row) => {
    runningStreak = row.completed ? runningStreak + 1 : 0;
    return {
      day: row.label,
      streak: runningStreak
    };
  });

  const bestDays = [...rows]
    .filter((row) => row.glasses > 0)
    .sort((a, b) => b.completion - a.completion || b.glasses - a.glasses)
    .slice(0, 5);

  const reminderEffectiveness = [
    {
      name: "On pace",
      value: rows.filter((row) => calculateHydrationReminder({
        date: row.key,
        goal: row.goal,
        entries: []
      }).pace === "on-track").length
    },
    {
      name: "Recovered",
      value: rows.filter((row) => row.completed).length
    },
    {
      name: "Missed",
      value: rows.filter((row) => row.glasses > 0 && !row.completed).length
    }
  ];

  const weekdayAverage = average(
    rows.filter((row) => !isWeekend(row.date)).map((row) => row.completion)
  );
  const weekendAverage = average(
    rows.filter((row) => isWeekend(row.date)).map((row) => row.completion)
  );
  const bestWeekday = weekly.reduce((best, row) =>
    row.completion > best.completion ? row : best
  );
  const afternoonEntries = Object.values(days)
    .flatMap((day) => day.entries)
    .filter((entry) => parseISO(entry.createdAt).getHours() >= 15).length;
  const totalEntries = Object.values(days).flatMap((day) => day.entries).length;
  const afternoonShare = totalEntries ? Math.round((afternoonEntries / totalEntries) * 100) : 0;

  return {
    today,
    rows,
    lastSeven,
    weekly,
    monthly,
    streakSeries,
    bestDays,
    reminderEffectiveness,
    hydrationScore: Math.min(100, Math.round(completion(today) * 0.55 + monthlyConsistency * 0.45)),
    consistencyRating:
      monthlyConsistency >= 90
        ? "Elite"
        : monthlyConsistency >= 75
          ? "Strong"
          : monthlyConsistency >= 55
            ? "Building"
            : "Needs focus",
    monthlyRank:
      monthlyConsistency >= 90
        ? "Diamond"
        : monthlyConsistency >= 75
          ? "Platinum"
          : monthlyConsistency >= 55
            ? "Gold"
            : "Bronze",
    personalRecords: {
      bestGlasses: Math.max(0, ...rows.map((row) => row.glasses)),
      bestStreak: Math.max(0, ...streakSeries.map((row) => row.streak)),
      perfectDays: rows.filter((row) => row.completed).length
    },
    insights: [
      weekdayAverage >= weekendAverage
        ? `You hydrate ${weekdayAverage - weekendAverage}% better on weekdays.`
        : `Weekends are ${weekendAverage - weekdayAverage}% stronger than weekdays.`,
      `Your best consistency is ${bestWeekday.weekday}s.`,
      afternoonShare < 25
        ? "You usually miss water after 3PM."
        : "Your afternoon hydration rhythm is holding.",
      monthlyDelta >= 0
        ? `You are ${monthlyDelta}% more consistent this month.`
        : `This month is ${Math.abs(monthlyDelta)}% behind your prior pace.`
    ]
  };
}

function AnalyticsMetric({
  icon: Icon,
  label,
  value,
  caption
}: {
  icon: typeof Target;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-cyan-300/12">
            <Icon className="size-5 text-cyan-200" />
          </div>
          <div>
            <p className="text-glass-label">{label}</p>
            <p className="mt-1 text-2xl font-black text-white">{value}</p>
            <p className="text-sm text-slate-400">{caption}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard({ days, achievements }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => buildAnalytics(days), [days]);
  const radialData = [{ name: "Hydration", value: completion(analytics.today), fill: "#67e8f9" }];
  const heatmapStart = subDays(new Date(), 83);
  const heatmapDays = Array.from({ length: 84 }, (_, index) => {
    const date = addDays(heatmapStart, index);
    const key = format(date, "yyyy-MM-dd");
    return analytics.rows.find((row) => row.key === key) ?? {
      key,
      label: format(date, "MMM d"),
      completion: 0,
      glasses: 0
    };
  });

  return (
    <motion.section
      className="space-y-5"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <div>
        <p className="text-sm uppercase tracking-[0.26em] text-cyan-100/60">
          Fitness intelligence
        </p>
        <h2 className="mt-2 text-4xl font-black text-white sm:text-5xl">
          Hydration analytics
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsMetric
          icon={Target}
          label="Hydration score"
          value={`${analytics.hydrationScore}`}
          caption="Today blended with 30-day consistency"
        />
        <AnalyticsMetric
          icon={Award}
          label="Athlete rating"
          value={analytics.consistencyRating}
          caption="Habit optimization tier"
        />
        <AnalyticsMetric
          icon={Trophy}
          label="Monthly rank"
          value={analytics.monthlyRank}
          caption="Based on monthly completion"
        />
        <AnalyticsMetric
          icon={Flame}
          label="Best streak"
          value={`${analytics.personalRecords.bestStreak}`}
          caption="Personal record"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-400">Daily Progress</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="72%"
                  outerRadius="100%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={22} background />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="-mt-44 grid place-items-center text-center">
              <p className="text-6xl font-black text-white">{completion(analytics.today)}%</p>
              <p className="text-sm text-slate-400">
                {dayTotal(analytics.today)}/{analytics.today.goal} glasses today
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-slate-400">Weekly Consistency</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weekly}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="weekday" tick={{ fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18 }} />
                  <Bar dataKey="completion" radius={[12, 12, 4, 4]}>
                    {analytics.weekly.map((entry) => (
                      <Cell key={entry.weekday} fill={entry.completion >= 75 ? "#67e8f9" : "#334155"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-400">Monthly Hydration Trends</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthly}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18 }} />
                  <Line type="monotone" dataKey="score" stroke="#67e8f9" strokeWidth={3} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="completedDays" stroke="#a7f3d0" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-slate-400">Streak Analytics</p>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.streakSeries.slice(-30)}>
                  <defs>
                    <linearGradient id="streakFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#67e8f9" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#67e8f9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" hide />
                  <YAxis tick={{ fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18 }} />
                  <Area dataKey="streak" stroke="#67e8f9" strokeWidth={3} fill="url(#streakFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-cyan-200" />
              <p className="text-sm text-slate-400">Completion Heatmap</p>
            </div>
            <div className="mt-5 grid grid-cols-12 gap-1.5">
              {heatmapDays.map((day) => (
                <div
                  key={day.key}
                  title={`${day.label}: ${day.completion}%`}
                  className={cn(
                    "aspect-square rounded-md border border-white/5",
                    day.completion >= 100
                      ? "bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.35)]"
                      : day.completion >= 70
                        ? "bg-cyan-400/60"
                        : day.completion >= 35
                          ? "bg-cyan-500/25"
                          : "bg-white/[0.045]"
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-slate-400">Reminder Effectiveness</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.reminderEffectiveness}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {["#67e8f9", "#a7f3d0", "#475569"].map((color) => (
                      <Cell key={color} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-400">Best Hydration Days</p>
            <div className="mt-5 space-y-4">
              {analytics.bestDays.length ? analytics.bestDays.map((day) => (
                <div key={day.key}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">{day.label}</span>
                    <span className="text-cyan-100">{day.glasses}/{day.goal}</span>
                  </div>
                  <Progress
                    value={day.completion}
                    label={`${day.label}: ${day.glasses} of ${day.goal} glasses, ${day.completion} percent`}
                  />
                </div>
              )) : (
                <p className="text-sm text-slate-400">Hydrate today to start building personal records.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-slate-400">Achievement History</p>
            <div className="mt-5 space-y-3">
              {achievements.length ? achievements.map((achievement) => (
                <div key={achievement.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="font-bold text-white">{achievement.title}</p>
                  <p className="text-sm text-slate-400">{achievement.description}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-400">Achievements unlock as streaks, perfect days, and consistency milestones build.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex items-center gap-2">
            <Waves className="size-5 text-cyan-200" />
            <p className="text-sm text-slate-400">Dynamic Insights</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {analytics.insights.map((insight) => (
              <div key={insight} className="rounded-2xl bg-white/[0.06] p-4 text-sm font-medium text-slate-100">
                {insight}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
