"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { setMusic as setAudioMusic, playSfxClip } from "@/lib/audio";
import {
  hasFeature,
  resolveActiveVariant,
  resolveSportConfig,
} from "@/lib/sportRegistry";
import { formatSeconds } from "@/lib/format";
import { useTimerDisplay } from "@/hooks/useTimerDisplay";
import { useCountdownTick } from "@/hooks/useCountdownTick";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { SettingsModal } from "./SettingsModal";
import { StatsModal } from "./StatsModal";
import { HistoryModal } from "./HistoryModal";
import { SoundboardModal } from "./SoundboardModal";
import { SportLineIcon } from "./SportLineIcons";
import { PickerWheel } from "./PickerWheel";
import { ShotClock } from "./ShotClock";
import { BannerOverlay } from "./BannerOverlay";
import { Confetti } from "./Confetti";
import {
  BuzzerIcon,
  CheckIcon,
  GearIcon,
  MenuIcon,
  MicSlashIcon,
  MicrophoneIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  WhistleIcon,
} from "./UiIcons";

type ScreenOrientationWithLock = ScreenOrientation & {
  lock?: (orientation: "portrait" | "landscape" | "any") => Promise<void>;
  unlock?: () => void;
};

type Side = "a" | "b";
type Popover = null | "period" | "clock" | "teamA" | "teamB" | "shotclock";

const PERIOD_VALUES = Array.from({ length: 20 }, (_, i) => i + 1);
const MIN_VALUES = Array.from({ length: 61 }, (_, i) => i);
const SEC_VALUES = Array.from({ length: 60 }, (_, i) => i);
const SC_VALUES = Array.from({ length: 60 }, (_, i) => i + 1);

function themeClass(theme: "dark" | "neon" | "classic" | "stadium"): string {
  switch (theme) {
    case "neon":
      return "bg-[radial-gradient(ellipse_at_center,_#1b0033_0%,_#000_70%)] text-white";
    case "classic":
      return "bg-[linear-gradient(180deg,_#1a1a1a,_#000)] text-white";
    case "stadium":
      return "bg-[radial-gradient(ellipse_at_top,_#003314_0%,_#000_70%)] text-white";
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
  const presentation = useGameStore((s) => s.presentationMode);
  const timer = useGameStore((s) => s.timer);
  const period = useGameStore((s) => s.period);
  const shotClock = useGameStore((s) => s.shotClock);
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const musicEnabled = useGameStore((s) => s.musicEnabled);
  const musicTrack = useGameStore((s) => s.musicTrack);

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
  const setPossession = useGameStore((s) => s.setPossession);
  const setSfxEnabled = useGameStore((s) => s.setSfxEnabled);
  const setMusicEnabled = useGameStore((s) => s.setMusicEnabled);
  const startShotClock = useGameStore((s) => s.startShotClock);
  const pauseShotClock = useGameStore((s) => s.pauseShotClock);
  const resetShotClock = useGameStore((s) => s.resetShotClock);
  const setShotClockDuration = useGameStore((s) => s.setShotClockDuration);
  const confettiKey = useGameStore((s) => s.confettiKey);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [soundboardOpen, setSoundboardOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [popover, setPopover] = useState<Popover>(null);
  const [teamDraft, setTeamDraft] = useState("");
  const [minDraft, setMinDraft] = useState(0);
  const [secDraft, setSecDraft] = useState(0);
  const [scDraft, setScDraft] = useState(shotClock.durationSeconds);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const audioMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!audioMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (
        audioMenuRef.current &&
        !audioMenuRef.current.contains(e.target as Node)
      )
        setAudioMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [audioMenuOpen]);

  const cfg = resolveSportConfig(sportId, customSport);
  const activeVariant = resolveActiveVariant(cfg, timerVariantId);
  const clockSec = useTimerDisplay();
  useCountdownTick();
  useKeyboardShortcuts(true);

  // Auto-resume music when entering the game
  useEffect(() => {
    if (musicEnabled) setAudioMusic(musicTrack);
    return () => setAudioMusic("none");
  }, [musicEnabled, musicTrack]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const orientation = window.screen.orientation as ScreenOrientationWithLock;
    if (orientation.lock) {
      orientation.lock("landscape").catch(() => {});
    }
    return () => {
      if (orientation.unlock) {
        try {
          orientation.unlock();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const scoreActions = useMemo(() => cfg.scoring.slice(0, 4), [cfg.scoring]);

  const onScore = (team: Side, actionId: string) => addScore(team, actionId);

  const periodLabel = activeVariant?.periodLabel ?? cfg.periodLabel;
  const periodText = `${periodLabel} ${period}`;
  const lowTime = clockSec <= 60 && clockSec > 0;
  const hasFouls = hasFeature(cfg, "fouls");
  const showPossession = hasFeature(cfg, "possession");

  const openClockPicker = () => {
    setMinDraft(Math.floor(timer.countdownFromSeconds / 60));
    setSecDraft(timer.countdownFromSeconds % 60);
    setPopover("clock");
  };
  const openShotClockPicker = () => {
    setScDraft(shotClock.durationSeconds);
    setPopover("shotclock");
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
    } else if (popover === "shotclock") {
      if (scDraft !== shotClock.durationSeconds) setShotClockDuration(scDraft);
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
  const onShotClockClick = () => {
    if (editing) {
      openShotClockPicker();
      return;
    }
    if (shotClock.running) pauseShotClock();
    else startShotClock();
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
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-4 pt-4 text-white">
          <div className="flex items-center justify-start gap-2 pt-1.5">
            <CircleBtn
              icon={<MenuIcon className="h-5 w-5" />}
              onClick={() => setUiPhase("menu")}
              ariaLabel="Exit to menu"
            />
            <div className="relative" ref={audioMenuRef}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                aria-label="Mute or restore music and sound effects"
                aria-expanded={audioMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAudioMenuOpen((open) => !open)}
                className={`flex h-12 w-12 items-center justify-center rounded-full shadow transition ${
                  musicEnabled || sfxEnabled
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <MicrophoneIcon className="h-6 w-6" aria-hidden />
              </motion.button>
              {audioMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 z-[120] mt-2 w-52 rounded-xl border border-white/20 bg-zinc-900 py-2 shadow-2xl"
                >
                  <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Mute audio
                  </p>
                  {musicEnabled ? (
                    <button
                      role="menuitem"
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-sm font-medium text-white hover:bg-white/10"
                      onClick={() => {
                        setMusicEnabled(false);
                        setAudioMenuOpen(false);
                      }}
                    >
                      Turn off music
                    </button>
                  ) : (
                    <button
                      role="menuitem"
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-sm font-medium text-white hover:bg-white/10"
                      onClick={() => {
                        setMusicEnabled(true);
                        setAudioMenuOpen(false);
                      }}
                    >
                      Turn on music
                    </button>
                  )}
                  {sfxEnabled ? (
                    <button
                      role="menuitem"
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-sm font-medium text-white hover:bg-white/10"
                      onClick={() => {
                        setSfxEnabled(false);
                        setAudioMenuOpen(false);
                      }}
                    >
                      Turn off sound effects
                    </button>
                  ) : (
                    <button
                      role="menuitem"
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-sm font-medium text-white hover:bg-white/10"
                      onClick={() => {
                        setSfxEnabled(true);
                        setAudioMenuOpen(false);
                      }}
                    >
                      Turn on sound effects
                    </button>
                  )}
                  <p className="mx-3 mt-1 border-t border-white/10 pt-2 text-[10px] text-zinc-500">
                    Finer volumes and tracks are in Settings.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center justify-center gap-2">
              <ShotClock onClick={onShotClockClick} />
              <div className="flex items-center gap-1">
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
                  {!cfg.noGameClock ? formatSeconds(clockSec) : "--:--"}
                </motion.button>
              </div>
            </div>
            <button
              type="button"
              onClick={onPeriodClick}
              className={`text-center text-2xl font-black text-white ${editDash}`}
            >
              {periodText}
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1.5">
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

        <div className="mt-0 grid flex-1 grid-cols-[auto_1fr_auto_1fr_auto] items-start gap-x-3 gap-y-2 px-4 pb-2 pt-1">
          <ActionColumn side="a" actions={scoreActions} onTap={onScore} />

          <section className="flex flex-col items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => onTeamNameClick("a")}
              className={`flex items-center gap-2 text-4xl font-black text-white ${editDash}`}
              style={{ color: teamA.color }}
            >
              {showPossession && possession === "a" && (
                <span className="text-cyan-400" aria-label="possession">
                  {"\u25B6"}
                </span>
              )}
              {teamA.name}
            </button>
            <AnimatedScore
              value={teamA.score}
              colorClass="text-lime-400"
              tint={teamA.color}
            />
          </section>

          <section className="flex flex-col items-center justify-center gap-1.5">
            <div className="flex flex-col items-center gap-0.5 text-white/90">
              <span className="h-5 w-px bg-white/15" aria-hidden />
              <SportLineIcon sportId={cfg.id} className="h-9 w-9 text-white/80" />
              <span className="h-5 w-px bg-white/15" aria-hidden />
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

          <section className="flex flex-col items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => onTeamNameClick("b")}
              className={`flex items-center gap-2 text-4xl font-black text-white ${editDash}`}
              style={{ color: teamB.color }}
            >
              {teamB.name}
              {showPossession && possession === "b" && (
                <span className="text-cyan-400" aria-label="possession">
                  {"\u25C0"}
                </span>
              )}
            </button>
            <AnimatedScore
              value={teamB.score}
              colorClass="text-lime-400"
              tint={teamB.color}
            />
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => playSfxClip("/sfx/horn.mp3")}
                aria-label="Horn"
                className="flex h-8 w-12 items-center justify-center rounded-full bg-zinc-800 text-white shadow transition hover:bg-zinc-700"
              >
                <BuzzerIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => playSfxClip("/sfx/whistle.mp3")}
                aria-label="Whistle"
                className="flex h-8 w-12 items-center justify-center rounded-full bg-zinc-800 text-white shadow transition hover:bg-zinc-700"
              >
                <WhistleIcon className="h-5 w-5" />
              </button>
            </div>
          </section>

          <ActionColumn side="b" actions={scoreActions} onTap={onScore} />
        </div>

        <button
          type="button"
          onClick={() => {
            if (!editing) return;
            const next =
              possession === "a" ? "b" : possession === "b" ? null : "a";
            setPossession(next);
          }}
          disabled={!editing}
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 ${
            editing
              ? "cursor-pointer rounded-md border border-dashed border-white/60 px-2 py-[2px] hover:text-white"
              : "cursor-default"
          }`}
          aria-label="Cycle possession"
        >
          {cfg.name}
          {possession && (
            <span className="ml-2 text-cyan-400">
              - Poss {possession === "a" ? teamA.name : teamB.name}
            </span>
          )}
          {!possession && editing && (
            <span className="ml-2 text-white/60">- Poss ?</span>
          )}
        </button>

        {!settingsOpen && !editing && (
          <button
            type="button"
            onClick={() => setPresentation(!presentation)}
            className="absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200"
          >
            {presentation ? "Exit present" : "Present"}
          </button>
        )}

        <BannerOverlay />
        <Confetti trigger={confettiKey} />

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

                {popover === "shotclock" && (
                  <PickerWheel
                    values={SC_VALUES}
                    value={scDraft}
                    onChange={(v) => setScDraft(Number(v))}
                    label="Shot clock"
                  />
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

                <div className="mt-3 flex justify-end gap-2">
                  {popover === "shotclock" && (
                    <button
                      type="button"
                      onClick={() => {
                        resetShotClock();
                      }}
                      className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-zinc-300"
                    >
                      Reset
                    </button>
                  )}
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
            onStats={() => {
              setSettingsOpen(false);
              setStatsOpen(true);
            }}
            onHistory={() => {
              setSettingsOpen(false);
              setHistoryOpen(true);
            }}
            onSoundboard={() => {
              setSettingsOpen(false);
              setSoundboardOpen(true);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {statsOpen && <StatsModal onClose={() => setStatsOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {historyOpen && (
          <HistoryModal onClose={() => setHistoryOpen(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {soundboardOpen && (
          <SoundboardModal onClose={() => setSoundboardOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AnimatedScore({
  value,
  colorClass,
  tint,
}: {
  value: number;
  colorClass: string;
  tint?: string;
}) {
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
          style={tint ? { color: tint } : undefined}
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
    <div className="flex flex-col items-center justify-center gap-2 py-1">
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
