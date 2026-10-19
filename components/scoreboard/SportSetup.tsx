"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import {
  hasFeature,
  resolveActiveVariant,
  resolveSportConfig,
} from "@/lib/sportRegistry";
import {
  CUSTOM_TIMER_VARIANT_ID,
  type PreGameSetupPrefs,
} from "@/lib/types";
import { SportLineIcon } from "./SportLineIcons";
import { RuleNotes } from "./RuleNotes";

export function SportSetup() {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const timerVariantId = useGameStore((s) => s.timerVariantId);
  const preGameSetup = useGameStore((s) => s.preGameSetup);
  const setTimerVariant = useGameStore((s) => s.setTimerVariant);
  const setCustomTimerFormat = useGameStore((s) => s.setCustomTimerFormat);
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const applyPreGameSetup = useGameStore((s) => s.applyPreGameSetup);

  const [rulesOpen, setRulesOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(true);
  const [prefs, setPrefs] = useState<PreGameSetupPrefs>(preGameSetup);

  const cfg = resolveSportConfig(sportId, customSport);
  const variants = cfg.timerVariants ?? [];
  const customTimerFormat = useGameStore((s) => s.customTimerFormat);
  const isCustomFormat = timerVariantId === CUSTOM_TIMER_VARIANT_ID;
  const active = resolveActiveVariant(
    cfg,
    timerVariantId,
    customTimerFormat,
  );

  useEffect(() => {
    if (isCustomFormat) return;
    if (!active) return;
    const periodSec = active.periodSeconds;
    setPrefs((p) => ({
      ...p,
      periodMinutes: Math.floor(periodSec / 60),
      periodSecondsRemainder: periodSec % 60,
      totalPeriods: active.regulationPeriods,
      shotClockEnabled: sportId === "basketball",
      stoppageTimeEnabled: sportId === "soccer",
      overtimeMinutes: Math.floor((active.overtimeSeconds ?? 5 * 60) / 60),
      overtimeSecondsRemainder: (active.overtimeSeconds ?? 5 * 60) % 60,
    }));
  }, [active, sportId, timerVariantId, isCustomFormat]);

  const update = <K extends keyof PreGameSetupPrefs>(
    key: K,
    value: PreGameSetupPrefs[K],
  ) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const syncCustomFormatFromPrefs = (next: PreGameSetupPrefs) => {
    const periodSeconds =
      next.periodMinutes * 60 + next.periodSecondsRemainder;
    setCustomTimerFormat({
      periodSeconds,
      regulationPeriods: next.totalPeriods,
    });
  };

  const onFormatChange = (value: string) => {
    if (value === CUSTOM_TIMER_VARIANT_ID) {
      syncCustomFormatFromPrefs(prefs);
      setTimerVariant(CUSTOM_TIMER_VARIANT_ID);
      return;
    }
    setTimerVariant(value);
  };

  const formatSelectValue = isCustomFormat
    ? CUSTOM_TIMER_VARIANT_ID
    : variants.some((x) => x.id === timerVariantId)
      ? timerVariantId
      : variants[0]?.id ?? CUSTOM_TIMER_VARIANT_ID;

  const startGame = () => {
    if (isCustomFormat) {
      syncCustomFormatFromPrefs(prefs);
    }
    applyPreGameSetup(prefs);
    setUiPhase("game");
  };

  const periodFieldClass =
    "w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-sm text-white outline-none focus:border-white/50";

  return (
    <div className="flex w-full flex-col bg-black px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-2 text-white">
      <button
        type="button"
        onClick={() => setUiPhase("menu")}
        className="mb-4 flex items-center gap-2 py-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
      >
        <span aria-hidden>←</span> Back
      </button>

      <div className="flex flex-col items-center text-center">
        <SportLineIcon sportId={sportId} className="h-14 w-14" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{cfg.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure everything, then start the scoreboard.
        </p>
      </div>

      <div className="mt-6 flex flex-col space-y-4">
        {(variants.length > 0 || !cfg.noGameClock) && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Format
            </label>
            <select
              value={formatSelectValue}
              onChange={(e) => onFormatChange(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-zinc-950 px-4 py-3 text-base font-semibold text-white"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
              {!cfg.noGameClock && (
                <option value={CUSTOM_TIMER_VARIANT_ID}>Custom</option>
              )}
            </select>

            {isCustomFormat && (
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
                <Field label="Period min">
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={prefs.periodMinutes}
                    onChange={(e) => {
                      const next = {
                        ...prefs,
                        periodMinutes: Number(e.target.value),
                      };
                      setPrefs(next);
                      syncCustomFormatFromPrefs(next);
                    }}
                    className={periodFieldClass}
                  />
                </Field>
                <Field label="Period sec">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={prefs.periodSecondsRemainder}
                    onChange={(e) => {
                      const next = {
                        ...prefs,
                        periodSecondsRemainder: Number(e.target.value),
                      };
                      setPrefs(next);
                      syncCustomFormatFromPrefs(next);
                    }}
                    className={periodFieldClass}
                  />
                </Field>
                <Field label={`${cfg.periodLabel}s`}>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={prefs.totalPeriods}
                    onChange={(e) => {
                      const next = {
                        ...prefs,
                        totalPeriods: Number(e.target.value),
                      };
                      setPrefs(next);
                      syncCustomFormatFromPrefs(next);
                    }}
                    className={periodFieldClass}
                  />
                </Field>
              </div>
            )}

            {!isCustomFormat && active?.hints && active.hints.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-left text-sm text-zinc-500">
                {active.hints.map((h, i) => (
                  <li key={i} className="border-l border-white/10 pl-3">
                    {h}
                  </li>
                ))}
              </ul>
            )}

            {sportId === "hockey" && !cfg.noGameClock && (
              <div className="mt-3 space-y-3 rounded-xl border border-cyan-400/25 bg-cyan-400/5 p-3">
                <Toggle
                  label="If tied: one overtime, then shootout"
                  checked={prefs.overtimeThenShootoutEnabled}
                  onChange={(v) => update("overtimeThenShootoutEnabled", v)}
                />
                {prefs.overtimeThenShootoutEnabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="OT min">
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={prefs.overtimeMinutes}
                        onChange={(e) =>
                          update("overtimeMinutes", Number(e.target.value))
                        }
                        className={periodFieldClass}
                      />
                    </Field>
                    <Field label="OT sec">
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={prefs.overtimeSecondsRemainder}
                        onChange={(e) =>
                          update(
                            "overtimeSecondsRemainder",
                            Number(e.target.value),
                          )
                        }
                        className={periodFieldClass}
                      />
                    </Field>
                  </div>
                )}
                <p className="text-xs text-zinc-500">
                  Overtime runs once if regulation ends tied. Still tied after OT
                  starts an automatic shootout.
                </p>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setCustomOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-white/15 px-4 py-3 text-sm font-bold"
        >
          Game setup
          <span className="text-zinc-500">{customOpen ? "▲" : "▼"}</span>
        </button>

        {customOpen && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Home team">
                <input
                  value={prefs.teamAName}
                  onChange={(e) => update("teamAName", e.target.value)}
                  className={periodFieldClass}
                />
              </Field>
              <Field label="Away team">
                <input
                  value={prefs.teamBName}
                  onChange={(e) => update("teamBName", e.target.value)}
                  className={periodFieldClass}
                />
              </Field>
              <Field label="Home color">
                <input
                  type="color"
                  value={prefs.teamAColor}
                  onChange={(e) => update("teamAColor", e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-lg border border-white/20 bg-transparent"
                />
              </Field>
              <Field label="Away color">
                <input
                  type="color"
                  value={prefs.teamBColor}
                  onChange={(e) => update("teamBColor", e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-lg border border-white/20 bg-transparent"
                />
              </Field>
            </div>

            {hasFeature(cfg, "targetScore") && (
              <>
                <Toggle
                  label="Target score win"
                  checked={prefs.targetScoreEnabled}
                  onChange={(v) => update("targetScoreEnabled", v)}
                />
                {prefs.targetScoreEnabled && (
                  <Field label="Target score">
                    <input
                      type="number"
                      min={1}
                      value={prefs.targetScore}
                      onChange={(e) =>
                        update("targetScore", Number(e.target.value))
                      }
                      className={periodFieldClass}
                    />
                  </Field>
                )}
              </>
            )}

            {hasFeature(cfg, "shotClock") && (
              <>
                <Toggle
                  label="Shot clock"
                  checked={prefs.shotClockEnabled}
                  onChange={(v) => update("shotClockEnabled", v)}
                />
                {prefs.shotClockEnabled && (
                  <Field label="Shot clock (sec)">
                    <input
                      type="number"
                      min={5}
                      max={45}
                      value={prefs.shotClockSeconds}
                      onChange={(e) =>
                        update("shotClockSeconds", Number(e.target.value))
                      }
                      className={periodFieldClass}
                    />
                  </Field>
                )}
              </>
            )}

            {hasFeature(cfg, "stoppageTime") && (
              <>
                <Toggle
                  label="Stoppage / injury time"
                  checked={prefs.stoppageTimeEnabled}
                  onChange={(v) => update("stoppageTimeEnabled", v)}
                />
                {prefs.stoppageTimeEnabled && (
                  <Field label="Default stoppage (min)">
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={prefs.defaultStoppageAdd}
                      onChange={(e) =>
                        update("defaultStoppageAdd", Number(e.target.value))
                      }
                      className={periodFieldClass}
                    />
                  </Field>
                )}
              </>
            )}

            {sportId === "soccer" && (
              <Toggle
                label="Penalty shootout tracker (5 kicks per team)"
                checked={prefs.penaltyShootoutEnabled}
                onChange={(v) => update("penaltyShootoutEnabled", v)}
              />
            )}

            <Toggle
              label="Walk-out intro sequence"
              checked={prefs.introSequenceEnabled}
              onChange={(v) => update("introSequenceEnabled", v)}
            />
          </div>
        )}

        {cfg.noGameClock && (
          <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
            No official game clock — pick Custom under Format for your own timer.
          </p>
        )}

        {cfg.rulesReference && (
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="w-full rounded-xl border border-white/15 py-3 text-sm font-bold hover:bg-white/[0.06]"
          >
            Rules & official times
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 pt-4">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={startGame}
          className="w-full rounded-2xl bg-white py-4 text-lg font-bold text-black shadow-lg"
        >
          Start scoreboard
        </motion.button>
      </div>

      <RuleNotes
        cfg={cfg}
        timerVariantId={timerVariantId}
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
    >
      {label}
      <span className={checked ? "text-green-400" : "text-zinc-500"}>
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}
