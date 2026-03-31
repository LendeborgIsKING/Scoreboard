"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { resolveSportConfig, hasFeature } from "@/lib/sportRegistry";
import { formatSeconds } from "@/lib/format";
import { useTimerDisplay } from "@/hooks/useTimerDisplay";

export function GameInfo() {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const period = useGameStore((s) => s.period);
  const halfInning = useGameStore((s) => s.halfInning);
  const down = useGameStore((s) => s.down);
  const balls = useGameStore((s) => s.balls);
  const strikes = useGameStore((s) => s.strikes);
  const outs = useGameStore((s) => s.outs);
  const timer = useGameStore((s) => s.timer);
  const cfg = resolveSportConfig(sportId, customSport);
  const displaySec = useTimerDisplay();
  const running = timer.running;
  const bigClock = cfg.timerEmphasis;

  const lowTime =
    timer.mode === "countdown" && displaySec <= 60 && displaySec > 0;

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-3">
      <motion.div
        animate={
          running
            ? { boxShadow: "0 0 32px rgba(34,211,238,0.35)" }
            : { boxShadow: "0 0 0 rgba(0,0,0,0)" }
        }
        className={`rounded-2xl border px-6 py-3 text-center font-mono font-bold tabular-nums ${
          bigClock ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
        } ${
          lowTime
            ? "border-red-500/80 bg-red-950/40 text-red-100 shadow-[0_0_40px_rgba(239,68,68,0.45)]"
            : "border-white/15 bg-black/30 text-white"
        }`}
      >
        {formatSeconds(displaySec)}
        {timer.mode === "countdown" && (
          <span className="ml-2 align-middle text-sm font-normal text-zinc-500">
            left
          </span>
        )}
      </motion.div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-400">
        {(hasFeature(cfg, "periods") || hasFeature(cfg, "innings")) && (
          <span className="rounded-full bg-white/5 px-3 py-1 font-medium text-zinc-200">
            {cfg.periodLabel} {period}
            {hasFeature(cfg, "halfInning") && (
              <span className="text-emerald-400/90">
                {" "}
                · {halfInning === "top" ? "Top" : "Bot"}
              </span>
            )}
          </span>
        )}
        {hasFeature(cfg, "downs") && (
          <span className="rounded-full bg-white/5 px-3 py-1">
            Down {down}
          </span>
        )}
        {hasFeature(cfg, "ballsStrikesOuts") && (
          <span className="rounded-full bg-amber-950/50 px-3 py-1 text-amber-200/90">
            {balls}-{strikes} · {outs} out
          </span>
        )}
      </div>
    </div>
  );
}
