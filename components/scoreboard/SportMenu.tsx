"use client";

import { useGameStore } from "@/lib/gameStore";
import { PRESETS, sortPresetsForMenu } from "@/lib/sportPresets";
import { SportLineIcon } from "./SportLineIcons";

export function SportMenu() {
  const setSport = useGameStore((s) => s.setSport);
  const setUiPhase = useGameStore((s) => s.setUiPhase);

  const ordered = sortPresetsForMenu(PRESETS);

  const pickSport = (id: string) => {
    setSport(id);
    setUiPhase("setup");
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-black pb-[max(2rem,env(safe-area-inset-bottom))] text-white">
      <div className="px-5 pb-8 pt-2">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-500">
          Scoreboard
        </p>
      </div>

      <nav className="flex flex-1 flex-col" aria-label="Sports">
        {ordered.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => pickSport(p.id)}
            className="flex w-full items-center gap-5 border-b border-white/[0.08] px-6 py-5 text-left transition active:bg-white/[0.06] max-sm:min-h-[52px] max-sm:py-4 sm:py-[1.35rem]"
          >
            <SportLineIcon sportId={p.id} className="h-11 w-11" />
            <span className="text-xl font-bold leading-none tracking-tight">
              {p.name}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
