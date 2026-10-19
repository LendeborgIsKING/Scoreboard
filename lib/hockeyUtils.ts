import type { HockeyPenalty, TeamId } from "./types";

export function activePenaltiesForTeam(
  penalties: HockeyPenalty[],
  team: TeamId,
): HockeyPenalty[] {
  return penalties.filter((p) => p.team === team && p.remainingSeconds > 0);
}

/** Simplified skaters on ice (5 minus active penalties, min 3). */
export function skatersOnIce(
  penalties: HockeyPenalty[],
  team: TeamId,
): number {
  const n = activePenaltiesForTeam(penalties, team).length;
  return Math.max(3, 5 - n);
}

export function powerPlayLabel(
  penalties: HockeyPenalty[],
  teamAName: string,
  teamBName: string,
): string | null {
  const a = skatersOnIce(penalties, "a");
  const b = skatersOnIce(penalties, "b");
  if (a === b) return "EVEN";
  if (a > b) return `${teamAName} PP ${a}v${b}`;
  return `${teamBName} PP ${b}v${a}`;
}

export function formatPenaltyTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
