"use client";

import { useSyncExternalStore } from "react";
import { useGameStore, getDisplaySeconds } from "@/lib/gameStore";
import { resolveSportConfig, usesCountUpClock } from "@/lib/sportRegistry";

function displaySecondsFromStore(): number {
  const s = useGameStore.getState();
  const cfg = resolveSportConfig(s.sportId, s.customSport);
  return getDisplaySeconds(s.timer, usesCountUpClock(cfg));
}

/** Wall-clock accurate display seconds while the timer may be running */
export function useTimerDisplay(): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsub = useGameStore.subscribe(onStoreChange);
      const id = window.setInterval(onStoreChange, 100);
      return () => {
        unsub();
        window.clearInterval(id);
      };
    },
    displaySecondsFromStore,
    displaySecondsFromStore,
  );
}
