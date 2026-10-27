"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameStore";

/** Keeps countdown end detection accurate when the tab is visible */
export function useCountdownTick() {
  const checkCountdownEnd = useGameStore((s) => s.checkCountdownEnd);
  const running = useGameStore((s) => s.timer.running);
  const buzzerWindow = useGameStore((s) => s.buzzerBeaterWindowActive);

  useEffect(() => {
    // Keep polling through the post-buzzer grace window so period/game resolution runs.
    if (!running && !buzzerWindow) return;
    const id = window.setInterval(() => {
      checkCountdownEnd();
    }, 200);
    return () => window.clearInterval(id);
  }, [running, buzzerWindow, checkCountdownEnd]);
}
