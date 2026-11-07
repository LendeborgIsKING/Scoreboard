"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useGameStore } from "@/lib/gameStore";
import { useCountdownTick } from "@/hooks/useCountdownTick";
import {
  applyAudioOutputPrefs,
  primeAudioOnFirstGesture,
  watchAudioLifecycle,
} from "@/lib/audio";
import { ScoreboardDisplay } from "./ScoreboardDisplay";
import { SportMenu } from "./SportMenu";
import { SportSetup } from "./SportSetup";
import { TournamentBracket } from "./TournamentBracket";
import { RoundRobin } from "./RoundRobin";
import { CustomSportBuilder } from "./CustomSportBuilder";
import { MobileAppShell } from "./MobileAppShell";
import {
  applyDisplaySnapshot,
  isDisplayRole,
  onCastSnapshot,
  setCastRole,
  startCastPublisher,
  startCastReceiver,
} from "@/lib/cast";

type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
};

export function ScoreboardApp({
  role = "controller",
}: {
  role?: "controller" | "display";
}) {
  const isDisplay = role === "display" || isDisplayRole();
  const [hydrated, setHydrated] = useState(isDisplay);
  const [tvReady, setTvReady] = useState(false);
  const uiPhase = useGameStore((s) => s.uiPhase);
  useCountdownTick();

  useEffect(() => {
    setCastRole(isDisplay ? "display" : "controller");
    if (isDisplay) {
      setHydrated(true);
      const stopRecv = startCastReceiver();
      const stopSnap = onCastSnapshot((payload) => {
        applyDisplaySnapshot(payload);
        setTvReady(true);
      });
      return () => {
        stopRecv();
        stopSnap();
      };
    }
    const finish = () => setHydrated(true);
    const unsub = useGameStore.persist.onFinishHydration(finish);
    void useGameStore.persist.rehydrate();
    if (useGameStore.persist.hasHydrated()) finish();
    const stopPub = startCastPublisher();
    return () => {
      unsub();
      stopPub();
    };
  }, [isDisplay]);

  useEffect(() => {
    primeAudioOnFirstGesture();
    return watchAudioLifecycle();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const s = useGameStore.getState();
    applyAudioOutputPrefs({
      sfxEnabled: s.sfxEnabled,
      sfxVolume: s.sfxVolume,
      musicEnabled: s.musicEnabled,
      musicVolume: s.musicVolume,
    });
  }, [hydrated]);

  let content: ReactNode;
  if (!hydrated) {
    content = (
      <div className="flex min-h-full flex-1 items-center justify-center bg-black font-mono text-sm text-zinc-500">
        Loading…
      </div>
    );
  } else if (isDisplay && !tvReady) {
    content = (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 bg-black px-8 text-center">
        <p className="font-black uppercase tracking-[0.35em] text-white">
          Scoreboard TV
        </p>
        <p className="max-w-md text-sm text-zinc-400">
          Waiting for the controller. Keep this screen open, then tap Cast to TV
          on your phone or computer.
        </p>
      </div>
    );
  } else if (uiPhase === "menu") {
    content = <SportMenu />;
  } else if (uiPhase === "setup") {
    content = <SportSetup />;
  } else if (uiPhase === "bracket") {
    content = <TournamentBracket />;
  } else if (uiPhase === "round-robin") {
    content = <RoundRobin />;
  } else if (uiPhase === "custom-builder") {
    content = <CustomSportBuilder />;
  } else {
    content = <ScoreboardDisplay />;
  }

  return (
    <MobileAppShell
      isGame={uiPhase === "game"}
      scrollable={uiPhase === "menu" && !isDisplay}
      tvDisplay={isDisplay}
    >
      {content}
    </MobileAppShell>
  );
}
