"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import type { BracketFormat } from "@/lib/types";
import {
  generateSingleElimBracket,
  generateDoubleElimBracket,
} from "@/lib/bracketUtils";
import { renderBracketCanvas, shareBracketImage } from "@/lib/bracketImage";

export function TournamentBracket() {
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const bracket = useGameStore((s) => s.bracket);
  const setBracket = useGameStore((s) => s.setBracket);
  const setTeamName = useGameStore((s) => s.setTeamName);
  const resetScoresOnly = useGameStore((s) => s.resetScoresOnly);

  const [setupMode, setSetupMode] = useState(!bracket);
  const [teamCount, setTeamCount] = useState<4 | 8>(8);
  const [format, setFormat] = useState<BracketFormat>("single");
  const [teams, setTeams] = useState<string[]>(Array(8).fill(""));
  const [tournamentName, setTournamentName] = useState("Tournament");

  const startTournament = () => {
    const names = Array.from({ length: teamCount }, (_, i) =>
      teams[i]?.trim() || `Team ${i + 1}`,
    );
    const matches =
      format === "double-elim" && teamCount === 8
        ? generateDoubleElimBracket(names)
        : generateSingleElimBracket(names, teamCount);

    setBracket({
      id: Date.now().toString(),
      name: tournamentName || "Tournament",
      teamCount,
      format,
      matches,
      activeMatchId: null,
    });
    setSetupMode(false);
  };

  const playMatch = (matchId: string) => {
    if (!bracket) return;
    const match = bracket.matches.find((m) => m.id === matchId);
    if (!match?.teamA || !match.teamB) return;
    setTeamName("a", match.teamA);
    setTeamName("b", match.teamB);
    resetScoresOnly();
    setBracket({ ...bracket, activeMatchId: matchId });
    setUiPhase("game");
  };

  const exportPng = async () => {
    if (!bracket) return;
    const canvas = renderBracketCanvas(bracket);
    await shareBracketImage(canvas, bracket.name.replace(/\s+/g, "-"));
  };

  if (setupMode) {
    return (
      <div className="flex min-h-full flex-1 flex-col overflow-auto bg-black px-5 py-6 pb-[env(safe-area-inset-bottom)] text-white">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-black">New Bracket</h1>
          <button type="button" onClick={() => setUiPhase("menu")} className="text-sm font-bold text-zinc-400 hover:text-white">
            Cancel
          </button>
        </div>

        <input
          value={tournamentName}
          onChange={(e) => setTournamentName(e.target.value)}
          placeholder="Tournament name"
          className="mb-4 rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-amber-400"
        />

        <div className="mb-4 flex gap-2">
          <button type="button" onClick={() => setFormat("single")} className={`flex-1 rounded-xl border-2 p-2 text-sm font-bold ${format === "single" ? "border-amber-400 text-amber-400" : "border-white/20 text-white/50"}`}>
            Single Elim
          </button>
          <button type="button" onClick={() => { setFormat("double-elim"); setTeamCount(8); }} className={`flex-1 rounded-xl border-2 p-2 text-sm font-bold ${format === "double-elim" ? "border-amber-400 text-amber-400" : "border-white/20 text-white/50"}`}>
            Double Elim (8)
          </button>
        </div>

        {format === "single" && (
          <div className="mb-4 flex gap-4">
            {([4, 8] as const).map((n) => (
              <button key={n} type="button" onClick={() => setTeamCount(n)} className={`flex-1 rounded-xl border-2 p-3 font-bold ${teamCount === n ? "border-amber-400 text-amber-400" : "border-white/20 text-white/50"}`}>
                {n} Teams
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {Array.from({ length: teamCount }).map((_, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Seed ${i + 1}`}
              value={teams[i] || ""}
              onChange={(e) => {
                const next = [...teams];
                next[i] = e.target.value;
                setTeams(next);
              }}
              className="rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-amber-400"
            />
          ))}
        </div>

        <button type="button" onClick={startTournament} className="mt-8 rounded-full bg-amber-400 py-4 font-black uppercase text-black hover:bg-amber-300">
          Generate Bracket
        </button>
      </div>
    );
  }

  if (!bracket) return null;

  const rounds = [...new Set(bracket.matches.map((m) => m.round))].sort((a, b) => a - b);

  return (
    <div className="flex min-h-full flex-1 flex-col overflow-hidden bg-black px-5 py-6 pb-[env(safe-area-inset-bottom)] text-white">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">{bracket.name}</h1>
          <p className="text-xs text-zinc-500">{bracket.format === "double-elim" ? "Double Elimination" : "Single Elimination"}</p>
        </div>
        <button type="button" onClick={() => setUiPhase("menu")} className="text-sm font-bold text-zinc-400 hover:text-white">
          Exit
        </button>
      </div>

      <div className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden pb-4">
        {rounds.map((round) => {
          const roundMatches = bracket.matches
            .filter((m) => m.round === round)
            .sort((a, b) => a.position - b.position);
          if (roundMatches.length === 0) return null;
          const label =
            bracket.format === "double-elim" && roundMatches[0]?.bracketSide === "losers"
              ? `L-R${round}`
              : roundMatches[0]?.id === "gf-m0"
                ? "Grand Final"
                : `Round ${round}`;

          return (
            <div key={round} className="flex min-w-[240px] shrink-0 snap-center flex-col justify-around border-r border-white/10 px-4 last:border-0">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
              {roundMatches.map((m) => (
                <div key={m.id} className="relative my-3 flex flex-col">
                  <div className="flex overflow-hidden rounded-xl border border-white/20 bg-zinc-900 shadow-xl">
                    <div className="flex w-full flex-col">
                      <div className={`flex items-center justify-between border-b border-white/10 p-3 ${m.winner === "a" ? "bg-amber-400/20 text-amber-300" : m.teamA ? "text-white" : "text-white/30"}`}>
                        <span className="truncate font-bold">{m.teamA || "TBD"}</span>
                        {m.scoreA != null && <span className="ml-2 font-mono text-sm">{m.scoreA}</span>}
                      </div>
                      <div className={`flex items-center justify-between p-3 ${m.winner === "b" ? "bg-amber-400/20 text-amber-300" : m.teamB ? "text-white" : "text-white/30"}`}>
                        <span className="truncate font-bold">{m.teamB || "TBD"}</span>
                        {m.scoreB != null && <span className="ml-2 font-mono text-sm">{m.scoreB}</span>}
                      </div>
                    </div>
                  </div>
                  {m.winner === null && m.teamA && m.teamB && (
                    <button
                      type="button"
                      onClick={() => playMatch(m.id)}
                      className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-amber-400 bg-black p-2 text-amber-400 shadow-lg hover:bg-amber-400 hover:text-black"
                      title="Load into Scoreboard"
                    >
                      ▶
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <p className="mb-2 text-center text-[10px] text-zinc-500">
        Winners auto-advance when a bracket game ends on the scoreboard.
      </p>

      <div className="flex shrink-0 gap-3">
        <button type="button" onClick={exportPng} className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-bold hover:bg-white/5">
          Export PNG
        </button>
        <button
          type="button"
          onClick={() => { if (confirm("Reset tournament?")) { setBracket(null); setSetupMode(true); } }}
          className="text-xs font-bold uppercase tracking-widest text-red-500"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
