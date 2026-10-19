"use client";

import { useGameStore, getElapsedMs } from "@/lib/gameStore";

function formatStoppage(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `+${m}:${s.toString().padStart(2, "0")}`;
}

export function StoppageTimeDisplay() {
  const st = useGameStore((s) => s.stoppageTime);
  const timer = useGameStore((s) => s.timer);
  const addSec = useGameStore((s) => s.addStoppageSeconds);
  const start = useGameStore((s) => s.startStoppageClock);
  const pause = useGameStore((s) => s.pauseStoppageClock);
  const reset = useGameStore((s) => s.resetStoppageClock);

  if (!st.enabled) return null;

  const mainRemaining = Math.max(
    0,
    timer.countdownFromSeconds -
      Math.floor(getElapsedMs(timer) / 1000),
  );
  const stoppageElapsed = st.running && st.runStartedAt
    ? st.accumulatedMs + (Date.now() - st.runStartedAt)
    : st.accumulatedMs;
  const stoppageRem = Math.max(0, st.addedSeconds - Math.floor(stoppageElapsed / 1000));

  const showStoppage = mainRemaining <= 0 && st.addedSeconds > 0;

  return (
    <div className="flex flex-col items-center gap-1">
      {showStoppage ? (
        <span className="font-mono text-2xl font-black text-amber-400 tabular-nums">
          {formatStoppage(stoppageRem)}
        </span>
      ) : (
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
          +{Math.floor(st.addedSeconds / 60)}:{(st.addedSeconds % 60).toString().padStart(2, "0")} stoppage
        </span>
      )}
      <div className="flex gap-1">
        <button type="button" onClick={() => addSec(60)} className="rounded px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 hover:text-white">+1m</button>
        {showStoppage && !st.running && (
          <button type="button" onClick={start} className="rounded px-1.5 py-0.5 text-[10px] font-bold text-green-400">Start</button>
        )}
        {st.running && (
          <button type="button" onClick={pause} className="rounded px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">Pause</button>
        )}
        <button type="button" onClick={reset} className="rounded px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">Reset</button>
      </div>
    </div>
  );
}
