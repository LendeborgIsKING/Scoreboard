"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameStore";
import { isDisplayRole } from "@/lib/cast";

/** Keeps countdown end detection accurate when the tab is visible */
export function useCountdownTick() {
  const checkCountdownEnd = useGameStore((s) => s.checkCountdownEnd);
  const running = useGameStore((s) => s.timer.running);
  const buzzerWindow = useGameStore((s) => s.buzzerBeaterWindowActive);

  useEffect(() => {
    // TV / second-screen display is view-only; the controller owns the clock.
    if (isDisplayRole()) return;
    // Keep polling through the post-buzzer grace window so period/game resolution runs.
    if (!running && !buzzerWindow) return;
    const id = window.setInterval(() => {
      checkCountdownEnd();
    }, 200);
    return () => window.clearInterval(id);
  }, [running, buzzerWindow, checkCountdownEnd]);
}
