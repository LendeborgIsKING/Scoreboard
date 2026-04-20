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

const ITEM_H = 44;
const VISIBLE = 5;

export function PickerWheel({ values, value, onChange, label, width = 72 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<number | null>(null);

  useEffect(() => {
    const idx = values.findIndex((v) => v === value);
    if (idx < 0 || !ref.current) return;
    ref.current.scrollTop = idx * ITEM_H;
  }, [value, values]);

  const onScroll = () => {
    if (!ref.current) return;
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      const next = values[clamped];
      if (next !== undefined && next !== value) onChange(next);
      ref.current.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    }, 120);
  };

  const pad = (ITEM_H * (VISIBLE - 1)) / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-xs font-bold uppercase tracking-widest text-white">
          {label}
        </span>
      )}
      <div
        className="relative"
        style={{ width, height: ITEM_H * VISIBLE }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-md bg-white/10"
          style={{ height: ITEM_H }}
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
          }}
        >
          {values.map((v) => (
            <div
              key={`${v}`}
              className={`flex snap-center items-center justify-center text-2xl font-black transition ${
                v === value ? "text-white" : "text-white/30"
              }`}
              style={{ height: ITEM_H }}
            >
              {v}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
