import type { SportConfig } from "./types";

export const BASKETBALL: SportConfig = {
  id: "basketball",
  name: "Basketball",
  scoring: [
    { id: "ft", label: "+1", value: 1 },
    { id: "mid", label: "+2", value: 2 },
    { id: "three", label: "+3", value: 3 },
  ],
  features: ["fouls", "timeouts", "periods", "possession"],
  periodLabel: "Quarter",
  maxPeriods: 4,
  defaultVariantId: "nba",
  timerVariants: [
    {
      id: "nba",
      label: "NBA — 4×12 min",
      periodSeconds: 12 * 60,
      regulationPeriods: 4,
      periodLabel: "Quarter",
      overtimeSeconds: 5 * 60,
      hints: [
        "Overtime: 5 min (repeat if tied).",
        "Stop-clock: fouls, timeouts, out-of-bounds.",
      ],
    },
    {
      id: "fiba",
      label: "FIBA — 4×10 min",
      periodSeconds: 10 * 60,
      regulationPeriods: 4,
      periodLabel: "Quarter",
      overtimeSeconds: 5 * 60,
      hints: ["Overtime: 5 min.", "Stop-clock on fouls, timeouts, OOB."],
    },
    {
      id: "hs",
      label: "High school — 4×8 min",
      periodSeconds: 8 * 60,
      regulationPeriods: 4,
      periodLabel: "Quarter",
      overtimeSeconds: 5 * 60,
      hints: ["Overtime: often 4 min (league-dependent).", "Stop-clock varies by state."],
    },
  ],
  rulesReference:
    "NBA / FIBA: 4 quarters — 12 min (NBA) or 10 min (FIBA). High school: 4×8 min. Overtime: typically 5 min. Clock stops on fouls, timeouts, and out-of-bounds (league rules apply).",
};

export const FOOTBALL: SportConfig = {
  id: "football",
  name: "American Football",
  scoring: [
    { id: "td", label: "TD", value: 6 },
    { id: "fg", label: "FG", value: 3 },
    { id: "pat1", label: "PAT+1", value: 1 },
    { id: "pat2", label: "2PT", value: 2 },
    { id: "safety", label: "Safety", value: 2 },
  ],
  features: ["periods", "possession", "downs"],
  periodLabel: "Quarter",
  maxPeriods: 4,
  defaultVariantId: "nfl",
  timerVariants: [
    {
      id: "nfl",
      label: "NFL / College — 4×15 min",
      periodSeconds: 15 * 60,
      regulationPeriods: 4,
      periodLabel: "Quarter",
      hints: [
        "NFL OT: sudden death / playoff rules vary.",
        "College OT: alternating 2-pt tries from 25.",
        "Clock: stops incomplete, OOB, first down (HS), etc.",
      ],
    },
    {
      id: "hs_fb",
      label: "High school — 4×12 min",
      periodSeconds: 12 * 60,
      regulationPeriods: 4,
      periodLabel: "Quarter",
      hints: ["Clock stops: OOB, incomplete, first downs (many states)."],
    },
  ],
  rulesReference:
    "NFL / College: 4 quarters × 15 min. High school: 4×12 min. Overtime: NFL sudden death (regular season rules change often); college uses alternating possessions. Clock stops on out-of-bounds, incomplete passes, and often first downs in high school.",
};

export const SOCCER: SportConfig = {
  id: "soccer",
  name: "Soccer",
  scoring: [{ id: "goal", label: "Goal", value: 1 }],
  features: ["periods"],
  periodLabel: "Half",
  maxPeriods: 2,
  timerEmphasis: true,
  defaultVariantId: "fifa",
  timerVariants: [
    {
      id: "fifa",
      label: "FIFA — 2×45 min",
      periodSeconds: 45 * 60,
      regulationPeriods: 2,
      periodLabel: "Half",
      hints: ["Stoppage time added at referee’s discretion (not on this clock)."],
    },
    {
      id: "youth",
      label: "Youth / HS — 2×40 min",
      periodSeconds: 40 * 60,
      regulationPeriods: 2,
      periodLabel: "Half",
    },
    {
      id: "extra_time",
      label: "Extra time — 2×15 min",
      periodSeconds: 15 * 60,
      regulationPeriods: 2,
      periodLabel: "ET half",
      hints: ["After full time if knockout rules require extra time."],
    },
  ],
  rulesReference:
    "FIFA standard: 2 halves × 45 min. Youth / high school often 2×40 min. Extra time: 2 halves × 15 min. Stoppage time is added by the referee and is not shown on a simple countdown.",
};

export const BASEBALL: SportConfig = {
  id: "baseball",
  name: "Baseball",
  scoring: [{ id: "run", label: "Run", value: 1 }],
  features: ["innings", "halfInning", "ballsStrikesOuts"],
  periodLabel: "Inning",
  maxPeriods: 9,
  noGameClock: true,
  defaultVariantId: "mlb",
  timerVariants: [
    {
      id: "mlb",
      label: "Standard (9 innings)",
      periodSeconds: 0,
      regulationPeriods: 9,
      periodLabel: "Inning",
      hints: ["No game clock — innings & outs.", "Extra innings until tie broken."],
    },
    {
      id: "youth_ll",
      label: "Youth / Little League (6 innings)",
      periodSeconds: 0,
      regulationPeriods: 6,
      periodLabel: "Inning",
      periodCap: 6,
      hints: ["Common youth length — confirm local rules."],
    },
  ],
  rulesReference:
    "No clock: game is by innings (9 standard MLB). Extra innings continue until the tie is broken. Youth / Little League often 6 innings. Use period as inning number.",
};

export const TENNIS: SportConfig = {
  id: "tennis",
  name: "Tennis",
  scoring: [
    { id: "pt", label: "Point", value: 1 },
    { id: "ace", label: "Ace", value: 1 },
  ],
  features: ["periods"],
  periodLabel: "Set",
  maxPeriods: 5,
  noGameClock: true,
  defaultVariantId: "bo3",
  timerVariants: [
    {
      id: "bo3",
      label: "Best of 3 sets",
      periodSeconds: 0,
      regulationPeriods: 3,
      periodLabel: "Set",
      periodCap: 3,
      hints: ["Use score as points or games in current set (your choice).", "Tiebreak: often first to 7, win by 2."],
    },
    {
      id: "bo5",
      label: "Best of 5 sets",
      periodSeconds: 0,
      regulationPeriods: 5,
      periodLabel: "Set",
      periodCap: 5,
      hints: ["Grand Slam men’s / some finals."],
    },
  ],
  rulesReference:
    "No clock: match is decided by points, games, and sets. Common formats: best of 3 sets or best of 5 sets. Tiebreakers are usually first to 7 points with a 2-point margin (varies by event).",
};

export const VOLLEYBALL: SportConfig = {
  id: "volleyball",
  name: "Volleyball",
  scoring: [{ id: "pt", label: "Rally", value: 1 }],
  features: ["periods"],
  periodLabel: "Set",
  maxPeriods: 5,
  noGameClock: true,
  defaultVariantId: "standard",
  timerVariants: [
    {
      id: "standard",
      label: "Best of 5 (25 / 25 / 25 / 25 / 15)",
      periodSeconds: 0,
      regulationPeriods: 5,
      periodLabel: "Set",
      hints: [
        "Sets 1–4: first to 25, win by 2.",
        "Set 5: first to 15, win by 2.",
        "No strict time limit — rallies count.",
      ],
    },
  ],
  rulesReference:
    "Standard indoor: best of 5 sets. Sets 1–4: first to 25 points, must win by 2. Final set (5th): first to 15, win by 2. No strict shot clock — track rallies and sets.",
};

export const HOCKEY: SportConfig = {
  id: "hockey",
  name: "Hockey",
  scoring: [{ id: "g", label: "Goal", value: 1 }],
  features: ["periods", "possession"],
  periodLabel: "Period",
  maxPeriods: 3,
  defaultVariantId: "ice",
  timerVariants: [
    {
      id: "ice",
      label: "Ice — 3×20 min",
      periodSeconds: 20 * 60,
      regulationPeriods: 3,
      periodLabel: "Period",
      hints: ["Overtime / shootouts per league rules."],
    },
    {
      id: "field",
      label: "Field — 2×35 min",
      periodSeconds: 35 * 60,
      regulationPeriods: 2,
      periodLabel: "Half",
    },
  ],
  rulesReference:
    "Ice hockey: 3 periods × 20 min. Field hockey: 2 halves × 35 min. Overtime and shootouts vary by league.",
};

export const RUGBY: SportConfig = {
  id: "rugby",
  name: "Rugby",
  scoring: [
    { id: "try", label: "Try", value: 5 },
    { id: "conv", label: "Conv", value: 2 },
    { id: "pen", label: "Pen", value: 3 },
    { id: "dg", label: "Drop", value: 3 },
  ],
  features: ["periods"],
  periodLabel: "Half",
  maxPeriods: 2,
  defaultVariantId: "union",
  timerVariants: [
    {
      id: "union",
      label: "Standard — 2×40 min",
      periodSeconds: 40 * 60,
      regulationPeriods: 2,
      periodLabel: "Half",
      overtimeSeconds: 10 * 60,
      hints: ["Extra time may be 2×10 min in knockout formats.", "Clock usually runs continuously."],
    },
    {
      id: "extra",
      label: "Extra time — 2×10 min",
      periodSeconds: 10 * 60,
      regulationPeriods: 2,
      periodLabel: "ET half",
    },
  ],
  rulesReference:
    "Standard: 2 halves × 40 min. Extra time: often 2 halves × 10 min. Clock stops rarely; play is usually continuous.",
};

export const PICKLEBALL: SportConfig = {
  id: "pickleball",
  name: "Pickleball",
  scoring: [{ id: "pt", label: "Point", value: 1 }],
  features: ["periods"],
  periodLabel: "Game",
  maxPeriods: 3,
  noGameClock: true,
  defaultVariantId: "rec",
  timerVariants: [
    {
      id: "rec",
      label: "Typical — play to 21, win by 2",
      periodSeconds: 0,
      regulationPeriods: 1,
      periodLabel: "Game",
      hints: ["No time limit — rally scoring.", "Use score as points; first to 21, must win by 2 (house rules vary)."],
    },
  ],
  rulesReference:
    "Often played to 21 points, win by 2. No time limit — rallies decide. Adjust target score in your league as needed.",
};

/** Default template for Custom mode — editable in UI */
export const CUSTOM_TEMPLATE: SportConfig = {
  id: "custom",
  name: "Custom",
  scoring: [
    { id: "c1", label: "+1", value: 1 },
    { id: "c2", label: "+2", value: 2 },
    { id: "c3", label: "+5", value: 5 },
  ],
  features: ["periods"],
  periodLabel: "Period",
};

export const PRESETS: SportConfig[] = [
  BASKETBALL,
  FOOTBALL,
  SOCCER,
  BASEBALL,
  TENNIS,
  VOLLEYBALL,
  HOCKEY,
  RUGBY,
  PICKLEBALL,
  CUSTOM_TEMPLATE,
];

export function presetById(id: string): SportConfig | undefined {
  return PRESETS.find((p) => p.id === id);
}
