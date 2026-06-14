"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import {
  setMusic as setAudioMusic,
  playSfx,
  playSfxClip,
  prefetchSfxClip,
  setThemeAmbient,
  stopThemeAmbient,
} from "@/lib/audio";
import { NHL_HORN_SRC } from "@/lib/nhlTeams";
import {
  hasFeature,
  resolveActiveVariant,
  resolveSportConfig,
} from "@/lib/sportRegistry";
import {
  FoulBonusLabels,
  ResetFoulsChip,
  ScoreMargin,
  TimeoutDots,
} from "./BasketballScoreboard";
import { formatClockSmart } from "@/lib/format";
import { useTimerMs } from "@/hooks/useTimerMs";
import { useCountdownTick } from "@/hooks/useCountdownTick";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";
import { pressFeedback } from "@/lib/feedback";
import { SettingsModal } from "./SettingsModal";
import { StatsModal } from "./StatsModal";
import { HistoryModal } from "./HistoryModal";
import { ThemeAmbience } from "./ThemeAmbience";
import { CourtAmbience } from "./CourtAmbience";
import { FireAmbience } from "./FireAmbience";
import { scoreFontClass } from "@/lib/themeDisplayFont";
import { MOBILE_SCOREBOARD_SHELL } from "@/lib/mobileClasses";
import { SportLineIcon } from "./SportLineIcons";
import { PickerWheel } from "./PickerWheel";
import { ShotClock } from "./ShotClock";
import { BannerOverlay } from "./BannerOverlay";
import { Confetti } from "./Confetti";
import { StopHornOverlay } from "./StopHornOverlay";
import { FinalCountdownPrompt } from "./FinalCountdownPrompt";
import { GameOverOverlay } from "./GameOverOverlay";
import {
  BuzzerIcon,
  CheckIcon,
  GearIcon,
  MenuIcon,
  MicSlashIcon,
  MicrophoneIcon,
  MusicNoteIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RotateIcon,
  WhistleIcon,
} from "./UiIcons";


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
    case "court":
      return {
        bg: "bg-[#c97438] text-white",
        scoreColor: "text-white",
        clockColor: "text-white",
        lowTimeColor: "text-amber-100",
        displayFont,
      };
    case "retro":
      return {
        bg: "bg-[radial-gradient(ellipse_at_center,_#04240f_0%,_#000_78%)] text-white",
        scoreColor: "text-green-400",
        clockColor: "text-amber-400",
        lowTimeColor: "text-red-400",
        displayFont,
      };
    case "blackout":
      return {
        bg: "bg-black text-white",
        scoreColor: "text-white",
        clockColor: "text-white",
        lowTimeColor: "text-zinc-400",
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
  const setMusicTrack = useGameStore((s) => s.setMusicTrack);
  const startShotClock = useGameStore((s) => s.startShotClock);
  const pauseShotClock = useGameStore((s) => s.pauseShotClock);
  const resetShotClock = useGameStore((s) => s.resetShotClock);
  const setShotClockDuration = useGameStore((s) => s.setShotClockDuration);
  const confettiKey = useGameStore((s) => s.confettiKey);
  const foulsResetPrompt = useGameStore((s) => s.foulsResetPrompt);
  const adjustTimeouts = useGameStore((s) => s.adjustTimeouts);
  const adjustScore = useGameStore((s) => s.adjustScore);
  const resetTeamFouls = useGameStore((s) => s.resetTeamFouls);
  const dismissFoulsResetPrompt = useGameStore(
    (s) => s.dismissFoulsResetPrompt,
  );
  const keepAwakeEnabled = useGameStore((s) => s.keepAwakeEnabled);
  const toggleDisplayFlip = useGameStore((s) => s.toggleDisplayFlip);
  const { isMobile } = useIsMobileDevice();

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
  const clockMs = useTimerMs();
  const clockSec = Math.ceil(clockMs / 1000);
  useCountdownTick();
  useKeyboardShortcuts(true);
  useWakeLock(keepAwakeEnabled);

  const longPressB = useLongPress(() => {
    adjustScore("b", -1);
    pressFeedback("medium");
  });
  const longPressA = useLongPress(() => {
    adjustScore("a", -1);
    pressFeedback("medium");
  });
  const togglePossession = (side: Side) => {
    pressFeedback();
    setPossession(possession === side ? null : side);
  };

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

  // Pre-decode hockey horns so the first tap fires instantly with zero lag.
  useEffect(() => {
    if (sportId === "hockey") {
      void prefetchSfxClip(NHL_HORN_SRC);
      void prefetchSfxClip("/sfx/horn.mp3");
    }
  }, [sportId]);

  // Warm the Final Countdown clip early so the first play hits instantly
  // when the prompt is accepted in the closing minute.
  useEffect(() => {
    void prefetchSfxClip("/music/final-countdown.mp3");
  }, []);

  const scoreActions = useMemo(() => cfg.scoring.slice(0, 4), [cfg.scoring]);

  const onScore = (team: Side, actionId: string) => {
    if (editing) {
      const action = scoreActions.find((a) => a.id === actionId);
      if (action) adjustScore(team, -action.value);
      return;
    }
    addScore(team, actionId);
  };

  const periodLabel = activeVariant?.periodLabel ?? cfg.periodLabel;
  const periodText = `${periodLabel} ${period}`;
  const lowTime = clockSec <= 60 && clockSec > 0;
  const hasFouls = hasFeature(cfg, "fouls");
  const hasTimeouts = hasFeature(cfg, "timeouts");
  const showPossession = hasFeature(cfg, "possession");
  const isBasketball = cfg.id === "basketball";
  const showFoulsReset =
    isBasketball &&
    hasFouls &&
    (editing || foulsResetPrompt) &&
    (teamA.fouls > 0 || teamB.fouls > 0 || foulsResetPrompt);

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
      <div className={`absolute left-1/2 top-1/2 flex h-[390px] w-[844px] -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col overflow-hidden ${MOBILE_SCOREBOARD_SHELL}`}>
        {theme === "court" && <CourtAmbience />}
        {theme === "fire" && <FireAmbience />}
        <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-4 pt-4 text-white">
          <div className="flex items-center justify-start gap-2 pt-1.5">
            <CircleBtn
              icon={<MenuIcon className="h-5 w-5" />}
              onClick={() => setUiPhase("menu")}
              ariaLabel="Exit to menu"
            />
            {isMobile && (
              <CircleBtn
                icon={<RotateIcon className="h-5 w-5" />}
                onClick={toggleDisplayFlip}
                ariaLabel="Flip screen orientation 180 degrees"
              />
            )}
            <MusicToggleButton
              playing={musicEnabled && musicTrack !== "none"}
              onToggle={() => {
                const playing = musicEnabled && musicTrack !== "none";
                if (playing) {
                  setMusicEnabled(false);
                } else {
                  if (musicTrack === "none") setMusicTrack("hype");
                  setMusicEnabled(true);
                }
              }}
            />
            <div className="relative" ref={audioMenuRef}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.06 }}
                transition={{ type: "spring", stiffness: 700, damping: 22 }}
                aria-label="Mute or restore music and sound effects"
                aria-expanded={audioMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAudioMenuOpen((open) => !open)}
                className="flex h-12 w-12 min-h-[44px] min-w-[44px] touch-manipulation select-none items-center justify-center rounded-full border-2 border-white/50 bg-transparent text-white shadow transition-colors hover:bg-white/10 hover:border-white active:bg-white/20"
                style={{ WebkitTapHighlightColor: "transparent" }}
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
                  className={`${tokens.displayFont} text-6xl leading-none tracking-[0.08em] ${
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
                  {!cfg.noGameClock ? formatClockSmart(clockMs) : "--:--"}
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

        <div className="relative z-10 mt-0 flex-1">
          <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-start gap-x-5 gap-y-2 px-5 pb-2 pt-1">
            {/* Away (B) on the left */}
            <ActionColumn
              side="b"
              actions={scoreActions}
              editing={editing}
              onTap={onScore}
            />

          <section className="flex w-full flex-col items-center justify-center gap-1.5">
            <div className="flex max-w-full items-center gap-2">
              {showPossession && (
                <PossessionToggle
                  active={possession === "b"}
                  onClick={() => togglePossession("b")}
                  dir="right"
                />
              )}
              {teamB.logo && (
                <img
                  src={teamB.logo}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded object-contain"
                />
              )}
              <button
                type="button"
                onClick={() => onTeamNameClick("b")}
                className={`break-words text-4xl font-black leading-tight text-white ${editDash}`}
                style={{ color: teamB.color }}
              >
                {teamB.name}
              </button>
            </div>
            <div className="w-full" {...longPressB}>
              <AnimatedScore
                value={teamB.score}
                colorClass={tokens.scoreColor}
                tint={teamB.color}
                displayFont={tokens.displayFont}
              />
            </div>
            {editing && (
              <ScoreAdjust
                onMinus={() => adjustScore("b", -1)}
                onPlus={() => adjustScore("b", 1)}
              />
            )}
            {isBasketball && hasTimeouts && (
              <TimeoutDots
                remaining={teamB.timeouts}
                teamLabel={teamB.name}
                editing={editing}
                onAdjust={(d) => adjustTimeouts("b", d)}
              />
            )}
          </section>

          {/* Center panel */}
          <section className="flex flex-col items-center justify-center gap-1.5">
            <div className="flex flex-col items-center gap-0.5 text-white/90">
              <span className="h-5 w-px bg-white/15" aria-hidden />
              <SportLineIcon sportId={cfg.id} className="h-9 w-9 text-white/80" />
              <span className="h-5 w-px bg-white/15" aria-hidden />
            </div>

            {isBasketball && (
              <ScoreMargin
                scoreA={teamA.score}
                scoreB={teamB.score}
                teamAName={teamA.name}
                teamBName={teamB.name}
                teamAColor={teamA.color}
                teamBColor={teamB.color}
                displayFont={tokens.displayFont}
              />
            )}

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

            {isBasketball && hasFouls && (
              <FoulBonusLabels awayFouls={teamB.fouls} homeFouls={teamA.fouls} />
            )}

            {showFoulsReset && (
              <ResetFoulsChip
                onReset={() => resetTeamFouls()}
                onDismiss={() => dismissFoulsResetPrompt()}
              />
            )}

            {hasFeature(cfg, "downs") && (
              <StatPill label="Down" value={String(down)} />
            )}

            {hasFeature(cfg, "ballsStrikesOuts") && (
              <div className="flex max-w-[min(100%,280px)] flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-yellow-300">
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
          <section className="flex w-full flex-col items-center justify-center gap-1.5">
            <div className="flex max-w-full items-center gap-2">
              <button
                type="button"
                onClick={() => onTeamNameClick("a")}
                className={`break-words text-4xl font-black leading-tight text-white ${editDash}`}
                style={{ color: teamA.color }}
              >
                {teamA.name}
              </button>
              {teamA.logo && (
                <img
                  src={teamA.logo}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded object-contain"
                />
              )}
              {showPossession && (
                <PossessionToggle
                  active={possession === "a"}
                  onClick={() => togglePossession("a")}
                  dir="left"
                />
              )}
            </div>
            <div className="w-full" {...longPressA}>
              <AnimatedScore
                value={teamA.score}
                colorClass={tokens.scoreColor}
                tint={teamA.color}
                displayFont={tokens.displayFont}
              />
            </div>
            {editing && (
              <ScoreAdjust
                onMinus={() => adjustScore("a", -1)}
                onPlus={() => adjustScore("a", 1)}
              />
            )}
            {isBasketball && hasTimeouts && (
              <TimeoutDots
                remaining={teamA.timeouts}
                teamLabel={teamA.name}
                editing={editing}
                onAdjust={(d) => adjustTimeouts("a", d)}
              />
            )}
            {/* Sits at the right edge of the home column, just to the left of the action column —
                guarantees no overlap with the +point buttons. */}
            <div className="mt-1 flex max-w-[120px] flex-wrap justify-end gap-2 self-end">
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
              <CircleBtn
                icon={<CheerIcon className="h-5 w-5" />}
                onClick={() => playSfx("cheer")}
                ariaLabel="Crowd cheer"
              />
              <CircleBtn
                icon={<BooIcon className="h-5 w-5" />}
                onClick={() => playSfx("boo")}
                ariaLabel="Crowd boo"
              />
            </div>
          </section>

            <ActionColumn
              side="a"
              actions={scoreActions}
              editing={editing}
              onTap={onScore}
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
        <FinalCountdownPrompt />
        <StopHornOverlay />
        <GameOverOverlay />

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
                className="mx-auto max-w-[calc(100vw-2rem)] rounded-2xl border border-white/20 bg-zinc-900/95 p-4 shadow-2xl"
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
                    <span className={`pb-[90px] ${tokens.displayFont} text-3xl text-white`}>
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
    <div className="relative h-[130px] w-full overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={value}
          initial={{ scale: 1.35, opacity: 0, y: -12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className={`absolute inset-0 flex items-center justify-center ${displayFont} text-[140px] leading-[0.9] tracking-tight ${colorClass}`}
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
      onClick={() => {
        pressFeedback();
        onClick();
      }}
      whileTap={{ scale: 0.86 }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: "spring", stiffness: 600, damping: 18 }}
      aria-label={ariaLabel ?? label}
      className="flex h-12 w-12 min-h-[44px] min-w-[44px] touch-manipulation select-none items-center justify-center rounded-full border-2 border-white/50 bg-transparent text-white shadow transition-colors hover:bg-white/10 hover:border-white active:bg-white/20"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {icon ?? <span className="text-2xl font-black">{label}</span>}
    </motion.button>
  );
}

/** Long-press helper — fires `cb` after the user holds for `ms`. */
function useLongPress(cb: () => void, ms = 500) {
  const timer = useRef<number | null>(null);
  const clear = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  return {
    onPointerDown: () => {
      clear();
      timer.current = window.setTimeout(cb, ms);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}

/** Tappable possession arrow — flips possession in normal play. */
function PossessionToggle({
  active,
  onClick,
  dir,
}: {
  active: boolean;
  onClick: () => void;
  dir: "left" | "right";
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 600, damping: 18 }}
      aria-label="Toggle possession"
      aria-pressed={active}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm transition ${
        active
          ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
          : "border-white/25 text-white/30 hover:border-white/60 hover:text-white/70"
      }`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {dir === "right" ? "\u25B6" : "\u25C0"}
    </motion.button>
  );
}

/** Compact +/- under a score for quick corrections in edit mode. */
function ScoreAdjust({
  onMinus,
  onPlus,
}: {
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          pressFeedback();
          onMinus();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 text-lg font-black text-white transition hover:bg-white/10 hover:border-white active:bg-white/20"
        aria-label="Subtract a point"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => {
          pressFeedback();
          onPlus();
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 text-lg font-black text-white transition hover:bg-white/10 hover:border-white active:bg-white/20"
        aria-label="Add a point"
      >
        +
      </button>
    </div>
  );
}

function CheerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M2 13.5 13 9l7 2.5v3L13 17 2 13.5Zm12 4.9 6-2.1v3.2a1 1 0 0 1-1.3.95L14 19v-.6ZM13 3l1.2 2.5L17 6.7l-2.5 1.2L13 10.4l-1.2-2.5L9.3 6.7l2.5-1.2L13 3Z" />
    </svg>
  );
}

function BooIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-3.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM8 17c.8-1.8 2.3-3 4-3s3.2 1.2 4 3c-1.2-.7-2.6-1-4-1s-2.8.3-4 1Z" />
    </svg>
  );
}

/**
 * One-tap music play/pause sitting in the scoreboard header so users don't
 * have to dive into settings. Highlighted (filled lime-tinted) when playing,
 * with three animated EQ bars bouncing next to the note.
 */
function MusicToggleButton({
  playing,
  onToggle,
}: {
  playing: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: "spring", stiffness: 700, damping: 22 }}
      aria-label={playing ? "Pause music" : "Play music"}
      aria-pressed={playing}
      className={`flex h-12 w-12 min-h-[44px] min-w-[44px] touch-manipulation select-none items-center justify-center gap-0.5 rounded-full border-2 shadow transition-colors active:bg-white/20 ${
        playing
          ? "border-lime-300 bg-lime-400/15 text-lime-200"
          : "border-white/50 bg-transparent text-white hover:bg-white/10 hover:border-white"
      }`}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <MusicNoteIcon className="h-5 w-5" aria-hidden />
      {playing && (
        <span className="flex h-4 items-end gap-[2px]" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block w-[2px] rounded-sm bg-lime-300"
              animate={{ height: ["25%", "100%", "40%", "85%", "30%"] }}
              transition={{
                duration: 0.85,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12,
              }}
            />
          ))}
        </span>
      )}
    </motion.button>
  );
}

function actionLabel(
  action: { label: string; value: number },
  editing: boolean,
) {
  if (!editing) return action.label;
  if (action.label.startsWith("+")) return action.label.replace("+", "−");
  return `−${action.value}`;
}

function ActionColumn({
  side,
  actions,
  editing,
  onTap,
}: {
  side: "a" | "b";
  actions: { id: string; label: string; value: number }[];
  editing: boolean;
  onTap: (side: "a" | "b", actionId: string) => void;
}) {
  return (
    <div className="relative z-30 flex flex-col items-center justify-center gap-2 py-1">
      {actions.map((a) => {
        const label = actionLabel(a, editing);
        return (
          <motion.button
            key={`${side}-${a.id}`}
            type="button"
            // Fire on the pointer-down event for max responsiveness — score the
            // moment a finger lands rather than waiting for tap completion.
            onPointerDown={(e) => {
              // Only main button / primary touch.
              if (e.button !== undefined && e.button !== 0) return;
              pressFeedback();
              onTap(side, a.id);
            }}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.06 }}
            transition={{ type: "spring", stiffness: 700, damping: 22 }}
            className="flex h-14 w-14 min-h-[44px] min-w-[44px] touch-manipulation select-none items-center justify-center rounded-full border-2 border-white/50 bg-transparent text-xl font-black text-white shadow transition-colors hover:bg-white/10 hover:border-white active:bg-white/20"
            style={{ WebkitTapHighlightColor: "transparent" }}
            title={editing ? `${label} (${-a.value})` : `${a.label} (${a.value})`}
          >
            {label}
          </motion.button>
        );
      })}
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
        <span className={`${displayFont} text-3xl text-yellow-300`}>{aValue}</span>
        <span className="text-white/40">|</span>
        <span className={`${displayFont} text-3xl text-yellow-300`}>{bValue}</span>
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
