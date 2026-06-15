"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useGameStore } from "@/lib/gameStore";
import { useCountdownTick } from "@/hooks/useCountdownTick";
import { primeAudioOnFirstGesture } from "@/lib/audio";
import { ScoreboardDisplay } from "./ScoreboardDisplay";
import { SportMenu } from "./SportMenu";
import { SportSetup } from "./SportSetup";
import { TournamentBracket } from "./TournamentBracket";
import { CustomSportBuilder } from "./CustomSportBuilder";
import { MobileAppShell } from "./MobileAppShell";

type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

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

  // Unlock Web Audio on the very first interaction so taps have zero latency.
  useEffect(() => {
    primeAudioOnFirstGesture();
  }, []);

  let content: ReactNode;
  if (!hydrated) {
    content = (
      <div className="flex min-h-full flex-1 items-center justify-center bg-black font-mono text-sm text-zinc-500">
        Loading…
      </div>
    );
  } else if (uiPhase === "menu") {
    content = <SportMenu />;
  } else if (uiPhase === "setup") {
    content = <SportSetup />;
  } else if (uiPhase === "bracket") {
    content = <TournamentBracket />;
  } else if (uiPhase === "custom-builder") {
    content = <CustomSportBuilder />;
  } else {
    content = <ScoreboardDisplay />;
  }

  return (
    <MobileAppShell isGame={uiPhase === "game"}>{content}</MobileAppShell>
  );
}
