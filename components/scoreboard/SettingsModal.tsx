"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { PRESETS, CUSTOM_TEMPLATE } from "@/lib/sportPresets";
import type { ScoringAction, SportConfig, SportFeature, ThemeId } from "@/lib/types";

const FEATURE_OPTIONS: { id: SportFeature; label: string }[] = [
  { id: "fouls", label: "Fouls" },
  { id: "timeouts", label: "Timeouts" },
  { id: "possession", label: "Possession" },
  { id: "periods", label: "Periods" },
  { id: "downs", label: "Downs" },
  { id: "innings", label: "Innings" },
  { id: "halfInning", label: "Top/Bottom" },
  { id: "ballsStrikesOuts", label: "B / S / O" },
];

type Props = { onClose: () => void };

export function SettingsModal({ onClose }: Props) {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const theme = useGameStore((s) => s.theme);
  const hypeMode = useGameStore((s) => s.hypeMode);
  const setSport = useGameStore((s) => s.setSport);
  const setCustomSport = useGameStore((s) => s.setCustomSport);
  const setTeamName = useGameStore((s) => s.setTeamName);
  const setTeamColor = useGameStore((s) => s.setTeamColor);
  const setTheme = useGameStore((s) => s.setTheme);
  const setHypeMode = useGameStore((s) => s.setHypeMode);

  const [draft, setDraft] = useState<SportConfig>(() =>
    customSport ? { ...customSport } : { ...CUSTOM_TEMPLATE },
  );

  const applyPreset = (id: string) => {
    setSport(id);
    if (id !== "custom") onClose();
  };

  const saveCustom = () => {
    setCustomSport({
      ...draft,
      id: "custom",
      scoring: draft.scoring.filter((s) => s.label.trim().length > 0),
    });
    onClose();
  };

  const updateScoringRow = (index: number, patch: Partial<ScoringAction>) => {
    setDraft((d) => {
      const scoring = [...d.scoring];
      scoring[index] = { ...scoring[index], ...patch };
      return { ...d, scoring };
    });
  };

  const addScoringRow = () => {
    setDraft((d) => ({
      ...d,
      scoring: [
        ...d.scoring,
        {
          id: `c${Date.now()}`,
          label: "+1",
          value: 1,
        },
      ],
    }));
  };

  const removeScoringRow = (index: number) => {
    setDraft((d) => ({
      ...d,
      scoring: d.scoring.filter((_, i) => i !== index),
    }));
  };

  const toggleFeature = (id: SportFeature) => {
    setDraft((d) => {
      const has = d.features.includes(id);
      return {
        ...d,
        features: has ? d.features.filter((f) => f !== id) : [...d.features, id],
      };
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl sm:rounded-3xl"
          >
            <h2 className="text-lg font-bold text-white">Settings</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Sport presets are data-driven — custom builds your own.
            </p>

            <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Sport preset
            </label>
            <select
              value={sportId}
              onChange={(e) => applyPreset(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-white"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {sportId === "custom" && (
              <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                <label className="text-xs font-semibold uppercase text-zinc-500">
                  Custom name
                </label>
                <input
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-white"
                />
                <label className="text-xs font-semibold uppercase text-zinc-500">
                  Period label
                </label>
                <input
                  value={draft.periodLabel}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, periodLabel: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-white"
                />
                <p className="text-xs text-zinc-500">Scoring buttons</p>
                <div className="space-y-2">
                  {draft.scoring.map((row, i) => (
                    <div key={row.id} className="flex gap-2">
                      <input
                        value={row.label}
                        onChange={(e) =>
                          updateScoringRow(i, { label: e.target.value })
                        }
                        className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
                        placeholder="Label"
                      />
                      <input
                        type="number"
                        value={row.value}
                        onChange={(e) =>
                          updateScoringRow(i, {
                            value: Number(e.target.value) || 0,
                          })
                        }
                        className="w-20 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeScoringRow(i)}
                        className="rounded-lg bg-white/10 px-2 text-xs text-zinc-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addScoringRow}
                  className="text-sm text-cyan-400 hover:underline"
                >
                  + Add button
                </button>
                <div className="flex flex-wrap gap-2">
                  {FEATURE_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFeature(f.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        draft.features.includes(f.id)
                          ? "bg-cyan-600 text-white"
                          : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={saveCustom}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"
                >
                  Save custom sport
                </button>
              </div>
            )}

            <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
              <p className="text-xs font-semibold uppercase text-zinc-500">
                Teams
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] text-zinc-500">Home</label>
                  <input
                    value={teamA.name}
                    onChange={(e) => setTeamName("a", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                  />
                  <input
                    type="color"
                    value={teamA.color}
                    onChange={(e) => setTeamColor("a", e.target.value)}
                    className="mt-2 h-9 w-full cursor-pointer rounded border border-white/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500">Away</label>
                  <input
                    value={teamB.name}
                    onChange={(e) => setTeamName("b", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                  />
                  <input
                    type="color"
                    value={teamB.color}
                    onChange={(e) => setTeamColor("b", e.target.value)}
                    className="mt-2 h-9 w-full cursor-pointer rounded border border-white/10"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-6">
              <div className="w-full text-xs font-semibold uppercase text-zinc-500">
                Theme
              </div>
              {(
                [
                  ["dark", "Dark"],
                  ["neon", "Neon"],
                  ["classic", "Classic"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id as ThemeId)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                    theme === id
                      ? "bg-white text-black"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={hypeMode}
                onChange={(e) => setHypeMode(e.target.checked)}
                className="rounded border-white/20"
              />
              Hype mode (stronger motion + score blip)
            </label>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl border border-white/15 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              Done
            </button>
          </motion.div>
    </motion.div>
  );
}
