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
        
        <button
          type="button"
          onClick={() => setUiPhase("bracket")}
          className="flex w-full items-center gap-5 border-b border-white/[0.08] px-6 py-5 text-left transition active:bg-white/[0.06] max-sm:min-h-[52px] max-sm:py-4 sm:py-[1.35rem]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-yellow-950">
              <path d="M4 3h5v4H4z" />
              <path d="M4 17h5v4H4z" />
              <path d="M9 5h3v14H9" />
              <path d="M12 12h4" />
              <path d="M16 10h4v4h-4z" />
            </svg>
          </div>
          <span className="text-xl font-bold leading-none tracking-tight">
            Tournament Bracket
          </span>
        </button>
        
        <button
          type="button"
          onClick={() => setUiPhase("custom-builder")}
          className="flex w-full items-center gap-5 border-b border-white/[0.08] px-6 py-5 text-left transition active:bg-white/[0.06] max-sm:min-h-[52px] max-sm:py-4 sm:py-[1.35rem]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/20">
            <span className="text-xl font-black">+</span>
          </div>
          <span className="text-xl font-bold leading-none tracking-tight">
            Custom Sport
          </span>
        </button>
      </nav>
    </div>
  );
}
