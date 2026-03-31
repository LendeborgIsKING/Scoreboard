"use client";

import { motion } from "framer-motion";
import { useGameStore, playScoreChime } from "@/lib/gameStore";
import { resolveSportConfig, hasFeature } from "@/lib/sportRegistry";
import type { TeamId } from "@/lib/types";
import { TimerBar } from "./TimerBar";

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function ControlPanel({ collapsed, onToggleCollapse }: Props) {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const hype = useGameStore((s) => s.hypeMode);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const downVal = useGameStore((s) => s.down);
  const balls = useGameStore((s) => s.balls);
  const strikes = useGameStore((s) => s.strikes);
  const outs = useGameStore((s) => s.outs);
  const possession = useGameStore((s) => s.possession);
  const setPossession = useGameStore((s) => s.setPossession);
  const addScore = useGameStore((s) => s.addScore);
  const adjustFouls = useGameStore((s) => s.adjustFouls);
  const adjustTimeouts = useGameStore((s) => s.adjustTimeouts);
  const nextPeriod = useGameStore((s) => s.nextPeriod);
  const prevPeriod = useGameStore((s) => s.prevPeriod);
  const toggleHalfInning = useGameStore((s) => s.toggleHalfInning);
  const adjustBSO = useGameStore((s) => s.adjustBSO);
  const resetCount = useGameStore((s) => s.resetCount);
  const adjustDown = useGameStore((s) => s.adjustDown);
  const undo = useGameStore((s) => s.undo);
  const resetGame = useGameStore((s) => s.resetGame);

  const cfg = resolveSportConfig(sportId, customSport);

  const scoreTap = (team: TeamId, id: string) => {
    addScore(team, id);
    playScoreChime(hype);
  };

  const confirmReset = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Reset entire game state?")
    ) {
      resetGame();
    }
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapse}
        className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/20 bg-zinc-900/90 px-5 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur"
      >
        Show controls
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 w-full max-w-5xl space-y-4 rounded-3xl border border-white/10 bg-black/40 p-4 shadow-2xl backdrop-blur-xl sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TimerBar />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={undo}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-white/20"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={confirmReset}
            className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-xs font-bold uppercase text-rose-200 hover:bg-rose-900/50"
          >
            Reset game
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
          >
            Collapse
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(["a", "b"] as const).map((side) => (
          <div
            key={side}
            className={`rounded-2xl border p-3 ${
              possession === side
                ? "border-cyan-400/50 bg-cyan-950/20"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {side === "a" ? "Home controls" : "Away controls"}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {cfg.scoring.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => scoreTap(side, action.id)}
                  className="min-h-[44px] min-w-[52px] rounded-xl bg-gradient-to-b from-white/20 to-white/5 px-3 py-2 text-sm font-bold text-white shadow-inner ring-1 ring-white/10 transition hover:scale-105 active:scale-95"
                >
                  {action.label}
                  <span className="block text-[10px] font-normal text-zinc-400">
                    +{action.value}
                  </span>
                </button>
              ))}
            </div>

            {hasFeature(cfg, "fouls") && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-400">
                Fouls
                <button
                  type="button"
                  className="rounded bg-white/10 px-2 py-1"
                  onClick={() => adjustFouls(side, -1)}
                >
                  −
                </button>
                <span className="font-mono text-white">
                  {side === "a" ? teamA.fouls : teamB.fouls}
                </span>
                <button
                  type="button"
                  className="rounded bg-white/10 px-2 py-1"
                  onClick={() => adjustFouls(side, 1)}
                >
                  +
                </button>
              </div>
            )}

            {hasFeature(cfg, "timeouts") && (
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-zinc-400">
                TO
                <button
                  type="button"
                  className="rounded bg-white/10 px-2 py-1"
                  onClick={() => adjustTimeouts(side, -1)}
                >
                  −
                </button>
                <span className="font-mono text-white">
                  {side === "a" ? teamA.timeouts : teamB.timeouts}
                </span>
                <button
                  type="button"
                  className="rounded bg-white/10 px-2 py-1"
                  onClick={() => adjustTimeouts(side, 1)}
                >
                  +
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-4">
        {(hasFeature(cfg, "periods") || hasFeature(cfg, "innings")) && (
          <>
            <button
              type="button"
              onClick={() => prevPeriod()}
              className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-zinc-300"
            >
              − {cfg.periodLabel}
            </button>
            <button
              type="button"
              onClick={() => nextPeriod()}
              className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-zinc-300"
            >
              + {cfg.periodLabel}
            </button>
          </>
        )}
        {hasFeature(cfg, "halfInning") && (
          <button
            type="button"
            onClick={() => toggleHalfInning()}
            className="rounded-lg bg-emerald-900/40 px-3 py-1.5 text-xs font-semibold text-emerald-200"
          >
            Toggle Top/Bot
          </button>
        )}
        {hasFeature(cfg, "downs") && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            Down
            <button
              type="button"
              className="rounded bg-white/10 px-2 py-1"
              onClick={() => adjustDown(-1)}
            >
              −
            </button>
            <span className="font-mono text-white">{downVal}</span>
            <button
              type="button"
              className="rounded bg-white/10 px-2 py-1"
              onClick={() => adjustDown(1)}
            >
              +
            </button>
          </div>
        )}
        {hasFeature(cfg, "ballsStrikesOuts") && (
          <div className="flex flex-wrap gap-2 text-xs">
            {(["balls", "strikes", "outs"] as const).map((k) => (
              <div key={k} className="flex items-center gap-1 text-zinc-400">
                <span className="uppercase">{k.slice(0, 1)}</span>
                <button
                  type="button"
                  className="rounded bg-white/10 px-2 py-0.5"
                  onClick={() => adjustBSO(k, -1)}
                >
                  −
                </button>
                <span className="w-4 text-center font-mono text-white">
                  {k === "balls" ? balls : k === "strikes" ? strikes : outs}
                </span>
                <button
                  type="button"
                  className="rounded bg-white/10 px-2 py-0.5"
                  onClick={() => adjustBSO(k, 1)}
                >
                  +
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => resetCount()}
              className="rounded-lg bg-amber-900/40 px-2 py-1 text-amber-100"
            >
              Clear cnt
            </button>
          </div>
        )}
        {hasFeature(cfg, "possession") && (
          <div className="flex gap-1 text-xs">
            <span className="text-zinc-500">Poss</span>
            <button
              type="button"
              className={`rounded px-2 py-1 ${possession === "a" ? "bg-cyan-600 text-white" : "bg-white/5"}`}
              onClick={() => setPossession("a")}
            >
              H
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 ${possession === "b" ? "bg-cyan-600 text-white" : "bg-white/5"}`}
              onClick={() => setPossession("b")}
            >
              A
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
