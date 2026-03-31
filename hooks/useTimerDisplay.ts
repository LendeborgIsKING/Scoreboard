"use client";

import { useSyncExternalStore } from "react";
import { useGameStore, getDisplaySeconds } from "@/lib/gameStore";

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
    () => getDisplaySeconds(useGameStore.getState().timer),
    () => getDisplaySeconds(useGameStore.getState().timer),
  );
}
