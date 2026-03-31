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
};

export const FOOTBALL: SportConfig = {
  id: "football",
  name: "Football",
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
};

export const SOCCER: SportConfig = {
  id: "soccer",
  name: "Soccer",
  scoring: [{ id: "goal", label: "Goal", value: 1 }],
  features: ["periods"],
  periodLabel: "Half",
  maxPeriods: 2,
  timerEmphasis: true,
};

export const BASEBALL: SportConfig = {
  id: "baseball",
  name: "Baseball",
  scoring: [{ id: "run", label: "Run", value: 1 }],
  features: ["innings", "halfInning", "ballsStrikesOuts"],
  periodLabel: "Inning",
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
  CUSTOM_TEMPLATE,
];

export function presetById(id: string): SportConfig | undefined {
  return PRESETS.find((p) => p.id === id);
}
