"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { useCountdownTick } from "@/hooks/useCountdownTick";
import { ScoreboardDisplay } from "./ScoreboardDisplay";

export function ScoreboardApp() {
  const [hydrated, setHydrated] = useState(false);
  useCountdownTick();

  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsub = useGameStore.persist.onFinishHydration(finish);
    void useGameStore.persist.rehydrate();
    if (useGameStore.persist.hasHydrated()) finish();
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-[#050506] font-mono text-sm text-zinc-500">
        Loading scoreboard…
      </div>
    );
  }

  return <ScoreboardDisplay />;
}
