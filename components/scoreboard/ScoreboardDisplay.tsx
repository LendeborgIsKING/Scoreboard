"use client";

import { useEffect, useMemo, useState } from "react";
import { useGameStore, playScoreChime } from "@/lib/gameStore";
import {
  hasFeature,
  resolveActiveVariant,
  resolveSportConfig,
} from "@/lib/sportRegistry";
import { formatSeconds } from "@/lib/format";
import { useTimerDisplay } from "@/hooks/useTimerDisplay";
import { SettingsModal } from "./SettingsModal";

type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (orientation: "portrait" | "landscape" | "any") => Promise<void>;
  unlock?: () => void;
};

type Side = "a" | "b";

function themeClass(theme: "dark" | "neon" | "classic"): string {
  switch (theme) {
    case "neon":
      return "bg-black text-white";
    case "classic":
      return "bg-black text-white";
    default:
      return "bg-black text-white";
  }
}

export function ScoreboardDisplay() {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const timerVariantId = useGameStore((s) => s.timerVariantId);

  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const theme = useGameStore((s) => s.theme);
  const hype = useGameStore((s) => s.hypeMode);
  const presentation = useGameStore((s) => s.presentationMode);
  const timer = useGameStore((s) => s.timer);
  const period = useGameStore((s) => s.period);

  const possession = useGameStore((s) => s.possession);
  const balls = useGameStore((s) => s.balls);
  const strikes = useGameStore((s) => s.strikes);
  const outs = useGameStore((s) => s.outs);
  const down = useGameStore((s) => s.down);

  const addScore = useGameStore((s) => s.addScore);
  const adjustFouls = useGameStore((s) => s.adjustFouls);
  const adjustTimeouts = useGameStore((s) => s.adjustTimeouts);
  const setCountdownDuration = useGameStore((s) => s.setCountdownDuration);
  const startTimer = useGameStore((s) => s.startTimer);
  const pauseTimer = useGameStore((s) => s.pauseTimer);
  const resetTimer = useGameStore((s) => s.resetTimer);
  const resetGame = useGameStore((s) => s.resetGame);
  const undo = useGameStore((s) => s.undo);
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const setPresentation = useGameStore((s) => s.setPresentationMode);
  const nextPeriod = useGameStore((s) => s.nextPeriod);
  const prevPeriod = useGameStore((s) => s.prevPeriod);
  const adjustBSO = useGameStore((s) => s.adjustBSO);
  const toggleHalfInning = useGameStore((s) => s.toggleHalfInning);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const cfg = resolveSportConfig(sportId, customSport);
  const activeVariant = resolveActiveVariant(cfg, timerVariantId);
  const clockSec = useTimerDisplay();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const orientation = window.screen.orientation as ScreenOrientationWithLock;
    if (orientation.lock) {
      orientation.lock("landscape").catch(() => {
        // Browser/OS may deny lock. CSS rotation fallback still applies.
      });
    }

    return () => {
      if (orientation.unlock) {
        try {
          orientation.unlock();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const scoreActions = useMemo(() => cfg.scoring.slice(0, 4), [cfg.scoring]);

  const onScore = (team: Side, actionId: string) => {
    addScore(team, actionId);
    playScoreChime(hype);
  };

  const periodLabel = activeVariant?.periodLabel ?? cfg.periodLabel;
  const periodText = `${periodLabel} ${period}`;
  const lowTime = clockSec <= 60 && clockSec > 0;

  return (
    <div
      className={`relative flex min-h-full flex-1 flex-col items-center overflow-hidden ${themeClass(theme)}`}
    >
      <div className="flex h-full w-full flex-1 flex-col portrait:absolute portrait:left-1/2 portrait:top-1/2 portrait:h-[390px] portrait:w-[844px] portrait:-translate-x-1/2 portrait:-translate-y-1/2 portrait:rotate-90">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 pt-4 text-white">
          <div className="flex items-center gap-2">
            <CircleBtn label="M" onClick={() => setUiPhase("menu")} />
            <CircleBtn
              label={timer.running ? "||" : ">"}
              onClick={() => (timer.running ? pauseTimer() : startTimer())}
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            {!cfg.noGameClock ? (
              <button
                type="button"
                onClick={() => setCountdownDuration(timer.countdownFromSeconds)}
                className={`font-stencil text-6xl leading-none tracking-[0.08em] ${
                  lowTime ? "text-red-400" : "text-red-500"
                }`}
              >
                {formatSeconds(clockSec)}
              </button>
            ) : (
              <div className="font-stencil text-4xl text-zinc-500">--:--</div>
            )}
            <button
              type="button"
              onClick={() => nextPeriod()}
              className="text-2xl font-black text-white"
            >
              {periodText}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <CircleBtn label="U" onClick={() => undo()} />
            <CircleBtn label="R" onClick={() => resetGame()} />
          </div>
        </div>

        <div className="mt-2 grid flex-1 grid-cols-[auto_1fr_auto_1fr_auto] items-stretch gap-3 px-4 pb-2">
          <ActionColumn side="a" actions={scoreActions} onTap={onScore} />

          <section className="flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => adjustTimeouts("a", 1)}
              className="text-4xl font-black text-white"
            >
              {teamA.name} ({teamA.timeouts})
            </button>
            <ScoreDigits colorClass="text-lime-400" value={teamA.score} />
            <MiniRow
              enabled={hasFeature(cfg, "fouls")}
              value={teamA.fouls}
              onMinus={() => adjustFouls("a", -1)}
              onPlus={() => adjustFouls("a", 1)}
              title="Fouls"
            />
          </section>

          <section className="flex flex-col items-center justify-center gap-3">
            <div className="font-stencil text-8xl text-white">X</div>
            {hasFeature(cfg, "downs") && (
              <StatPill label="Down" value={String(down)} />
            )}
            {hasFeature(cfg, "ballsStrikesOuts") && (
              <div className="flex items-center gap-2 text-sm text-yellow-300">
                <button type="button" onClick={() => adjustBSO("balls", -1)} className="rounded-full border border-white/30 px-2">-</button>
                B {balls}
                <button type="button" onClick={() => adjustBSO("balls", 1)} className="rounded-full border border-white/30 px-2">+</button>
                <span className="mx-1">|</span>
                <button type="button" onClick={() => adjustBSO("strikes", -1)} className="rounded-full border border-white/30 px-2">-</button>
                S {strikes}
                <button type="button" onClick={() => adjustBSO("strikes", 1)} className="rounded-full border border-white/30 px-2">+</button>
                <span className="mx-1">|</span>
                <button type="button" onClick={() => adjustBSO("outs", -1)} className="rounded-full border border-white/30 px-2">-</button>
                O {outs}
                <button type="button" onClick={() => adjustBSO("outs", 1)} className="rounded-full border border-white/30 px-2">+</button>
              </div>
            )}
            {hasFeature(cfg, "halfInning") && (
              <button type="button" onClick={() => toggleHalfInning()} className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase text-zinc-200">
                Toggle Top/Bot
              </button>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => prevPeriod()} className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase">- {periodLabel}</button>
              <button type="button" onClick={() => nextPeriod()} className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase">+ {periodLabel}</button>
              <button type="button" onClick={() => resetTimer()} className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase">Reset Clock</button>
            </div>
          </section>

          <section className="flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => adjustTimeouts("b", 1)}
              className="text-4xl font-black text-white"
            >
              {teamB.name} ({teamB.timeouts})
            </button>
            <ScoreDigits colorClass="text-lime-400" value={teamB.score} />
            <MiniRow
              enabled={hasFeature(cfg, "fouls")}
              value={teamB.fouls}
              onMinus={() => adjustFouls("b", -1)}
              onPlus={() => adjustFouls("b", 1)}
              title="Fouls"
            />
          </section>

          <ActionColumn side="b" actions={scoreActions} onTap={onScore} />
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {cfg.name}
          {possession && <span className="ml-2 text-cyan-400">- Poss {possession === "a" ? "Home" : "Away"}</span>}
        </div>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="absolute right-3 top-3 z-20 p-0 text-white"
          aria-label="Open settings"
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current">
            <path d="M19.14 12.94a7.96 7.96 0 0 0 .05-.94 7.96 7.96 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7.3 7.3 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.96 7.96 0 0 0-.05.94c0 .32.02.63.05.94L2.82 14.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.39 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.22 1.13-.55 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z" />
          </svg>
        </button>

        {!settingsOpen && (
          <button
            type="button"
            onClick={() => setPresentation(!presentation)}
            className="absolute right-4 top-20 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] uppercase"
          >
            {presentation ? "Exit Present" : "Present"}
          </button>
        )}
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function ScoreDigits({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className={`font-stencil text-[140px] leading-[0.9] tracking-tight ${colorClass}`}>
      {value}
    </div>
  );
}

function CircleBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl font-black text-black shadow"
    >
      {label}
    </button>
  );
}

function ActionColumn({
  side,
  actions,
  onTap,
}: {
  side: Side;
  actions: { id: string; label: string; value: number }[];
  onTap: (side: Side, actionId: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-2">
      {actions.map((a) => (
        <button
          key={`${side}-${a.id}`}
          type="button"
          onClick={() => onTap(side, a.id)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-black shadow"
          title={`${a.label} (${a.value})`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

function MiniRow({
  enabled,
  value,
  onMinus,
  onPlus,
  title,
}: {
  enabled: boolean;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  title: string;
}) {
  if (!enabled) return null;
  return (
    <div className="flex items-center gap-2 text-white">
      <button type="button" onClick={onMinus} className="h-10 w-10 rounded-full bg-white text-2xl font-black text-black">-</button>
      <span className="font-stencil text-4xl text-yellow-300">{value}</span>
      <button type="button" onClick={onPlus} className="h-10 w-10 rounded-full bg-white text-2xl font-black text-black">+</button>
      <span className="ml-1 text-xs uppercase tracking-widest text-zinc-400">{title}</span>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-zinc-200">
      {label}: {value}
    </div>
  );
}
