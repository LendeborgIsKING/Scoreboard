"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  GameSnapshot,
  SportConfig,
  TeamId,
  TeamState,
  TimerState,
} from "./types";
import { BASKETBALL } from "./sportPresets";
import { resolveSportConfig } from "./sportRegistry";

const UNDO_MAX = 40;

const defaultTeam = (name: string, color: string): TeamState => ({
  name,
  color,
  score: 0,
  fouls: 0,
  timeouts: 7,
});

const defaultTimer = (): TimerState => ({
  mode: "countup",
  running: false,
  runStartedAt: null,
  accumulatedMs: 0,
  countdownFromSeconds: 12 * 60,
});

function snapshotFrom(
  s: GameStateSlice,
): GameSnapshot {
  return {
    sportId: s.sportId,
    customSport: s.customSport,
    teamA: { ...s.teamA },
    teamB: { ...s.teamB },
    period: s.period,
    halfInning: s.halfInning,
    balls: s.balls,
    strikes: s.strikes,
    outs: s.outs,
    down: s.down,
    possession: s.possession,
    timer: { ...s.timer },
  };
}


export interface GameState extends GameStateSlice {
  undoStack: GameSnapshot[];
  presentationMode: boolean;
  hypeMode: boolean;
  theme: import("./types").ThemeId;
  controlsCollapsed: boolean;
}

interface GameStateSlice {
  sportId: string;
  customSport: SportConfig | null;
  teamA: TeamState;
  teamB: TeamState;
  period: number;
  halfInning: "top" | "bottom";
  balls: number;
  strikes: number;
  outs: number;
  down: number;
  possession: TeamId | null;
  timer: TimerState;
}

const initialSlice: GameStateSlice = {
  sportId: BASKETBALL.id,
  customSport: null,
  teamA: defaultTeam("HOME", "#22c55e"),
  teamB: defaultTeam("AWAY", "#3b82f6"),
  period: 1,
  halfInning: "top",
  balls: 0,
  strikes: 0,
  outs: 0,
  down: 1,
  possession: "a",
  timer: defaultTimer(),
};

type GameStore = GameState & {
  pushUndo: () => void;
  undo: () => void;
  setSport: (id: string) => void;
  setCustomSport: (config: SportConfig) => void;
  addScore: (team: TeamId, actionId: string) => void;
  adjustFouls: (team: TeamId, delta: number) => void;
  adjustTimeouts: (team: TeamId, delta: number) => void;
  setPossession: (team: TeamId | null) => void;
  nextPeriod: () => void;
  prevPeriod: () => void;
  toggleHalfInning: () => void;
  adjustBSO: (key: "balls" | "strikes" | "outs", delta: number) => void;
  resetCount: () => void;
  adjustDown: (delta: number) => void;
  resetGame: () => void;
  setTeamName: (team: TeamId, name: string) => void;
  setTeamColor: (team: TeamId, color: string) => void;
  setTimerMode: (mode: TimerState["mode"]) => void;
  setCountdownDuration: (seconds: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  checkCountdownEnd: () => void;
  setPresentationMode: (v: boolean) => void;
  setHypeMode: (v: boolean) => void;
  setTheme: (t: import("./types").ThemeId) => void;
  setControlsCollapsed: (v: boolean) => void;
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialSlice,
      undoStack: [],
      presentationMode: false,
      hypeMode: false,
      theme: "dark",
      controlsCollapsed: false,

      pushUndo: () => {
        const snap = snapshotFrom(get());
        set((state) => ({
          undoStack: [...state.undoStack.slice(-UNDO_MAX + 1), snap],
        }));
      },

      undo: () => {
        const { undoStack } = get();
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        set({
          sportId: prev.sportId,
          customSport: prev.customSport,
          teamA: prev.teamA,
          teamB: prev.teamB,
          period: prev.period,
          halfInning: prev.halfInning,
          balls: prev.balls,
          strikes: prev.strikes,
          outs: prev.outs,
          down: prev.down,
          possession: prev.possession,
          timer: prev.timer,
          undoStack: undoStack.slice(0, -1),
        });
      },

      setSport: (id) => {
        get().pushUndo();
        set({ sportId: id });
      },

      setCustomSport: (config) => {
        get().pushUndo();
        set({ customSport: config, sportId: "custom" });
      },

      addScore: (team, actionId) => {
        const { sportId, customSport } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const action = cfg.scoring.find((a) => a.id === actionId);
        if (!action) return;
        get().pushUndo();
        set((state) => {
          const key = team === "a" ? "teamA" : "teamB";
          return {
            [key]: {
              ...state[key],
              score: state[key].score + action.value,
            },
          };
        });
      },

      adjustFouls: (team, delta) => {
        get().pushUndo();
        set((state) => {
          const key = team === "a" ? "teamA" : "teamB";
          return {
            [key]: {
              ...state[key],
              fouls: Math.max(0, state[key].fouls + delta),
            },
          };
        });
      },

      adjustTimeouts: (team, delta) => {
        get().pushUndo();
        set((state) => {
          const key = team === "a" ? "teamA" : "teamB";
          return {
            [key]: {
              ...state[key],
              timeouts: Math.max(0, Math.min(9, state[key].timeouts + delta)),
            },
          };
        });
      },

      setPossession: (team) => {
        get().pushUndo();
        set({ possession: team });
      },

      nextPeriod: () => {
        get().pushUndo();
        const { sportId, customSport, period } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const max = cfg.maxPeriods;
        set({
          period: max ? Math.min(period + 1, max) : period + 1,
        });
      },

      prevPeriod: () => {
        get().pushUndo();
        set((state) => ({
          period: Math.max(1, state.period - 1),
        }));
      },

      toggleHalfInning: () => {
        get().pushUndo();
        set((state) => ({
          halfInning: state.halfInning === "top" ? "bottom" : "top",
        }));
      },

      adjustBSO: (key, delta) => {
        get().pushUndo();
        set((state) => {
          const limits = { balls: 4, strikes: 3, outs: 3 };
          const max = limits[key];
          const cur =
            key === "balls"
              ? state.balls
              : key === "strikes"
                ? state.strikes
                : state.outs;
          const next = Math.max(0, Math.min(max, cur + delta));
          if (key === "balls") return { balls: next };
          if (key === "strikes") return { strikes: next };
          return { outs: next };
        });
      },

      resetCount: () => {
        get().pushUndo();
        set({ balls: 0, strikes: 0 });
      },

      adjustDown: (delta) => {
        get().pushUndo();
        set((state) => ({
          down: Math.max(1, Math.min(4, state.down + delta)),
        }));
      },

      resetGame: () => {
        get().pushUndo();
        set({
          ...initialSlice,
          teamA: { ...get().teamA, score: 0, fouls: 0 },
          teamB: { ...get().teamB, score: 0, fouls: 0 },
          timer: defaultTimer(),
          period: 1,
          halfInning: "top",
          balls: 0,
          strikes: 0,
          outs: 0,
          down: 1,
        });
      },

      setTeamName: (team, name) => {
        const key = team === "a" ? "teamA" : "teamB";
        set({ [key]: { ...get()[key], name } });
      },

      setTeamColor: (team, color) => {
        const key = team === "a" ? "teamA" : "teamB";
        set({ [key]: { ...get()[key], color } });
      },

      setTimerMode: (mode) => {
        get().pushUndo();
        set((state) => ({
          timer: {
            ...state.timer,
            mode,
            running: false,
            runStartedAt: null,
            accumulatedMs: 0,
          },
        }));
      },

      setCountdownDuration: (seconds) => {
        get().pushUndo();
        set((state) => ({
          timer: {
            ...state.timer,
            countdownFromSeconds: Math.max(1, seconds),
            accumulatedMs: 0,
            running: false,
            runStartedAt: null,
          },
        }));
      },

      startTimer: () => {
        set((state) => ({
          timer: {
            ...state.timer,
            running: true,
            runStartedAt: Date.now(),
          },
        }));
      },

      pauseTimer: () => {
        const { timer } = get();
        if (!timer.running || timer.runStartedAt == null) {
          set({ timer: { ...timer, running: false, runStartedAt: null } });
          return;
        }
        const segment = Date.now() - timer.runStartedAt;
        set({
          timer: {
            ...timer,
            running: false,
            runStartedAt: null,
            accumulatedMs: timer.accumulatedMs + segment,
          },
        });
      },

      resetTimer: () => {
        get().pushUndo();
        set((state) => ({
          timer: {
            ...state.timer,
            running: false,
            runStartedAt: null,
            accumulatedMs: 0,
          },
        }));
      },

      checkCountdownEnd: () => {
        const { timer } = get();
        if (!timer.running || timer.mode !== "countdown") return;
        const total = timer.countdownFromSeconds * 1000;
        const elapsed = getElapsedMs(timer);
        if (elapsed >= total) {
          set({
            timer: {
              ...timer,
              running: false,
              runStartedAt: null,
              accumulatedMs: total,
            },
          });
          playBuzzer();
        }
      },

      setPresentationMode: (v) => set({ presentationMode: v }),
      setHypeMode: (v) => set({ hypeMode: v }),
      setTheme: (t) => set({ theme: t }),
      setControlsCollapsed: (v) => set({ controlsCollapsed: v }),
    }),
    {
      name: "scoreboard-game-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sportId: state.sportId,
        customSport: state.customSport,
        teamA: state.teamA,
        teamB: state.teamB,
        period: state.period,
        halfInning: state.halfInning,
        balls: state.balls,
        strikes: state.strikes,
        outs: state.outs,
        down: state.down,
        possession: state.possession,
        timer: state.timer,
        hypeMode: state.hypeMode,
        theme: state.theme,
      }),
      skipHydration: true,
    },
  ),
);

export function getElapsedMs(timer: TimerState): number {
  const base = timer.accumulatedMs;
  if (!timer.running || timer.runStartedAt == null) return base;
  return base + (Date.now() - timer.runStartedAt);
}

export function formatClockFromMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getDisplaySeconds(timer: TimerState): number {
  if (timer.mode === "countup") {
    return Math.floor(getElapsedMs(timer) / 1000);
  }
  const total = timer.countdownFromSeconds * 1000;
  const rem = Math.max(0, total - getElapsedMs(timer));
  return Math.ceil(rem / 1000);
}

function playBuzzer() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 400);
  } catch {
    /* ignore */
  }
}

export function playScoreChime(hype: boolean) {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = hype ? 660 : 440;
    g.gain.value = hype ? 0.08 : 0.05;
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, hype ? 120 : 80);
  } catch {
    /* ignore */
  }
}
