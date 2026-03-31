"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { useCountdownTick } from "@/hooks/useCountdownTick";
import { ScoreboardDisplay } from "./ScoreboardDisplay";
import { SportMenu } from "./SportMenu";
import { SportSetup } from "./SportSetup";

export function ScoreboardApp() {
  const [hydrated, setHydrated] = useState(false);
  const uiPhase = useGameStore((s) => s.uiPhase);
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
        Loading…
      </div>
    );
  }

  if (uiPhase === "menu") {
    return <SportMenu />;
  }
  if (uiPhase === "setup") {
    return <SportSetup />;
  }

  return <ScoreboardDisplay />;
}
