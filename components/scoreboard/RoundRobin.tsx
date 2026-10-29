"use client";

import { useState } from "react";
import { useGameStore } from "@/lib/gameStore";
import { buildRoundRobinResults, pairKey } from "@/lib/bracketUtils";
import { renderRoundRobinCanvas, shareBracketImage } from "@/lib/bracketImage";
import {
  Choice,
  PrimaryButton,
  ScreenFrame,
  SETUP_INPUT,
} from "./TournamentBracket";

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
  const [nextKey, setNextKey] = useState<string | null>(null);

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
      <ScreenFrame
        title="Round Robin"
        onBack={() => setUiPhase("menu")}
        footer={<PrimaryButton onClick={startLeague}>Start League</PrimaryButton>}
      >
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3 px-5 py-4">
          <input
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            placeholder="League name"
            className={`${SETUP_INPUT} text-base font-semibold`}
          />
          <div className="grid grid-cols-3 gap-2">
            {([4, 6, 8] as const).map((n) => (
              <Choice key={n} active={teamCount === n} onClick={() => setTeamCount(n)}>
                {n} Teams
              </Choice>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
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
                className={SETUP_INPUT}
              />
            ))}
          </div>
        </div>
      </ScreenFrame>
    );
  }

  if (!rr) return null;

  const fixtures: { i: number; j: number; key: string; played: boolean }[] = [];
  rr.teams.forEach((_, i) => {
    rr.teams.forEach((_, j) => {
      if (j <= i) return;
      const key = pairKey(i, j);
      const result = rr.results[key];
      if (result) fixtures.push({ i, j, key, played: result.played });
    });
  });
  const remaining = fixtures.filter((f) => !f.played);
  const selected =
    remaining.find((f) => f.key === nextKey) ?? remaining[0] ?? null;

  return (
    <ScreenFrame
      title={rr.name}
      subtitle={`${fixtures.length - remaining.length} of ${fixtures.length} played`}
      onBack={() => setUiPhase("menu")}
      backLabel="Exit"
      footer={
        <div className="flex items-center gap-3">
          <button type="button" onClick={exportPng} className="flex-1 rounded-2xl border border-white/20 py-3 text-sm font-bold hover:bg-white/5">
            Export PNG
          </button>
          <button
            type="button"
            onClick={() => { if (confirm("Reset league?")) { setRoundRobin(null); setSetupMode(true); } }}
            className="px-2 text-xs font-bold uppercase tracking-widest text-red-500"
          >
            Reset
          </button>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 py-2">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
              <th className="py-2 text-left">Team</th>
              <th>P</th><th>W</th><th>L</th><th>T</th><th>GD</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rr.teams.map((t, idx) => (
              <tr key={t.name} className={`border-b border-white/5 ${idx === 0 ? "text-amber-300" : ""}`}>
                <td className="max-w-[8rem] truncate py-1.5 text-left font-bold">{t.name}</td>
                <td>{t.played}</td><td>{t.wins}</td><td>{t.losses}</td><td>{t.ties}</td>
                <td>{t.goalsFor - t.goalsAgainst}</td>
                <td className="font-bold">{t.points}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {selected ? (
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Next match</span>
            <div className="flex w-full gap-2">
              <select
                value={selected.key}
                onChange={(e) => setNextKey(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-zinc-950 px-3 py-2.5 text-center font-semibold text-white"
              >
                {remaining.map((f) => (
                  <option key={f.key} value={f.key}>
                    {rr.teams[f.i].name} vs {rr.teams[f.j].name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => playMatch(selected.i, selected.j)}
                className="rounded-xl bg-amber-400 px-5 font-black uppercase text-black hover:bg-amber-300"
              >
                Play
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm font-bold text-amber-300">
            League complete — {rr.teams[0]?.name} leads the table.
          </p>
        )}
      </div>
    </ScreenFrame>
  );
}

