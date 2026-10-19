"use client";

import { useGameStore } from "@/lib/gameStore";
import type { HockeyFeatureToggles, TeamId } from "@/lib/types";
import { BoxScoreTable } from "./BasketballScoreboard";
import { MenuPanelBody } from "./MenuScrollLayout";
import { resolveSportConfig, effectiveMaxPeriods, resolveActiveVariant } from "@/lib/sportRegistry";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-white/10 px-3 py-2.5 text-left text-sm"
    >
      <span>{label}</span>
      <span className={checked ? "font-bold text-green-400" : "text-zinc-500"}>
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}

const TOGGLE_LABELS: Record<keyof HockeyFeatureToggles, string> = {
  shotsOnGoal: "Shots on goal",
  emptyNetIndicator: "Empty net indicator",
  periodBoxScore: "Period box score (settings page)",
  puckDropDelay: "Puck-drop delay before clock",
  goalCelebration: "Goal celebration flash",
  lastGoalTicker: "Last goal ticker",
};

export function HockeyPanel({
  view,
  onReturnToScoreboard,
}: {
  view: "main" | "periods";
  onReturnToScoreboard?: () => void;
}) {
  const toggles = useGameStore((s) => s.hockeyToggles);
  const setToggle = useGameStore((s) => s.setHockeyToggle);
  const puckSec = useGameStore((s) => s.puckDropDelaySeconds);
  const setPuckSec = useGameStore((s) => s.setPuckDropDelaySeconds);
  const emptyNetTeam = useGameStore((s) => s.hockeyEmptyNetTeam);
  const setEmptyNetTeam = useGameStore((s) => s.setHockeyEmptyNetTeam);
  const startShootout = useGameStore((s) => s.startShootout);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const periodScores = useGameStore((s) => s.periodScores);
  const period = useGameStore((s) => s.period);
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const timerVariantId = useGameStore((s) => s.timerVariantId);
  const customTimerFormat = useGameStore((s) => s.customTimerFormat);

  const cfg = resolveSportConfig(sportId, customSport);
  const variant = resolveActiveVariant(cfg, timerVariantId, customTimerFormat);
  const periodLabel = variant?.periodLabel ?? cfg.periodLabel;
  const maxPeriods =
    effectiveMaxPeriods(cfg, timerVariantId, customTimerFormat) ??
    cfg.maxPeriods ??
    3;

  const pickEmptyNet = (team: TeamId) => {
    setEmptyNetTeam(emptyNetTeam === team ? null : team);
    onReturnToScoreboard?.();
  };

  if (view === "periods") {
    if (!toggles.periodBoxScore) {
      return (
        <PanelShell title="Period scores">
          <p className="text-sm text-zinc-400">
            Turn on &quot;Period box score&quot; in Hockey settings to use this page.
          </p>
        </PanelShell>
      );
    }
    return (
      <PanelShell title="Period scores">
        <BoxScoreTable
          periodScores={periodScores}
          period={period}
          periodLabel={periodLabel}
          maxPeriods={maxPeriods}
          teamAName={teamA.name}
          teamBName={teamB.name}
          teamAColor={teamA.color}
          teamBColor={teamB.color}
          scoreA={teamA.score}
          scoreB={teamB.score}
        />
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Hockey">
      <p className="mb-3 text-xs text-zinc-500">
        Features stay off the scoreboard until you turn them on. Shots on goal appear centered under the clock when enabled.
      </p>

      <div className="space-y-2">
        {(Object.keys(TOGGLE_LABELS) as (keyof HockeyFeatureToggles)[]).map(
          (key) => (
            <Toggle
              key={key}
              label={TOGGLE_LABELS[key]}
              checked={toggles[key]}
              onChange={(v) => setToggle(key, v)}
            />
          ),
        )}
      </div>

      {toggles.puckDropDelay && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <label className="text-xs font-bold uppercase text-zinc-500">
            Puck-drop delay (seconds)
          </label>
          <input
            type="number"
            min={1}
            max={15}
            value={puckSec}
            onChange={(e) => setPuckSec(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-white"
          />
        </div>
      )}

      {toggles.emptyNetIndicator && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-bold">Empty net</p>
          <p className="mt-1 text-xs text-zinc-500">
            Shows an EN badge on the scoreboard for the team with the empty net. You can also tap EN under a team name during the game.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => pickEmptyNet("b")}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                emptyNetTeam === "b"
                  ? "border-amber-400 bg-amber-400/15 text-amber-300"
                  : "border-white/30 text-white hover:bg-white/10"
              }`}
            >
              {teamB.name}
            </button>
            <button
              type="button"
              onClick={() => pickEmptyNet("a")}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                emptyNetTeam === "a"
                  ? "border-amber-400 bg-amber-400/15 text-amber-300"
                  : "border-white/30 text-white hover:bg-white/10"
              }`}
            >
              {teamA.name}
            </button>
            {emptyNetTeam && (
              <button
                type="button"
                onClick={() => {
                  setEmptyNetTeam(null);
                  onReturnToScoreboard?.();
                }}
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-sky-500/30 bg-sky-950/40 p-3">
        <p className="text-sm font-bold text-sky-200">Shootout</p>
        <p className="mt-1 text-xs text-zinc-500">
          Opens a full-screen shootout tracker on the scoreboard.
        </p>
        <button
          type="button"
          onClick={() => {
            startShootout("hockey");
            onReturnToScoreboard?.();
          }}
          className="mt-3 w-full rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-500"
        >
          Start shootout
        </button>
      </div>
    </PanelShell>
  );
}

function PanelShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return <MenuPanelBody title={title}>{children}</MenuPanelBody>;
}
