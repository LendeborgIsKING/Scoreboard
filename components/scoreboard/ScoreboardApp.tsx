"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useGameStore } from "@/lib/gameStore";
import { useCountdownTick } from "@/hooks/useCountdownTick";
import { ScoreboardDisplay } from "./ScoreboardDisplay";
import { SportMenu } from "./SportMenu";
import { SportSetup } from "./SportSetup";
import { MobileAppShell } from "./MobileAppShell";

type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

export function ScoreboardApp() {
  const [hydrated, setHydrated] = useState(false);
  const uiPhase = useGameStore((s) => s.uiPhase);
  useCountdownTick();

  // Lock to landscape as soon as the app loads so the screen flips immediately.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const orientation = window.screen.orientation as ScreenOrientationWithLock;
    if (orientation?.lock) {
      orientation.lock("landscape").catch(() => {});
    }
    return () => {
      if (orientation?.unlock) {
        try {
          orientation.unlock();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsub = useGameStore.persist.onFinishHydration(finish);
    void useGameStore.persist.rehydrate();
    if (useGameStore.persist.hasHydrated()) finish();
    return unsub;
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
  } else {
    content = <ScoreboardDisplay />;
  }

  return (
    <MobileAppShell isGame={uiPhase === "game"}>{content}</MobileAppShell>
  );
}
