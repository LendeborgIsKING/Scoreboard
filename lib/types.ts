export type TeamId = "a" | "b";

/** Reserved timer variant id — user-defined period length and count */
export const CUSTOM_TIMER_VARIANT_ID = "custom";

export interface CustomTimerFormat {
  periodSeconds: number;
  regulationPeriods: number;
}

/** Features toggled per sport preset — UI renders from this list */
export type SportFeature =
  | "fouls"
  | "timeouts"
  | "possession"
  | "periods"
  | "downs"
  | "innings"
  | "halfInning"
  | "ballsStrikesOuts"
  /** Basketball */
  | "shotClock"
  /** Soccer */
  | "stoppageTime"
  | "refereeTimers"
  /** Volleyball, pickleball, etc. */
  | "targetScore";

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
  /** Match clock counts elapsed time up to period length (soccer) */
  countUpClock?: boolean;
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

export type MusicTrackId = "none" | "anthem" | "shuffle" | "youtube";

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

export interface JumbotronState {
  type: "timeout" | "halftime" | "custom";
  text: string;
  subtext?: string;
  durationSeconds: number;
  runStartedAt: number;
  teamId?: TeamId | null;
}

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  teamA: string | null;
  teamB: string | null;
  winner?: "a" | "b" | null;
  /** Winners or losers side for double-elimination */
  bracketSide?: "winners" | "losers";
  /** Final score when match was played via scoreboard */
  scoreA?: number;
  scoreB?: number;
}

export type BracketFormat = "single" | "double-elim";

export interface BracketState {
  id: string;
  name: string;
  teamCount: 4 | 8;
  format: BracketFormat;
  matches: BracketMatch[];
  /** Match currently loaded in the scoreboard (for auto-advance) */
  activeMatchId: string | null;
}

export interface RoundRobinTeam {
  name: string;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface RoundRobinState {
  id: string;
  name: string;
  teams: RoundRobinTeam[];
  /** Keyed "i-j" where i < j */
  results: Record<string, { scoreA: number; scoreB: number; played: boolean }>;
  activePairKey: string | null;
}

export type ShootoutSport = "soccer" | "hockey";

export interface ShootoutShot {
  team: TeamId;
  scored: boolean | null;
}

export interface ShootoutState {
  active: boolean;
  sport: ShootoutSport;
  shots: ShootoutShot[];
  teamAScore: number;
  teamBScore: number;
  nextTeam: TeamId;
}

export interface RefereeTimerState {
  active: boolean;
  label: string;
  durationSeconds: number;
  runStartedAt: number;
}

export interface StoppageTimeState {
  enabled: boolean;
  addedSeconds: number;
  running: boolean;
  runStartedAt: number | null;
  accumulatedMs: number;
}

export interface IntroSequenceState {
  active: boolean;
  phase: "teamA" | "teamB" | "versus" | "done";
  startedAt: number;
}

export interface HockeyPenalty {
  id: string;
  team: TeamId;
  /** Seconds remaining on the penalty */
  remainingSeconds: number;
}

export interface HockeyFeatureToggles {
  shotsOnGoal: boolean;
  emptyNetIndicator: boolean;
  periodBoxScore: boolean;
  puckDropDelay: boolean;
  goalCelebration: boolean;
  lastGoalTicker: boolean;
}

export interface HockeyLastGoal {
  team: TeamId;
  teamName: string;
  period: number;
  clockLabel: string;
  emptyNet: boolean;
}

export interface PuckDropState {
  /** Wall-clock ms when the game clock should start */
  startsAt: number;
}

export interface PreGameSetupPrefs {
  teamAName: string;
  teamBName: string;
  teamAColor: string;
  teamBColor: string;
  periodMinutes: number;
  periodSecondsRemainder: number;
  totalPeriods: number;
  targetScoreEnabled: boolean;
  targetScore: number;
  shotClockEnabled: boolean;
  shotClockSeconds: number;
  introSequenceEnabled: boolean;
  stoppageTimeEnabled: boolean;
  defaultStoppageAdd: number;
  /** One OT period if regulation ends tied, then shootout if still tied (clocked sports) */
  overtimeThenShootoutEnabled: boolean;
  overtimeMinutes: number;
  overtimeSecondsRemainder: number;
  /** Soccer: enable penalty shootout tracker (5 kicks per team) */
  penaltyShootoutEnabled: boolean;
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

export type UiPhase = "menu" | "setup" | "game" | "bracket" | "round-robin" | "custom-builder";

/** Runners on first / second / third for the baseball diamond. */
export interface BaseballBases {
  first: boolean;
  second: boolean;
  third: boolean;
}

export const EMPTY_BASEBALL_BASES: BaseballBases = {
  first: false,
  second: false,
  third: false,
};

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
  baseballBases: BaseballBases;
  down: number;
  possession: TeamId | null;
  timer: TimerState;
}
