import { Flame, Medal, ShieldCheck, Sparkles, Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type AchievementStripProps = {
  streak: number;
  hydrationScore: number;
  consistency: number;
  level: number;
  xp: number;
  weeklyWins: number;
  unlockedCount: number;
};

export function AchievementStrip({
  streak,
  hydrationScore,
  consistency,
  level,
  xp,
  weeklyWins,
  unlockedCount
}: AchievementStripProps) {
  const achievements = [
    {
      icon: Flame,
      label: "Streak",
      value: `${streak} days`,
      color: "text-orange-300"
    },
    {
      icon: ShieldCheck,
      label: "Hydration score",
      value: `${hydrationScore}`,
      color: "text-emerald-300"
    },
    {
      icon: Medal,
      label: "Consistency",
      value: `${consistency}%`,
      color: "text-amber-200"
    },
    {
      icon: Sparkles,
      label: "Level",
      value: `${level}`,
      color: "text-cyan-200"
    },
    {
      icon: Trophy,
      label: "Weekly wins",
      value: `${weeklyWins}/7`,
      color: "text-lime-200"
    },
    {
      icon: ShieldCheck,
      label: "XP badges",
      value: `${xp} XP / ${unlockedCount}`,
      color: "text-sky-200"
    }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {achievements.map(({ icon: Icon, label, value, color }) => (
        <Card key={label} className="rounded-3xl">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="grid size-11 place-items-center rounded-2xl bg-white/10">
              <Icon className={color} />
            </div>
            <div>
              <p className="text-glass-label-wide">
                {label}
              </p>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
