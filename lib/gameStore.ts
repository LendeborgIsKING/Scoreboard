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
  gatePreGamePrefs,
  hasFeature,
  resolveActiveVariant,
  resolveSportConfig,
} from "./sportRegistry";
import {
  BASKETBALL_SCORE_SFX_SRC,
  playSfx,
  playSfxClip,
  speakAnnouncement,
  setMusic as setAudioMusic,
  setMusicVolume,
  setCrowdIntensity as setAudioCrowdIntensity,
  setSfxVolume,
  stopActiveSfxClip,
  vibrate,
} from "./audio";
import { stopYouTubeVideo } from "./youtubePlayer";
import { advanceBracketWinner, pairKey } from "./bracketUtils";
import { DEFAULT_HOCKEY_TOGGLES } from "./hockeyDefaults";
import { shootoutWinnerAfterShot } from "./shootoutUtils";

function playScoreSound(id: ScoreSoundId) {
  switch (id) {
    case "swish":
      playSfxClip(BASKETBALL_SCORE_SFX_SRC);
      break;
    case "horn":
      playSfxClip("/sfx/nba-horn.mp3");
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

type HornStoreSlice = {
  sfxEnabled: boolean;
  hockeyGoalHornHome: string | null;
  hockeyGoalHornAway: string | null;
  nhlHornOffsets: Record<string, number>;
  scoreSoundId: ScoreSoundId;
};

type HornStoreSet = (partial: { hornPlaying: boolean }) => void;

/** NHL team horn for the scoring side, or default horn if none assigned. */
function playHockeyGoalHornForTeam(
  team: TeamId,
  state: HornStoreSlice,
  set: HornStoreSet,
) {
  if (!state.sfxEnabled) return;

  const hornTeamId =
    team === "a" ? state.hockeyGoalHornHome : state.hockeyGoalHornAway;
  const clearHornFlag = () => set({ hornPlaying: false });
  set({ hornPlaying: true });
  if (hornTeamId) {
    const hornTeam = NHL_TEAMS.find((t) => t.id === hornTeamId);
    if (hornTeam) {
      const start =
        state.nhlHornOffsets[hornTeamId] ?? hornTeam.defaultStart;
      const end = start + hornTeam.defaultDuration;
      playSfxClip(NHL_HORN_SRC, start, end, { onEnded: clearHornFlag });
    } else {
      playSfxClip("/sfx/nba-horn.mp3", 0, undefined, { onEnded: clearHornFlag });
    }
  } else {
    playSfxClip("/sfx/nba-horn.mp3", 0, undefined, { onEnded: clearHornFlag });
  }
}

function playShootoutScoredSfx(
  team: TeamId,
  sport: import("./types").ShootoutSport,
  state: HornStoreSlice,
  set: HornStoreSet,
) {
  if (!state.sfxEnabled) return;

  if (sport === "hockey") {
    playHockeyGoalHornForTeam(team, state, set);
    return;
  }

  if (state.scoreSoundId === "horn") {
    playSfxClip("/sfx/nba-horn.mp3");
  } else if (
    state.scoreSoundId !== "none" &&
    state.scoreSoundId !== "default"
  ) {
    playScoreSound(state.scoreSoundId);
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
  customTimerFormat?: import("./types").CustomTimerFormat | null,
): TimerState {
  const cfg = resolveSportConfig(sportId, customSport);
  const v = resolveActiveVariant(cfg, timerVariantId, customTimerFormat);
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
    /** Set when the game was decided by a shootout */
    shootoutScoreA?: number;
    shootoutScoreB?: number;
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
  announcerEnabled: boolean;
  youtubeVideoId: string | null;
  jumbotron: import("./types").JumbotronState | null;
  bracket: import("./types").BracketState | null;
  roundRobin: import("./types").RoundRobinState | null;
  shootout: import("./types").ShootoutState | null;
  refereeTimer: import("./types").RefereeTimerState | null;
  stoppageTime: import("./types").StoppageTimeState;
  introSequence: import("./types").IntroSequenceState | null;
  pitchCountA: number;
  pitchCountB: number;
  teamChantA: string;
  teamChantB: string;
  crowdIntensity: number;
  ledScoreAnimation: boolean;
  preGameSetup: import("./types").PreGameSetupPrefs;
  hockeyToggles: import("./types").HockeyFeatureToggles;
  hockeyPenalties: import("./types").HockeyPenalty[];
  hockeyDelayedTeam: TeamId | null;
  hockeyShotsA: number;
  hockeyShotsB: number;
  hockeyLastGoal: import("./types").HockeyLastGoal | null;
  hockeyGoalCelebrationKey: number;
  hockeyNextGoalEmptyNet: boolean;
  puckDrop: import("./types").PuckDropState | null;
  puckDropDelaySeconds: number;
  customTimerFormat: import("./types").CustomTimerFormat;
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
  setAnnouncerEnabled: (v: boolean) => void;
  setYoutubeVideoId: (id: string | null) => void;
  setJumbotron: (jumbo: import("./types").JumbotronState | null) => void;
  setBracket: (bracket: import("./types").BracketState | null) => void;
  setRoundRobin: (rr: import("./types").RoundRobinState | null) => void;
  applyPreGameSetup: (prefs: import("./types").PreGameSetupPrefs) => void;
  startIntroSequence: () => void;
  advanceIntroSequence: () => void;
  dismissIntroSequence: () => void;
  startShootout: (sport: import("./types").ShootoutSport) => void;
  recordShootoutShot: (scored: boolean) => void;
  endShootout: () => void;
  startRefereeTimer: (seconds: number, label: string) => void;
  dismissRefereeTimer: () => void;
  setStoppageEnabled: (v: boolean) => void;
  addStoppageSeconds: (sec: number) => void;
  startStoppageClock: () => void;
  pauseStoppageClock: () => void;
  resetStoppageClock: () => void;
  adjustPitchCount: (team: TeamId, delta: number) => void;
  resetPitchCounts: () => void;
  setTeamChant: (team: TeamId, chant: string) => void;
  setCrowdIntensity: (v: number) => void;
  setLedScoreAnimation: (v: boolean) => void;
  autoAdvanceTournament: (winnerSide: TeamId) => void;
  recordRoundRobinResult: (winnerSide: TeamId | "tie") => void;
  setHockeyToggle: (
    key: keyof import("./types").HockeyFeatureToggles,
    v: boolean,
  ) => void;
  setPuckDropDelaySeconds: (sec: number) => void;
  addHockeyPenalty: (team: TeamId, minutes: 2 | 5) => void;
  clearHockeyPenalties: () => void;
  setHockeyDelayedTeam: (team: TeamId | null) => void;
  adjustHockeyShots: (team: TeamId, delta: number) => void;
  setHockeyNextGoalEmptyNet: (v: boolean) => void;
  dismissHockeyGoalCelebration: () => void;
  tickHockey: () => void;
  applyHockeyOvertimeSeconds: (seconds: number) => void;
  startHockeyIntermission: (minutes: number) => void;
  setCustomTimerFormat: (format: import("./types").CustomTimerFormat) => void;
};

const defaultPreGameSetup: import("./types").PreGameSetupPrefs = {
  teamAName: "HOME",
  teamBName: "AWAY",
  teamAColor: "#22c55e",
  teamBColor: "#3b82f6",
  periodMinutes: 12,
  periodSecondsRemainder: 0,
  totalPeriods: 4,
  targetScoreEnabled: false,
  targetScore: 21,
  shotClockEnabled: false,
  shotClockSeconds: 24,
  introSequenceEnabled: false,
  stoppageTimeEnabled: false,
  defaultStoppageAdd: 3,
};

const initialStoppageTime: import("./types").StoppageTimeState = {
  enabled: false,
  addedSeconds: 0,
  running: false,
  runStartedAt: null,
  accumulatedMs: 0,
};

const initialShotClock: ShotClockState = {
  enabled: false,
  running: false,
  runStartedAt: null,
  accumulatedMs: 0,
  durationSeconds: 24,
};

let bannerCounter = 0;
let lastHockeyPenaltyTickMs = 0;

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
      announcerEnabled: false,
      youtubeVideoId: null,
      jumbotron: null,
      bracket: null,
      roundRobin: null,
      shootout: null,
      refereeTimer: null,
      stoppageTime: initialStoppageTime,
      introSequence: null,
      pitchCountA: 0,
      pitchCountB: 0,
      teamChantA: "",
      teamChantB: "",
      crowdIntensity: 0.4,
      ledScoreAnimation: true,
      preGameSetup: defaultPreGameSetup,
      hockeyToggles: { ...DEFAULT_HOCKEY_TOGGLES },
      hockeyPenalties: [],
      hockeyDelayedTeam: null,
      hockeyShotsA: 0,
      hockeyShotsB: 0,
      hockeyLastGoal: null,
      hockeyGoalCelebrationKey: 0,
      hockeyNextGoalEmptyNet: false,
      puckDrop: null,
      puckDropDelaySeconds: 4,
      customTimerFormat: { periodSeconds: 12 * 60, regulationPeriods: 4 },

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
        const prev = get();
        set({
          sportId: id,
          timerVariantId: vid,
          period: 1,
          timer: defaultTimerForSport(id, get().customSport, vid),
          shotClock: { ...prev.shotClock, enabled: false, running: false },
          stoppageTime: { ...initialStoppageTime, enabled: false },
          targetScoreEnabled: false,
          shootout: null,
          refereeTimer: null,
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
        const { sportId, customSport, period, customTimerFormat } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const cap = effectiveMaxPeriods(cfg, variantId, customTimerFormat);
        set({
          timerVariantId: variantId,
          period: cap != null ? Math.min(period, cap) : period,
          timer: defaultTimerForSport(
            sportId,
            customSport,
            variantId,
            customTimerFormat,
          ),
        });
      },

      setCustomTimerFormat: (format) => {
        const periodSeconds = Math.max(0, format.periodSeconds);
        const regulationPeriods = Math.max(1, Math.min(20, format.regulationPeriods));
        const normalized = { periodSeconds, regulationPeriods };
        set({ customTimerFormat: normalized });
        if (get().timerVariantId === "custom") {
          set((state) => ({
            period: Math.min(state.period, regulationPeriods),
            timer: {
              ...state.timer,
              countdownFromSeconds: periodSeconds,
              accumulatedMs: 0,
              running: false,
              runStartedAt: null,
            },
          }));
        }
      },

      applyOfficialPeriodTimer: () => {
        get().pushUndo();
        const { sportId, customSport, timerVariantId, customTimerFormat } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const v = resolveActiveVariant(cfg, timerVariantId, customTimerFormat);
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
        const { sportId, customSport, timerVariantId, customTimerFormat } = get();
        const cfg = resolveSportConfig(sportId, customSport);
        const v = resolveActiveVariant(cfg, timerVariantId, customTimerFormat);
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
          
          if (get().announcerEnabled && action.value > 0) {
            const teamName = team === "a" ? get().teamA.name : get().teamB.name;
            const chant = team === "a" ? get().teamChantA : get().teamChantB;
            if (chant?.trim()) {
              speakAnnouncement(chant.trim());
            } else {
              const flavor = action.value >= 3 ? "for three!" : "scores!";
              speakAnnouncement(`${teamName} ${flavor}`);
            }
          }

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
                96.25,
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
            playHockeyGoalHornForTeam(team, get(), set);
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
              effectiveMaxPeriods(
                cfgNow,
                timerVariantId,
                get().customTimerFormat,
              ) ?? cfgNow.maxPeriods;
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

        if (sportId === "hockey" && action.value > 0) {
          const {
            hockeyToggles,
            hockeyNextGoalEmptyNet,
            period,
            timer,
            teamA,
            teamB,
          } = get();
          const clockLabel = formatClockFromMs(
            Math.max(0, timer.countdownFromSeconds * 1000 - getElapsedMs(timer)),
          );
          const teamName = team === "a" ? teamA.name : teamB.name;
          const emptyNet =
            hockeyToggles.emptyNetGoals && hockeyNextGoalEmptyNet;
          set({
            hockeyDelayedTeam: null,
            hockeyNextGoalEmptyNet: false,
            ...(hockeyToggles.shotsOnGoal
              ? {
                  hockeyShotsA:
                    team === "a" ? get().hockeyShotsA + 1 : get().hockeyShotsA,
                  hockeyShotsB:
                    team === "b" ? get().hockeyShotsB + 1 : get().hockeyShotsB,
                }
              : {}),
            ...(hockeyToggles.lastGoalTicker
              ? {
                  hockeyLastGoal: {
                    team,
                    teamName,
                    period,
                    clockLabel,
                    emptyNet,
                  },
                }
              : {}),
            ...(hockeyToggles.goalCelebration
              ? { hockeyGoalCelebrationKey: get().hockeyGoalCelebrationKey + 1 }
              : {}),
          });
          if (emptyNet && bannersEnabled) {
            bannerCounter += 1;
            set({
              banner: {
                id: bannerCounter,
                text: "GOAL!",
                subtext: `${teamName} — EMPTY NET`,
                flavor: "score",
              },
            });
          }
        }
      },

      triggerGameOver: () => {
        const { teamA, teamB, gameOverCelebration } = get();
        if (gameOverCelebration) return;
        if (teamA.score === teamB.score) return;
        const winnerSide: "a" | "b" = teamA.score > teamB.score ? "a" : "b";
        const winnerName = winnerSide === "a" ? teamA.name : teamB.name;
        if (get().announcerEnabled) {
          speakAnnouncement(`Game over! ${winnerName} wins!`);
        }
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
        get().autoAdvanceTournament(winnerSide);
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
        if (delta < 0 && get().announcerEnabled) {
          const teamName = team === "a" ? get().teamA.name : get().teamB.name;
          speakAnnouncement(`Timeout, ${teamName}`);
        }
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
      setTargetScoreEnabled: (v) =>
        set((s) => {
          const cfg = resolveSportConfig(s.sportId, s.customSport);
          if (!hasFeature(cfg, "targetScore")) return s;
          return { targetScoreEnabled: v };
        }),
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
        const { customTimerFormat } = get();
        const max =
          effectiveMaxPeriods(cfg, timerVariantId, customTimerFormat) ??
          cfg.maxPeriods;
        const nextPeriodNum = max ? Math.min(period + 1, max) : period + 1;
        if (get().announcerEnabled) {
          const cfgNow = resolveSportConfig(sportId, customSport);
          const varNow = resolveActiveVariant(
            cfgNow,
            timerVariantId,
            customTimerFormat,
          );
          const pLabel = varNow?.periodLabel ?? cfgNow.periodLabel;
          speakAnnouncement(`Starting ${pLabel} ${nextPeriodNum}`);
        }
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
        const { sportId, hockeyToggles, puckDropDelaySeconds, puckDrop } = get();
        if (puckDrop) return;
        if (
          sportId === "hockey" &&
          hockeyToggles.puckDropDelay &&
          puckDropDelaySeconds > 0
        ) {
          set({
            puckDrop: {
              startsAt: Date.now() + puckDropDelaySeconds * 1000,
            },
          });
          return;
        }
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
          effectiveMaxPeriods(cfg, timerVariantId, get().customTimerFormat) ??
          cfg.maxPeriods;
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
            if (sfxEnabled) playSfxClip("/sfx/nba-horn.mp3");
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
        set((state) => {
          const cfg = resolveSportConfig(state.sportId, state.customSport);
          if (!hasFeature(cfg, "shotClock")) return state;
          return { shotClock: { ...state.shotClock, enabled: v } };
        }),

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
          stopYouTubeVideo();
        }
      },

      setMusicTrack: (t) => {
        set({ musicTrack: t });
        if (t !== "youtube") {
          set({ youtubeVideoId: null });
          stopYouTubeVideo();
        }
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
        stopYouTubeVideo();
        set({ musicEnabled: false, youtubeVideoId: null, musicTrack: "none" });
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
        const variant = resolveActiveVariant(
          cfg,
          timerVariantId,
          get().customTimerFormat,
        );
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

      setAnnouncerEnabled: (v) => set({ announcerEnabled: v }),
      setYoutubeVideoId: (id) => {
        if (!id) stopYouTubeVideo();
        set({ youtubeVideoId: id });
      },
      setJumbotron: (jumbo) => set({ jumbotron: jumbo }),
      setBracket: (bracket) => set({ bracket }),

      setRoundRobin: (rr) => set({ roundRobin: rr }),

      applyPreGameSetup: (prefs) => {
        const cfg = resolveSportConfig(get().sportId, get().customSport);
        const gated = gatePreGamePrefs(cfg, prefs);
        const periodSec =
          gated.periodMinutes * 60 + gated.periodSecondsRemainder;
        const customTimerFormat = {
          periodSeconds: periodSec,
          regulationPeriods: gated.totalPeriods,
        };
        set({
          preGameSetup: gated,
          customTimerFormat,
          teamA: {
            ...get().teamA,
            name: gated.teamAName || "HOME",
            color: gated.teamAColor,
          },
          teamB: {
            ...get().teamB,
            name: gated.teamBName || "AWAY",
            color: gated.teamBColor,
          },
          targetScoreEnabled: gated.targetScoreEnabled,
          targetScore: gated.targetScore,
          shotClock: {
            ...get().shotClock,
            enabled: gated.shotClockEnabled,
            durationSeconds: gated.shotClockSeconds,
          },
          stoppageTime: {
            ...initialStoppageTime,
            enabled: gated.stoppageTimeEnabled,
            addedSeconds: gated.defaultStoppageAdd * 60,
          },
          timer: {
            ...get().timer,
            countdownFromSeconds: periodSec,
            accumulatedMs: 0,
            running: false,
            runStartedAt: null,
          },
          period: 1,
          pitchCountA: 0,
          pitchCountB: 0,
        });
        if (prefs.introSequenceEnabled) {
          get().startIntroSequence();
        }
      },

      startIntroSequence: () =>
        set({
          introSequence: {
            active: true,
            phase: "teamA",
            startedAt: Date.now(),
          },
        }),

      advanceIntroSequence: () => {
        const intro = get().introSequence;
        if (!intro?.active) return;
        const next =
          intro.phase === "teamA"
            ? "teamB"
            : intro.phase === "teamB"
              ? "versus"
              : "done";
        if (next === "done") {
          set({ introSequence: null });
        } else {
          set({ introSequence: { ...intro, phase: next } });
        }
      },

      dismissIntroSequence: () => set({ introSequence: null }),

      startShootout: (sport) => {
        const cfg = resolveSportConfig(get().sportId, get().customSport);
        if (sport === "hockey" && cfg.id !== "hockey") return;
        if (sport === "soccer" && cfg.id !== "soccer") return;
        set({
          shootout: {
            active: true,
            sport,
            shots: [],
            teamAScore: 0,
            teamBScore: 0,
            nextTeam: "a",
          },
        });
      },

      recordShootoutShot: (scored) => {
        const so = get().shootout;
        if (!so?.active) return;
        const shootingTeam = so.nextTeam;
        const shots = [...so.shots, { team: shootingTeam, scored }];
        let teamAScore = so.teamAScore;
        let teamBScore = so.teamBScore;
        if (scored) {
          if (shootingTeam === "a") teamAScore++;
          else teamBScore++;
          playShootoutScoredSfx(shootingTeam, so.sport, get(), set);
        }
        const nextTeam: TeamId = shootingTeam === "a" ? "b" : "a";
        const updated = {
          ...so,
          shots,
          teamAScore,
          teamBScore,
          nextTeam,
        };
        const winner = shootoutWinnerAfterShot(updated);
        if (winner) {
          const { teamA, teamB, announcerEnabled } = get();
          const winnerName = winner === "a" ? teamA.name : teamB.name;
          if (announcerEnabled) {
            speakAnnouncement(`${winnerName} wins the shootout!`);
          }
          get().pauseTimer();
          set((state) => ({
            shootout: null,
            gameOverCelebration: {
              winnerSide: winner,
              winnerName,
              loserName: winner === "a" ? teamB.name : teamA.name,
              finalScoreA: teamA.score,
              finalScoreB: teamB.score,
              shootoutScoreA: teamAScore,
              shootoutScoreB: teamBScore,
            },
            confettiKey: state.confettiKey + 1,
          }));
          get().autoAdvanceTournament(winner);
          return;
        }
        set({ shootout: updated });
      },

      endShootout: () => set({ shootout: null }),

      startRefereeTimer: (seconds, label) => {
        const cfg = resolveSportConfig(get().sportId, get().customSport);
        if (!hasFeature(cfg, "refereeTimers")) return;
        set({
          refereeTimer: {
            active: true,
            label,
            durationSeconds: seconds,
            runStartedAt: Date.now(),
          },
        });
      },

      dismissRefereeTimer: () => set({ refereeTimer: null }),

      setStoppageEnabled: (v) =>
        set((s) => {
          const cfg = resolveSportConfig(s.sportId, s.customSport);
          if (!hasFeature(cfg, "stoppageTime")) return s;
          return { stoppageTime: { ...s.stoppageTime, enabled: v } };
        }),

      addStoppageSeconds: (sec) =>
        set((s) => ({
          stoppageTime: {
            ...s.stoppageTime,
            addedSeconds: Math.max(0, s.stoppageTime.addedSeconds + sec),
          },
        })),

      startStoppageClock: () =>
        set((s) => ({
          stoppageTime: {
            ...s.stoppageTime,
            running: true,
            runStartedAt: Date.now(),
          },
        })),

      pauseStoppageClock: () =>
        set((s) => {
          const st = s.stoppageTime;
          if (!st.running || st.runStartedAt == null) return s;
          return {
            stoppageTime: {
              ...st,
              running: false,
              accumulatedMs:
                st.accumulatedMs + (Date.now() - st.runStartedAt),
              runStartedAt: null,
            },
          };
        }),

      resetStoppageClock: () =>
        set((s) => ({
          stoppageTime: {
            ...s.stoppageTime,
            running: false,
            runStartedAt: null,
            accumulatedMs: 0,
          },
        })),

      adjustPitchCount: (team, delta) =>
        set((s) => ({
          pitchCountA:
            team === "a"
              ? Math.max(0, s.pitchCountA + delta)
              : s.pitchCountA,
          pitchCountB:
            team === "b"
              ? Math.max(0, s.pitchCountB + delta)
              : s.pitchCountB,
        })),

      resetPitchCounts: () => set({ pitchCountA: 0, pitchCountB: 0 }),

      setTeamChant: (team, chant) =>
        set(team === "a" ? { teamChantA: chant } : { teamChantB: chant }),

      setCrowdIntensity: (v) => {
        const clamped = Math.max(0, Math.min(1, v));
        set({ crowdIntensity: clamped });
        setAudioCrowdIntensity(clamped);
      },

      setLedScoreAnimation: (v) => set({ ledScoreAnimation: v }),

      autoAdvanceTournament: (winnerSide) => {
        const { bracket, roundRobin, teamA, teamB } = get();
        if (bracket?.activeMatchId) {
          const updated = advanceBracketWinner(
            bracket,
            bracket.activeMatchId,
            winnerSide,
            teamA.score,
            teamB.score,
          );
          set({ bracket: updated });
        }
        if (roundRobin?.activePairKey) {
          get().recordRoundRobinResult(winnerSide);
        }
      },

      recordRoundRobinResult: (winnerSide) => {
        const rr = get().roundRobin;
        if (!rr?.activePairKey) return;
        const key = rr.activePairKey;
        const [iStr, jStr] = key.split("-");
        const i = Number(iStr);
        const j = Number(jStr);
        const { teamA, teamB } = get();
        const result = rr.results[key];
        if (!result) return;

        const teams = rr.teams.map((t) => ({ ...t }));
        const ti = teams[i];
        const tj = teams[j];
        if (!ti || !tj) return;

        ti.played++;
        tj.played++;
        ti.goalsFor += teamA.score;
        ti.goalsAgainst += teamB.score;
        tj.goalsFor += teamB.score;
        tj.goalsAgainst += teamA.score;

        if (winnerSide === "tie") {
          ti.ties++;
          tj.ties++;
          ti.points++;
          tj.points++;
        } else if (winnerSide === "a") {
          ti.wins++;
          tj.losses++;
          ti.points += 3;
        } else {
          tj.wins++;
          ti.losses++;
          tj.points += 3;
        }

        teams.sort((a, b) => b.points - a.points || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst));

        const results = {
          ...rr.results,
          [key]: {
            scoreA: teamA.score,
            scoreB: teamB.score,
            played: true,
          },
        };

        set({
          roundRobin: {
            ...rr,
            teams,
            results,
            activePairKey: null,
          },
        });
      },

      setHockeyToggle: (key, v) =>
        set((s) => ({
          hockeyToggles: { ...s.hockeyToggles, [key]: v },
        })),

      setPuckDropDelaySeconds: (sec) =>
        set({ puckDropDelaySeconds: Math.max(0, Math.min(15, sec)) }),

      addHockeyPenalty: (team, minutes) =>
        set((s) => ({
          hockeyPenalties: [
            ...s.hockeyPenalties,
            {
              id: `p${Date.now()}`,
              team,
              remainingSeconds: minutes * 60,
            },
          ],
        })),

      clearHockeyPenalties: () => set({ hockeyPenalties: [] }),

      setHockeyDelayedTeam: (team) => set({ hockeyDelayedTeam: team }),

      adjustHockeyShots: (team, delta) =>
        set((s) => ({
          hockeyShotsA:
            team === "a"
              ? Math.max(0, s.hockeyShotsA + delta)
              : s.hockeyShotsA,
          hockeyShotsB:
            team === "b"
              ? Math.max(0, s.hockeyShotsB + delta)
              : s.hockeyShotsB,
        })),

      setHockeyNextGoalEmptyNet: (v) => set({ hockeyNextGoalEmptyNet: v }),

      dismissHockeyGoalCelebration: () =>
        set({ hockeyGoalCelebrationKey: 0 }),

      tickHockey: () => {
        const s = get();
        if (s.sportId !== "hockey") return;

        if (s.puckDrop && Date.now() >= s.puckDrop.startsAt) {
          set({
            puckDrop: null,
            timer: {
              ...s.timer,
              running: true,
              runStartedAt: Date.now(),
            },
          });
        }

        const now = Date.now();
        if (
          s.hockeyPenalties.length > 0 &&
          now - lastHockeyPenaltyTickMs >= 1000
        ) {
          lastHockeyPenaltyTickMs = now;
          const next = s.hockeyPenalties
            .map((p) => ({
              ...p,
              remainingSeconds: Math.max(0, p.remainingSeconds - 1),
            }))
            .filter((p) => p.remainingSeconds > 0);
          if (next.length !== s.hockeyPenalties.length) {
            set({ hockeyPenalties: next });
          } else {
            set({ hockeyPenalties: next });
          }
        }
      },

      applyHockeyOvertimeSeconds: (seconds) => {
        get().pushUndo();
        set((state) => ({
          timer: {
            ...state.timer,
            countdownFromSeconds: seconds,
            accumulatedMs: 0,
            running: false,
            runStartedAt: null,
          },
        }));
      },

      startHockeyIntermission: (minutes) => {
        get().startRefereeTimer(minutes * 60, "Intermission");
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
        announcerEnabled: state.announcerEnabled,
        bracket: state.bracket,
        roundRobin: state.roundRobin,
        teamChantA: state.teamChantA,
        teamChantB: state.teamChantB,
        crowdIntensity: state.crowdIntensity,
        ledScoreAnimation: state.ledScoreAnimation,
        preGameSetup: state.preGameSetup,
        hockeyToggles: state.hockeyToggles,
        puckDropDelaySeconds: state.puckDropDelaySeconds,
        customTimerFormat: state.customTimerFormat,
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
        if (typeof merged.announcerEnabled !== "boolean")
          merged.announcerEnabled = false;
        merged.youtubeVideoId = null;
        merged.jumbotron = null;
        if (!merged.bracket) merged.bracket = null;
        else if (!merged.bracket.format) merged.bracket.format = "single";
        if (merged.bracket && merged.bracket.activeMatchId === undefined)
          merged.bracket.activeMatchId = null;
        if (!merged.roundRobin) merged.roundRobin = null;
        if (!merged.preGameSetup) merged.preGameSetup = defaultPreGameSetup;
        if (typeof merged.crowdIntensity !== "number") merged.crowdIntensity = 0.4;
        if (typeof merged.ledScoreAnimation !== "boolean") merged.ledScoreAnimation = true;
        if (typeof merged.teamChantA !== "string") merged.teamChantA = "";
        if (typeof merged.teamChantB !== "string") merged.teamChantB = "";
        merged.shootout = null;
        merged.refereeTimer = null;
        merged.introSequence = null;
        merged.puckDrop = null;
        if (!merged.hockeyToggles)
          merged.hockeyToggles = { ...DEFAULT_HOCKEY_TOGGLES };
        if (typeof merged.puckDropDelaySeconds !== "number")
          merged.puckDropDelaySeconds = 4;
        if (!merged.customTimerFormat) {
          merged.customTimerFormat = {
            periodSeconds: 12 * 60,
            regulationPeriods: 4,
          };
        }
        merged.hockeyPenalties = merged.hockeyPenalties ?? [];
        merged.hockeyDelayedTeam = null;
        merged.hockeyGoalCelebrationKey = 0;
        if (!merged.stoppageTime) merged.stoppageTime = initialStoppageTime;
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
        const cfg = resolveSportConfig(
          merged.sportId ?? BASKETBALL.id,
          merged.customSport ?? null,
        );
        if (!hasFeature(cfg, "shotClock") && merged.shotClock) {
          merged.shotClock = {
            ...merged.shotClock,
            enabled: false,
            running: false,
            runStartedAt: null,
          };
        }
        if (!hasFeature(cfg, "stoppageTime")) {
          merged.stoppageTime = { ...initialStoppageTime, enabled: false };
        }
        if (!hasFeature(cfg, "targetScore")) merged.targetScoreEnabled = false;
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
