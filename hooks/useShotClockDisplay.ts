"use client";

import { useSyncExternalStore } from "react";
import { useGameStore, getShotClockSeconds } from "@/lib/gameStore";

export function useShotClockDisplay(): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsub = useGameStore.subscribe(onStoreChange);
      const id = window.setInterval(onStoreChange, 100);
      return () => {
        unsub();
        window.clearInterval(id);
      };
    },
    () => getShotClockSeconds(useGameStore.getState().shotClock),
    () => getShotClockSeconds(useGameStore.getState().shotClock),
  );
}
