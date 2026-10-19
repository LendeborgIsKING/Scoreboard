"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import {
  activePenaltiesForTeam,
  formatPenaltyTime,
  powerPlayLabel,
} from "@/lib/hockeyUtils";

/** One compact row — only shows chips that matter right now. */
export function HockeyStatusStrip() {
  const sportId = useGameStore((s) => s.sportId);
  const toggles = useGameStore((s) => s.hockeyToggles);
  const penalties = useGameStore((s) => s.hockeyPenalties);
  const delayed = useGameStore((s) => s.hockeyDelayedTeam);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const shotsA = useGameStore((s) => s.hockeyShotsA);
  const shotsB = useGameStore((s) => s.hockeyShotsB);
  const puckDrop = useGameStore((s) => s.puckDrop);
  const puckSec = useGameStore((s) => s.puckDropDelaySeconds);
  const [, bump] = useState(0);

  useEffect(() => {
    if (!puckDrop) return;
    const id = window.setInterval(() => bump((n) => n + 1), 200);
    return () => window.clearInterval(id);
  }, [puckDrop]);

  if (sportId !== "hockey") return null;

  const chips: string[] = [];

  if (puckDrop) {
    const rem = Math.max(0, Math.ceil((puckDrop.startsAt - Date.now()) / 1000));
    chips.push(`DROP ${rem || puckSec}s`);
  }

  if (toggles.delayedPenalty && delayed) {
    const name = delayed === "a" ? teamA.name : teamB.name;
    chips.push(`DEL ${name}`);
  }

  if (toggles.powerPlayIndicator && penalties.length > 0) {
    const pp = powerPlayLabel(penalties, teamA.name, teamB.name);
    if (pp && pp !== "EVEN") chips.push(pp);
  }

  if (toggles.penaltyBox) {
    for (const side of ["a", "b"] as const) {
      const list = activePenaltiesForTeam(penalties, side);
      if (list.length === 0) continue;
      const name = side === "a" ? teamA.name : teamB.name;
      const times = list.map((p) => formatPenaltyTime(p.remainingSeconds)).join(" ");
      chips.push(`${name} ${times}`);
    }
  }

  if (toggles.shotsOnGoal && (shotsA > 0 || shotsB > 0)) {
    chips.push(`SOG ${shotsA}–${shotsB}`);
  }

  if (chips.length === 0) return null;

  return (
    <div className="mx-auto flex max-w-[min(100%,320px)] flex-wrap justify-center gap-1 px-1">
      {chips.map((c) => (
        <span
          key={c}
          className="rounded-full border border-sky-400/40 bg-sky-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-200"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

export function HockeyLastGoalTicker() {
  const sportId = useGameStore((s) => s.sportId);
  const toggles = useGameStore((s) => s.hockeyToggles);
  const last = useGameStore((s) => s.hockeyLastGoal);
  if (sportId !== "hockey" || !toggles.lastGoalTicker || !last) return null;

  return (
    <div className="pointer-events-none absolute bottom-12 left-0 right-0 z-20 flex justify-center px-4">
      <p className="max-w-full truncate rounded-full border border-white/15 bg-black/70 px-3 py-1 text-[11px] font-semibold text-zinc-300 backdrop-blur-sm">
        Last goal: {last.teamName} at {last.clockLabel} P{last.period}
        {last.emptyNet ? " (EN)" : ""}
      </p>
    </div>
  );
}

export function HockeyGoalCelebration() {
  const sportId = useGameStore((s) => s.sportId);
  const toggles = useGameStore((s) => s.hockeyToggles);
  const key = useGameStore((s) => s.hockeyGoalCelebrationKey);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const last = useGameStore((s) => s.hockeyLastGoal);
  const [visibleKey, setVisibleKey] = useState(0);

  useEffect(() => {
    if (key > 0 && key !== visibleKey) {
      setVisibleKey(key);
      const t = window.setTimeout(() => setVisibleKey(0), 2200);
      return () => window.clearTimeout(t);
    }
  }, [key, visibleKey]);

  if (sportId !== "hockey" || !toggles.goalCelebration || visibleKey === 0) {
    return null;
  }

  const team = last?.team === "b" ? teamB : teamA;

  return (
    <AnimatePresence>
      <motion.div
        key={visibleKey}
        className="pointer-events-none absolute inset-0 z-[55] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.1, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="rounded-3xl border-4 px-10 py-6 text-center shadow-2xl"
          style={{
            borderColor: team.color,
            backgroundColor: `${team.color}22`,
            boxShadow: `0 0 60px ${team.color}66`,
          }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/80">
            Goal
          </p>
          <p
            className="mt-2 text-5xl font-black uppercase"
            style={{ color: team.color }}
          >
            {team.name}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Rink lines when enabled (works with any theme). */
export function HockeyRinkOverlay() {
  const sportId = useGameStore((s) => s.sportId);
  const toggles = useGameStore((s) => s.hockeyToggles);
  if (sportId !== "hockey" || !toggles.rinkVisual) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-35"
      aria-hidden
    >
      <div className="absolute inset-x-[8%] top-[18%] bottom-[22%] rounded-[3rem] border-2 border-sky-200/50" />
      <div className="absolute inset-x-[8%] top-1/2 h-0.5 -translate-y-1/2 bg-red-400/60" />
      <div className="absolute left-1/2 top-[18%] bottom-[22%] w-24 -translate-x-1/2 rounded-full border-2 border-red-400/50" />
      <div className="absolute left-[8%] top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border-2 border-red-400/40" />
      <div className="absolute right-[8%] top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border-2 border-red-400/40" />
    </div>
  );
}

/** Re-render puck drop countdown every 200ms while pending. */
export function HockeyTickBridge() {
  const sportId = useGameStore((s) => s.sportId);
  const tick = useGameStore((s) => s.tickHockey);

  useEffect(() => {
    if (sportId !== "hockey") return;
    const id = window.setInterval(() => tick(), 200);
    return () => window.clearInterval(id);
  }, [sportId, tick]);

  return null;
}
