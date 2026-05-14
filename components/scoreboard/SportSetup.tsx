"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import {
  resolveActiveVariant,
  resolveSportConfig,
} from "@/lib/sportRegistry";
import { SportLineIcon } from "./SportLineIcons";
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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-black px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-2 text-white">
      <button
        type="button"
        onClick={() => setUiPhase("menu")}
        className="mb-6 flex items-center gap-2 py-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
      >
        <span aria-hidden>←</span> Back
      </button>

      <div className="flex flex-col items-center text-center">
        <SportLineIcon sportId={sportId} className="h-16 w-16" />
        <h1 className="mt-5 text-2xl font-bold tracking-tight">{cfg.name}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Pick a format, then start the scoreboard.
        </p>
      </div>

      <div className="mt-8 flex flex-1 flex-col space-y-5">
        {variants.length > 0 && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Format
            </label>
            <select
              value={
                variants.some((x) => x.id === timerVariantId)
                  ? timerVariantId
                  : variants[0]?.id
              }
              onChange={(e) => setTimerVariant(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-zinc-950 px-4 py-3.5 text-base font-semibold text-white"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            {active?.hints && active.hints.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-left text-sm text-zinc-500">
                {active.hints.map((h, i) => (
                  <li key={i} className="border-l border-white/10 pl-3">
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {cfg.noGameClock && (
          <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
            No official game clock — score by rallies or innings. You can still
            run an informal countdown in-game.
          </p>
        )}

        {cfg.rulesReference && (
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="w-full rounded-xl border border-white/15 py-3.5 text-sm font-bold text-white hover:bg-white/[0.06]"
          >
            Rules & official times
          </button>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setUiPhase("game")}
          className="w-full rounded-2xl bg-white py-4 text-lg font-bold text-black shadow-lg"
        >
          Start scoreboard
        </motion.button>
        {sportId === "custom" && (
          <p className="text-center text-xs text-zinc-500">
            After starting, use Settings to customize buttons.
          </p>
        )}
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
