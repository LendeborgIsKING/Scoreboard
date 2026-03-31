"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { resolveSportConfig } from "@/lib/sportRegistry";
import type { ThemeId } from "@/lib/types";
import { TeamPanel } from "./TeamPanel";
import { GameInfo } from "./GameInfo";
import { ControlPanel } from "./ControlPanel";
import { SettingsModal } from "./SettingsModal";

function themeClass(theme: ThemeId): string {
  switch (theme) {
    case "neon":
      return "bg-[radial-gradient(ellipse_at_top,_#312e81_0%,_#0f0a1a_45%,_#0a0a0f_100%)] text-white";
    case "classic":
      return "bg-[linear-gradient(180deg,_#0d2818_0%,_#0a1f12_40%,_#051208_100%)] text-white";
    default:
      return "bg-[radial-gradient(ellipse_at_50%_-20%,_#27272a_0%,_#0a0a0c_55%,_#050506_100%)] text-white";
  }
}

export function ScoreboardDisplay() {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const possession = useGameStore((s) => s.possession);
  const hype = useGameStore((s) => s.hypeMode);
  const theme = useGameStore((s) => s.theme);
  const presentation = useGameStore((s) => s.presentationMode);
  const controlsCollapsed = useGameStore((s) => s.controlsCollapsed);
  const setPresentation = useGameStore((s) => s.setPresentationMode);
  const setControlsCollapsed = useGameStore((s) => s.setControlsCollapsed);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const cfg = resolveSportConfig(sportId, customSport);

  return (
    <div
      className={`relative flex min-h-full flex-col items-center px-3 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-10 ${themeClass(theme)}`}
    >
      {!presentation && (
        <header className="mb-6 flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">
              {cfg.name}
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Virtual scoreboard
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 hover:bg-white/10"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => setPresentation(true)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 hover:bg-white/10"
            >
              Present
            </button>
          </div>
        </header>
      )}

      {presentation && (
        <button
          type="button"
          onClick={() => setPresentation(false)}
          className="fixed right-4 top-4 z-50 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold uppercase text-white backdrop-blur"
        >
          Exit present
        </button>
      )}

      <motion.div
        layout
        className="flex w-full max-w-6xl flex-col items-center gap-8"
      >
        <GameInfo />
        <div className="grid w-full gap-4 sm:grid-cols-2 sm:gap-6">
          <TeamPanel
            team="a"
            data={teamA}
            active={possession === "a"}
            hype={hype}
          />
          <TeamPanel
            team="b"
            data={teamB}
            active={possession === "b"}
            hype={hype}
          />
        </div>
      </motion.div>

      {!presentation && (
        <ControlPanel
          collapsed={controlsCollapsed}
          onToggleCollapse={() => setControlsCollapsed(!controlsCollapsed)}
        />
      )}

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
