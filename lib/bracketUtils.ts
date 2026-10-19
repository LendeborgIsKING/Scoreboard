import type { BracketFormat, BracketMatch, BracketState } from "./types";

export function generateSingleElimBracket(
  teams: string[],
  teamCount: 4 | 8,
): BracketMatch[] {
  const matches: BracketMatch[] = [];
  for (let i = 0; i < teamCount / 2; i++) {
    matches.push({
      id: `r1-m${i}`,
      round: 1,
      position: i,
      teamA: teams[i * 2] || `Team ${i * 2 + 1}`,
      teamB: teams[i * 2 + 1] || `Team ${i * 2 + 2}`,
      winner: null,
      bracketSide: "winners",
    });
  }
  for (let i = 0; i < teamCount / 4; i++) {
    matches.push({
      id: `r2-m${i}`,
      round: 2,
      position: i,
      teamA: null,
      teamB: null,
      winner: null,
      bracketSide: "winners",
    });
  }
  if (teamCount === 8) {
    matches.push({
      id: `r3-m0`,
      round: 3,
      position: 0,
      teamA: null,
      teamB: null,
      winner: null,
      bracketSide: "winners",
    });
  }
  return matches;
}

/** 8-team double elimination: winners + losers brackets + grand final */
export function generateDoubleElimBracket(teams: string[]): BracketMatch[] {
  const names = teams.length >= 8 ? teams : Array.from({ length: 8 }, (_, i) => teams[i] || `Team ${i + 1}`);
  const matches: BracketMatch[] = [];

  // Winners bracket round 1 (4 matches)
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `w-r1-m${i}`,
      round: 1,
      position: i,
      teamA: names[i * 2],
      teamB: names[i * 2 + 1],
      winner: null,
      bracketSide: "winners",
    });
  }
  // Winners bracket round 2 (2 matches)
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `w-r2-m${i}`,
      round: 2,
      position: i,
      teamA: null,
      teamB: null,
      winner: null,
      bracketSide: "winners",
    });
  }
  // Winners bracket final
  matches.push({
    id: `w-r3-m0`,
    round: 3,
    position: 0,
    teamA: null,
    teamB: null,
    winner: null,
    bracketSide: "winners",
  });

  // Losers bracket round 1 (2 matches — losers from W-R1 pairs)
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `l-r1-m${i}`,
      round: 1,
      position: i,
      teamA: null,
      teamB: null,
      winner: null,
      bracketSide: "losers",
    });
  }
  // Losers bracket round 2 (2 matches)
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `l-r2-m${i}`,
      round: 2,
      position: i,
      teamA: null,
      teamB: null,
      winner: null,
      bracketSide: "losers",
    });
  }
  // Losers bracket round 3
  matches.push({
    id: `l-r3-m0`,
    round: 3,
    position: 0,
    teamA: null,
    teamB: null,
    winner: null,
    bracketSide: "losers",
  });
  // Losers bracket final
  matches.push({
    id: `l-r4-m0`,
    round: 4,
    position: 0,
    teamA: null,
    teamB: null,
    winner: null,
    bracketSide: "losers",
  });
  // Grand final
  matches.push({
    id: `gf-m0`,
    round: 5,
    position: 0,
    teamA: null,
    teamB: null,
    winner: null,
    bracketSide: "winners",
  });

  return matches;
}

export function advanceBracketWinner(
  bracket: BracketState,
  matchId: string,
  winnerSide: "a" | "b",
  scoreA?: number,
  scoreB?: number,
): BracketState {
  const match = bracket.matches.find((m) => m.id === matchId);
  if (!match) return bracket;

  const winnerName = winnerSide === "a" ? match.teamA : match.teamB;
  const loserName = winnerSide === "a" ? match.teamB : match.teamA;
  if (!winnerName) return bracket;

  const nextMatches = bracket.matches.map((m) =>
    m.id === matchId
      ? { ...m, winner: winnerSide, scoreA, scoreB }
      : { ...m },
  );

  if (bracket.format === "single") {
    advanceSingleElim(nextMatches, match, winnerName);
  } else {
    advanceDoubleElim(nextMatches, match, winnerName, loserName);
  }

  return { ...bracket, matches: nextMatches, activeMatchId: null };
}

function advanceSingleElim(
  matches: BracketMatch[],
  match: BracketMatch,
  winnerName: string,
) {
  const nextRound = match.round + 1;
  const nextPos = Math.floor(match.position / 2);
  const isTeamA = match.position % 2 === 0;
  const target = matches.find(
    (m) => m.round === nextRound && m.position === nextPos,
  );
  if (!target) return;
  if (isTeamA) target.teamA = winnerName;
  else target.teamB = winnerName;
}

function advanceDoubleElim(
  matches: BracketMatch[],
  match: BracketMatch,
  winnerName: string,
  loserName: string | null,
) {
  const side = match.bracketSide ?? "winners";

  if (match.id === "gf-m0") return;

  if (side === "winners") {
    if (match.round === 1) {
      // Winner advances in winners bracket; loser drops to losers R1
      const wNextPos = Math.floor(match.position / 2);
      const wTarget = matches.find(
        (m) =>
          m.bracketSide === "winners" &&
          m.round === 2 &&
          m.position === wNextPos,
      );
      if (wTarget) {
        if (match.position % 2 === 0) wTarget.teamA = winnerName;
        else wTarget.teamB = winnerName;
      }
      if (loserName) {
        const lPos = Math.floor(match.position / 2);
        const lTarget = matches.find(
          (m) =>
            m.bracketSide === "losers" &&
            m.round === 1 &&
            m.position === lPos,
        );
        if (lTarget) {
          if (match.position % 2 === 0) lTarget.teamA = loserName;
          else lTarget.teamB = loserName;
        }
      }
    } else if (match.round === 2 && match.bracketSide === "winners") {
      const wTarget = matches.find(
        (m) => m.id === "w-r3-m0",
      );
      if (wTarget) {
        if (match.position === 0) wTarget.teamA = winnerName;
        else wTarget.teamB = winnerName;
      }
      if (loserName) {
        const lTarget = matches.find(
          (m) =>
            m.bracketSide === "losers" &&
            m.round === 2 &&
            m.position === match.position,
        );
        if (lTarget) {
          if (match.position === 0) lTarget.teamB = loserName;
          else lTarget.teamA = loserName;
        }
      }
    } else if (match.id === "w-r3-m0") {
      const gf = matches.find((m) => m.id === "gf-m0");
      if (gf) gf.teamA = winnerName;
      if (loserName) {
        const lf = matches.find((m) => m.id === "l-r4-m0");
        if (lf) lf.teamB = loserName;
      }
    }
  } else {
    // Losers bracket progression
    if (match.round === 1) {
      const target = matches.find(
        (m) =>
          m.bracketSide === "losers" &&
          m.round === 2 &&
          m.position === match.position,
      );
      if (target) target.teamB = winnerName;
    } else if (match.round === 2) {
      const target = matches.find((m) => m.id === "l-r3-m0");
      if (target) {
        if (match.position === 0) target.teamA = winnerName;
        else target.teamB = winnerName;
      }
    } else if (match.id === "l-r3-m0") {
      const target = matches.find((m) => m.id === "l-r4-m0");
      if (target) target.teamA = winnerName;
    } else if (match.id === "l-r4-m0") {
      const gf = matches.find((m) => m.id === "gf-m0");
      if (gf) gf.teamB = winnerName;
    }
  }
}

export function pairKey(i: number, j: number): string {
  return i < j ? `${i}-${j}` : `${j}-${i}`;
}

export function buildRoundRobinResults(
  teamCount: number,
): Record<string, { scoreA: number; scoreB: number; played: boolean }> {
  const results: Record<string, { scoreA: number; scoreB: number; played: boolean }> = {};
  for (let i = 0; i < teamCount; i++) {
    for (let j = i + 1; j < teamCount; j++) {
      results[pairKey(i, j)] = { scoreA: 0, scoreB: 0, played: false };
    }
  }
  return results;
}
