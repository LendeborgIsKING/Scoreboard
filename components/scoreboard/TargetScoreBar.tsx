"use client";

import { useGameStore } from "@/lib/gameStore";

export function TargetScoreBar() {
  const enabled = useGameStore((s) => s.targetScoreEnabled);
  const target = useGameStore((s) => s.targetScore);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);

  if (!enabled) return null;

  const pctA = Math.min(100, (teamA.score / target) * 100);
  const pctB = Math.min(100, (teamB.score / target) * 100);

  return (
    <div className="mx-auto mt-2 w-full max-w-[280px] space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        <span>First to {target}</span>
      </div>
      <div className="space-y-1">
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pctA}%`, backgroundColor: teamA.color }}
          />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pctB}%`, backgroundColor: teamB.color }}
          />
        </div>
      </div>
    </div>
  );
}
