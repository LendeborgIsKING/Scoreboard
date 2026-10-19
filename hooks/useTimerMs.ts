"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore, getTimerDisplayMs } from "@/lib/gameStore";
import { resolveSportConfig, usesCountUpClock } from "@/lib/sportRegistry";

/**
 * Clock display in milliseconds — counts up (soccer) or down (most sports).
 */
export function useTimerMs(): number {
  const timer = useGameStore((s) => s.timer);
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const cfg = resolveSportConfig(sportId, customSport);
  const countUp = usesCountUpClock(cfg);

  const compute = () => getTimerDisplayMs(timer, countUp);
  const [ms, setMs] = useState(compute);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setMs(getTimerDisplayMs(timer, countUp));
    if (!timer.running) return;

    const loop = () => {
      setMs(getTimerDisplayMs(timer, countUp));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [timer, countUp]);

  return ms;
}
