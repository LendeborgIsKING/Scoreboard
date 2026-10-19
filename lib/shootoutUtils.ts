import type { ShootoutShot, ShootoutSport, ShootoutState, TeamId } from "./types";

/** Regulation attempts per team before sudden death */
export const SHOOTOUT_REGULATION_ATTEMPTS: Record<ShootoutSport, number> = {
  hockey: 3,
  soccer: 5,
};

export function completedRoundCount(shots: ShootoutShot[]): number {
  return Math.floor(shots.length / 2);
}

/** Round number (1-based) for the upcoming shot */
export function upcomingRound(so: ShootoutState): number {
  const n = so.shots.length;
  return so.nextTeam === "a" ? Math.floor(n / 2) + 1 : Math.ceil(n / 2);
}

export function isSuddenDeath(so: ShootoutState): boolean {
  const reg = SHOOTOUT_REGULATION_ATTEMPTS[so.sport];
  const rounds = completedRoundCount(so.shots);
  if (rounds < reg) return false;
  if (rounds > reg) return true;
  return so.shots.length >= reg * 2 && so.teamAScore === so.teamBScore;
}

export function shootoutStatusLabel(so: ShootoutState): string {
  const reg = SHOOTOUT_REGULATION_ATTEMPTS[so.sport];
  if (isSuddenDeath(so)) {
    const sdRound = completedRoundCount(so.shots) - reg + 1;
    return `Sudden death · round ${sdRound}`;
  }
  const round = upcomingRound(so);
  return `Round ${Math.min(round, reg)} of ${reg}`;
}

/**
 * NHL / FIFA-style shootout: after each pair of shots, decide if someone won.
 * Returns null if the shootout continues.
 */
export function shootoutWinnerAfterShot(so: ShootoutState): TeamId | null {
  const shots = so.shots;
  if (shots.length === 0) return null;
  const last = shots[shots.length - 1];
  if (last.team !== "b") return null;

  const round = completedRoundCount(shots);
  const reg = SHOOTOUT_REGULATION_ATTEMPTS[so.sport];
  const { teamAScore, teamBScore } = so;

  if (round < reg) return null;

  if (round === reg) {
    if (teamAScore === teamBScore) return null;
    return teamAScore > teamBScore ? "a" : "b";
  }

  const aShot = shots[shots.length - 2];
  const bShot = shots[shots.length - 1];
  if (aShot.scored && !bShot.scored) return "a";
  if (!aShot.scored && bShot.scored) return "b";
  return null;
}
