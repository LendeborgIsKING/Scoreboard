"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import type { TeamId } from "@/lib/types";

/** Shots on goal — away # | SOG | home # with + to increment. */
export function HockeySogDisplay() {
  const sportId = useGameStore((s) => s.sportId);
  const toggles = useGameStore((s) => s.hockeyToggles);
  const shotsA = useGameStore((s) => s.hockeyShotsA);
  const shotsB = useGameStore((s) => s.hockeyShotsB);
  const adjustShots = useGameStore((s) => s.adjustHockeyShots);

  if (sportId !== "hockey" || !toggles.shotsOnGoal) return null;

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,340px)] items-center justify-center gap-6 px-3 py-1 sm:gap-10">
      <div className="flex min-w-[4.5rem] flex-1 items-center justify-end gap-2">
        <span className="font-mono text-xl font-black tabular-nums text-white">
          {shotsB}
        </span>
        <button
          type="button"
          onClick={() => adjustShots("b", 1)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/40 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
          aria-label="Add away shot on goal"
        >
          +
        </button>
      </div>
      <span className="shrink-0 px-2 text-xs font-bold uppercase tracking-[0.35em] text-sky-300">
        SOG
      </span>
      <div className="flex min-w-[4.5rem] flex-1 items-center justify-start gap-2">
        <span className="font-mono text-xl font-black tabular-nums text-white">
          {shotsA}
        </span>
        <button
          type="button"
          onClick={() => adjustShots("a", 1)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/40 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
          aria-label="Add home shot on goal"
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Tap to mark which team has pulled the goalie (empty net). */
export function HockeyEmptyNetBadge({ side }: { side: TeamId }) {
  const sportId = useGameStore((s) => s.sportId);
  const toggles = useGameStore((s) => s.hockeyToggles);
  const emptyNetTeam = useGameStore((s) => s.hockeyEmptyNetTeam);
  const setEmptyNetTeam = useGameStore((s) => s.setHockeyEmptyNetTeam);

  if (sportId !== "hockey" || !toggles.emptyNetIndicator) return null;

  const active = emptyNetTeam === side;

  return (
    <button
      type="button"
      onClick={() => setEmptyNetTeam(active ? null : side)}
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider transition ${
        active
          ? "border-amber-400 bg-amber-500/25 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.35)]"
          : "border-white/25 text-zinc-500 hover:border-white/50 hover:text-zinc-300"
      }`}
      aria-label={active ? "Clear empty net" : "Mark empty net"}
      aria-pressed={active}
    >
      EN
    </button>
  );
}

/** Compact chips (puck drop, etc.) under the clock. */
export function HockeyStatusStrip() {
  const sportId = useGameStore((s) => s.sportId);
  const toggles = useGameStore((s) => s.hockeyToggles);
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
      const t = window.setTimeout(() => setVisibleKey(0), 5000);
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
