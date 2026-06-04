"use client";

import { playSfx, vibrate } from "./audio";
import { useGameStore } from "./gameStore";

/**
 * Unified button-press feedback. Reads user preferences from the store so a
 * single call gives the right haptic + optional tick everywhere. Safe to call
 * on every press; no-ops when the relevant preference is off or unsupported.
 */
export function pressFeedback(strength: "light" | "medium" = "light") {
  const s = useGameStore.getState();
  if (s.vibrationEnabled) vibrate(strength === "medium" ? 18 : 10);
  if (s.pressTickEnabled && s.sfxEnabled) playSfx("tick");
}
