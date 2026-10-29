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
import { FitScreen } from "./MenuScrollLayout";

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

  const updateCustomFormat = <K extends keyof PreGameSetupPrefs>(
    key: K,
    value: PreGameSetupPrefs[K],
  ) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    syncCustomFormatFromPrefs(next);
  };

  const showFormat = variants.length > 0 || !cfg.noGameClock;
  const showOtOption = sportId === "hockey" && !cfg.noGameClock;
  const hint = !isCustomFormat ? active?.hints?.[0] : undefined;

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-black text-white">
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 pt-3">
        <button
          type="button"
          onClick={() => setUiPhase("menu")}
          className="justify-self-start py-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <SportLineIcon sportId={sportId} className="h-6 w-6" />
          <h1 className="text-lg font-bold tracking-tight">{cfg.name}</h1>
        </div>
        {cfg.rulesReference ? (
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="justify-self-end py-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
          >
            Rules
          </button>
        ) : (
          <span />
        )}
      </header>

      <FitScreen>
        <div className="mx-auto flex w-full max-w-sm flex-col gap-5 px-5 py-4">
          {showFormat && (
            <section className="flex flex-col items-center gap-2">
              <SectionLabel>Format</SectionLabel>
              <select
                value={formatSelectValue}
                onChange={(e) => onFormatChange(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-zinc-950 px-4 py-3 text-center text-base font-semibold text-white"
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
                <div className="grid w-full grid-cols-3 gap-2">
                  <NumberBox
                    label="Min"
                    min={0}
                    max={90}
                    value={prefs.periodMinutes}
                    onChange={(v) => updateCustomFormat("periodMinutes", v)}
                  />
                  <NumberBox
                    label="Sec"
                    min={0}
                    max={59}
                    value={prefs.periodSecondsRemainder}
                    onChange={(v) =>
                      updateCustomFormat("periodSecondsRemainder", v)
                    }
                  />
                  <NumberBox
                    label={`${cfg.periodLabel}s`}
                    min={1}
                    max={20}
                    value={prefs.totalPeriods}
                    onChange={(v) => updateCustomFormat("totalPeriods", v)}
                  />
                </div>
              )}
              {hint && (
                <p className="text-center text-xs text-zinc-500">{hint}</p>
              )}
            </section>
          )}

          <section className="flex flex-col items-center gap-2">
            <SectionLabel>Teams</SectionLabel>
            <TeamRow
              name={prefs.teamAName}
              color={prefs.teamAColor}
              placeholder="Home"
              onName={(v) => update("teamAName", v)}
              onColor={(v) => update("teamAColor", v)}
            />
            <TeamRow
              name={prefs.teamBName}
              color={prefs.teamBColor}
              placeholder="Away"
              onName={(v) => update("teamBName", v)}
              onColor={(v) => update("teamBColor", v)}
            />
          </section>

          <section className="flex flex-col items-center gap-2">
            <SectionLabel>Options</SectionLabel>
            <div className="grid w-full grid-cols-2 gap-2">
              {hasFeature(cfg, "shotClock") && (
                <OptionChip
                  label="Shot clock"
                  checked={prefs.shotClockEnabled}
                  onChange={(v) => update("shotClockEnabled", v)}
                />
              )}
              {hasFeature(cfg, "targetScore") && (
                <OptionChip
                  label="Target score"
                  checked={prefs.targetScoreEnabled}
                  onChange={(v) => update("targetScoreEnabled", v)}
                />
              )}
              {hasFeature(cfg, "stoppageTime") && (
                <OptionChip
                  label="Stoppage time"
                  checked={prefs.stoppageTimeEnabled}
                  onChange={(v) => update("stoppageTimeEnabled", v)}
                />
              )}
              {sportId === "soccer" && (
                <OptionChip
                  label="Penalties"
                  checked={prefs.penaltyShootoutEnabled}
                  onChange={(v) => update("penaltyShootoutEnabled", v)}
                />
              )}
              {showOtOption && (
                <OptionChip
                  label="OT → Shootout"
                  checked={prefs.overtimeThenShootoutEnabled}
                  onChange={(v) => update("overtimeThenShootoutEnabled", v)}
                />
              )}
              <OptionChip
                label="Intro"
                checked={prefs.introSequenceEnabled}
                onChange={(v) => update("introSequenceEnabled", v)}
              />
            </div>

            {hasFeature(cfg, "shotClock") && prefs.shotClockEnabled && (
              <InlineNumber
                label="Shot clock"
                suffix="sec"
                min={5}
                max={45}
                value={prefs.shotClockSeconds}
                onChange={(v) => update("shotClockSeconds", v)}
              />
            )}
            {hasFeature(cfg, "targetScore") && prefs.targetScoreEnabled && (
              <InlineNumber
                label="First to"
                suffix="pts"
                min={1}
                value={prefs.targetScore}
                onChange={(v) => update("targetScore", v)}
              />
            )}
            {hasFeature(cfg, "stoppageTime") && prefs.stoppageTimeEnabled && (
              <InlineNumber
                label="Default stoppage"
                suffix="min"
                min={0}
                max={15}
                value={prefs.defaultStoppageAdd}
                onChange={(v) => update("defaultStoppageAdd", v)}
              />
            )}
            {showOtOption && prefs.overtimeThenShootoutEnabled && (
              <div className="grid w-full grid-cols-2 gap-2">
                <InlineNumber
                  label="OT"
                  suffix="min"
                  min={0}
                  max={60}
                  value={prefs.overtimeMinutes}
                  onChange={(v) => update("overtimeMinutes", v)}
                />
                <InlineNumber
                  label="OT"
                  suffix="sec"
                  min={0}
                  max={59}
                  value={prefs.overtimeSecondsRemainder}
                  onChange={(v) => update("overtimeSecondsRemainder", v)}
                />
              </div>
            )}
          </section>
        </div>
      </FitScreen>

      <div className="mx-auto w-full max-w-sm shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
      {children}
    </span>
  );
}

function TeamRow({
  name,
  color,
  placeholder,
  onName,
  onColor,
}: {
  name: string;
  color: string;
  placeholder: string;
  onName: (v: string) => void;
  onColor: (v: string) => void;
}) {
  return (
    <div className="flex w-full items-center gap-3">
      <label
        className="relative h-11 w-11 shrink-0 cursor-pointer rounded-full border-2 border-white/30"
        style={{ backgroundColor: color }}
        aria-label={`${placeholder} color`}
      >
        <input
          type="color"
          value={color}
          onChange={(e) => onColor(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <input
        value={name}
        placeholder={placeholder}
        onChange={(e) => onName(e.target.value)}
        className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-center text-base font-semibold text-white outline-none focus:border-white/50"
      />
      <span className="w-11 shrink-0" aria-hidden />
    </div>
  );
}

function OptionChip({
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
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
        checked
          ? "border-white bg-white text-black"
          : "border-white/15 text-zinc-300 hover:border-white/40"
      }`}
    >
      {label}
    </button>
  );
}

function InlineNumber({
  label,
  suffix,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  suffix?: string;
  min?: number;
  max?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-2 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 rounded-lg bg-white/5 px-2 py-1 text-center font-semibold text-white outline-none focus:bg-white/10"
        />
        {suffix && <span className="text-xs text-zinc-500">{suffix}</span>}
      </span>
    </label>
  );
}

function NumberBox({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-2 text-center text-sm font-semibold text-white outline-none focus:border-white/50"
      />
    </label>
  );
}

