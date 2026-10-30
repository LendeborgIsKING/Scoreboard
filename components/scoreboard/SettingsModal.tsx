"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";
import {
  hasFeature,
  resolveSportConfig,
  effectiveMaxPeriods,
  resolveActiveVariant,
} from "@/lib/sportRegistry";
import { BoxScoreTable } from "./BasketballScoreboard";
import { playSfx, playSfxClip } from "@/lib/audio";
import { NHL_TEAMS, NHL_HORN_SRC } from "@/lib/nhlTeams";
import { fileToDownscaledDataUrl } from "@/lib/imageUtils";
import { shareScoreboardImage } from "@/lib/scoreboardImage";
import {
  CheckIcon,
  CloseIcon,
  MenuIcon,
  PencilIcon,
} from "./UiIcons";

import { searchYouTube, type YouTubeSearchResult } from "@/app/actions/youtube";
import { playYouTubeVideo, stopYouTubeVideo } from "@/lib/youtubePlayer";
import { RefereeQuickTimers } from "./RefereeTimerOverlay";
import { HockeyPanel } from "./HockeyPanel";
import {
  FitScreen,
  MenuOverlayHeader,
  MenuPanelBody,
  MobileMenuPortal,
  useLockPageScrollWhileOpen,
} from "./MenuScrollLayout";
import {
  PanelGrid,
  PanelWide,
  SettingsLayoutProvider,
  useSettingsLayout,
} from "./SettingsLayoutContext";
import { usePhoneLandscape } from "@/hooks/usePhoneLandscape";

type Props = {
  onClose: () => void;
  onEdit: () => void;
  onStats: () => void;
  onHistory: () => void;
};

type Panel =
  | "menu"
  | "music"
  | "theme"
  | "shotclock"
  | "boxscore"
  | "game"
  | "team-colors"
  | "hockey-horn"
  | "hockey"
  | "hockey-periods";

const THEMES: { id: import("@/lib/types").ThemeId; label: string; chip: string }[] = [
  { id: "dark",     label: "Dark",     chip: "bg-zinc-900" },
  { id: "classic",  label: "Classic",  chip: "bg-stone-700" },
  { id: "neon",     label: "Neon",     chip: "bg-fuchsia-600" },
  { id: "stadium",  label: "Stadium",  chip: "bg-emerald-700" },
  { id: "fire",     label: "Fire",     chip: "bg-gradient-to-br from-red-700 to-orange-500" },
  { id: "ice",      label: "Ice",      chip: "bg-gradient-to-br from-sky-700 to-cyan-400" },
  { id: "midnight", label: "Midnight", chip: "bg-gradient-to-br from-indigo-900 to-violet-700" },
  { id: "gold",     label: "Gold",     chip: "bg-gradient-to-br from-yellow-600 to-amber-400" },
  { id: "court",    label: "Orange Court", chip: "bg-[#c97438] ring-1 ring-white/40" },
  { id: "retro",    label: "Retro LED", chip: "bg-[radial-gradient(circle,_#16a34a_0%,_#022c11_80%)]" },
  { id: "blackout", label: "Blackout", chip: "bg-black ring-1 ring-white/30" },
];

const TARGET_PRESETS = [11, 15, 21];

const TRACKS: {
  id: "none" | "hype" | "anthem" | "shuffle";
  label: string;
}[] = [
  { id: "none", label: "Off" },
  { id: "hype", label: "Hype (Kernkraft)" },
  { id: "anthem", label: "Anthem (Star-Spangled Banner)" },
  { id: "shuffle", label: "Song Shuffle" },
];

const SC_PRESETS = [10, 14, 24, 30, 35, 45];

const PANEL_TITLES: Record<Panel, string> = {
  menu: "Settings",
  music: "Music",
  theme: "Theme",
  shotclock: "Shot clock",
  boxscore: "Box score",
  game: "Game",
  "team-colors": "Colors",
  "hockey-horn": "Goal horns",
  hockey: "Hockey",
  "hockey-periods": "Period scores",
};

export function SettingsModal({
  onClose,
  onEdit,
  onStats,
  onHistory,
}: Props) {
  const [panel, setPanel] = useState<Panel>("menu");
  const setUiPhase = useGameStore((s) => s.setUiPhase);
  const { isMobile } = useIsMobileDevice();
  const { isPhoneLandscape } = usePhoneLandscape();
  useLockPageScrollWhileOpen();

  const exitToSportMenu = () => {
    onClose();
    setUiPhase("menu");
  };
  const backdropClass = isMobile
    ? "fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm"
    : "absolute inset-0 z-50 bg-black/75 backdrop-blur-sm";
  const shellClass = isMobile
    ? isPhoneLandscape
      ? "fixed inset-0 z-[201] flex min-h-0 w-full flex-col bg-black text-white pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      : "fixed inset-0 z-[201] flex min-h-0 w-full flex-col bg-black text-white"
    : "absolute left-1/2 top-1/2 flex h-[390px] w-[844px] min-h-0 -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col bg-black text-white";

  const overlay = (
    <motion.div
      className={backdropClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className={shellClass}
      >
        <SettingsLayoutProvider>
        <MenuOverlayHeader
          title={PANEL_TITLES[panel]}
          compact={isPhoneLandscape}
          left={
            <button
              type="button"
              onClick={onClose}
              className="flex flex-col items-center text-white"
              aria-label="Cancel and return to scoreboard"
            >
              <CircleShell compact={isPhoneLandscape}>
                <CloseIcon className={isPhoneLandscape ? "h-5 w-5" : "h-7 w-7"} />
              </CircleShell>
            </button>
          }
          right={
            <button
              type="button"
              onClick={
                panel === "menu" ? exitToSportMenu : () => setPanel("menu")
              }
              className="flex flex-col items-center text-white"
              aria-label={panel === "menu" ? "Exit to sport menu" : "Back"}
            >
              <CircleShell compact={isPhoneLandscape}>
                <MenuIcon className={isPhoneLandscape ? "h-5 w-5" : "h-7 w-7"} />
              </CircleShell>
            </button>
          }
        />

        <FitScreen
          key={panel}
          className={
            isPhoneLandscape
              ? "px-[max(0.25rem,env(safe-area-inset-left))]"
              : "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          }
        >
          {panel === "menu" && (
            <MenuView
              onEdit={onEdit}
              onMusic={() => setPanel("music")}
              onTheme={() => setPanel("theme")}
              onShotClock={() => setPanel("shotclock")}
              onBoxScore={() => setPanel("boxscore")}
              onGame={() => setPanel("game")}
              onTeamColors={() => setPanel("team-colors")}
              onHockeyHorn={() => setPanel("hockey-horn")}
              onHockey={() => setPanel("hockey")}
              onHockeyPeriods={() => setPanel("hockey-periods")}
              onStats={onStats}
              onHistory={onHistory}
            />
          )}
          {panel === "music" && <MusicPanel />}
          {panel === "theme" && <ThemePanel />}
          {panel === "shotclock" && <ShotClockPanel />}
          {panel === "boxscore" && <BoxScorePanel />}
          {panel === "game" && <GamePanel onReturnToScoreboard={onClose} />}
          {panel === "team-colors" && <TeamColorsPanel />}
          {panel === "hockey-horn" && <HockeyHornPanel />}
          {panel === "hockey" && (
            <HockeyPanel view="main" onReturnToScoreboard={onClose} />
          )}
          {panel === "hockey-periods" && <HockeyPanel view="periods" />}
        </FitScreen>
        </SettingsLayoutProvider>
      </motion.div>
    </motion.div>
  );

  return <MobileMenuPortal>{overlay}</MobileMenuPortal>;
}

function MenuView({
  onEdit,
  onMusic,
  onTheme,
  onShotClock,
  onBoxScore,
  onGame,
  onTeamColors,
  onHockeyHorn,
  onHockey,
  onHockeyPeriods,
  onStats,
  onHistory,
}: {
  onEdit: () => void;
  onMusic: () => void;
  onTheme: () => void;
  onShotClock: () => void;
  onBoxScore: () => void;
  onGame: () => void;
  onTeamColors: () => void;
  onHockeyHorn: () => void;
  onHockey: () => void;
  onHockeyPeriods: () => void;
  onStats: () => void;
  onHistory: () => void;
}) {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const cfg = resolveSportConfig(sportId, customSport);
  const isHockey = sportId === "hockey";
  const isBasketball = sportId === "basketball";
  const showShotClock = hasFeature(cfg, "shotClock");
  const hockeyPeriodBox = useGameStore((s) => s.hockeyToggles.periodBoxScore);

  const onShare = () => {
    const s = useGameStore.getState();
    const cfg = resolveSportConfig(s.sportId, s.customSport);
    const variant = resolveActiveVariant(
      cfg,
      s.timerVariantId,
      s.customTimerFormat,
    );
    void shareScoreboardImage({
      sportName: cfg.name,
      periodLabel: variant?.periodLabel ?? cfg.periodLabel,
      period: s.period,
      teamA: { name: s.teamA.name, color: s.teamA.color, score: s.teamA.score },
      teamB: { name: s.teamB.name, color: s.teamB.color, score: s.teamB.score },
      periodScores: s.periodScores,
    });
  };

  const { isPhoneLandscape } = useSettingsLayout();

  return (
    <div
      className={
        isPhoneLandscape
          ? "mx-auto grid max-w-5xl grid-cols-6 gap-x-2 gap-y-2 px-2 pb-1"
          : "mx-auto grid max-w-full grid-cols-3 gap-x-4 gap-y-5 px-5 pb-4 max-sm:gap-x-3 max-sm:gap-y-4 max-sm:px-4 sm:grid-cols-5 sm:gap-x-6 sm:gap-y-4 sm:px-10"
      }
    >
      <Tile label="Edit" icon={<PencilIcon className="h-7 w-7" />} onClick={onEdit} compact={isPhoneLandscape} />
      <Tile label="Game" icon={<SlidersGlyph />} onClick={onGame} compact={isPhoneLandscape} />
      <Tile label="Music" icon={<NoteGlyph />} onClick={onMusic} compact={isPhoneLandscape} />
      <Tile label="Theme" icon={<PaletteGlyph />} onClick={onTheme} compact={isPhoneLandscape} />
      {showShotClock && (
        <Tile label="Shot clock" icon={<ClockGlyph />} onClick={onShotClock} compact={isPhoneLandscape} />
      )}
      {isBasketball && (
        <Tile label="Box score" icon={<BallGlyph />} onClick={onBoxScore} compact={isPhoneLandscape} />
      )}

      <Tile label="Colors" icon={<DropGlyph />} onClick={onTeamColors} compact={isPhoneLandscape} />
      <Tile label="Stats" icon={<BarGlyph />} onClick={onStats} compact={isPhoneLandscape} />
      <Tile label="History" icon={<ListGlyph />} onClick={onHistory} compact={isPhoneLandscape} />
      <Tile label="Share" icon={<ShareGlyph />} onClick={onShare} compact={isPhoneLandscape} />
      {isHockey && (
        <>
          <Tile label="Hockey" icon={<HornGlyph />} onClick={onHockey} compact={isPhoneLandscape} />
          <Tile label="Horns" icon={<HornGlyph />} onClick={onHockeyHorn} compact={isPhoneLandscape} />
          {hockeyPeriodBox && (
            <Tile label="Periods" icon={<BallGlyph />} onClick={onHockeyPeriods} compact={isPhoneLandscape} />
          )}
        </>
      )}
    </div>
  );
}

function Tile({
  label,
  icon,
  onClick,
  compact,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        playSfx("click");
        onClick();
      }}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.04 }}
      className="flex flex-col items-center text-white touch-manipulation"
    >
      <CircleShell compact={compact}>{icon}</CircleShell>
      <span
        className={`mt-0.5 text-center font-black uppercase leading-tight ${
          compact ? "text-[9px] tracking-wide" : "text-base tracking-wider"
        }`}
      >
        {label}
      </span>
    </motion.button>
  );
}

function GamePanel({
  onReturnToScoreboard,
}: {
  onReturnToScoreboard?: () => void;
}) {
  const autoStart = useGameStore((s) => s.autoStartClockOnScore);
  const setAutoStart = useGameStore((s) => s.setAutoStartClockOnScore);
  const keepAwake = useGameStore((s) => s.keepAwakeEnabled);
  const setKeepAwake = useGameStore((s) => s.setKeepAwakeEnabled);
  const targetEnabled = useGameStore((s) => s.targetScoreEnabled);
  const setTargetEnabled = useGameStore((s) => s.setTargetScoreEnabled);
  const targetScore = useGameStore((s) => s.targetScore);
  const setTargetScore = useGameStore((s) => s.setTargetScore);
  const confettiEnabled = useGameStore((s) => s.confettiEnabled);
  const setConfettiEnabled = useGameStore((s) => s.setConfettiEnabled);
  const bannersEnabled = useGameStore((s) => s.bannersEnabled);
  const setBannersEnabled = useGameStore((s) => s.setBannersEnabled);
  const resetScoresOnly = useGameStore((s) => s.resetScoresOnly);
  const startShootout = useGameStore((s) => s.startShootout);
  const preGameSetup = useGameStore((s) => s.preGameSetup);
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const cfg = resolveSportConfig(sportId, customSport);
  const showTargetScore = hasFeature(cfg, "targetScore");
  const showRefereeTimers = hasFeature(cfg, "refereeTimers");

  return (
    <PanelShell title="Game">
      <PanelGrid>
      <ToggleRow
        label="Auto-start clock on first score"
        checked={autoStart}
        onChange={setAutoStart}
      />
      <ToggleRow
        label="Keep screen awake"
        checked={keepAwake}
        onChange={setKeepAwake}
      />

      {showTargetScore && (
        <>
          <ToggleRow
            label="Win at a target score"
            checked={targetEnabled}
            onChange={setTargetEnabled}
          />
          {targetEnabled && (
            <PanelWide>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-sm font-bold">Target</span>
              <div className="flex flex-wrap gap-2">
                {TARGET_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTargetScore(n)}
                    className={`rounded-full border-2 px-3 py-1 text-sm font-bold transition ${
                      targetScore === n
                        ? "border-white bg-white/20 text-white"
                        : "border-white/40 text-zinc-300 hover:border-white hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="ml-auto w-16 rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-center text-base font-black text-white outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            </PanelWide>
          )}
        </>
      )}

      <ToggleRow
        label="Confetti on big plays"
        checked={confettiEnabled}
        onChange={setConfettiEnabled}
      />
      <ToggleRow
        label="Play banners (BUCKET!, etc.)"
        checked={bannersEnabled}
        onChange={setBannersEnabled}
      />

      {showRefereeTimers && (
        <PanelWide>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-sm font-bold">Referee quick timers</span>
          <RefereeQuickTimers onAfterStart={onReturnToScoreboard} />
        </div>
        </PanelWide>
      )}

      {sportId === "soccer" && preGameSetup.penaltyShootoutEnabled && (
        <PanelWide>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-bold text-white">Penalty shootout</p>
          <p className="mt-1 text-xs text-zinc-500">
            Five kicks per team, then sudden death if still tied.
          </p>
          <button
            type="button"
            onClick={() => {
              startShootout("soccer");
              onReturnToScoreboard?.();
            }}
            className="mt-3 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"
          >
            Start penalties
          </button>
        </div>
        </PanelWide>
      )}
      {sportId === "hockey" && (
        <PanelWide>
        <p className="text-xs text-zinc-500">
          Shootout and overtime options are in Settings → Hockey.
        </p>
        </PanelWide>
      )}

      <PanelWide>
      <button
        type="button"
        onClick={() => resetScoresOnly()}
        className="mt-1 inline-flex items-center gap-2 self-start rounded-full border-2 border-white/50 bg-transparent px-4 py-1.5 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
      >
        Reset scores only
      </button>
      <p className="text-xs text-zinc-500">
        Reset scores clears points, fouls, and the period but keeps teams,
        colors, theme, and clock settings.
      </p>
      </PanelWide>
      </PanelGrid>
    </PanelShell>
  );
}

function MusicPanel() {
  const enabled = useGameStore((s) => s.musicEnabled);
  const track = useGameStore((s) => s.musicTrack);
  const volume = useGameStore((s) => s.musicVolume);
  const youtubeVideoId = useGameStore((s) => s.youtubeVideoId);
  const setEnabled = useGameStore((s) => s.setMusicEnabled);
  const setTrack = useGameStore((s) => s.setMusicTrack);
  const setVol = useGameStore((s) => s.setMusicVolumePref);
  const setYoutubeVideoId = useGameStore((s) => s.setYoutubeVideoId);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await searchYouTube(query);
    setResults(res);
    setLoading(false);
  };

  return (
    <PanelShell title="Music">
      <PanelGrid>
      <ToggleRow
        label="Enable music"
        checked={enabled}
        onChange={setEnabled}
      />
      <SliderRow label="Volume" value={volume} onChange={setVol} />
      <PanelWide>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTrack(t.id)}
            className={`rounded-full border-2 border-white/50 px-3 py-1.5 text-sm font-bold transition ${
              track === t.id && !youtubeVideoId
                ? "bg-white/20 text-white"
                : "bg-transparent text-zinc-300 hover:border-white hover:bg-white/10 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      </PanelWide>
      
      {/* Mini YouTube Screen */}
      <PanelWide>
      <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-zinc-400">YouTube Player</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube..."
            className="flex-1 rounded-lg border border-white/20 bg-black/60 px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-white/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-white/10 px-4 py-1.5 text-sm font-bold transition hover:bg-white/20 disabled:opacity-50"
          >
            Search
          </button>
        </form>
        
        {results.length > 0 && !youtubeVideoId && (
          <div className="mt-3 flex flex-col gap-2">
            {results.slice(0, 3).map((vid) => (
              <button
                key={vid.id}
                type="button"
                onClick={() => {
                  setTrack("youtube");
                  setYoutubeVideoId(vid.id);
                  setEnabled(true);
                  playYouTubeVideo(vid.id);
                  setResults([]);
                }}
                className="flex items-center gap-3 rounded-lg border border-white/10 p-2 text-left hover:bg-white/5 transition"
              >
                {vid.thumbnail && (
                  <img src={vid.thumbnail} alt="" className="h-10 w-16 rounded object-cover" />
                )}
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-sm font-bold text-zinc-200">{vid.title}</div>
                  <div className="text-xs text-zinc-500">{vid.channelName} • {vid.durationFormatted}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {youtubeVideoId && (
          <div className="mt-3 flex flex-col gap-2">
            <div className="text-sm font-bold text-green-400">
              ▶ A YouTube player opened on screen — tap play if audio does not
              start automatically.
            </div>
            <button
              type="button"
              onClick={() => {
                stopYouTubeVideo();
                setYoutubeVideoId(null);
                setTrack("none");
                setEnabled(false);
              }}
              className="mt-1 rounded-lg bg-red-600/20 px-3 py-1.5 text-sm font-bold text-red-300 transition hover:bg-red-600/30"
            >
              Stop YouTube
            </button>
          </div>
        )}
      </div>
      </PanelWide>

      <PanelWide>
      <p className="mt-3 text-xs text-zinc-500">
        Background music plays normally. Final Countdown interrupts and turns other music off.
      </p>
      </PanelWide>
      </PanelGrid>
    </PanelShell>
  );
}

function ThemePanel() {
  const theme = useGameStore((s) => s.theme);
  const setTheme = useGameStore((s) => s.setTheme);
  const { isPhoneLandscape } = useSettingsLayout();

  return (
    <PanelShell title="Theme">
      <p className="text-center text-xs text-zinc-500">
        Pick a scoreboard look. The active theme is highlighted.
      </p>
      <ul
        className={`mx-auto grid w-full list-none gap-2 p-0 ${
          isPhoneLandscape
            ? "max-w-4xl grid-cols-4"
            : "max-w-xs grid-cols-3"
        }`}
      >
        {THEMES.map((t) => {
          const selected = theme === t.id;
          return (
            <li key={t.id} className="min-w-0">
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`Theme: ${t.label}`}
                onClick={() => {
                  playSfx("click");
                  setTheme(t.id);
                }}
                className={`flex w-full flex-col items-center gap-2 rounded-2xl border px-1.5 py-2.5 transition touch-manipulation ${
                  selected
                    ? "border-white bg-white/12"
                    : "border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]"
                }`}
              >
                <span
                  className={`relative block h-10 w-10 shrink-0 rounded-full shadow-inner ring-2 ${t.chip} ${
                    selected ? "ring-white" : "ring-white/25"
                  }`}
                >
                  {selected && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/25">
                      <CheckIcon className="h-5 w-5 text-white drop-shadow" />
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center text-[11px] font-semibold leading-tight text-zinc-200">
                  {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </PanelShell>
  );
}

function BoxScorePanel() {
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
    4;

  return (
    <PanelShell title="Box score">
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

function ShotClockPanel() {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const cfg = resolveSportConfig(sportId, customSport);
  const sc = useGameStore((s) => s.shotClock);
  const setEnabled = useGameStore((s) => s.setShotClockEnabled);
  const setDuration = useGameStore((s) => s.setShotClockDuration);
  if (!hasFeature(cfg, "shotClock")) {
    return (
      <PanelShell title="Shot clock">
        <p className="text-sm text-zinc-400">
          Shot clock is available for basketball only. Pick basketball from the
          sport menu to use it.
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Shot clock">
      <ToggleRow
        label="Enable shot clock"
        checked={sc.enabled}
        onChange={setEnabled}
      />
      <div className="mt-1 flex flex-wrap gap-2">
        {SC_PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setDuration(s)}
            className={`rounded-full border-2 border-white/50 px-3 py-1.5 text-sm font-bold transition ${
              sc.durationSeconds === s
                ? "bg-white/20 text-white"
                : "bg-transparent text-zinc-300 hover:border-white hover:bg-white/10 hover:text-white"
            }`}
          >
            {s}s
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Shows above the main clock. Tap to start/pause; auto-buzzes at 0.
      </p>
    </PanelShell>
  );
}

function TeamColorsPanel() {
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const setColor = useGameStore((s) => s.setTeamColor);
  const setLogo = useGameStore((s) => s.setTeamLogo);
  const swap = useGameStore((s) => s.swapTeams);
  const PALETTE = [
    "#22c55e",
    "#3b82f6",
    "#ef4444",
    "#f59e0b",
    "#a855f7",
    "#06b6d4",
    "#ec4899",
    "#facc15",
  ];
  const { isPhoneLandscape } = useSettingsLayout();
  return (
    <PanelShell title="Team colors & logos">
      <div className={`grid gap-4 ${isPhoneLandscape ? "grid-cols-2 gap-2" : "grid-cols-2"}`}>
        <ColorBlock
          name={teamA.name}
          color={teamA.color}
          palette={PALETTE}
          logo={teamA.logo ?? null}
          onPick={(c) => setColor("a", c)}
          onLogo={(d) => setLogo("a", d)}
        />
        <ColorBlock
          name={teamB.name}
          color={teamB.color}
          palette={PALETTE}
          logo={teamB.logo ?? null}
          onPick={(c) => setColor("b", c)}
          onLogo={(d) => setLogo("b", d)}
        />
      </div>
      <button
        type="button"
        onClick={swap}
        className="mt-3 inline-flex items-center gap-2 self-start rounded-full border-2 border-white/50 bg-transparent px-4 py-1.5 text-sm font-bold text-white transition hover:border-white hover:bg-white/10"
      >
        <CheckIcon className="h-4 w-4" />
        Swap home / away
      </button>
    </PanelShell>
  );
}

function LogoUploader({
  logo,
  onLogo,
}: {
  logo: string | null;
  onLogo: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="mt-3 flex items-center gap-2">
      {logo ? (
        <img
          src={logo}
          alt="Team logo"
          className="h-9 w-9 rounded object-contain ring-1 ring-white/20"
        />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded bg-white/5 text-[10px] text-white/40 ring-1 ring-white/10">
          none
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const url = await fileToDownscaledDataUrl(file, 96);
            onLogo(url);
          } catch {
            /* ignore unreadable image */
          }
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-full border border-white/40 px-3 py-1 text-xs font-bold text-white transition hover:border-white hover:bg-white/10"
      >
        Upload
      </button>
      {logo && (
        <button
          type="button"
          onClick={() => onLogo(null)}
          className="rounded-full border border-white/20 px-3 py-1 text-xs text-zinc-400 transition hover:border-white/60 hover:text-white"
        >
          Remove
        </button>
      )}
    </div>
  );
}

function ColorBlock({
  name,
  color,
  palette,
  logo,
  onPick,
  onLogo,
}: {
  name: string;
  color: string;
  palette: string[];
  logo: string | null;
  onPick: (c: string) => void;
  onLogo: (dataUrl: string | null) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-5 w-5 rounded-full border border-white/20"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-black uppercase tracking-widest">
          {name}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {palette.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            className={`h-8 w-8 rounded-full ring-2 ${
              color.toLowerCase() === c.toLowerCase()
                ? "ring-white"
                : "ring-transparent"
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Choose ${c}`}
          />
        ))}
      </div>
      <LogoUploader logo={logo} onLogo={onLogo} />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const { isPhoneLandscape } = useSettingsLayout();
  return (
    <label
      className={`flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 ${
        isPhoneLandscape ? "px-2 py-1.5" : "px-3 py-2"
      }`}
    >
      <span className={`font-bold ${isPhoneLandscape ? "text-xs leading-tight" : "text-sm"}`}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-lime-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="w-full text-sm font-bold sm:w-16">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-lime-400"
      />
      <span className="w-10 text-right font-stencil text-base">
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

function PanelShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return <MenuPanelBody title={title}>{children}</MenuPanelBody>;
}

function CircleShell({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <span
      className={`flex items-center justify-center rounded-full border-2 border-white/50 bg-transparent text-white shadow transition hover:bg-white/10 hover:border-white [&_svg]:shrink-0 ${
        compact ? "h-10 w-10 [&_svg]:h-5 [&_svg]:w-5" : "h-14 w-14"
      }`}
    >
      {children}
    </span>
  );
}

function NoteGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M9 17V5l11-2v12a3 3 0 1 1-2-2.83V6.42L11 8.06V17a3 3 0 1 1-2-2.83Z" />
    </svg>
  );
}

function PaletteGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2v-1a2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 10 10 0 0 0-10-11Zm-5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm1-13h-2v6l5 3 1-1.6L13 11V7Z" />
    </svg>
  );
}

function BallGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M7 7c3 2 7 2 10 0M7 17c3-2 7-2 10 0" strokeWidth="1.5" />
    </svg>
  );
}

function DropGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M12 2.5C8.5 6 5 9.5 5 14a7 7 0 1 0 14 0c0-4.5-3.5-8-7-11.5Z" />
    </svg>
  );
}

function SlidersGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M3 7h10a3 3 0 0 1 5.66 0H21v2h-2.34a3 3 0 0 1-5.66 0H3V7Zm0 8h2.34a3 3 0 0 1 5.66 0h10v2H11a3 3 0 0 1-5.66 0H3v-2Z" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.9a3 3 0 0 0 0-2.6l6.7-3.9a3 3 0 1 0-.9-1.6L8 9.1a3 3 0 1 0 0 5.8l6.7 3.9A3 3 0 1 0 18 16Z" />
    </svg>
  );
}

function BarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M3 17h4v4H3v-4Zm6-7h4v11H9V10Zm6-7h4v18h-4V3Z" />
    </svg>
  );
}

function ListGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M4 5h16v2H4V5Zm0 6h16v2H4v-2Zm0 6h16v2H4v-2Z" />
    </svg>
  );
}

function HornGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
      <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02ZM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77Z" />
    </svg>
  );
}

function HockeyHornPanel() {
  const hornHome = useGameStore((s) => s.hockeyGoalHornHome);
  const hornAway = useGameStore((s) => s.hockeyGoalHornAway);
  const offsets = useGameStore((s) => s.nhlHornOffsets);
  const setHornHome = useGameStore((s) => s.setHockeyGoalHornHome);
  const setHornAway = useGameStore((s) => s.setHockeyGoalHornAway);
  const setOffset = useGameStore((s) => s.setNhlHornOffset);
  const homeTeamName = useGameStore((s) => s.teamA.name);
  const awayTeamName = useGameStore((s) => s.teamB.name);

  const preview = (id: string) => {
    const team = NHL_TEAMS.find((t) => t.id === id);
    if (!team) return;
    const start = offsets[id] ?? team.defaultStart;
    playSfxClip(NHL_HORN_SRC, start, start + team.defaultDuration);
  };

  const { isPhoneLandscape } = useSettingsLayout();
  return (
    <PanelShell title="Goal Horns">
      <div className={isPhoneLandscape ? "grid grid-cols-2 gap-2" : "flex flex-col gap-3"}>
      <HornPicker
        sideLabel={`${homeTeamName} · Home`}
        hornId={hornHome}
        offsets={offsets}
        onPick={setHornHome}
        onOffset={setOffset}
        onPreview={preview}
      />
      <HornPicker
        sideLabel={`${awayTeamName} · Away`}
        hornId={hornAway}
        offsets={offsets}
        onPick={setHornAway}
        onOffset={setOffset}
        onPreview={preview}
      />
      </div>
      <p className="text-center text-xs text-zinc-500">
        Start time sets where the clip begins in the horn file.
      </p>
    </PanelShell>
  );
}

function HornPicker({
  sideLabel,
  hornId,
  offsets,
  onPick,
  onOffset,
  onPreview,
}: {
  sideLabel: string;
  hornId: string | null;
  offsets: Record<string, number>;
  onPick: (id: string | null) => void;
  onOffset: (id: string, seconds: number) => void;
  onPreview: (id: string) => void;
}) {
  const team = hornId ? NHL_TEAMS.find((t) => t.id === hornId) : undefined;
  const start = team ? offsets[team.id] ?? team.defaultStart : null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <span className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        {sideLabel}
      </span>
      <select
        value={hornId ?? ""}
        onChange={(e) => onPick(e.target.value || null)}
        className="w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2.5 text-center text-base font-semibold text-white"
      >
        <option value="">Default horn</option>
        {NHL_TEAMS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {team && start !== null && (
        <div className="flex items-center justify-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-zinc-400">
            Start
            <input
              key={team.id}
              type="number"
              min={0}
              step={0.1}
              defaultValue={start}
              onBlur={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num) && num >= 0) onOffset(team.id, num);
              }}
              className="w-16 rounded-lg border border-white/20 bg-transparent px-2 py-1 text-center text-sm text-white outline-none focus:border-white"
            />
            s
          </label>
          <button
            type="button"
            onClick={() => onPreview(team.id)}
            className="rounded-full border border-white/50 px-4 py-1 text-sm text-white transition hover:border-white hover:bg-white/10"
            aria-label={`Preview ${team.name}`}
          >
            ▶ Preview
          </button>
        </div>
      )}
    </div>
  );
}

