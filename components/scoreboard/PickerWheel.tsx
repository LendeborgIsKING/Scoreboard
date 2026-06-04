"use client";

import { useEffect, useRef } from "react";

type Value = number | string;

type Props = {
  values: Value[];
  value: Value;
  onChange: (next: Value) => void;
  label?: string;
  width?: number;
};

const ITEM_H = 48;
const VISIBLE = 5;

export function PickerWheel({ values, value, onChange, label, width = 96 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<number | null>(null);
  const programmatic = useRef(false);

  const index = Math.max(
    0,
    values.findIndex((v) => v === value),
  );

  // Keep the wheel aligned to the current value when it changes externally.
  useEffect(() => {
    const idx = values.findIndex((v) => v === value);
    if (idx < 0 || !ref.current) return;
    programmatic.current = true;
    ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    window.setTimeout(() => {
      programmatic.current = false;
    }, 240);
  }, [value, values]);

  const settleTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    const next = values[clamped];
    if (next !== undefined && next !== value) onChange(next);
    ref.current?.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
  };

  const onScroll = () => {
    if (!ref.current || programmatic.current) return;
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      if (!ref.current) return;
      settleTo(Math.round(ref.current.scrollTop / ITEM_H));
    }, 90);
  };

  const step = (dir: -1 | 1) => settleTo(index + dir);

  const pad = (ITEM_H * (VISIBLE - 1)) / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
          {label}
        </span>
      )}

      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="Previous"
        className="flex h-7 w-full items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white active:bg-white/20"
        style={{ width }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M12 8l6 6H6l6-6Z" />
        </svg>
      </button>

      <div className="relative" style={{ width, height: ITEM_H * VISIBLE }}>
        {/* Center selection pill */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl border border-white/20 bg-white/10"
          style={{ height: ITEM_H }}
          aria-hidden
        />
        {/* Top / bottom fade masks */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-zinc-900 to-transparent"
          style={{ height: pad }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-zinc-900 to-transparent"
          style={{ height: pad }}
          aria-hidden
        />

        <div
          ref={ref}
          onScroll={onScroll}
          className="hide-scrollbar h-full snap-y snap-mandatory overflow-auto scroll-smooth text-center"
          style={{
            paddingTop: pad,
            paddingBottom: pad,
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {values.map((v, i) => {
            const dist = Math.abs(i - index);
            const cls =
              dist === 0
                ? "text-white"
                : dist === 1
                  ? "text-white/45"
                  : "text-white/20";
            return (
              <button
                key={`${v}`}
                type="button"
                onClick={() => settleTo(i)}
                className={`flex w-full snap-center items-center justify-center text-3xl font-black tabular-nums transition ${cls}`}
                style={{ height: ITEM_H }}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => step(1)}
        aria-label="Next"
        className="flex h-7 w-full items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white active:bg-white/20"
        style={{ width }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M12 16l-6-6h12l-6 6Z" />
        </svg>
      </button>
    </div>
  );
}
