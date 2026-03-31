"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameStore";

/** Keeps countdown end detection accurate when the tab is visible */
export function useCountdownTick() {
  const checkCountdownEnd = useGameStore((s) => s.checkCountdownEnd);
  const running = useGameStore((s) => s.timer.running);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      checkCountdownEnd();
    }, 200);
    return () => window.clearInterval(id);
  }, [running, checkCountdownEnd]);
}
