export type TeamId = "a" | "b";

/** Features toggled per sport preset — UI renders from this list */
export type SportFeature =
  | "fouls"
  | "timeouts"
  | "possession"
  | "periods"
  | "downs"
  | "innings"
  | "halfInning"
  | "ballsStrikesOuts";

export type ScoringAction = {
  id: string;
  label: string;
  value: number;
};

/** Regulation / format timing — drives quick “apply period” countdowns */
export type TimerVariant = {
  id: string;
  label: string;
  /** One regulation period length (seconds) for countdown presets (0 = no game clock) */
  periodSeconds: number;
  regulationPeriods: number;
  /** Quarter, Half, Period, Set (display only) */
  periodLabel: string;
  /** Overtime / extra period length (optional) */
  overtimeSeconds?: number;
  /** Short bullets for UI */
  hints?: string[];
  /** Cap period/inning counter for this format (e.g. youth baseball 6) */
  periodCap?: number;
};

export type SportConfig = {
  id: string;
  name: string;
  scoring: ScoringAction[];
  features: SportFeature[];
  periodLabel: string;
  /** If set, period cannot exceed this (e.g. 4 quarters) */
  maxPeriods?: number;
  /** Hint for timer UX (soccer: emphasize clock) */
  timerEmphasis?: boolean;
  /** Official formats & times — user picks one; IDs are stable */
  timerVariants?: TimerVariant[];
  defaultVariantId?: string;
  /** Collapsible reference (official times, clock behavior) */
  rulesReference?: string;
  /** Hide shot clock UI — use stopwatch manually or rallies only */
  noGameClock?: boolean;
};

export type ThemeId =
  | "dark"
  | "neon"
  | "classic"
  | "stadium"
  | "fire"
  | "ice"
  | "midnight"
  | "gold"
  | "court"
  | "retro"
  | "blackout";

/** Sound played when a team scores. "default" keeps per-sport behavior. */
export type ScoreSoundId =
  | "default"
  | "swish"
  | "chime"
  | "ding"
  | "horn"
  | "tada"
  | "none";

export type MusicTrackId = "none" | "hype" | "anthem" | "shuffle";

export interface ShotClockState {
  enabled: boolean;
  running: boolean;
  runStartedAt: number | null;
  accumulatedMs: number;
  durationSeconds: number;
}

export interface BannerMessage {
  id: number;
  text: string;
  subtext?: string;
  flavor?: "score" | "win" | "info" | "warn";
}

export interface GameHistoryEntry {
  id: string;
  finishedAt: number;
  sportId: string;
  sportName: string;
  periodLabel: string;
  finalPeriod: number;
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  winner: "a" | "b" | "tie";
}

export interface TeamState {
  name: string;
  color: string;
  score: number;
  fouls: number;
  timeouts: number;
  /** Optional uploaded logo as a small data URL, shown next to the name. */
  logo?: string | null;
}

export interface TimerState {
  running: boolean;
  /** Wall-clock ms when current run segment started */
  runStartedAt: number | null;
  /** Ms counted before current run (excludes active segment) */
  accumulatedMs: number;
  /** Countdown duration (seconds) */
  countdownFromSeconds: number;
}

export type UiPhase = "menu" | "setup" | "game";

export interface GameSnapshot {
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
