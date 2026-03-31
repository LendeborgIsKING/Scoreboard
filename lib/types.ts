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

export type ThemeId = "dark" | "neon" | "classic";

export interface TeamState {
  name: string;
  color: string;
  score: number;
  fouls: number;
  timeouts: number;
}

export interface TimerState {
  mode: "countup" | "countdown";
  running: boolean;
  /** Wall-clock ms when current run segment started */
  runStartedAt: number | null;
  /** Ms counted before current run (excludes active segment) */
  accumulatedMs: number;
  /** Starting duration for countdown mode (seconds) */
  countdownFromSeconds: number;
}

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
