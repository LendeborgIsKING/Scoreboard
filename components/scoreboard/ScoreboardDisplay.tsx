"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
import { SportLineIcon } from "./SportLineIcons";
import { PickerWheel } from "./PickerWheel";
import {
  CheckIcon,
  GearIcon,
  MenuIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
} from "./UiIcons";

type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (orientation: "portrait" | "landscape" | "any") => Promise<void>;
  unlock?: () => void;
};

type Side = "a" | "b";
type Popover = null | "period" | "clock" | "teamA" | "teamB";

const PERIOD_VALUES = Array.from({ length: 20 }, (_, i) => i + 1);
const MIN_VALUES = Array.from({ length: 61 }, (_, i) => i);
const SEC_VALUES = Array.from({ length: 60 }, (_, i) => i);

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
  const setCountdownDuration = useGameStore((s) => s.setCountdownDuration);
  const setClockSeconds = useGameStore((s) => s.setClockSeconds);
  const setPeriod = useGameStore((s) => s.setPeriod);
  const setTeamName = useGameStore((s) => s.setTeamName);
  const startTimer = useGameStore((s) => s.startTimer);
  const pauseTimer = useGameStore((s) => s.pauseTimer);
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const setPresentation = useGameStore((s) => s.setPresentationMode);
  const nextPeriod = useGameStore((s) => s.nextPeriod);
  const adjustBSO = useGameStore((s) => s.adjustBSO);
  const toggleHalfInning = useGameStore((s) => s.toggleHalfInning);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [popover, setPopover] = useState<Popover>(null);
  const [teamDraft, setTeamDraft] = useState("");
  const [minDraft, setMinDraft] = useState(0);
  const [secDraft, setSecDraft] = useState(0);

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
  const hasFouls = hasFeature(cfg, "fouls");

  const openClockPicker = () => {
    setMinDraft(Math.floor(timer.countdownFromSeconds / 60));
    setSecDraft(timer.countdownFromSeconds % 60);
    setPopover("clock");
  };

  const openTeamPicker = (side: Side) => {
    setTeamDraft(side === "a" ? teamA.name : teamB.name);
    setPopover(side === "a" ? "teamA" : "teamB");
  };

  const closePopover = () => {
    if (popover === "clock") {
      const total = Math.max(0, minDraft * 60 + secDraft);
      if (total !== timer.countdownFromSeconds) setClockSeconds(total);
    } else if (popover === "teamA") {
      const next = teamDraft.trim() || "HOME";
      if (next !== teamA.name) setTeamName("a", next);
    } else if (popover === "teamB") {
      const next = teamDraft.trim() || "AWAY";
      if (next !== teamB.name) setTeamName("b", next);
    }
    setPopover(null);
  };

  const onClockClick = () => {
    if (editing) openClockPicker();
    else setCountdownDuration(timer.countdownFromSeconds);
  };
  const onPeriodClick = () => {
    if (editing) setPopover("period");
    else nextPeriod();
  };
  const onTeamNameClick = (side: Side) => {
    if (editing) openTeamPicker(side);
  };

  const editDash = editing
    ? "border-2 border-dashed border-white rounded-lg px-3 py-1"
    : "";
  const editDashRed = editing
    ? "border-2 border-dashed border-red-500 rounded-lg px-3 py-1"
    : "";

  return (
    <div
      className={`relative flex min-h-full flex-1 flex-col items-center overflow-hidden ${themeClass(theme)}`}
    >
      <div className="absolute left-1/2 top-1/2 flex h-[390px] w-[844px] -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col max-sm:landscape:static max-sm:landscape:h-full max-sm:landscape:w-full max-sm:landscape:translate-x-0 max-sm:landscape:translate-y-0 max-sm:landscape:rotate-0">
        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-2 px-4 pt-4 text-white">
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
                onClick={onClockClick}
                className={`font-stencil text-6xl leading-none tracking-[0.08em] ${
                  lowTime ? "text-red-400" : "text-red-500"
                } ${editDashRed}`}
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
              onClick={onPeriodClick}
              className={`text-2xl font-black text-white ${editDash}`}
            >
              {periodText}
            </button>
          </div>

          <div className="flex items-center gap-2 justify-self-end">
            <CircleBtn
              icon={
                editing ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <PencilIcon className="h-5 w-5" />
                )
              }
              onClick={() => setEditing((v) => !v)}
              ariaLabel={editing ? "Finish editing" : "Edit scoreboard"}
            />
            <CircleBtn
              icon={<GearIcon className="h-5 w-5" />}
              onClick={() => setSettingsOpen(true)}
              ariaLabel="Open settings"
            />
          </div>
        </div>

        <div className="mt-2 grid flex-1 grid-cols-[auto_1fr_auto_1fr_auto] items-stretch gap-3 px-4 pb-2">
          <ActionColumn side="a" actions={scoreActions} onTap={onScore} />

          <section className="flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onTeamNameClick("a")}
              className={`text-4xl font-black text-white ${editDash}`}
            >
              {teamA.name}
            </button>
            <AnimatedScore value={teamA.score} colorClass="text-lime-400" />
          </section>

          <section className="flex flex-col items-center justify-center gap-3">
            <div className="flex flex-col items-center gap-1 text-white/90">
              <span className="h-8 w-px bg-white/15" aria-hidden />
              <SportLineIcon sportId={cfg.id} className="h-9 w-9 text-white/80" />
              <span className="h-8 w-px bg-white/15" aria-hidden />
            </div>

            {hasFouls && (
              <FoulsBlock
                aValue={teamA.fouls}
                bValue={teamB.fouls}
                editing={editing}
                onA={(d) => adjustFouls("a", d)}
                onB={(d) => adjustFouls("b", d)}
              />
            )}

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
          </section>

          <section className="flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onTeamNameClick("b")}
              className={`text-4xl font-black text-white ${editDash}`}
            >
              {teamB.name}
            </button>
            <AnimatedScore value={teamB.score} colorClass="text-lime-400" />
          </section>

          <ActionColumn side="b" actions={scoreActions} onTap={onScore} />
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {cfg.name}
          {possession && <span className="ml-2 text-cyan-400">- Poss {possession === "a" ? "Home" : "Away"}</span>}
        </div>

        {!settingsOpen && !editing && (
          <button
            type="button"
            onClick={() => setPresentation(!presentation)}
            className="absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200"
          >
            {presentation ? "Exit present" : "Present"}
          </button>
        )}

        <AnimatePresence>
          {popover && (
            <motion.div
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePopover}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-2xl border border-white/20 bg-zinc-900/95 p-4 shadow-2xl"
              >
                {popover === "period" && (
                  <PickerWheel
                    values={PERIOD_VALUES}
                    value={period}
                    onChange={(v) => setPeriod(Number(v))}
                    label={periodLabel}
                  />
                )}

                {popover === "clock" && (
                  <div className="flex items-end gap-2">
                    <PickerWheel
                      values={MIN_VALUES}
                      value={minDraft}
                      onChange={(v) => setMinDraft(Number(v))}
                      label="MIN"
                      width={64}
                    />
                    <span className="pb-[90px] font-stencil text-3xl text-white">
                      :
                    </span>
                    <PickerWheel
                      values={SEC_VALUES}
                      value={secDraft}
                      onChange={(v) => setSecDraft(Number(v))}
                      label="SEC"
                      width={64}
                    />
                  </div>
                )}

                {(popover === "teamA" || popover === "teamB") && (
                  <div className="flex w-[320px] flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      {popover === "teamA" ? "Home" : "Away"}
                    </label>
                    <input
                      autoFocus
                      value={teamDraft}
                      onChange={(e) => setTeamDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") closePopover();
                      }}
                      className="rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-xl font-black text-white outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={closePopover}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-black"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Done
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            onClose={() => setSettingsOpen(false)}
            onEdit={() => {
              setSettingsOpen(false);
              setEditing(true);
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

function FoulsBlock({
  aValue,
  bValue,
  editing,
  onA,
  onB,
}: {
  aValue: number;
  bValue: number;
  editing: boolean;
  onA: (delta: number) => void;
  onB: (delta: number) => void;
}) {
  const delta = editing ? -1 : 1;
  const symbol = editing ? "-" : "+";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">
        Fouls
      </span>
      <div className="flex items-center gap-3 text-white">
        <button
          type="button"
          onClick={() => onA(delta)}
          className="h-7 w-7 rounded-full bg-white text-sm font-black text-black"
          aria-label={`Home foul ${symbol}1`}
        >
          {symbol}
        </button>
        <span className="font-stencil text-3xl text-yellow-300">{aValue}</span>
        <span className="text-white/40">|</span>
        <span className="font-stencil text-3xl text-yellow-300">{bValue}</span>
        <button
          type="button"
          onClick={() => onB(delta)}
          className="h-7 w-7 rounded-full bg-white text-sm font-black text-black"
          aria-label={`Away foul ${symbol}1`}
        >
          {symbol}
        </button>
      </div>
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
