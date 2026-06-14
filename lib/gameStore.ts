"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  BannerMessage,
  GameHistoryEntry,
  GameSnapshot,
  MusicTrackId,
  ScoreSoundId,
  ShotClockState,
  SportConfig,
  TeamId,
  TeamState,
  TimerState,
  UiPhase,
} from "./types";
import { BASKETBALL } from "./sportPresets";
import { NHL_TEAMS, NHL_HORN_SRC } from "./nhlTeams";
import {
  defaultVariantId,
  effectiveMaxPeriods,
  resolveActiveVariant,
  resolveSportConfig,
} from "./sportRegistry";
import {
  BASKETBALL_SCORE_SFX_SRC,
  playSfx,
  playSfxClip,
  setMusic as setAudioMusic,
  setMusicVolume,
  setSfxVolume,
  stopActiveSfxClip,
  vibrate,
} from "./audio";

function playScoreSound(id: ScoreSoundId) {
  switch (id) {
    case "swish":
      playSfxClip(BASKETBALL_SCORE_SFX_SRC);
      break;
    case "horn":
      playSfxClip("/sfx/horn.mp3");
      break;
    case "chime":
      playSfx("chime");
      break;
    case "ding":
      playSfx("ding");
      break;
    case "tada":
      playSfx("tada");
      break;
    case "none":
    default:
      break;
  }
}

const UNDO_MAX = 40;

const defaultTeam = (name: string, color: string): TeamState => ({
  name,
  color,
  score: 0,
  fouls: 0,
  timeouts: 7,
  logo: null,
});

function defaultTimerForSport(
  sportId: string,
  customSport: SportConfig | null,
  timerVariantId: string,
): TimerState {
  const cfg = resolveSportConfig(sportId, customSport);
  const v = resolveActiveVariant(cfg, timerVariantId);
  const periodSec =
    v?.periodSeconds && v.periodSeconds > 0 ? v.periodSeconds : 12 * 60;

  return {
    running: false,
    runStartedAt: null,
    accumulatedMs: 0,
    countdownFromSeconds: periodSec,
  };
}

function snapshotFrom(
  s: GameStateSlice,
): GameSnapshot {
  return {
    sportId: s.sportId,
    customSport: s.customSport,
    timerVariantId: s.timerVariantId,
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
  uiPhase: UiPhase;
  shotClock: ShotClockState;
  sfxEnabled: boolean;
  sfxVolume: number;
  musicEnabled: boolean;
  musicTrack: MusicTrackId;
  musicVolume: number;
  banner: BannerMessage | null;
  history: GameHistoryEntry[];
  periodScores: { a: number[]; b: number[] };
  confettiKey: number;
  /** Selected NHL team ID for the home team goal horn (null = default horn) */
  hockeyGoalHornHome: string | null;
  /** Selected NHL team ID for the away team goal horn (null = default horn) */
  hockeyGoalHornAway: string | null;
  /** User-adjusted start timestamps (seconds) keyed by NHL team id */
  nhlHornOffsets: Record<string, number>;
  /** True when a hockey goal horn is currently sounding — drives the
   *  fullscreen STOP HORN overlay. */
  hornPlaying: boolean;
  /** Set ~3 s after the final whistle. Drives the fullscreen winner
   *  celebration (continuous confetti, big winner name, etc.). */
  gameOverCelebration: {
    winnerSide: "a" | "b";
    winnerName: string;
    loserName: string;
    finalScoreA: number;
    finalScoreB: number;
  } | null;
  /** Whether the "Play The Final Countdown?" prompt is currently visible. */
  finalCountdownPromptVisible: boolean;
  /** Tracks whether the prompt has already been shown for this game so we
   *  never spam it twice. Reset on resetGame / setSport / fresh hydration. */
  finalCountdownPromptShownThisGame: boolean;
  /** After advancing a quarter in basketball, surface reset-fouls until used. */
  foulsResetPrompt: boolean;
  /** Haptic feedback on button presses. */
  vibrationEnabled: boolean;
  /** Soft tick sound on button presses. */
  pressTickEnabled: boolean;
  /** Start the game clock automatically on the first score. */
  autoStartClockOnScore: boolean;
  /** Keep the device screen awake during a game. */
  keepAwakeEnabled: boolean;
  /** End the game when a team reaches the target score. */
  targetScoreEnabled: boolean;
  targetScore: number;
  /** Show confetti bursts on big plays. */
  confettiEnabled: boolean;
  /** Show the centered play banners (BUCKET!, 3 POINTS!, etc.). */
  bannersEnabled: boolean;
  /** Which sound plays when a team scores. */
  scoreSoundId: ScoreSoundId;
  /** When true, rotate the on-screen layout an extra 180° (manual flip). */
  displayFlipped: boolean;
  /** True during the post-0:00 grace window where buzzer beaters can still count. */
  buzzerBeaterWindowActive: boolean;
  /** Deadline (Date.now ms) when the grace window ends. */
  buzzerBeaterWindowEndsAt: number | null;
  /** Guard so we don't schedule multiple end-of-window timers. */
  buzzerBeaterWindowSettling: boolean;
}

interface GameStateSlice {
  sportId: string;
  customSport: SportConfig | null;
  timerVariantId: string;
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
  timerVariantId: defaultVariantId(BASKETBALL),
  teamA: defaultTeam("HOME", "#22c55e"),
  teamB: defaultTeam("AWAY", "#3b82f6"),
  period: 1,
  halfInning: "top",
  balls: 0,
  strikes: 0,
  outs: 0,
  down: 1,
  possession: "a",
  timer: defaultTimerForSport(
    BASKETBALL.id,
    null,
    defaultVariantId(BASKETBALL),
  ),
};

type GameStore = GameState & {
  pushUndo: () => void;
  undo: () => void;
  setSport: (id: string) => void;
  setCustomSport: (config: SportConfig) => void;
  addScore: (team: TeamId, actionId: string) => void;
  triggerGameOver: () => void;
  adjustFouls: (team: TeamId, delta: number) => void;
  adjustTimeouts: (team: TeamId, delta: number) => void;
  resetTeamFouls: () => void;
  dismissFoulsResetPrompt: () => void;
  resetScoresOnly: () => void;
  setTeamLogo: (team: TeamId, logo: string | null) => void;
  setVibrationEnabled: (v: boolean) => void;
  setPressTickEnabled: (v: boolean) => void;
  setAutoStartClockOnScore: (v: boolean) => void;
  setKeepAwakeEnabled: (v: boolean) => void;
  setTargetScoreEnabled: (v: boolean) => void;
  setTargetScore: (n: number) => void;
  setConfettiEnabled: (v: boolean) => void;
  setBannersEnabled: (v: boolean) => void;
  setScoreSound: (id: ScoreSoundId) => void;
  setPossession: (team: TeamId | null) => void;
  nextPeriod: () => void;
  prevPeriod: () => void;
  toggleHalfInning: () => void;
  adjustBSO: (key: "balls" | "strikes" | "outs", delta: number) => void;
  resetCount: () => void;
  adjustDown: (delta: number) => void;
  setPeriod: (value: number) => void;
  adjustScore: (team: TeamId, delta: number) => void;
  resetGame: () => void;
  setTeamName: (team: TeamId, name: string) => void;
  setTeamColor: (team: TeamId, color: string) => void;
  setCountdownDuration: (seconds: number) => void;
  setClockSeconds: (seconds: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  checkCountdownEnd: () => void;
  setPresentationMode: (v: boolean) => void;
  setHypeMode: (v: boolean) => void;
  setTheme: (t: import("./types").ThemeId) => void;
  setControlsCollapsed: (v: boolean) => void;
  setTimerVariant: (variantId: string) => void;
  applyOfficialPeriodTimer: () => void;
  applyOvertimeTimer: () => void;
  setUiPhase: (phase: UiPhase) => void;
  toggleDisplayFlip: () => void;
  setShotClockEnabled: (v: boolean) => void;
  setShotClockDuration: (seconds: number) => void;
  startShotClock: () => void;
  pauseShotClock: () => void;
  resetShotClock: () => void;
  checkShotClockEnd: () => void;
  setSfxEnabled: (v: boolean) => void;
  setSfxVolumePref: (v: number) => void;
  setMusicEnabled: (v: boolean) => void;
  setMusicTrack: (t: MusicTrackId) => void;
  setMusicVolumePref: (v: number) => void;
  setHockeyGoalHornHome: (id: string | null) => void;
  setHockeyGoalHornAway: (id: string | null) => void;
  setNhlHornOffset: (teamId: string, startSec: number) => void;
  stopHorn: () => void;
  dismissGameOverCelebration: () => void;
  showFinalCountdownPrompt: () => void;
  dismissFinalCountdownPrompt: () => void;
  playFinalCountdown: () => void;
  showBanner: (msg: Omit<BannerMessage, "id">) => void;
  clearBanner: () => void;
  finalizeGame: () => void;
  clearHistory: () => void;
  swapTeams: () => void;
};

const initialShotClock: ShotClockState = {
  enabled: false,
  running: false,
  runStartedAt: null,
  accumulatedMs: 0,
  durationSeconds: 24,
};

let bannerCounter = 0;

function bigPlayLabel(
  delta: number,
  sportId: string,
  milestone: boolean,
  newScore: number,
): string {
  if (milestone) return `${newScore}!`;
  if (sportId === "basketball") {
    if (delta >= 3) return "3 POINTS!";
    if (delta === 2) return "BUCKET!";
    return "+1";
  }
  if (sportId === "football") {
    if (delta >= 6) return "TOUCHDOWN!";
    if (delta === 3) return "FIELD GOAL!";
    if (delta === 2) return "SAFETY!";
    return "+1";
  }
  if (sportId === "soccer" || sportId === "hockey") return "GOAL!";
  return `+${delta}`;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialSlice,
      undoStack: [],
      presentationMode: false,
      hypeMode: false,
      theme: "dark",
      displayFlipped: false,
      controlsCollapsed: false,
      uiPhase: "menu",
      shotClock: initialShotClock,
      sfxEnabled: true,
      sfxVolume: 0.6,
      musicEnabled: false,
      musicTrack: "none",
      musicVolume: 0.3,
      banner: null,
      history: [],
      periodScores: { a: [0], b: [0] },
      confettiKey: 0,
      hockeyGoalHornHome: null,
      hockeyGoalHornAway: null,
      nhlHornOffsets: {},
      hornPlaying: false,
      gameOverCelebration: null,
      finalCountdownPromptVisible: false,
      finalCountdownPromptShownThisGame: false,
      foulsResetPrompt: false,
      vibrationEnabled: true,
      pressTickEnabled: false,
      autoStartClockOnScore: false,
      keepAwakeEnabled: true,
      targetScoreEnabled: false,
      targetScore: 21,
      confettiEnabled: true,
      bannersEnabled: true,
      scoreSoundId: "default",
      buzzerBeaterWindowActive: false,
      buzzerBeaterWindowEndsAt: null,
      buzzerBeaterWindowSettling: false,

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
          timerVariantId: prev.timerVariantId,
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
        const cfg = resolveSportConfig(id, get().customSport);
        const vid = defaultVariantId(cfg);
        set({
          sportId: id,
          timerVariantId: vid,
          period: 1,
          timer: defaultTimerForSport(id, get().customSport, vid),
          // Fresh sport = fresh game session: rearm the Final Countdown prompt
          // and clear any leftover celebration.
          finalCountdownPromptShownThisGame: false,
          finalCountdownPromptVisible: false,
          buzzerBeaterWindowActive: false,
          buzzerBeaterWindowEndsAt: null,
          buzzerBeaterWindowSettling: false,
          gameOverCelebration: null,
        });
      },

      setCustomSport: (config) => {
        get().pushUndo();
        const vid = defaultVariantId(config);
        set({
          customSport: config,
          sportId: "custom",
          timerVariantId: vid,
          period: 1,
          timer: defaultTimerForSport("custom", config, vid),
        });
      },

      setTimerVariant: (variantId) => {
        get().pushUndo();
        const { sportId, customSport, period } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const cap = effectiveMaxPeriods(cfg, variantId);
        set({
          timerVariantId: variantId,
          period: cap != null ? Math.min(period, cap) : period,
          timer: defaultTimerForSport(sportId, customSport, variantId),
        });
      },

      applyOfficialPeriodTimer: () => {
        get().pushUndo();
        const { sportId, customSport, timerVariantId } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const v = resolveActiveVariant(cfg, timerVariantId);
        if (!v || v.periodSeconds <= 0) return;
        set((state) => ({
          timer: {
            ...state.timer,
            countdownFromSeconds: v.periodSeconds,
            accumulatedMs: 0,
            running: false,
            runStartedAt: null,
          },
        }));
      },

      applyOvertimeTimer: () => {
        get().pushUndo();
        const { sportId, customSport, timerVariantId } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const v = resolveActiveVariant(cfg, timerVariantId);
        const ot = v?.overtimeSeconds;
        if (ot == null || ot <= 0) return;
        set((state) => ({
          timer: {
            ...state.timer,
            countdownFromSeconds: ot,
            accumulatedMs: 0,
            running: false,
            runStartedAt: null,
          },
        }));
      },

      addScore: (team, actionId) => {
        const {
          sportId,
          customSport,
          sfxEnabled,
          periodScores,
          period,
          timer,
          confettiEnabled,
          bannersEnabled,
          scoreSoundId,
          vibrationEnabled,
          autoStartClockOnScore,
          targetScoreEnabled,
          targetScore,
          buzzerBeaterWindowActive,
          timerVariantId,
        } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const action = cfg.scoring.find((a) => a.id === actionId);
        if (!action) return;
        get().pushUndo();

        // Buzzer-beater: scored with the clock running in the final 3 seconds.
        const remainingMs = Math.max(
          0,
          timer.countdownFromSeconds * 1000 - getElapsedMs(timer),
        );
        const isBuzzerBeater =
          !cfg.noGameClock &&
          (timer.running || buzzerBeaterWindowActive) &&
          action.value > 0 &&
          ((remainingMs > 0 && remainingMs <= 3000) || buzzerBeaterWindowActive);

        set((state) => {
          const key = team === "a" ? "teamA" : "teamB";
          const updatedPeriodScores = {
            a: [...periodScores.a],
            b: [...periodScores.b],
          };
          while (updatedPeriodScores.a.length < period)
            updatedPeriodScores.a.push(0);
          while (updatedPeriodScores.b.length < period)
            updatedPeriodScores.b.push(0);
          const idx = period - 1;
          updatedPeriodScores[team][idx] =
            (updatedPeriodScores[team][idx] ?? 0) + action.value;
          const newScore = state[key].score + action.value;
          const milestone = newScore > 0 && newScore % 25 === 0;
          const isBig = action.value >= 6 || milestone || isBuzzerBeater;
          const isMid = action.value >= 3;
          let banner = state.banner;
          if (bannersEnabled && (isBig || isMid || isBuzzerBeater)) {
            bannerCounter += 1;
            banner = {
              id: bannerCounter,
              text: isBuzzerBeater
                ? "BUZZER BEATER!"
                : bigPlayLabel(action.value, cfg.id, milestone, newScore),
              flavor: "score",
            };
          }
          return {
            [key]: {
              ...state[key],
              score: newScore,
            },
            periodScores: updatedPeriodScores,
            confettiKey:
              confettiEnabled && isBig
                ? state.confettiKey + 1
                : state.confettiKey,
            banner,
          };
        });

        // Auto-start the clock on the first score of a clocked sport.
        if (
          autoStartClockOnScore &&
          action.value > 0 &&
          !cfg.noGameClock &&
          !get().timer.running &&
          getElapsedMs(get().timer) === 0
        ) {
          get().startTimer();
        }

        if (
          sportId === "basketball" &&
          action.value > 0 &&
          get().shotClock.enabled
        ) {
          get().resetShotClock();
        }
        if (sfxEnabled && action.value > 0) {
          // During the 5-second post-buzzer grace window, play the requested
          // Mike Breen clip segment:
          // - tie: 0:49–0:52.5
          // - go-ahead win: 1:32–1:35.5
          const { teamA, teamB } = get();
          const tieAfterScore = teamA.score === teamB.score;
          const inBuzzerWindow = buzzerBeaterWindowActive;
          if (buzzerBeaterWindowActive) {
            if (tieAfterScore) {
              playSfxClip(
                "/music/mike-breen-double-bang.mp3",
                49,
                53.5,
              );
            } else {
              playSfxClip(
                "/music/mike-breen-double-bang.mp3",
                92,
                96.5,
              );
            }
          }
          // Don't immediately override the Breen call with normal score SFX.
          if (inBuzzerWindow) {
            // no-op; Breen clip already played above
          } else if (scoreSoundId !== "default") {
            playScoreSound(scoreSoundId);
          } else if (sportId === "basketball") {
            playSfxClip(BASKETBALL_SCORE_SFX_SRC);
          } else if (sportId === "hockey") {
            const { hockeyGoalHornHome, hockeyGoalHornAway, nhlHornOffsets } = get();
            const hornTeamId = team === "a" ? hockeyGoalHornHome : hockeyGoalHornAway;
            const clearHornFlag = () => set({ hornPlaying: false });
            // Flag goes up immediately so the STOP HORN overlay appears the same frame.
            set({ hornPlaying: true });
            if (hornTeamId) {
              const hornTeam = NHL_TEAMS.find((t) => t.id === hornTeamId);
              if (hornTeam) {
                const start = nhlHornOffsets[hornTeamId] ?? hornTeam.defaultStart;
                const end = start + hornTeam.defaultDuration;
                playSfxClip(NHL_HORN_SRC, start, end, { onEnded: clearHornFlag });
              } else {
                playSfxClip("/sfx/horn.mp3", 0, undefined, { onEnded: clearHornFlag });
              }
            } else {
              playSfxClip("/sfx/horn.mp3", 0, undefined, { onEnded: clearHornFlag });
            }
          } else if (action.value >= 6) playSfx("tada");
          else if (action.value >= 3) playSfx("swoosh");
          else playSfx("chime");
        }

        // If someone takes the lead during the 5-second buzzer window, end game
        // immediately (no need to wait for the remainder of the window).
        if (buzzerBeaterWindowActive && action.value > 0) {
          const { teamA, teamB } = get();
          if (teamA.score !== teamB.score) {
            const cfgNow = resolveSportConfig(sportId, customSport);
            const max =
              effectiveMaxPeriods(cfgNow, timerVariantId) ?? cfgNow.maxPeriods;
            const isFinalPeriod = max != null && period >= max;
            if (isFinalPeriod) {
              get().triggerGameOver();
              set({
                buzzerBeaterWindowActive: false,
                buzzerBeaterWindowEndsAt: null,
                buzzerBeaterWindowSettling: false,
              });
            }
          }
        }
        // Quick haptic on every score for tactile feedback on phones.
        if (action.value > 0 && vibrationEnabled) vibrate(20);

        // Target-score win: end the game when a team reaches the target.
        if (targetScoreEnabled && action.value > 0) {
          const { teamA, teamB } = get();
          const reached =
            teamA.score >= targetScore || teamB.score >= targetScore;
          if (reached && teamA.score !== teamB.score) {
            get().triggerGameOver();
          }
        }
      },

      triggerGameOver: () => {
        const { teamA, teamB, gameOverCelebration } = get();
        if (gameOverCelebration) return;
        if (teamA.score === teamB.score) return;
        const winnerSide: "a" | "b" = teamA.score > teamB.score ? "a" : "b";
        get().pauseTimer();
        set((state) => ({
          gameOverCelebration: {
            winnerSide,
            winnerName: winnerSide === "a" ? teamA.name : teamB.name,
            loserName: winnerSide === "a" ? teamB.name : teamA.name,
            finalScoreA: teamA.score,
            finalScoreB: teamB.score,
          },
          confettiKey: state.confettiKey + 1,
        }));
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

      resetTeamFouls: () => {
        get().pushUndo();
        set((state) => ({
          teamA: { ...state.teamA, fouls: 0 },
          teamB: { ...state.teamB, fouls: 0 },
          foulsResetPrompt: false,
        }));
      },

      dismissFoulsResetPrompt: () => set({ foulsResetPrompt: false }),

      resetScoresOnly: () => {
        get().pushUndo();
        set((state) => ({
          teamA: { ...state.teamA, score: 0, fouls: 0 },
          teamB: { ...state.teamB, score: 0, fouls: 0 },
          periodScores: { a: [0], b: [0] },
          period: 1,
          foulsResetPrompt: false,
        }));
      },

      setTeamLogo: (team, logo) => {
        const key = team === "a" ? "teamA" : "teamB";
        set({ [key]: { ...get()[key], logo } });
      },

      setVibrationEnabled: (v) => set({ vibrationEnabled: v }),
      setPressTickEnabled: (v) => set({ pressTickEnabled: v }),
      setAutoStartClockOnScore: (v) => set({ autoStartClockOnScore: v }),
      setKeepAwakeEnabled: (v) => set({ keepAwakeEnabled: v }),
      setTargetScoreEnabled: (v) => set({ targetScoreEnabled: v }),
      setTargetScore: (n) =>
        set({ targetScore: Math.max(1, Math.floor(n)) }),
      setConfettiEnabled: (v) => set({ confettiEnabled: v }),
      setBannersEnabled: (v) => set({ bannersEnabled: v }),
      setScoreSound: (id) => set({ scoreSoundId: id }),

      setPossession: (team) => {
        get().pushUndo();
        set({ possession: team });
      },

      nextPeriod: () => {
        get().pushUndo();
        const {
          sportId,
          customSport,
          period,
          timerVariantId,
          periodScores,
        } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const max = effectiveMaxPeriods(cfg, timerVariantId) ?? cfg.maxPeriods;
        const nextPeriodNum = max ? Math.min(period + 1, max) : period + 1;
        const a = [...periodScores.a];
        const b = [...periodScores.b];
        while (a.length < nextPeriodNum) a.push(0);
        while (b.length < nextPeriodNum) b.push(0);
        set({
          period: nextPeriodNum,
          periodScores: { a, b },
          foulsResetPrompt:
            sportId === "basketball" && nextPeriodNum > period,
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

      setPeriod: (value) => {
        get().pushUndo();
        const next = Math.max(1, Math.floor(value));
        set({ period: next });
      },

      adjustScore: (team, delta) => {
        get().pushUndo();
        set((state) => {
          const key = team === "a" ? "teamA" : "teamB";
          const prev = state[key].score;
          return {
            [key]: {
              ...state[key],
              score: Math.max(0, prev + delta),
            },
          };
        });
      },

      resetGame: () => {
        get().pushUndo();
        const { sportId, customSport, shotClock } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const vid = defaultVariantId(cfg);
        set({
          ...initialSlice,
          sportId,
          customSport,
          timerVariantId: vid,
          teamA: { ...get().teamA, score: 0, fouls: 0 },
          teamB: { ...get().teamB, score: 0, fouls: 0 },
          timer: defaultTimerForSport(sportId, customSport, vid),
          period: 1,
          halfInning: "top",
          balls: 0,
          strikes: 0,
          outs: 0,
          down: 1,
          periodScores: { a: [0], b: [0] },
          shotClock: {
            ...shotClock,
            running: false,
            runStartedAt: null,
            accumulatedMs: 0,
          },
          finalCountdownPromptShownThisGame: false,
          finalCountdownPromptVisible: false,
          buzzerBeaterWindowActive: false,
          buzzerBeaterWindowEndsAt: null,
          buzzerBeaterWindowSettling: false,
          gameOverCelebration: null,
          foulsResetPrompt: false,
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
          buzzerBeaterWindowActive: false,
          buzzerBeaterWindowEndsAt: null,
          buzzerBeaterWindowSettling: false,
        }));
      },

      setClockSeconds: (seconds) => {
        get().pushUndo();
        const safe = Math.max(0, Math.floor(seconds));
        set((state) => ({
          timer: {
            ...state.timer,
            countdownFromSeconds: safe,
            accumulatedMs: 0,
            running: false,
            runStartedAt: null,
          },
          buzzerBeaterWindowActive: false,
          buzzerBeaterWindowEndsAt: null,
          buzzerBeaterWindowSettling: false,
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
          buzzerBeaterWindowActive: false,
          buzzerBeaterWindowEndsAt: null,
          buzzerBeaterWindowSettling: false,
        }));
      },

      checkCountdownEnd: () => {
        const {
          timer,
          sfxEnabled,
          sportId,
          customSport,
          timerVariantId,
          period,
          teamA,
          teamB,
          finalCountdownPromptShownThisGame,
          finalCountdownPromptVisible,
          gameOverCelebration,
          buzzerBeaterWindowActive,
          buzzerBeaterWindowEndsAt,
          buzzerBeaterWindowSettling,
        } = get();
        if (!timer.running && !buzzerBeaterWindowActive) return;
        const total = timer.countdownFromSeconds * 1000;
        const elapsed = getElapsedMs(timer);
        const remainingSec = Math.max(0, (total - elapsed) / 1000);

        const cfg = resolveSportConfig(sportId, customSport);
        const max =
          effectiveMaxPeriods(cfg, timerVariantId) ?? cfg.maxPeriods;
        const isFinalPeriod = max != null && period >= max;

        // ---- Last-minute Final Countdown prompt ----
        // Show once per game, only in the final period of a clocked sport,
        // while the clock is between 1 and 60 seconds. Skip if a celebration
        // is already up.
        if (
          !cfg.noGameClock &&
          isFinalPeriod &&
          !finalCountdownPromptShownThisGame &&
          !finalCountdownPromptVisible &&
          !gameOverCelebration &&
          remainingSec > 1 &&
          remainingSec <= 60
        ) {
          set({
            finalCountdownPromptVisible: true,
            finalCountdownPromptShownThisGame: true,
          });
        }

        // ---- End of period / game ----
        if (elapsed >= total) {
          // Start a 5-second grace window once the clock first hits 0:00.
          if (!buzzerBeaterWindowActive) {
            const endsAt = Date.now() + 5000;
            set({
              timer: {
                ...timer,
                running: false,
                runStartedAt: null,
                accumulatedMs: total,
              },
              finalCountdownPromptVisible: false,
              buzzerBeaterWindowActive: true,
              buzzerBeaterWindowEndsAt: endsAt,
              buzzerBeaterWindowSettling: false,
            });
            if (sfxEnabled) playSfxClip("/sfx/horn.mp3");
            return;
          }

          // While the window is active, wait until it expires before resolving period/game.
          if (buzzerBeaterWindowEndsAt && Date.now() < buzzerBeaterWindowEndsAt) {
            return;
          }
          if (buzzerBeaterWindowSettling) return;
          set({ buzzerBeaterWindowSettling: true });

          set({
            timer: {
              ...timer,
              running: false,
              runStartedAt: null,
              accumulatedMs: total,
            },
            // Buzzer ends any lingering Final Countdown prompt.
            finalCountdownPromptVisible: false,
            buzzerBeaterWindowActive: false,
            buzzerBeaterWindowEndsAt: null,
            buzzerBeaterWindowSettling: false,
          });
          if (max && period >= max && teamA.score !== teamB.score) {
            const winnerSide: "a" | "b" =
              teamA.score > teamB.score ? "a" : "b";
            const winnerName =
              winnerSide === "a" ? teamA.name : teamB.name;
            const loserName =
              winnerSide === "a" ? teamB.name : teamA.name;
            bannerCounter += 1;
            set({
              banner: {
                id: bannerCounter,
                text: `${winnerName} WINS!`,
                subtext: `${teamA.name} ${teamA.score} - ${teamB.score} ${teamB.name}`,
                flavor: "win",
              },
            });
            // 3-second delay then trigger the full celebration overlay.
            const finalA = teamA.score;
            const finalB = teamB.score;
            setTimeout(() => {
              // Only show if user hasn't already left the game screen.
              if (get().uiPhase !== "game") return;
              set((state) => ({
                gameOverCelebration: {
                  winnerSide,
                  winnerName,
                  loserName,
                  finalScoreA: finalA,
                  finalScoreB: finalB,
                },
                confettiKey: state.confettiKey + 1,
              }));
            }, 3000);
          } else {
            // Automatically advance period and reset the clock for the next one after a 3 second delay.
            setTimeout(() => {
              get().nextPeriod();
              get().applyOfficialPeriodTimer();
            }, 3000);
          }
        }
      },

      setPresentationMode: (v) => set({ presentationMode: v }),
      setHypeMode: (v) => set({ hypeMode: v }),
      setTheme: (t) => set({ theme: t }),
      setControlsCollapsed: (v) => set({ controlsCollapsed: v }),
      setUiPhase: (phase) => set({ uiPhase: phase }),
      toggleDisplayFlip: () =>
        set((state) => ({ displayFlipped: !state.displayFlipped })),

      setShotClockEnabled: (v) =>
        set((state) => ({
          shotClock: { ...state.shotClock, enabled: v },
        })),

      setShotClockDuration: (seconds) =>
        set((state) => ({
          shotClock: {
            ...state.shotClock,
            durationSeconds: Math.max(1, Math.floor(seconds)),
            accumulatedMs: 0,
            running: false,
            runStartedAt: null,
          },
        })),

      startShotClock: () =>
        set((state) => ({
          shotClock: {
            ...state.shotClock,
            running: true,
            runStartedAt: Date.now(),
          },
        })),

      pauseShotClock: () =>
        set((state) => {
          const sc = state.shotClock;
          if (!sc.running || sc.runStartedAt == null) {
            return {
              shotClock: { ...sc, running: false, runStartedAt: null },
            };
          }
          const segment = Date.now() - sc.runStartedAt;
          return {
            shotClock: {
              ...sc,
              running: false,
              runStartedAt: null,
              accumulatedMs: sc.accumulatedMs + segment,
            },
          };
        }),

      resetShotClock: () =>
        set((state) => ({
          shotClock: {
            ...state.shotClock,
            running: false,
            runStartedAt: null,
            accumulatedMs: 0,
          },
        })),

      checkShotClockEnd: () => {
        const { shotClock, sfxEnabled } = get();
        if (!shotClock.enabled || !shotClock.running) return;
        const total = shotClock.durationSeconds * 1000;
        const elapsed = getShotClockElapsed(shotClock);
        if (elapsed >= total) {
          set({
            shotClock: {
              ...shotClock,
              running: false,
              runStartedAt: null,
              accumulatedMs: total,
            },
          });
          if (sfxEnabled) playSfx("buzzer");
        }
      },

      setSfxEnabled: (v) => {
        set({ sfxEnabled: v });
        if (!v) setSfxVolume(0);
        else setSfxVolume(get().sfxVolume);
      },

      setSfxVolumePref: (v) => {
        const clamped = Math.max(0, Math.min(1, v));
        set({ sfxVolume: clamped });
        if (get().sfxEnabled) setSfxVolume(clamped);
      },

      setMusicEnabled: (v) => {
        set({ musicEnabled: v });
        if (v) {
          setMusicVolume(get().musicVolume);
          setAudioMusic(get().musicTrack);
        } else {
          setAudioMusic("none");
        }
      },

      setMusicTrack: (t) => {
        set({ musicTrack: t });
        if (get().musicEnabled) setAudioMusic(t);
      },

      setMusicVolumePref: (v) => {
        const clamped = Math.max(0, Math.min(1, v));
        set({ musicVolume: clamped });
        setMusicVolume(clamped);
      },

      setHockeyGoalHornHome: (id) => set({ hockeyGoalHornHome: id }),
      setHockeyGoalHornAway: (id) => set({ hockeyGoalHornAway: id }),

      setNhlHornOffset: (teamId, startSec) =>
        set((state) => ({
          nhlHornOffsets: { ...state.nhlHornOffsets, [teamId]: startSec },
        })),

      stopHorn: () => {
        stopActiveSfxClip();
        set({ hornPlaying: false });
      },

      dismissGameOverCelebration: () => {
        // Save the result to history once the user dismisses the celebration.
        const { gameOverCelebration } = get();
        if (gameOverCelebration) get().finalizeGame();
        set({ gameOverCelebration: null });
      },

      showFinalCountdownPrompt: () =>
        set({
          finalCountdownPromptVisible: true,
          finalCountdownPromptShownThisGame: true,
        }),

      dismissFinalCountdownPrompt: () =>
        set({ finalCountdownPromptVisible: false }),

      playFinalCountdown: () => {
        // Start at 13 s to skip the spoken intro and hit the iconic synth.
        // Final Countdown should take over: stop any looping music first.
        setAudioMusic("none");
        set({ musicEnabled: false });
        playSfxClip("/music/final-countdown.mp3", 13);
        set({ finalCountdownPromptVisible: false });
      },

      showBanner: (msg) => {
        bannerCounter += 1;
        set({ banner: { id: bannerCounter, ...msg } });
      },

      clearBanner: () => set({ banner: null }),

      finalizeGame: () => {
        const {
          sportId,
          customSport,
          teamA,
          teamB,
          period,
          history,
          timerVariantId,
        } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const variant = resolveActiveVariant(cfg, timerVariantId);
        const periodLabel = variant?.periodLabel ?? cfg.periodLabel;
        const winner: "a" | "b" | "tie" =
          teamA.score === teamB.score
            ? "tie"
            : teamA.score > teamB.score
              ? "a"
              : "b";
        const entry: GameHistoryEntry = {
          id: `g${Date.now()}`,
          finishedAt: Date.now(),
          sportId,
          sportName: cfg.name,
          periodLabel,
          finalPeriod: period,
          teamA: { name: teamA.name, score: teamA.score },
          teamB: { name: teamB.name, score: teamB.score },
          winner,
        };
        set({ history: [entry, ...history].slice(0, 20) });
      },

      clearHistory: () => set({ history: [] }),

      swapTeams: () => {
        get().pushUndo();
        set((state) => ({
          teamA: state.teamB,
          teamB: state.teamA,
          periodScores: {
            a: [...state.periodScores.b],
            b: [...state.periodScores.a],
          },
          possession:
            state.possession === "a"
              ? "b"
              : state.possession === "b"
                ? "a"
                : null,
        }));
      },
    }),
    {
      name: "scoreboard-game-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sportId: state.sportId,
        customSport: state.customSport,
        timerVariantId: state.timerVariantId,
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
        shotClock: state.shotClock,
        sfxEnabled: state.sfxEnabled,
        sfxVolume: state.sfxVolume,
        musicEnabled: state.musicEnabled,
        musicTrack: state.musicTrack,
        musicVolume: state.musicVolume,
        history: state.history,
        periodScores: state.periodScores,
        hockeyGoalHornHome: state.hockeyGoalHornHome,
        hockeyGoalHornAway: state.hockeyGoalHornAway,
        nhlHornOffsets: state.nhlHornOffsets,
        vibrationEnabled: state.vibrationEnabled,
        pressTickEnabled: state.pressTickEnabled,
        autoStartClockOnScore: state.autoStartClockOnScore,
        keepAwakeEnabled: state.keepAwakeEnabled,
        targetScoreEnabled: state.targetScoreEnabled,
        targetScore: state.targetScore,
        confettiEnabled: state.confettiEnabled,
        bannersEnabled: state.bannersEnabled,
        scoreSoundId: state.scoreSoundId,
        displayFlipped: state.displayFlipped,
      }),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = persisted as Partial<GameStore> | undefined;
        const merged = { ...current, ...p } as GameStore;
        if (!merged.timerVariantId) {
          merged.timerVariantId = defaultVariantId(
            resolveSportConfig(merged.sportId, merged.customSport),
          );
        }
        merged.uiPhase = "menu";
        if (merged.timer && "mode" in merged.timer) {
          delete (merged.timer as { mode?: unknown }).mode;
        }
        if (!merged.shotClock) merged.shotClock = initialShotClock;
        else
          merged.shotClock = {
            ...merged.shotClock,
            running: false,
            runStartedAt: null,
          };
        if (typeof merged.sfxEnabled !== "boolean") merged.sfxEnabled = true;
        if (typeof merged.sfxVolume !== "number") merged.sfxVolume = 0.6;
        if (typeof merged.musicEnabled !== "boolean")
          merged.musicEnabled = false;
        if (!merged.musicTrack) merged.musicTrack = "none";
        const rawTrack = (persisted as { musicTrack?: unknown } | undefined)
          ?.musicTrack;
        if (rawTrack === "hype2") merged.musicTrack = "hype";
        if (rawTrack === "ambient") merged.musicTrack = "none";
        if (typeof merged.musicVolume !== "number") merged.musicVolume = 0.3;
        if (!merged.periodScores) merged.periodScores = { a: [0], b: [0] };
        merged.foulsResetPrompt = false;
        if (typeof merged.vibrationEnabled !== "boolean")
          merged.vibrationEnabled = true;
        if (typeof merged.pressTickEnabled !== "boolean")
          merged.pressTickEnabled = false;
        if (typeof merged.autoStartClockOnScore !== "boolean")
          merged.autoStartClockOnScore = false;
        if (typeof merged.keepAwakeEnabled !== "boolean")
          merged.keepAwakeEnabled = true;
        if (typeof merged.targetScoreEnabled !== "boolean")
          merged.targetScoreEnabled = false;
        if (typeof merged.targetScore !== "number") merged.targetScore = 21;
        if (typeof merged.confettiEnabled !== "boolean")
          merged.confettiEnabled = true;
        if (typeof merged.bannersEnabled !== "boolean")
          merged.bannersEnabled = true;
        if (!merged.scoreSoundId) merged.scoreSoundId = "default";
        if (merged.teamA && merged.teamA.logo === undefined)
          merged.teamA = { ...merged.teamA, logo: null };
        if (merged.teamB && merged.teamB.logo === undefined)
          merged.teamB = { ...merged.teamB, logo: null };
        if (!merged.history) merged.history = [];
        merged.banner = null;
        if (typeof merged.confettiKey !== "number") merged.confettiKey = 0;
        merged.buzzerBeaterWindowActive = false;
        merged.buzzerBeaterWindowEndsAt = null;
        merged.buzzerBeaterWindowSettling = false;
        if (merged.hockeyGoalHornHome === undefined) merged.hockeyGoalHornHome = null;
        if (merged.hockeyGoalHornAway === undefined) merged.hockeyGoalHornAway = null;
        if (!merged.nhlHornOffsets) merged.nhlHornOffsets = {};
        // Never restore transient overlay flags from a previous session.
        merged.hornPlaying = false;
        merged.gameOverCelebration = null;
        merged.finalCountdownPromptVisible = false;
        merged.finalCountdownPromptShownThisGame = false;
        return merged;
      },
    },
  ),
);

export function getElapsedMs(timer: TimerState): number {
  const base = timer.accumulatedMs;
  if (!timer.running || timer.runStartedAt == null) return base;
  return base + (Date.now() - timer.runStartedAt);
}

export function getShotClockElapsed(sc: ShotClockState): number {
  const base = sc.accumulatedMs;
  if (!sc.running || sc.runStartedAt == null) return base;
  return base + (Date.now() - sc.runStartedAt);
}

export function getShotClockSeconds(sc: ShotClockState): number {
  const total = sc.durationSeconds * 1000;
  const rem = Math.max(0, total - getShotClockElapsed(sc));
  return Math.ceil(rem / 1000);
}

export function formatClockFromMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getDisplaySeconds(timer: TimerState): number {
  const total = timer.countdownFromSeconds * 1000;
  const rem = Math.max(0, total - getElapsedMs(timer));
  return Math.ceil(rem / 1000);
}

/** @deprecated kept for compatibility — audio engine now handles SFX via store actions */
export function playScoreChime(_hype: boolean) {
  void _hype;
}
