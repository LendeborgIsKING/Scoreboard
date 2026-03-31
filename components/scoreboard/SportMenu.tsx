"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { PRESETS } from "@/lib/sportPresets";
import { SPORT_MENU_ICON } from "@/lib/sportIcons";

export function SportMenu() {
  const setSport = useGameStore((s) => s.setSport);
  const setUiPhase = useGameStore((s) => s.setUiPhase);

  const pickSport = (id: string) => {
    setSport(id);
    setUiPhase("setup");
  };

  return (
    <div className="flex min-h-full flex-col bg-[radial-gradient(ellipse_at_50%_0%,#1e293b_0%,#020617_50%,#000_100%)] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <header className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.5em] text-cyan-400/80">
            Virtual scoreboard
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Choose a sport
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Pick a sport to see clock and scoring options, then start your game.
          </p>
        </header>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3">
          {PRESETS.map((p, i) => (
            <motion.button
              key={p.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => pickSport(p.id)}
              className="group flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-5 text-center shadow-lg transition hover:border-cyan-500/40 hover:bg-white/[0.08] hover:shadow-cyan-500/10 active:scale-[0.98] sm:min-h-[140px]"
            >
              <span className="text-4xl drop-shadow-lg transition group-hover:scale-110 sm:text-5xl">
                {SPORT_MENU_ICON[p.id] ?? "🎯"}
              </span>
              <span className="mt-3 text-sm font-semibold leading-tight sm:text-base">
                {p.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
