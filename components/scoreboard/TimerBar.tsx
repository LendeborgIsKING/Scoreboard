"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import {
  resolveActiveVariant,
  resolveSportConfig,
  usesCountUpTimer,
} from "@/lib/sportRegistry";
import { RuleNotes } from "./RuleNotes";

export function TimerBar() {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const timerVariantId = useGameStore((s) => s.timerVariantId);
  const timer = useGameStore((s) => s.timer);
  const setTimerMode = useGameStore((s) => s.setTimerMode);
  const setCountdownDuration = useGameStore((s) => s.setCountdownDuration);
  const startTimer = useGameStore((s) => s.startTimer);
  const pauseTimer = useGameStore((s) => s.pauseTimer);
  const resetTimer = useGameStore((s) => s.resetTimer);
  const setTimerVariant = useGameStore((s) => s.setTimerVariant);
  const applyOfficialPeriodTimer = useGameStore(
    (s) => s.applyOfficialPeriodTimer,
  );
  const applyOvertimeTimer = useGameStore((s) => s.applyOvertimeTimer);

  const [rulesOpen, setRulesOpen] = useState(false);

  const cfg = resolveSportConfig(sportId, customSport);
  const variants = cfg.timerVariants ?? [];
  const active = resolveActiveVariant(cfg, timerVariantId);
  const showOfficial =
    variants.length > 0 && active && active.periodSeconds > 0;
  const showOt =
    !usesCountUpTimer(sportId) &&
    active?.overtimeSeconds &&
    active.overtimeSeconds > 0;
  const isSoccer = usesCountUpTimer(sportId);

  return (
    <>
      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
        {variants.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Format
            </label>
            <select
              value={
                variants.some((x) => x.id === timerVariantId)
                  ? timerVariantId
                  : variants[0]?.id
              }
              onChange={(e) => setTimerVariant(e.target.value)}
              className="max-w-[min(100%,280px)] flex-1 rounded-lg border border-white/15 bg-zinc-900 px-2 py-1.5 text-xs text-white"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            {cfg.rulesReference && (
              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                className="rounded-lg border border-white/15 px-2 py-1 text-[10px] font-semibold uppercase text-zinc-400 hover:text-white"
              >
                Rules
              </button>
            )}
          </div>
        )}

        {!cfg.noGameClock && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setTimerMode("countup")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                  timer.mode === "countup"
                    ? "bg-emerald-600 text-white"
                    : "bg-white/5 text-zinc-400"
                }`}
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => setTimerMode("countdown")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                  timer.mode === "countdown"
                    ? "bg-rose-600 text-white"
                    : "bg-white/5 text-zinc-400"
                }`}
              >
                Down
              </button>
            </div>
            {timer.mode === "countdown" && (
              <label className="flex items-center gap-1 text-xs text-zinc-400">
                Mins
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={Math.round(timer.countdownFromSeconds / 60)}
                  onChange={(e) =>
                    setCountdownDuration(Number(e.target.value) * 60 || 60)
                  }
                  className="w-14 rounded border border-white/15 bg-zinc-900 px-2 py-1 text-white"
                />
              </label>
            )}
            <button
              type="button"
              onClick={() => (timer.running ? pauseTimer() : startTimer())}
              className="rounded-lg bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/20"
            >
              {timer.running ? "Pause" : "Start"}
            </button>
            <button
              type="button"
              onClick={() => resetTimer()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Reset clk
            </button>
          </div>
        )}

        {cfg.noGameClock && (
          <p className="text-center text-[11px] leading-snug text-zinc-500">
            No official game clock — use rally scoring or count-up for informal
            time.{" "}
            {cfg.rulesReference && (
              <button
                type="button"
                className="text-cyan-400/90 underline"
                onClick={() => setRulesOpen(true)}
              >
                View rules
              </button>
            )}
          </p>
        )}

        {showOfficial && (
          <div className="flex flex-wrap justify-center gap-2 border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={() => applyOfficialPeriodTimer()}
              className="rounded-lg bg-cyan-900/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-cyan-100 hover:bg-cyan-800/50"
            >
              {isSoccer
                ? `Reset period (count up · ${Math.floor((active?.periodSeconds ?? 0) / 60)}′)`
                : `Set clock → period (${Math.floor((active?.periodSeconds ?? 0) / 60)}:${String(Math.floor((active?.periodSeconds ?? 0) % 60)).padStart(2, "0")})`}
            </button>
            {showOt && (
              <button
                type="button"
                onClick={() => applyOvertimeTimer()}
                className="rounded-lg bg-amber-900/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-100 hover:bg-amber-800/40"
              >
                OT (
                {Math.floor((active?.overtimeSeconds ?? 0) / 60)}:
                {String(
                  Math.floor((active?.overtimeSeconds ?? 0) % 60),
                ).padStart(2, "0")}
                )
              </button>
            )}
          </div>
        )}
      </div>

      <RuleNotes
        cfg={cfg}
        timerVariantId={timerVariantId}
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </>
  );
}
