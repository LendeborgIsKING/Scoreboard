"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore, getElapsedMs } from "@/lib/gameStore";

/**
 * Remaining clock time in milliseconds, updated on every animation frame while
 * the timer is running so the display can show smooth tenths of a second.
 * When paused it stops updating (and returns the static remaining ms).
 */
export function useTimerMs(): number {
  const timer = useGameStore((s) => s.timer);
  const compute = () =>
    Math.max(0, timer.countdownFromSeconds * 1000 - getElapsedMs(timer));
  const [ms, setMs] = useState(compute);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Always reflect the latest static value immediately.
    setMs(Math.max(0, timer.countdownFromSeconds * 1000 - getElapsedMs(timer)));
    if (!timer.running) return;

    const loop = () => {
      setMs(
        Math.max(0, timer.countdownFromSeconds * 1000 - getElapsedMs(timer)),
      );
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [timer]);

  return ms;
}
