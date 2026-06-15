"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { motion } from "framer-motion";

export function TournamentBracket() {
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const bracket = useGameStore((s) => s.bracket);
  const setBracket = useGameStore((s) => s.setBracket);
  const setTeamName = useGameStore((s) => s.setTeamName);
  const resetScoresOnly = useGameStore((s) => s.resetScoresOnly);

  const [setupMode, setSetupMode] = useState(!bracket);
  const [teamCount, setTeamCount] = useState<4 | 8>(8);
  const [teams, setTeams] = useState<string[]>(Array(8).fill(""));

  const startTournament = () => {
    const matches: import("@/lib/types").BracketMatch[] = [];
    const count = teamCount;
    // Round 1
    for (let i = 0; i < count / 2; i++) {
      matches.push({
        id: `r1-m${i}`,
        round: 1,
        position: i,
        teamA: teams[i * 2] || `Team ${i * 2 + 1}`,
        teamB: teams[i * 2 + 1] || `Team ${i * 2 + 2}`,
        winner: null,
      });
    }
    // Round 2 (Semifinals if 8 teams, Finals if 4 teams)
    for (let i = 0; i < count / 4; i++) {
      matches.push({
        id: `r2-m${i}`,
        round: 2,
        position: i,
        teamA: null,
        teamB: null,
        winner: null,
      });
    }
    // Round 3 (Finals if 8 teams)
    if (count === 8) {
      matches.push({
        id: `r3-m0`,
        round: 3,
        position: 0,
        teamA: null,
        teamB: null,
        winner: null,
      });
    }

    setBracket({
      id: Date.now().toString(),
      name: "Tournament",
      teamCount: count,
      matches,
    });
    setSetupMode(false);
  };

  const playMatch = (match: import("@/lib/types").BracketMatch) => {
    if (!match.teamA || !match.teamB) return;
    setTeamName("a", match.teamA);
    setTeamName("b", match.teamB);
    resetScoresOnly();
    setUiPhase("game");
  };

  const advanceWinner = (match: import("@/lib/types").BracketMatch, winnerSide: "a" | "b") => {
    if (!bracket) return;
    const winnerName = winnerSide === "a" ? match.teamA : match.teamB;
    if (!winnerName) return;

    const nextMatches = bracket.matches.map((m) => {
      if (m.id === match.id) {
        return { ...m, winner: winnerSide };
      }
      return m;
    });

    const nextRound = match.round + 1;
    const nextPos = Math.floor(match.position / 2);
    const isTeamA = match.position % 2 === 0;

    const targetIndex = nextMatches.findIndex(
      (m) => m.round === nextRound && m.position === nextPos
    );

    if (targetIndex !== -1) {
      nextMatches[targetIndex] = {
        ...nextMatches[targetIndex],
        teamA: isTeamA ? winnerName : nextMatches[targetIndex].teamA,
        teamB: !isTeamA ? winnerName : nextMatches[targetIndex].teamB,
      };
    }

    setBracket({ ...bracket, matches: nextMatches });
  };

  if (setupMode) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-black px-5 py-6 text-white pb-[env(safe-area-inset-bottom)] overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-black">New Bracket</h1>
          <button
            onClick={() => setUiPhase("menu")}
            className="text-sm font-bold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
        
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setTeamCount(4)}
            className={`flex-1 rounded-xl border-2 p-3 font-bold ${teamCount === 4 ? "border-amber-400 text-amber-400" : "border-white/20 text-white/50"}`}
          >
            4 Teams
          </button>
          <button
            onClick={() => setTeamCount(8)}
            className={`flex-1 rounded-xl border-2 p-3 font-bold ${teamCount === 8 ? "border-amber-400 text-amber-400" : "border-white/20 text-white/50"}`}
          >
            8 Teams
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: teamCount }).map((_, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Seed ${i + 1}`}
              value={teams[i] || ""}
              onChange={(e) => {
                const newT = [...teams];
                newT[i] = e.target.value;
                setTeams(newT);
              }}
              className="rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-amber-400"
            />
          ))}
        </div>

        <button
          onClick={startTournament}
          className="mt-8 rounded-full bg-amber-400 py-4 font-black uppercase text-black hover:bg-amber-300"
        >
          Generate Bracket
        </button>
      </div>
    );
  }

  if (!bracket) return null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-black px-5 py-6 text-white pb-[env(safe-area-inset-bottom)] overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black">Tournament</h1>
        <button
          onClick={() => setUiPhase("menu")}
          className="text-sm font-bold text-zinc-400 hover:text-white"
        >
          Exit
        </button>
      </div>

      <div className="flex flex-1 overflow-x-auto overflow-y-hidden pb-4 snap-x">
        {[1, 2, 3].map((round) => {
          const roundMatches = bracket.matches.filter((m) => m.round === round);
          if (roundMatches.length === 0) return null;

          return (
            <div key={round} className="flex min-w-[240px] shrink-0 snap-center flex-col justify-around px-4 border-r border-white/10 last:border-0">
              {roundMatches.map((m) => (
                <div key={m.id} className="relative flex flex-col my-4">
                  <div className="flex overflow-hidden rounded-xl border border-white/20 bg-zinc-900 shadow-xl">
                    <div className="flex w-full flex-col">
                      <div className={`flex items-center justify-between border-b border-white/10 p-3 ${m.winner === "a" ? "bg-amber-400/20 text-amber-300" : m.teamA ? "text-white" : "text-white/30"}`}>
                        <span className="font-bold truncate">{m.teamA || "TBD"}</span>
                        {m.winner === null && m.teamA && m.teamB && (
                          <button onClick={() => advanceWinner(m, "a")} className="ml-2 rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase hover:bg-white/30">Win</button>
                        )}
                      </div>
                      <div className={`flex items-center justify-between p-3 ${m.winner === "b" ? "bg-amber-400/20 text-amber-300" : m.teamB ? "text-white" : "text-white/30"}`}>
                        <span className="font-bold truncate">{m.teamB || "TBD"}</span>
                        {m.winner === null && m.teamA && m.teamB && (
                          <button onClick={() => advanceWinner(m, "b")} className="ml-2 rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase hover:bg-white/30">Win</button>
                        )}
                      </div>
                    </div>
                  </div>
                  {m.winner === null && m.teamA && m.teamB && (
                    <button
                      onClick={() => playMatch(m)}
                      className="absolute -right-3 top-1/2 -translate-y-1/2 rounded-full border border-amber-400 bg-black p-2 shadow-lg text-amber-400 hover:bg-amber-400 hover:text-black z-10"
                      title="Load into Scoreboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 shrink-0 flex justify-center">
        <button
          onClick={() => {
            if (confirm("Are you sure you want to reset the bracket?")) {
              setBracket(null);
              setSetupMode(true);
            }
          }}
          className="text-xs uppercase tracking-widest text-red-500 font-bold"
        >
          Reset Tournament
        </button>
      </div>
    </div>
  );
}
