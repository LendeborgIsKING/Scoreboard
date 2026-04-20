"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore, playScoreChime } from "@/lib/gameStore";
import {
  hasFeature,
  resolveActiveVariant,
  resolveSportConfig,
} from "@/lib/sportRegistry";
import { formatSeconds } from "@/lib/format";
import { useTimerDisplay } from "@/hooks/useTimerDisplay";
import { SettingsModal } from "./SettingsModal";
import { EditOverlay } from "./EditOverlay";
import { SportLineIcon } from "./SportLineIcons";
import { GearIcon, MenuIcon, PauseIcon, PencilIcon, PlayIcon } from "./UiIcons";

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
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const setPresentation = useGameStore((s) => s.setPresentationMode);
  const nextPeriod = useGameStore((s) => s.nextPeriod);
  const prevPeriod = useGameStore((s) => s.prevPeriod);
  const adjustBSO = useGameStore((s) => s.adjustBSO);
  const toggleHalfInning = useGameStore((s) => s.toggleHalfInning);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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
      <div className="absolute left-1/2 top-1/2 flex h-[390px] w-[844px] -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col max-sm:landscape:static max-sm:landscape:h-full max-sm:landscape:w-full max-sm:landscape:translate-x-0 max-sm:landscape:translate-y-0 max-sm:landscape:rotate-0">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-6 pt-4 text-white">
          <div className="flex items-center gap-2">
            <CircleBtn
              icon={<MenuIcon className="h-5 w-5" />}
              onClick={() => setUiPhase("menu")}
              ariaLabel="Exit to menu"
            />
            <CircleBtn
              icon={
                timer.running ? (
                  <PauseIcon className="h-5 w-5" />
                ) : (
                  <PlayIcon className="h-5 w-5" />
                )
              }
              onClick={() => (timer.running ? pauseTimer() : startTimer())}
              ariaLabel={timer.running ? "Pause clock" : "Start clock"}
            />
          </div>

          <div className="flex flex-col items-center gap-1">
            {!cfg.noGameClock ? (
              <motion.button
                type="button"
                onClick={() => setCountdownDuration(timer.countdownFromSeconds)}
                className={`font-stencil text-6xl leading-none tracking-[0.08em] ${
                  lowTime ? "text-red-400" : "text-red-500"
                }`}
                animate={
                  lowTime
                    ? { opacity: [1, 0.5, 1], scale: [1, 1.02, 1] }
                    : { opacity: 1, scale: 1 }
                }
                transition={
                  lowTime
                    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
                }
              >
                {formatSeconds(clockSec)}
              </motion.button>
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

          <div className="h-12 w-12" aria-hidden />
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
            <AnimatedScore value={teamA.score} colorClass="text-lime-400" />
            <MiniRow
              enabled={hasFeature(cfg, "fouls")}
              value={teamA.fouls}
              onMinus={() => adjustFouls("a", -1)}
              onPlus={() => adjustFouls("a", 1)}
              title="Fouls"
            />
          </section>

          <section className="flex flex-col items-center justify-center gap-3">
            <div className="flex flex-col items-center gap-2 text-white/90">
              <span className="h-14 w-px bg-white/15" aria-hidden />
              <SportLineIcon sportId={cfg.id} className="h-10 w-10 text-white/80" />
              <span className="h-14 w-px bg-white/15" aria-hidden />
            </div>
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
            <AnimatedScore value={teamB.score} colorClass="text-lime-400" />
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

        <div className="absolute right-3 top-3 z-20 flex items-center gap-3">
          <motion.button
            type="button"
            onClick={() => setEditOpen(true)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow"
            aria-label="Edit scoreboard"
          >
            <PencilIcon className="h-8 w-8" />
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setSettingsOpen(true)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow"
            aria-label="Open settings"
          >
            <GearIcon className="h-8 w-8" />
          </motion.button>
        </div>

        {!settingsOpen && (
          <button
            type="button"
            onClick={() => setPresentation(!presentation)}
            className="absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200"
          >
            {presentation ? "Exit present" : "Present"}
          </button>
        )}

        <AnimatePresence>
          {editOpen && <EditOverlay onClose={() => setEditOpen(false)} />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            onClose={() => setSettingsOpen(false)}
            onEdit={() => {
              setSettingsOpen(false);
              setEditOpen(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AnimatedScore({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="relative h-[130px] w-full overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={value}
          initial={{ scale: 1.35, opacity: 0, y: -12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className={`absolute inset-0 flex items-center justify-center font-stencil text-[140px] leading-[0.9] tracking-tight ${colorClass}`}
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CircleBtn({
  label,
  icon,
  onClick,
  ariaLabel,
}: {
  label?: string;
  icon?: ReactNode;
  onClick: () => void;
  ariaLabel?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.04 }}
      aria-label={ariaLabel ?? label}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow transition hover:bg-white/90"
    >
      {icon ?? <span className="text-2xl font-black">{label}</span>}
    </motion.button>
  );
}

function ActionColumn({
  side,
  actions,
  onTap,
}: {
  side: "a" | "b";
  actions: { id: string; label: string; value: number }[];
  onTap: (side: "a" | "b", actionId: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-2">
      {actions.map((a) => (
        <motion.button
          key={`${side}-${a.id}`}
          type="button"
          onClick={() => onTap(side, a.id)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-black shadow"
          title={`${a.label} (${a.value})`}
        >
          {a.label}
        </motion.button>
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
