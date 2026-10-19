"use client";

import type { CSSProperties } from "react";
import { useGameStore } from "@/lib/gameStore";
import type { BaseballBases } from "@/lib/types";

type BaseKey = keyof BaseballBases;

const BASE_SPOTS: {
  key: BaseKey;
  label: string;
  style: CSSProperties;
}[] = [
  { key: "second", label: "2nd base", style: { top: "4%", left: "50%" } },
  { key: "third", label: "3rd base", style: { top: "50%", left: "6%" } },
  { key: "first", label: "1st base", style: { top: "50%", left: "94%" } },
];

function BasePad({
  occupied,
  label,
  onClick,
}: {
  occupied: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}${occupied ? ", runner on" : ", empty"}`}
      aria-pressed={occupied}
      className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 transition touch-manipulation ${
        occupied
          ? "border-amber-300 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.55)]"
          : "border-white/35 bg-white/5 hover:border-white/60 hover:bg-white/10"
      }`}
    />
  );
}

/** Small infield diamond — tap a base to toggle a runner. */
export function BaseballDiamond() {
  const bases = useGameStore((s) => s.baseballBases);
  const toggle = useGameStore((s) => s.toggleBaseRunner);

  return (
    <div
      className="relative mx-auto h-[4.25rem] w-[4.25rem] shrink-0"
      aria-hidden={false}
    >
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 h-full w-full text-white/20"
        aria-hidden
      >
        <path
          d="M50 12 L88 50 L50 88 L12 50 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M50 88 L50 96"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {BASE_SPOTS.map(({ key, label, style }) => (
        <div key={key} className="absolute" style={style}>
          <BasePad
            occupied={bases[key]}
            label={label}
            onClick={() => toggle(key)}
          />
        </div>
      ))}
    </div>
  );
}
