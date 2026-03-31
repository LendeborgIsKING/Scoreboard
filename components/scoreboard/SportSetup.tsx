"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import {
  resolveActiveVariant,
  resolveSportConfig,
} from "@/lib/sportRegistry";
import { SPORT_MENU_ICON } from "@/lib/sportIcons";
import { RuleNotes } from "./RuleNotes";

export function SportSetup() {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const timerVariantId = useGameStore((s) => s.timerVariantId);
  const setTimerVariant = useGameStore((s) => s.setTimerVariant);
  const setUiPhase = useGameStore((s) => s.setUiPhase);

  const [rulesOpen, setRulesOpen] = useState(false);

  const cfg = resolveSportConfig(sportId, customSport);
  const variants = cfg.timerVariants ?? [];
  const active = resolveActiveVariant(cfg, timerVariantId);
  const icon = SPORT_MENU_ICON[sportId] ?? "🎯";

  return (
    <div className="flex min-h-full flex-col bg-[radial-gradient(ellipse_at_50%_0%,#1e293b_0%,#020617_55%,#000_100%)] px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <button
          type="button"
          onClick={() => setUiPhase("menu")}
          className="mb-6 self-start text-sm text-zinc-500 transition hover:text-white"
        >
          ← Back to sports
        </button>

        <div className="text-center">
          <div className="text-6xl drop-shadow-md">{icon}</div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{cfg.name}</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Choose the format and review the clock rules, then start scoring.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {variants.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Format & times
              </label>
              <select
                value={
                  variants.some((x) => x.id === timerVariantId)
                    ? timerVariantId
                    : variants[0]?.id
                }
                onChange={(e) => setTimerVariant(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-zinc-900/80 px-4 py-3 text-base text-white"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              {active?.hints && active.hints.length > 0 && (
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-500">
                  {active.hints.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {cfg.noGameClock && (
            <p className="rounded-xl border border-amber-500/20 bg-amber-950/30 px-4 py-3 text-sm text-amber-200/90">
              This sport has no official game clock — you’ll use rally or inning
              scoring. Optional countdown is still available for informal timing.
            </p>
          )}

          {cfg.rulesReference && (
            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className="w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              View full rules & official times
            </button>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-10">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setUiPhase("game")}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-900/40 hover:from-cyan-500 hover:to-emerald-500"
          >
            Start scoreboard
          </motion.button>
          {sportId === "custom" && (
            <p className="text-center text-xs text-zinc-500">
              After starting, open Settings to customize buttons and features.
            </p>
          )}
        </div>
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
