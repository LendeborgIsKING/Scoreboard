"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameStore";
import { isDisplayRole } from "@/lib/cast";

export function useShotClockTick() {
  const check = useGameStore((s) => s.checkShotClockEnd);
  const running = useGameStore((s) => s.shotClock.running);

  useEffect(() => {
    if (isDisplayRole()) return;
    if (!running) return;
    const id = window.setInterval(() => check(), 200);
    return () => window.clearInterval(id);
  }, [running, check]);
}
