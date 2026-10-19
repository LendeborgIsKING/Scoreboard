"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { buildRoundRobinResults, pairKey } from "@/lib/bracketUtils";
import { renderRoundRobinCanvas, shareBracketImage } from "@/lib/bracketImage";

export function RoundRobin() {
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const rr = useGameStore((s) => s.roundRobin);
  const setRoundRobin = useGameStore((s) => s.setRoundRobin);
  const setTeamName = useGameStore((s) => s.setTeamName);
  const resetScoresOnly = useGameStore((s) => s.resetScoresOnly);

  const [setupMode, setSetupMode] = useState(!rr);
  const [teamCount, setTeamCount] = useState<4 | 6 | 8>(4);
  const [teams, setTeams] = useState<string[]>(Array(8).fill(""));
  const [leagueName, setLeagueName] = useState("League");

  const startLeague = () => {
    const names = Array.from({ length: teamCount }, (_, i) =>
      teams[i]?.trim() || `Team ${i + 1}`,
    );
    setRoundRobin({
      id: Date.now().toString(),
      name: leagueName || "League",
      teams: names.map((name) => ({
        name,
        played: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      })),
      results: buildRoundRobinResults(teamCount),
      activePairKey: null,
    });
    setSetupMode(false);
  };

  const playMatch = (i: number, j: number) => {
    if (!rr) return;
    const key = pairKey(i, j);
    const result = rr.results[key];
    if (result?.played) return;
    setTeamName("a", rr.teams[i].name);
    setTeamName("b", rr.teams[j].name);
    resetScoresOnly();
    setRoundRobin({ ...rr, activePairKey: key });
    setUiPhase("game");
  };

  const exportPng = async () => {
    if (!rr) return;
    const canvas = renderRoundRobinCanvas(rr);
    await shareBracketImage(canvas, rr.name.replace(/\s+/g, "-"));
  };

  if (setupMode) {
    return (
      <div className="flex w-full flex-col bg-black px-5 py-6 pb-[env(safe-area-inset-bottom)] text-white">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-black">Round Robin</h1>
          <button
            type="button"
            onClick={() => setUiPhase("menu")}
            className="text-sm font-bold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
        <input
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          placeholder="League name"
          className="mb-4 rounded-lg border border-white/20 bg-white/5 p-3 text-white outline-none focus:border-amber-400"
        />
        <div className="mb-4 flex gap-2">
          {([4, 6, 8] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTeamCount(n)}
              className={`flex-1 rounded-xl border-2 p-2 font-bold ${teamCount === n ? "border-amber-400 text-amber-400" : "border-white/20 text-white/50"}`}
            >
              {n} Teams
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: teamCount }).map((_, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Team ${i + 1}`}
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
        <button
          type="button"
          onClick={startLeague}
          className="mt-8 rounded-full bg-amber-400 py-4 font-black uppercase text-black hover:bg-amber-300"
        >
          Start League
        </button>
      </div>
    );
  }

  if (!rr) return null;

  return (
    <div className="flex min-h-full flex-1 flex-col overflow-hidden bg-black px-5 py-6 pb-[env(safe-area-inset-bottom)] text-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">{rr.name}</h1>
        <button type="button" onClick={() => setUiPhase("menu")} className="text-sm font-bold text-zinc-400 hover:text-white">
          Exit
        </button>
      </div>

      <div className="mb-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="py-2">Team</th>
              <th>P</th><th>W</th><th>L</th><th>T</th><th>Pts</th><th>GF</th><th>GA</th>
            </tr>
          </thead>
          <tbody>
            {rr.teams.map((t, idx) => (
              <tr key={t.name} className={`border-b border-white/5 ${idx === 0 ? "text-amber-300" : ""}`}>
                <td className="py-2 font-bold">{t.name}</td>
                <td>{t.played}</td><td>{t.wins}</td><td>{t.losses}</td><td>{t.ties}</td>
                <td className="font-bold">{t.points}</td><td>{t.goalsFor}</td><td>{t.goalsAgainst}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Fixtures</h2>
        <div className="flex flex-col gap-2">
          {rr.teams.map((_, i) =>
            rr.teams.map((_, j) => {
              if (j <= i) return null;
              const key = pairKey(i, j);
              const result = rr.results[key];
              if (!result) return null;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={result.played}
                  onClick={() => playMatch(i, j)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left ${result.played ? "border-white/5 text-zinc-500" : "border-white/20 hover:bg-white/5"}`}
                >
                  <span>{rr.teams[i].name} vs {rr.teams[j].name}</span>
                  <span className="font-mono text-sm">
                    {result.played ? `${result.scoreA} - ${result.scoreB}` : "Play →"}
                  </span>
                </button>
              );
            }),
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={exportPng} className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-bold hover:bg-white/5">
          Export PNG
        </button>
        <button
          type="button"
          onClick={() => { setRoundRobin(null); setSetupMode(true); }}
          className="text-xs font-bold uppercase tracking-widest text-red-500"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
