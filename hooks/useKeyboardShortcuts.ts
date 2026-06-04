"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/gameStore";
import { resolveSportConfig } from "@/lib/sportRegistry";
import { playSfx } from "@/lib/audio";

/**
 * Keyboard shortcuts (active in the game phase).
 * - Space: play/pause clock
 * - A: home team primary score
 * - B: away team primary score
 * - 1/2/3: home actions by index; Shift+1/2/3: away
 * - F/V: home foul +/-; G/N: away foul +/-
 * - R: reset clock
 * - S: swap teams
 * - M: mute/unmute sfx
 */
export function useKeyboardShortcuts(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;
      const s = useGameStore.getState();
      const cfg = resolveSportConfig(s.sportId, s.customSport);
      const actions = cfg.scoring;
      const score = (team: "a" | "b", idx: number) => {
        const a = actions[idx];
        if (a) s.addScore(team, a.id);
      };
      switch (e.key) {
        case " ":
          e.preventDefault();
          if (s.timer.running) s.pauseTimer();
          else s.startTimer();
          playSfx("click");
          break;
        case "a":
        case "A":
          score("a", 0);
          break;
        case "b":
        case "B":
          score("b", 0);
          break;
        case "1":
          if (e.shiftKey) score("b", 0);
          else score("a", 0);
          break;
        case "2":
          if (e.shiftKey) score("b", 1);
          else score("a", 1);
          break;
        case "3":
          if (e.shiftKey) score("b", 2);
          else score("a", 2);
          break;
        case "f":
        case "F":
          s.adjustFouls("a", 1);
          break;
        case "v":
        case "V":
          s.adjustFouls("a", -1);
          break;
        case "g":
        case "G":
          s.adjustFouls("b", 1);
          break;
        case "n":
        case "N":
          s.adjustFouls("b", -1);
          break;
        case "r":
        case "R":
          s.resetTimer();
          break;
        case "s":
        case "S":
          s.swapTeams();
          break;
        case "m":
        case "M":
          s.setSfxEnabled(!s.sfxEnabled);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active]);
}
