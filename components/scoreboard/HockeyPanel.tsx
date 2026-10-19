"use client";

import { useGameStore } from "@/lib/gameStore";
import type { HockeyFeatureToggles } from "@/lib/types";
import { BoxScoreTable } from "./BasketballScoreboard";
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
  emptyNetGoals: "Empty-net goals",
  periodBoxScore: "Period box score (settings page)",
  intermissionTimer: "Intermission timer",
  overtimePresets: "Overtime clock presets",
  puckDropDelay: "Puck-drop delay before clock",
  goalCelebration: "Goal celebration flash",
  rinkVisual: "Rink lines overlay",
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
  const nextEn = useGameStore((s) => s.hockeyNextGoalEmptyNet);
  const setNextEn = useGameStore((s) => s.setHockeyNextGoalEmptyNet);
  const startShootout = useGameStore((s) => s.startShootout);
  const applyOt = useGameStore((s) => s.applyHockeyOvertimeSeconds);
  const startIntermission = useGameStore((s) => s.startHockeyIntermission);
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

      {toggles.emptyNetGoals && (
        <button
          type="button"
          onClick={() => setNextEn(!nextEn)}
          className={`mt-4 w-full rounded-xl border-2 py-2 text-sm font-bold ${nextEn ? "border-amber-400 text-amber-300" : "border-white/20"}`}
        >
          Next goal counts as empty net: {nextEn ? "Yes" : "No"}
        </button>
      )}

      {toggles.intermissionTimer && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[15, 17, 18].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                startIntermission(m);
                onReturnToScoreboard?.();
              }}
              className="rounded-full border border-white/30 px-3 py-1 text-xs font-bold hover:bg-white/10"
            >
              {m} min intermission
            </button>
          ))}
        </div>
      )}

      {toggles.overtimePresets && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { sec: 300, label: "OT 5:00" },
            { sec: 600, label: "OT 10:00" },
            { sec: 240, label: "OT 4:00" },
          ].map((p) => (
            <button
              key={p.sec}
              type="button"
              onClick={() => {
                applyOt(p.sec);
                onReturnToScoreboard?.();
              }}
              className="rounded-full border border-white/30 px-3 py-1 text-xs font-bold hover:bg-white/10"
            >
              {p.label}
            </button>
          ))}
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
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[max(1.5rem,env(safe-area-inset-left))] pb-24 pt-[max(5.5rem,env(safe-area-inset-top))]">
      <h2 className="mb-4 text-2xl font-black">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
