"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { motion } from "framer-motion";
import type { SportConfig } from "@/lib/types";

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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-black px-5 py-6 text-white pb-[env(safe-area-inset-bottom)] overflow-auto">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-black">Custom Sport</h1>
        <button
          onClick={() => setUiPhase("menu")}
          className="text-sm font-bold text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
      
      <div className="flex flex-col gap-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Sport Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 p-3 font-bold text-white outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Period Name</label>
            <input
              type="text"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="e.g. Quarter"
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Max Periods</label>
            <input
              type="number"
              value={maxPeriods}
              onChange={(e) => setMaxPeriods(e.target.value)}
              placeholder="e.g. 4"
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Clock Length (seconds)</label>
          <input
            type="number"
            value={periodSeconds}
            onChange={(e) => setPeriodSeconds(e.target.value)}
            placeholder="e.g. 600"
            className="mt-1 w-full rounded-xl border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Scoring Buttons</label>
            {scoring.length < 4 && (
              <button
                onClick={() => setScoring([...scoring, { id: `pt${Date.now()}`, label: `+1`, value: 1 }])}
                className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase hover:bg-white/20"
              >
                Add Button
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {scoring.map((sc, i) => (
              <div key={sc.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={sc.label}
                  onChange={(e) => {
                    const newS = [...scoring];
                    newS[i].label = e.target.value;
                    setScoring(newS);
                  }}
                  className="w-20 rounded-lg border border-white/20 bg-white/5 p-2 text-center font-bold text-white outline-none focus:border-amber-400"
                />
                <span className="text-zinc-500">=</span>
                <input
                  type="number"
                  value={sc.value}
                  onChange={(e) => {
                    const newS = [...scoring];
                    newS[i].value = parseInt(e.target.value) || 0;
                    setScoring(newS);
                  }}
                  className="w-16 rounded-lg border border-white/20 bg-white/5 p-2 text-center text-white outline-none focus:border-amber-400"
                />
                <span className="text-sm text-zinc-500">pts</span>
                {scoring.length > 1 && (
                  <button
                    onClick={() => {
                      const newS = [...scoring];
                      newS.splice(i, 1);
                      setScoring(newS);
                    }}
                    className="ml-auto text-red-500 hover:text-red-400"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="flex items-center justify-between">
            <span className="font-bold">Track Fouls</span>
            <input type="checkbox" checked={hasFouls} onChange={(e) => setHasFouls(e.target.checked)} className="h-5 w-5 accent-amber-400" />
          </label>
          <label className="flex items-center justify-between">
            <span className="font-bold">Track Timeouts</span>
            <input type="checkbox" checked={hasTimeouts} onChange={(e) => setHasTimeouts(e.target.checked)} className="h-5 w-5 accent-amber-400" />
          </label>
          <label className="flex items-center justify-between">
            <span className="font-bold">Possession Arrow</span>
            <input type="checkbox" checked={hasPossession} onChange={(e) => setHasPossession(e.target.checked)} className="h-5 w-5 accent-amber-400" />
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-8 mb-4 shrink-0 rounded-full bg-amber-400 py-4 font-black uppercase text-black hover:bg-amber-300"
      >
        Save & Start
      </button>
    </div>
  );
}
