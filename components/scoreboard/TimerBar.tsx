"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import {
  resolveActiveVariant,
  resolveSportConfig,
} from "@/lib/sportRegistry";
import { CUSTOM_TIMER_VARIANT_ID } from "@/lib/types";
import { RuleNotes } from "./RuleNotes";

export function TimerBar() {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const timerVariantId = useGameStore((s) => s.timerVariantId);
  const customTimerFormat = useGameStore((s) => s.customTimerFormat);
  const timer = useGameStore((s) => s.timer);
  const setCountdownDuration = useGameStore((s) => s.setCountdownDuration);
  const startTimer = useGameStore((s) => s.startTimer);
  const pauseTimer = useGameStore((s) => s.pauseTimer);
  const resetTimer = useGameStore((s) => s.resetTimer);
  const setTimerVariant = useGameStore((s) => s.setTimerVariant);
  const setCustomTimerFormat = useGameStore((s) => s.setCustomTimerFormat);
  const applyOfficialPeriodTimer = useGameStore(
    (s) => s.applyOfficialPeriodTimer,
  );
  const applyOvertimeTimer = useGameStore((s) => s.applyOvertimeTimer);

  const [rulesOpen, setRulesOpen] = useState(false);

  const cfg = resolveSportConfig(sportId, customSport);
  const variants = cfg.timerVariants ?? [];
  const isCustomFormat = timerVariantId === CUSTOM_TIMER_VARIANT_ID;
  const active = resolveActiveVariant(cfg, timerVariantId, customTimerFormat);
  const showFormatRow = variants.length > 0 || !cfg.noGameClock;
  const formatSelectValue = isCustomFormat
    ? CUSTOM_TIMER_VARIANT_ID
    : variants.some((x) => x.id === timerVariantId)
      ? timerVariantId
      : variants[0]?.id ?? CUSTOM_TIMER_VARIANT_ID;

  const customPeriodMin = Math.floor(customTimerFormat.periodSeconds / 60);
  const customPeriodSec = customTimerFormat.periodSeconds % 60;

  const onFormatChange = (value: string) => {
    if (value === CUSTOM_TIMER_VARIANT_ID) {
      setTimerVariant(CUSTOM_TIMER_VARIANT_ID);
      return;
    }
    setTimerVariant(value);
  };

  const showOfficial =
    showFormatRow && active && active.periodSeconds > 0;
  const showOt = active?.overtimeSeconds && active.overtimeSeconds > 0;

  return (
    <>
      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
        {showFormatRow && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Format
              </label>
              <select
                value={formatSelectValue}
                onChange={(e) => onFormatChange(e.target.value)}
                className="max-w-[min(100%,280px)] flex-1 rounded-lg border border-white/15 bg-zinc-900 px-2 py-1.5 text-xs text-white"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
                <option value={CUSTOM_TIMER_VARIANT_ID}>Custom</option>
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
            {isCustomFormat && (
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-2">
                <label className="flex flex-col gap-0.5 text-[10px] text-zinc-400">
                  Period min
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={customPeriodMin}
                    onChange={(e) => {
                      const min = Number(e.target.value);
                      setCustomTimerFormat({
                        periodSeconds: min * 60 + customPeriodSec,
                        regulationPeriods: customTimerFormat.regulationPeriods,
                      });
                    }}
                    className="rounded border border-white/15 bg-zinc-900 px-2 py-1 text-xs text-white"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-[10px] text-zinc-400">
                  Period sec
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={customPeriodSec}
                    onChange={(e) => {
                      const sec = Number(e.target.value);
                      setCustomTimerFormat({
                        periodSeconds: customPeriodMin * 60 + sec,
                        regulationPeriods: customTimerFormat.regulationPeriods,
                      });
                    }}
                    className="rounded border border-white/15 bg-zinc-900 px-2 py-1 text-xs text-white"
                  />
                </label>
                <label className="flex flex-col gap-0.5 text-[10px] text-zinc-400">
                  Periods
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={customTimerFormat.regulationPeriods}
                    onChange={(e) =>
                      setCustomTimerFormat({
                        periodSeconds: customTimerFormat.periodSeconds,
                        regulationPeriods: Number(e.target.value),
                      })
                    }
                    className="rounded border border-white/15 bg-zinc-900 px-2 py-1 text-xs text-white"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {!cfg.noGameClock && (
          <div className="flex flex-wrap items-center justify-center gap-2">
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
            No official game clock — score by rallies or innings.{" "}
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
              Set clock → period (
              {Math.floor((active?.periodSeconds ?? 0) / 60)}:
              {String(Math.floor((active?.periodSeconds ?? 0) % 60)).padStart(
                2,
                "0",
              )}
              )
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
