"use client";

import { useGameStore } from "@/lib/gameStore";

export function TimerBar() {
  const timer = useGameStore((s) => s.timer);
  const setTimerMode = useGameStore((s) => s.setTimerMode);
  const setCountdownDuration = useGameStore((s) => s.setCountdownDuration);
  const startTimer = useGameStore((s) => s.startTimer);
  const pauseTimer = useGameStore((s) => s.pauseTimer);
  const resetTimer = useGameStore((s) => s.resetTimer);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setTimerMode("countup")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
            timer.mode === "countup"
              ? "bg-emerald-600 text-white"
              : "bg-white/5 text-zinc-400"
          }`}
        >
          Up
        </button>
        <button
          type="button"
          onClick={() => setTimerMode("countdown")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
            timer.mode === "countdown"
              ? "bg-rose-600 text-white"
              : "bg-white/5 text-zinc-400"
          }`}
        >
          Down
        </button>
      </div>
      {timer.mode === "countdown" && (
        <label className="flex items-center gap-1 text-xs text-zinc-400">
          Mins
          <input
            type="number"
            min={1}
            max={120}
            value={Math.round(timer.countdownFromSeconds / 60)}
            onChange={(e) =>
              setCountdownDuration(Number(e.target.value) * 60 || 60)
            }
            className="w-14 rounded border border-white/15 bg-zinc-900 px-2 py-1 text-white"
          />
        </label>
      )}
      <button
        type="button"
        onClick={() => (timer.running ? pauseTimer() : startTimer())}
        className="rounded-lg bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-white/20"
      >
        {timer.running ? "Pause" : "Start"}
      </button>
      <button
        type="button"
        onClick={() => resetTimer()}
        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
      >
        Reset clk
      </button>
    </div>
  );
}
