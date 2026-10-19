"use client";

import { useGameStore } from "@/lib/gameStore";
import { BaseballDiamond } from "./BaseballDiamond";

const plusBtn =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/40 text-xs font-bold text-white transition hover:border-white hover:bg-white/10";

/** Balls–strikes as 0-0, 1-2, etc.; outs with + only to increment. */
export function BaseballCountDisplay() {
  const balls = useGameStore((s) => s.balls);
  const strikes = useGameStore((s) => s.strikes);
  const outs = useGameStore((s) => s.outs);
  const adjustBSO = useGameStore((s) => s.adjustBSO);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const pitchCountA = useGameStore((s) => s.pitchCountA);
  const pitchCountB = useGameStore((s) => s.pitchCountB);
  const adjustPitchCount = useGameStore((s) => s.adjustPitchCount);

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,320px)] flex-col items-center gap-3 px-2">
      <BaseballDiamond />

      <div className="flex w-full items-center justify-center gap-5">
        <span className="font-mono text-2xl font-black tabular-nums tracking-wide text-yellow-300">
          {balls}-{strikes}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={plusBtn}
            onClick={() => adjustBSO("balls", 1)}
            aria-label="Add ball"
          >
            +
          </button>
          <button
            type="button"
            className={plusBtn}
            onClick={() => adjustBSO("strikes", 1)}
            aria-label="Add strike"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Out
        </span>
        <span className="font-mono text-xl font-black tabular-nums text-yellow-300">
          {outs}
        </span>
        <button
          type="button"
          className={plusBtn}
          onClick={() => adjustBSO("outs", 1)}
          aria-label="Add out"
        >
          +
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          Pitch {teamB.name}: {pitchCountB}
          <button
            type="button"
            className={plusBtn}
            onClick={() => adjustPitchCount("b", 1)}
            aria-label={`Add pitch for ${teamB.name}`}
          >
            +
          </button>
        </span>
        <span className="inline-flex items-center gap-1.5">
          Pitch {teamA.name}: {pitchCountA}
          <button
            type="button"
            className={plusBtn}
            onClick={() => adjustPitchCount("a", 1)}
            aria-label={`Add pitch for ${teamA.name}`}
          >
            +
          </button>
        </span>
      </div>
    </div>
  );
}
