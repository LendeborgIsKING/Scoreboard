import type { HockeyFeatureToggles } from "./types";

export const DEFAULT_HOCKEY_TOGGLES: HockeyFeatureToggles = {
  shotsOnGoal: false,
  emptyNetGoals: false,
  periodBoxScore: false,
  intermissionTimer: false,
  overtimePresets: false,
  puckDropDelay: false,
  goalCelebration: false,
  rinkVisual: false,
  lastGoalTicker: false,
};
