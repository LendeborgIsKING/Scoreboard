"use client";

import { useState } from "react";

export default function Home() {
  const [home, setHome] = useState(0);
  const [away, setAway] = useState(0);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <header className="mb-10 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.35em] text-emerald-400/90">
          Live
        </p>
        <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Scoreboard
        </h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          Starter app — connect GitHub & Vercel, then we&apos;ll shape this into what you need.
        </p>
      </header>

      <div className="flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:flex-row sm:items-stretch sm:justify-between sm:gap-8 sm:p-10">
        <ScoreColumn
          label="Home"
          score={home}
          onAdd={() => setHome((n) => n + 1)}
          onSub={() => setHome((n) => Math.max(0, n - 1))}
        />
        <div className="hidden items-center justify-center sm:flex">
          <span className="font-mono text-2xl font-bold text-zinc-600">:</span>
        </div>
        <ScoreColumn
          label="Away"
          score={away}
          onAdd={() => setAway((n) => n + 1)}
          onSub={() => setAway((n) => Math.max(0, n - 1))}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setHome(0);
          setAway(0);
        }}
        className="mt-8 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
      >
        Reset
      </button>
    </div>
  );
}

function ScoreColumn({
  label,
  score,
  onAdd,
  onSub,
}: {
  label: string;
  score: number;
  onAdd: () => void;
  onSub: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <span className="font-mono text-6xl font-bold tabular-nums text-zinc-50 sm:text-7xl">
        {score}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSub}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
        >
          −
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          +
        </button>
      </div>
    </div>
  );
}
