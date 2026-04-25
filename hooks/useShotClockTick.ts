"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameStore";

export function useShotClockTick() {
  const check = useGameStore((s) => s.checkShotClockEnd);
  const running = useGameStore((s) => s.shotClock.running);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => check(), 200);
    return () => window.clearInterval(id);
  }, [running, check]);
}
