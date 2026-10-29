"use client";

import { useState, type ReactNode } from "react";
import { useGameStore } from "@/lib/gameStore";
import type { BracketFormat } from "@/lib/types";
import {
  generateSingleElimBracket,
  generateDoubleElimBracket,
} from "@/lib/bracketUtils";
import { renderBracketCanvas, shareBracketImage } from "@/lib/bracketImage";
import { FitScreen } from "./MenuScrollLayout";

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
      <ScreenFrame
        title="New Bracket"
        onBack={() => setUiPhase("menu")}
        footer={
          <PrimaryButton onClick={startTournament}>Generate Bracket</PrimaryButton>
        }
      >
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3 px-5 py-4">
          <input
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            placeholder="Tournament name"
            className={`${SETUP_INPUT} text-base font-semibold`}
          />
          <div className="grid grid-cols-3 gap-2">
            <Choice active={format === "single" && teamCount === 4} onClick={() => { setFormat("single"); setTeamCount(4); }}>
              4 · Single
            </Choice>
            <Choice active={format === "single" && teamCount === 8} onClick={() => { setFormat("single"); setTeamCount(8); }}>
              8 · Single
            </Choice>
            <Choice active={format === "double-elim"} onClick={() => { setFormat("double-elim"); setTeamCount(8); }}>
              8 · Double
            </Choice>
          </div>
          <div className="grid grid-cols-2 gap-2">
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
                className={SETUP_INPUT}
              />
            ))}
          </div>
        </div>
      </ScreenFrame>
    );
  }

  if (!bracket) return null;

  const rounds = [...new Set(bracket.matches.map((m) => m.round))].sort((a, b) => a - b);

  return (
    <ScreenFrame
      title={bracket.name}
      subtitle={bracket.format === "double-elim" ? "Double Elimination" : "Single Elimination"}
      onBack={() => setUiPhase("menu")}
      backLabel="Exit"
      footer={
        <div className="flex items-center gap-3">
          <button type="button" onClick={exportPng} className="flex-1 rounded-2xl border border-white/20 py-3 text-sm font-bold hover:bg-white/5">
            Export PNG
          </button>
          <button
            type="button"
            onClick={() => { if (confirm("Reset tournament?")) { setBracket(null); setSetupMode(true); } }}
            className="px-2 text-xs font-bold uppercase tracking-widest text-red-500"
          >
            Reset
          </button>
        </div>
      }
    >
      <div className="flex w-full flex-col gap-3 px-3 py-2">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))` }}
        >
          {rounds.map((round) => {
            const roundMatches = bracket.matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.position - b.position);
            if (roundMatches.length === 0) return null;
            const label =
              bracket.format === "double-elim" && roundMatches[0]?.bracketSide === "losers"
                ? `L-R${round}`
                : roundMatches[0]?.id === "gf-m0"
                  ? "Final"
                  : `R${round}`;

            return (
              <div key={round} className="flex min-w-0 flex-col justify-around gap-2">
                <p className="text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
                {roundMatches.map((m) => {
                  const playable = m.winner === null && !!m.teamA && !!m.teamB;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!playable}
                      onClick={() => playMatch(m.id)}
                      className={`flex w-full flex-col overflow-hidden rounded-lg border text-left text-xs ${
                        playable ? "border-amber-400/70 bg-zinc-900" : "border-white/15 bg-zinc-900/70"
                      }`}
                      title={playable ? "Load into Scoreboard" : undefined}
                    >
                      <MatchSide name={m.teamA} score={m.scoreA} won={m.winner === "a"} />
                      <div className="h-px bg-white/10" />
                      <MatchSide name={m.teamB} score={m.scoreB} won={m.winner === "b"} />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p className="text-center text-[10px] text-zinc-500">
          Tap a highlighted match to play it. Winners auto-advance.
        </p>
      </div>
    </ScreenFrame>
  );
}

export const SETUP_INPUT =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-center text-white outline-none focus:border-amber-400";

function MatchSide({
  name,
  score,
  won,
}: {
  name: string | null;
  score: number | null | undefined;
  won: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-1 px-2 py-1.5 ${
        won ? "bg-amber-400/20 text-amber-300" : name ? "text-white" : "text-white/30"
      }`}
    >
      <span className="truncate font-bold">{name || "TBD"}</span>
      {score != null && <span className="font-mono">{score}</span>}
    </div>
  );
}

export function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-2 py-2.5 text-sm font-bold ${
        active ? "border-amber-400 text-amber-400" : "border-white/15 text-white/50"
      }`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl bg-amber-400 py-4 text-lg font-black uppercase text-black hover:bg-amber-300"
    >
      {children}
    </button>
  );
}

/** Header + centered fit-to-screen body + pinned footer, shared by tournament screens. */
export function ScreenFrame({
  title,
  subtitle,
  onBack,
  backLabel = "← Back",
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-black text-white">
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="justify-self-start py-2 text-sm font-semibold text-zinc-400 hover:text-white"
        >
          {backLabel}
        </button>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-[10px] uppercase tracking-widest text-zinc-500">{subtitle}</p>}
        </div>
        <span />
      </header>
      <FitScreen>{children}</FitScreen>
      {footer && (
        <div className="mx-auto w-full max-w-sm shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
          {footer}
        </div>
      )}
    </div>
  );
}

