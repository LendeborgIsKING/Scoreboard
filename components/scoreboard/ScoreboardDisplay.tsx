"use client";

import { useEffect, useState } from "react";
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
  const setUiPhase = useGameStore((s) => s.setUiPhase);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const cfg = resolveSportConfig(sportId, customSport);

  useEffect(() => {
    // Attempt to lock orientation to landscape when entering the scoreboard
    const screenAny = window.screen as any;
    if (typeof window !== "undefined" && screenAny.orientation?.lock) {
      screenAny.orientation
        .lock("landscape")
        .catch((err: any) => {
          console.warn("Orientation lock failed:", err);
        });
    }

    // Cleanup: try to unlock or just let it be when leaving
    return () => {
      if (typeof window !== "undefined" && screenAny.orientation?.unlock) {
        try {
          screenAny.orientation.unlock();
        } catch (e) {
          /* ignore */
        }
      }
    };
  }, []);

  return (
    <div
      className={`relative flex min-h-full flex-1 flex-col items-center overflow-hidden ${themeClass(theme)}`}
    >
      {/* 
        Forced Landscape Wrapper:
        On portrait screens (including PC), we rotate the entire scoreboard 90deg 
        so it always displays in landscape orientation.
      */}
      <div className="flex h-full w-full flex-1 flex-col items-center portrait:absolute portrait:left-1/2 portrait:top-1/2 portrait:h-[100vw] portrait:w-[100vh] portrait:-translate-x-1/2 portrait:-translate-y-1/2 portrait:rotate-90">
        {!presentation && (
          <header className="mb-4 flex w-full max-w-5xl items-center justify-between gap-3 px-6 pt-4 sm:pt-10">
            <button
              type="button"
              onClick={() => setUiPhase("menu")}
              className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
            >
              ← Menu
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase text-zinc-300"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => setPresentation(true)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase text-zinc-300"
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

        <div className="flex w-full flex-1 items-center justify-between gap-4 px-6">
          <TeamPanel
            team="a"
            data={teamA}
            active={possession === "a"}
            hype={hype}
          />

          <div className="flex flex-col items-center justify-center gap-4">
            <GameInfo />
          </div>

          <TeamPanel
            team="b"
            data={teamB}
            active={possession === "b"}
            hype={hype}
          />
        </div>

        {!presentation && (
          <div className="w-full px-6 pb-6">
            <ControlPanel
              collapsed={controlsCollapsed}
              onToggleCollapse={() => setControlsCollapsed(!controlsCollapsed)}
            />
          </div>
        )}
      </div>

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
