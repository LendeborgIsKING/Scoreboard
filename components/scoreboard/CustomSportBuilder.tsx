"use client";

import { useState, type ReactNode } from "react";
import { useGameStore } from "@/lib/gameStore";
import type { SportConfig } from "@/lib/types";
import { FitScreen } from "./MenuScrollLayout";

export function CustomSportBuilder() {
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const setCustomSport = useGameStore((s) => s.setCustomSport);
  const currentCustom = useGameStore((s) => s.customSport);

  const [name, setName] = useState(currentCustom?.name || "My Sport");
  const [periodLabel, setPeriodLabel] = useState(currentCustom?.periodLabel || "Period");
  const [maxPeriods, setMaxPeriods] = useState(currentCustom?.maxPeriods?.toString() || "4");
  const [periodSeconds, setPeriodSeconds] = useState((currentCustom?.timerVariants?.[0]?.periodSeconds || 600).toString());
  
  const defaultScoring = currentCustom?.scoring || [
    { id: "1pt", label: "+1", value: 1 },
    { id: "2pt", label: "+2", value: 2 },
    { id: "3pt", label: "+3", value: 3 },
  ];
  const [scoring, setScoring] = useState(defaultScoring);
  
  const [hasFouls, setHasFouls] = useState(currentCustom?.features.includes("fouls") ?? true);
  const [hasTimeouts, setHasTimeouts] = useState(currentCustom?.features.includes("timeouts") ?? true);
  const [hasPossession, setHasPossession] = useState(currentCustom?.features.includes("possession") ?? true);

  const handleSave = () => {
    const config: SportConfig = {
      id: "custom",
      name: name || "Custom Sport",
      periodLabel: periodLabel || "Period",
      maxPeriods: maxPeriods ? parseInt(maxPeriods, 10) : undefined,
      scoring: scoring,
      features: ["periods"],
      timerVariants: [
        {
          id: "custom-timer",
          label: "Standard",
          periodSeconds: parseInt(periodSeconds, 10) || 600,
          regulationPeriods: maxPeriods ? parseInt(maxPeriods, 10) : 4,
          periodLabel: periodLabel || "Period",
        }
      ],
      defaultVariantId: "custom-timer",
    };

    if (hasFouls) config.features.push("fouls");
    if (hasTimeouts) config.features.push("timeouts");
    if (hasPossession) config.features.push("possession");

    setCustomSport(config);
    setUiPhase("setup");
  };

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-center font-semibold text-white outline-none focus:border-amber-400";

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-black text-white">
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 pt-3">
        <button
          type="button"
          onClick={() => setUiPhase("menu")}
          className="justify-self-start py-2 text-sm font-semibold text-zinc-400 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold tracking-tight">Custom Sport</h1>
        <span />
      </header>

      <FitScreen>
        <div className="mx-auto flex w-full max-w-sm flex-col gap-4 px-5 py-4">
          <Labeled label="Sport name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </Labeled>

          <div className="grid grid-cols-3 gap-2">
            <Labeled label="Period">
              <input
                type="text"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="Quarter"
                className={inputClass}
              />
            </Labeled>
            <Labeled label="Count">
              <input
                type="number"
                value={maxPeriods}
                onChange={(e) => setMaxPeriods(e.target.value)}
                placeholder="4"
                className={inputClass}
              />
            </Labeled>
            <Labeled label="Seconds">
              <input
                type="number"
                value={periodSeconds}
                onChange={(e) => setPeriodSeconds(e.target.value)}
                placeholder="600"
                className={inputClass}
              />
            </Labeled>
          </div>

          <Labeled label="Scoring buttons">
            <div className="flex flex-wrap justify-center gap-2">
              {scoring.map((sc, i) => (
                <div
                  key={sc.id}
                  className="flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2 py-1.5"
                >
                  <input
                    type="text"
                    value={sc.label}
                    aria-label="Button label"
                    onChange={(e) => {
                      const newS = [...scoring];
                      newS[i] = { ...newS[i], label: e.target.value };
                      setScoring(newS);
                    }}
                    className="w-10 bg-transparent text-center font-bold text-white outline-none"
                  />
                  <span className="text-xs text-zinc-500">=</span>
                  <input
                    type="number"
                    value={sc.value}
                    aria-label="Points"
                    onChange={(e) => {
                      const newS = [...scoring];
                      newS[i] = { ...newS[i], value: parseInt(e.target.value) || 0 };
                      setScoring(newS);
                    }}
                    className="w-8 bg-transparent text-center text-white outline-none"
                  />
                  {scoring.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setScoring(scoring.filter((_, j) => j !== i))}
                      className="px-1 text-red-500 hover:text-red-400"
                      aria-label="Remove button"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {scoring.length < 4 && (
                <button
                  type="button"
                  onClick={() =>
                    setScoring([...scoring, { id: `pt${Date.now()}`, label: "+1", value: 1 }])
                  }
                  className="rounded-xl border border-dashed border-white/25 px-3 py-1.5 text-sm font-bold text-zinc-400 hover:text-white"
                >
                  + Add
                </button>
              )}
            </div>
          </Labeled>

          <Labeled label="Track">
            <div className="grid grid-cols-3 gap-2">
              <Chip label="Fouls" checked={hasFouls} onChange={setHasFouls} />
              <Chip label="Timeouts" checked={hasTimeouts} onChange={setHasTimeouts} />
              <Chip label="Possession" checked={hasPossession} onChange={setHasPossession} />
            </div>
          </Labeled>
        </div>
      </FitScreen>

      <div className="mx-auto w-full max-w-sm shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-2xl bg-amber-400 py-4 text-lg font-black uppercase text-black hover:bg-amber-300"
        >
          Save & Start
        </button>
      </div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
        {label}
      </span>
      <div className="w-full">{children}</div>
    </div>
  );
}

function Chip({
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
      className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition ${
        checked ? "border-amber-400 bg-amber-400 text-black" : "border-white/15 text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

