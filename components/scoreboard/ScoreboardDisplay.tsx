"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { setMusic as setAudioMusic, playSfxClip, setThemeAmbient, stopThemeAmbient } from "@/lib/audio";
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
import { ThemeAmbience } from "./ThemeAmbience";
import { scoreFontClass } from "@/lib/themeDisplayFont";
import { MOBILE_SCOREBOARD_SHELL } from "@/lib/mobileClasses";
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

interface ThemeTokens {
  bg: string;
  scoreColor: string;
  clockColor: string;
  lowTimeColor: string;
  displayFont: string;
}

function themeTokens(theme: string): ThemeTokens {
  const displayFont = scoreFontClass(theme);
  switch (theme) {
    case "neon":
      return {
        bg: "bg-[radial-gradient(ellipse_at_center,_#1b0033_0%,_#000_70%)] text-white",
        scoreColor: "text-fuchsia-400",
        clockColor: "text-fuchsia-500",
        lowTimeColor: "text-pink-400",
        displayFont,
      };
    case "classic":
      return {
        bg: "bg-[linear-gradient(180deg,_#1a1a1a,_#000)] text-white",
        scoreColor: "text-amber-300",
        clockColor: "text-red-500",
        lowTimeColor: "text-red-400",
        displayFont,
      };
    case "stadium":
      return {
        bg: "bg-[radial-gradient(ellipse_at_top,_#003314_0%,_#000_70%)] text-white",
        scoreColor: "text-green-400",
        clockColor: "text-red-500",
        lowTimeColor: "text-red-400",
        displayFont,
      };
    case "fire":
      return {
        bg: "bg-[radial-gradient(ellipse_at_center,_#3d0a00_0%,_#000_70%)] text-white",
        scoreColor: "text-orange-400",
        clockColor: "text-orange-500",
        lowTimeColor: "text-red-400",
        displayFont,
      };
    case "ice":
      return {
        bg: "bg-[radial-gradient(ellipse_at_top,_#001833_0%,_#000_70%)] text-white",
        scoreColor: "text-sky-300",
        clockColor: "text-sky-400",
        lowTimeColor: "text-cyan-300",
        displayFont,
      };
    case "midnight":
      return {
        bg: "bg-[linear-gradient(160deg,_#0a0020_0%,_#000_60%)] text-white",
        scoreColor: "text-violet-400",
        clockColor: "text-indigo-400",
        lowTimeColor: "text-purple-400",
        displayFont,
      };
    case "gold":
      return {
        bg: "bg-[radial-gradient(ellipse_at_top,_#2a1a00_0%,_#000_70%)] text-white",
        scoreColor: "text-yellow-400",
        clockColor: "text-yellow-500",
        lowTimeColor: "text-amber-400",
        displayFont,
      };
    default: // dark
      return {
        bg: "bg-black text-white",
        scoreColor: "text-lime-400",
        clockColor: "text-red-500",
        lowTimeColor: "text-red-400",
        displayFont,
      };
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
  const tokens = themeTokens(theme);
  const clockSec = useTimerDisplay();
  useCountdownTick();
  useKeyboardShortcuts(true);

  // Auto-resume music when entering the game
  useEffect(() => {
    if (musicEnabled) setAudioMusic(musicTrack);
    return () => setAudioMusic("none");
  }, [musicEnabled, musicTrack]);

  // Theme ambient audio (e.g. stadium roar)
  useEffect(() => {
    setThemeAmbient(theme);
    return () => stopThemeAmbient();
  }, [theme]);

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
      className={`relative flex min-h-full flex-1 flex-col items-center overflow-hidden ${tokens.bg}`}
    >
      <ThemeAmbience theme={theme} />
      <div className="relative z-10 flex w-full min-h-full flex-1 flex-col items-center">
      <div className={`absolute left-1/2 top-1/2 flex h-[390px] w-[844px] -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col ${MOBILE_SCOREBOARD_SHELL}`}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-4 pt-4 text-white max-sm:px-2 max-sm:pt-2">
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
                className="flex h-12 w-12 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full border-2 border-white/50 bg-transparent text-white shadow transition hover:bg-white/10 hover:border-white"
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
              <ShotClock onClick={onShotClockClick} fontClass={tokens.displayFont} />
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
                  className={`${tokens.displayFont} text-6xl leading-none tracking-[0.08em] max-sm:text-[2.65rem] ${
                    lowTime ? tokens.lowTimeColor : tokens.clockColor
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
              className={`text-center text-2xl font-black text-white max-sm:text-xl ${editDash}`}
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

        <div className="relative mt-0 flex-1">
          <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-start gap-x-3 gap-y-2 px-4 pb-2 pt-1 max-sm:gap-x-1 max-sm:gap-y-1 max-sm:px-2 max-sm:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {/* Away (B) on the left */}
            <ActionColumn side="b" actions={scoreActions} onTap={onScore} />

          <section className="flex flex-col items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => onTeamNameClick("b")}
              className={`flex max-w-full items-center gap-2 break-words text-4xl font-black leading-tight text-white max-sm:max-w-[36vw] max-sm:text-xl ${editDash}`}
              style={{ color: teamB.color }}
            >
              {showPossession && possession === "b" && (
                <span className="text-cyan-400" aria-label="possession">
                  {"\u25B6"}
                </span>
              )}
              {teamB.name}
            </button>
            <AnimatedScore
              value={teamB.score}
              colorClass={tokens.scoreColor}
              tint={teamB.color}
              displayFont={tokens.displayFont}
            />
          </section>

          {/* Center panel */}
          <section className="flex flex-col items-center justify-center gap-1.5">
            <div className="flex flex-col items-center gap-0.5 text-white/90">
              <span className="h-5 w-px bg-white/15" aria-hidden />
              <SportLineIcon sportId={cfg.id} className="h-9 w-9 text-white/80" />
              <span className="h-5 w-px bg-white/15" aria-hidden />
            </div>

            {hasFouls && (
              <FoulsBlock
                aValue={teamB.fouls}
                bValue={teamA.fouls}
                editing={editing}
                onA={(d) => adjustFouls("b", d)}
                onB={(d) => adjustFouls("a", d)}
                displayFont={tokens.displayFont}
              />
            )}

            {hasFeature(cfg, "downs") && (
              <StatPill label="Down" value={String(down)} />
            )}

            {hasFeature(cfg, "ballsStrikesOuts") && (
              <div className="flex max-w-[min(100%,280px)] flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-yellow-300 max-sm:text-[11px]">
                <button type="button" onClick={() => adjustBSO("balls", -1)} className="flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-transparent text-white transition hover:bg-white/10 hover:border-white">-</button>
                B {balls}
                <button type="button" onClick={() => adjustBSO("balls", 1)} className="flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-transparent text-white transition hover:bg-white/10 hover:border-white">+</button>
                <span className="mx-1">|</span>
                <button type="button" onClick={() => adjustBSO("strikes", -1)} className="flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-transparent text-white transition hover:bg-white/10 hover:border-white">-</button>
                S {strikes}
                <button type="button" onClick={() => adjustBSO("strikes", 1)} className="flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-transparent text-white transition hover:bg-white/10 hover:border-white">+</button>
                <span className="mx-1">|</span>
                <button type="button" onClick={() => adjustBSO("outs", -1)} className="flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-transparent text-white transition hover:bg-white/10 hover:border-white">-</button>
                O {outs}
                <button type="button" onClick={() => adjustBSO("outs", 1)} className="flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-transparent text-white transition hover:bg-white/10 hover:border-white">+</button>
              </div>
            )}

            {hasFeature(cfg, "halfInning") && (
              <button type="button" onClick={() => toggleHalfInning()} className="rounded-full border border-white/50 bg-transparent px-3 py-1 text-xs uppercase text-white transition hover:bg-white/10 hover:border-white">
                Toggle Top/Bot
              </button>
            )}
          </section>

          {/* Home (A) on the right */}
          <section className="flex flex-col items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => onTeamNameClick("a")}
              className={`flex max-w-full items-center gap-2 break-words text-4xl font-black leading-tight text-white max-sm:max-w-[36vw] max-sm:text-xl ${editDash}`}
              style={{ color: teamA.color }}
            >
              {teamA.name}
              {showPossession && possession === "a" && (
                <span className="text-cyan-400" aria-label="possession">
                  {"\u25C0"}
                </span>
              )}
            </button>
            <AnimatedScore
              value={teamA.score}
              colorClass={tokens.scoreColor}
              tint={teamA.color}
              displayFont={tokens.displayFont}
            />
          </section>

            <ActionColumn side="a" actions={scoreActions} onTap={onScore} />
          </div>

          {/* Full padded right edge of score row; wrapper spans full board width (not just the away column) */}
          <div className="pointer-events-auto absolute right-4 top-[11.25rem] z-20 flex gap-2 max-sm:right-[max(1rem,env(safe-area-inset-right))] max-sm:top-[9.25rem] max-sm:landscape:top-[10.75rem] max-sm:portrait:top-[9.25rem]">
            <CircleBtn
              icon={<BuzzerIcon className="h-5 w-5" />}
              onClick={() => playSfxClip("/sfx/horn.mp3")}
              ariaLabel="Horn"
            />
            <CircleBtn
              icon={<WhistleIcon className="h-5 w-5" />}
              onClick={() => playSfxClip("/sfx/whistle.mp3")}
              ariaLabel="Whistle"
            />
          </div>
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
          className={`absolute bottom-3 left-1/2 max-sm:bottom-[max(0.75rem,env(safe-area-inset-bottom))] -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 ${
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
            className="absolute bottom-3 right-4 max-sm:bottom-[max(0.75rem,env(safe-area-inset-bottom))] max-sm:right-[max(1rem,env(safe-area-inset-right))] text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-200"
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
                className="mx-auto max-w-[calc(100vw-2rem)] rounded-2xl border border-white/20 bg-zinc-900/95 p-4 shadow-2xl max-sm:p-3"
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
                    <span className={`pb-[90px] max-sm:pb-[72px] ${tokens.displayFont} text-3xl text-white max-sm:text-2xl`}>
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
                  <div className="flex w-full max-w-[min(320px,calc(100vw-2rem))] flex-col gap-2">
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
                    className="inline-flex items-center gap-2 rounded-full border-2 border-white/50 bg-transparent px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10 hover:border-white"
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
    </div>
  );
}

function AnimatedScore({
  value,
  colorClass,
  tint,
  displayFont,
}: {
  value: number;
  colorClass: string;
  tint?: string;
  displayFont: string;
}) {
  return (
    <div className="relative h-[130px] w-full overflow-hidden max-sm:h-[92px]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={value}
          initial={{ scale: 1.35, opacity: 0, y: -12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className={`absolute inset-0 flex items-center justify-center ${displayFont} text-[140px] leading-[0.9] tracking-tight max-sm:text-[5rem] ${colorClass}`}
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
      className="flex h-12 w-12 min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full border-2 border-white/50 bg-transparent text-white shadow transition hover:bg-white/10 hover:border-white"
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
    <div className="relative z-30 flex flex-col items-center justify-center gap-2 py-1 max-sm:gap-1.5">
      {actions.map((a) => (
        <motion.button
          key={`${side}-${a.id}`}
          type="button"
          onClick={() => onTap(side, a.id)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="flex h-14 w-14 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 border-white/50 bg-transparent text-xl font-black text-white shadow transition hover:bg-white/10 hover:border-white max-sm:h-[52px] max-sm:w-[52px] max-sm:text-lg"
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
  displayFont,
}: {
  aValue: number;
  bValue: number;
  editing: boolean;
  onA: (delta: number) => void;
  onB: (delta: number) => void;
  displayFont: string;
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
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-transparent text-sm font-black text-white transition hover:bg-white/10 hover:border-white"
          aria-label={`Home foul ${symbol}1`}
        >
          {symbol}
        </button>
        <span className={`${displayFont} text-3xl text-yellow-300 max-sm:text-2xl`}>{aValue}</span>
        <span className="text-white/40">|</span>
        <span className={`${displayFont} text-3xl text-yellow-300 max-sm:text-2xl`}>{bValue}</span>
        <button
          type="button"
          onClick={() => onB(delta)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-transparent text-sm font-black text-white transition hover:bg-white/10 hover:border-white"
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
