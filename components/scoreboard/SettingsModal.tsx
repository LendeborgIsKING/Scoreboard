"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { resolveSportConfig, effectiveMaxPeriods, resolveActiveVariant } from "@/lib/sportRegistry";
import { BoxScoreTable } from "./BasketballScoreboard";
import { playSfx, playSfxClip } from "@/lib/audio";
import { NHL_TEAMS, NHL_HORN_SRC } from "@/lib/nhlTeams";
import {
  BuzzerIcon,
  CheckIcon,
  CloseIcon,
  MenuIcon,
  PencilIcon,
} from "./UiIcons";
import { MOBILE_SCOREBOARD_SHELL } from "@/lib/mobileClasses";

type Props = {
  onClose: () => void;
  onEdit: () => void;
  onStats: () => void;
  onHistory: () => void;
};

type Panel =
  | "menu"
  | "sound"
  | "music"
  | "theme"
  | "shotclock"
  | "boxscore"
  | "team-colors"
  | "hockey-horn";

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
];

const TRACKS: {
  id: "none" | "hype" | "anthem";
  label: string;
}[] = [
  { id: "none", label: "Off" },
  { id: "hype", label: "Hype (Kernkraft)" },
  { id: "anthem", label: "Anthem (Star-Spangled Banner)" },
];

const SC_PRESETS = [10, 14, 24, 30, 35, 45];

export function SettingsModal({
  onClose,
  onEdit,
  onStats,
  onHistory,
}: Props) {
  const [panel, setPanel] = useState<Panel>("menu");

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm"
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
        className={`absolute left-1/2 top-1/2 flex h-[390px] w-[844px] min-h-0 -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col bg-black text-white ${MOBILE_SCOREBOARD_SHELL}`}
      >
        <button
          type="button"
          onClick={panel === "menu" ? onClose : () => setPanel("menu")}
          className="absolute left-[max(1.5rem,env(safe-area-inset-left))] top-[max(1rem,env(safe-area-inset-top))] flex flex-col items-center text-white"
          aria-label={panel === "menu" ? "Exit settings" : "Back"}
        >
          <CircleShell>
            <MenuIcon className="h-7 w-7" />
          </CircleShell>
          <span className="mt-0.5 text-2xl font-black">
            {panel === "menu" ? "Exit" : "Back"}
          </span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-[max(1.5rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] flex flex-col items-center text-white"
          aria-label="Close settings"
        >
          <CircleShell>
            <CloseIcon className="h-7 w-7" />
          </CircleShell>
          <span className="mt-0.5 text-2xl font-black">Close</span>
        </button>

        {panel === "menu" && (
          <MenuView
            onEdit={onEdit}
            onSound={() => setPanel("sound")}
            onMusic={() => setPanel("music")}
            onTheme={() => setPanel("theme")}
            onShotClock={() => setPanel("shotclock")}
            onBoxScore={() => setPanel("boxscore")}
            onTeamColors={() => setPanel("team-colors")}
            onHockeyHorn={() => setPanel("hockey-horn")}
            onStats={onStats}
            onHistory={onHistory}
          />
        )}
        {panel === "sound" && <SoundPanel />}
        {panel === "music" && <MusicPanel />}
        {panel === "theme" && <ThemePanel />}
        {panel === "shotclock" && <ShotClockPanel />}
        {panel === "boxscore" && <BoxScorePanel />}
        {panel === "team-colors" && <TeamColorsPanel />}
        {panel === "hockey-horn" && <HockeyHornPanel />}
      </motion.div>
    </motion.div>
  );
}

function MenuView({
  onEdit,
  onSound,
  onMusic,
  onTheme,
  onShotClock,
  onBoxScore,
  onTeamColors,
  onHockeyHorn,
  onStats,
  onHistory,
}: {
  onEdit: () => void;
  onSound: () => void;
  onMusic: () => void;
  onTheme: () => void;
  onShotClock: () => void;
  onBoxScore: () => void;
  onTeamColors: () => void;
  onHockeyHorn: () => void;
  onStats: () => void;
  onHistory: () => void;
}) {
  const sportId = useGameStore((s) => s.sportId);
  const isHockey = sportId === "hockey";
  const isBasketball = sportId === "basketball";
  return (
    <div className="mx-auto mt-16 grid max-w-full grid-cols-3 gap-x-4 gap-y-5 px-5 max-sm:mt-14 max-sm:gap-x-3 max-sm:gap-y-4 max-sm:px-4 sm:mt-20 sm:grid-cols-5 sm:gap-x-6 sm:gap-y-4 sm:px-10">
      <Tile label="Edit" icon={<PencilIcon className="h-7 w-7" />} onClick={onEdit} />
      <Tile label="Sound" icon={<BuzzerIcon className="h-7 w-7" />} onClick={onSound} />
      <Tile label="Music" icon={<NoteGlyph />} onClick={onMusic} />
      <Tile label="Theme" icon={<PaletteGlyph />} onClick={onTheme} />
      <Tile label="Shot clock" icon={<ClockGlyph />} onClick={onShotClock} />
      {isBasketball && (
        <Tile label="Box score" icon={<BallGlyph />} onClick={onBoxScore} />
      )}

      <Tile label="Colors" icon={<DropGlyph />} onClick={onTeamColors} />
      <Tile label="Stats" icon={<BarGlyph />} onClick={onStats} />
      <Tile label="History" icon={<ListGlyph />} onClick={onHistory} />
      {isHockey && (
        <Tile label="Goal Horns" icon={<HornGlyph />} onClick={onHockeyHorn} />
      )}
    </div>
  );
}

function Tile({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
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
      <CircleShell>{icon}</CircleShell>
      <span className="mt-1 text-base font-black uppercase tracking-wider">
        {label}
      </span>
    </motion.button>
  );
}

function SoundPanel() {
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const setSfxEnabled = useGameStore((s) => s.setSfxEnabled);
  const setVol = useGameStore((s) => s.setSfxVolumePref);
  return (
    <PanelShell title="Sound effects">
      <ToggleRow
        label="Enable SFX"
        checked={sfxEnabled}
        onChange={setSfxEnabled}
      />
      <SliderRow
        label="Volume"
        value={sfxVolume}
        onChange={(v) => {
          setVol(v);
          if (sfxEnabled) playSfx("ding");
        }}
      />
      <p className="text-xs text-zinc-500">
        Score chimes, period buzzers, and win fanfare use this volume.
      </p>
    </PanelShell>
  );
}

function MusicPanel() {
  const enabled = useGameStore((s) => s.musicEnabled);
  const track = useGameStore((s) => s.musicTrack);
  const volume = useGameStore((s) => s.musicVolume);
  const setEnabled = useGameStore((s) => s.setMusicEnabled);
  const setTrack = useGameStore((s) => s.setMusicTrack);
  const setVol = useGameStore((s) => s.setMusicVolumePref);
  return (
    <PanelShell title="Music">
      <ToggleRow
        label="Enable music"
        checked={enabled}
        onChange={setEnabled}
      />
      <SliderRow label="Volume" value={volume} onChange={setVol} />
      <div className="mt-2 flex flex-wrap gap-2">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTrack(t.id)}
            className={`rounded-full border-2 border-white/50 px-3 py-1.5 text-sm font-bold transition ${
              track === t.id
                ? "bg-white/20 text-white"
                : "bg-transparent text-zinc-300 hover:border-white hover:bg-white/10 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Synthesized in-browser — no downloads, no streaming.
      </p>
    </PanelShell>
  );
}

function ThemePanel() {
  const theme = useGameStore((s) => s.theme);
  const setTheme = useGameStore((s) => s.setTheme);
  return (
    <PanelShell title="Theme">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={`flex flex-col items-start gap-2 rounded-xl border-2 p-3 transition max-sm:p-2.5 sm:flex-row sm:items-center sm:gap-3 ${
              theme === t.id
                ? "border-white bg-white/10"
                : "border-white/10 hover:border-white/30"
            }`}
          >
            <span className={`h-10 w-10 rounded-lg ${t.chip}`} />
            <span className="text-base font-bold">{t.label}</span>
          </button>
        ))}
      </div>
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

  const cfg = resolveSportConfig(sportId, customSport);
  const variant = resolveActiveVariant(cfg, timerVariantId);
  const periodLabel = variant?.periodLabel ?? cfg.periodLabel;
  const maxPeriods =
    effectiveMaxPeriods(cfg, timerVariantId) ?? cfg.maxPeriods ?? 4;

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
  const supported = ["basketball", "football"].includes(cfg.id);

  return (
    <PanelShell title="Shot clock">
      <ToggleRow
        label={`Enable shot clock${supported ? "" : " (any sport)"}`}
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
  return (
    <PanelShell title="Team colors">
      <div className="grid grid-cols-2 gap-4">
        <ColorBlock
          name={teamA.name}
          color={teamA.color}
          palette={PALETTE}
          onPick={(c) => setColor("a", c)}
        />
        <ColorBlock
          name={teamB.name}
          color={teamB.color}
          palette={PALETTE}
          onPick={(c) => setColor("b", c)}
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

function ColorBlock({
  name,
  color,
  palette,
  onPick,
}: {
  name: string;
  color: string;
  palette: string[];
  onPick: (c: string) => void;
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
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-sm font-bold">{label}</span>
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
  return (
    <div className="mt-16 flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-5 pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:mt-14 sm:mt-20 sm:px-12">
      <h3 className="text-center font-stencil text-3xl">{title}</h3>
      {children}
    </div>
  );
}

function CircleShell({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/50 bg-transparent text-white shadow transition hover:bg-white/10 hover:border-white">
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

type HornAssignMode = "list" | "assign-home" | "assign-away";

function HockeyHornPanel() {
  const hornHome = useGameStore((s) => s.hockeyGoalHornHome);
  const hornAway = useGameStore((s) => s.hockeyGoalHornAway);
  const offsets = useGameStore((s) => s.nhlHornOffsets);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const setHornHome = useGameStore((s) => s.setHockeyGoalHornHome);
  const setHornAway = useGameStore((s) => s.setHockeyGoalHornAway);
  const setOffset = useGameStore((s) => s.setNhlHornOffset);

  const [mode, setMode] = useState<HornAssignMode>("list");
  const [editing, setEditing] = useState<string | null>(null);
  const [draftVal, setDraftVal] = useState("");

  const preview = (id: string) => {
    const team = NHL_TEAMS.find((t) => t.id === id);
    if (!team) return;
    const start = offsets[id] ?? team.defaultStart;
    playSfxClip(NHL_HORN_SRC, start, start + team.defaultDuration);
  };

  const commitEdit = (id: string) => {
    const num = parseFloat(draftVal);
    if (!isNaN(num) && num >= 0) setOffset(id, num);
    setEditing(null);
  };

  const homeTeamName = useGameStore((s) => s.teamA.name);
  const awayTeamName = useGameStore((s) => s.teamB.name);
  void teamA; void teamB;

  const homeName = NHL_TEAMS.find((t) => t.id === hornHome)?.name ?? "Default horn";
  const awayName = NHL_TEAMS.find((t) => t.id === hornAway)?.name ?? "Default horn";

  if (mode === "assign-home" || mode === "assign-away") {
    const isHome = mode === "assign-home";
    const currentId = isHome ? hornHome : hornAway;
    const setId = isHome ? setHornHome : setHornAway;
    const sideLabel = isHome ? homeTeamName : awayTeamName;
    return (
      <PanelShell title={`${sideLabel} Horn`}>
        <p className="text-xs text-zinc-500">
          Pick an NHL team horn for <span className="font-bold text-white">{sideLabel}</span>. Tap ▶ to preview.
        </p>
        <button
          type="button"
          onClick={() => { setId(null); setMode("list"); }}
          className={`rounded-full border-2 border-white/50 px-3 py-1.5 text-sm font-bold transition ${
            currentId === null ? "bg-white/20 text-white" : "bg-transparent text-zinc-300 hover:border-white hover:bg-white/10"
          }`}
        >
          Default horn
        </button>
        <div className="mt-1 flex-1 overflow-y-auto pr-1">
          {NHL_TEAMS.map((team) => {
            const start = offsets[team.id] ?? team.defaultStart;
            const isSelected = currentId === team.id;
            const isEditingThis = editing === team.id;
            return (
              <div
                key={team.id}
                className={`mb-1 flex items-center gap-2 rounded-xl border px-3 py-1.5 transition ${
                  isSelected ? "border-white/60 bg-white/10" : "border-white/10 hover:border-white/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => { setId(team.id); setMode("list"); }}
                  className="flex-1 text-left text-sm font-bold"
                >
                  {team.name}
                </button>
                {isEditingThis ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className="w-16 rounded border border-white/30 bg-transparent px-1 py-0.5 text-center text-xs text-white outline-none focus:border-white"
                      value={draftVal}
                      autoFocus
                      onChange={(e) => setDraftVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(team.id);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      onBlur={() => commitEdit(team.id)}
                    />
                    <span className="text-[10px] text-zinc-400">s</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditing(team.id); setDraftVal(String(start)); }}
                    className="w-12 rounded border border-white/20 bg-transparent text-center text-xs text-zinc-400 hover:border-white hover:text-white"
                    title="Tap to edit start time"
                  >
                    {start}s
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => preview(team.id)}
                  className="rounded-full border border-white/50 bg-transparent px-2 py-0.5 text-xs text-white transition hover:border-white hover:bg-white/10"
                  aria-label={`Preview ${team.name}`}
                >
                  ▶
                </button>
              </div>
            );
          })}
        </div>
      </PanelShell>
    );
  }

  // Main list view
  return (
    <PanelShell title="Goal Horns">
      <p className="text-xs text-zinc-500">
        Assign an NHL goal horn to each team. Tap a row to change.
      </p>

      {/* Home assignment */}
      <button
        type="button"
        onClick={() => setMode("assign-home")}
        className="flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/5 px-4 py-3 transition hover:border-white/40 hover:bg-white/10"
      >
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">{homeTeamName} (Home)</div>
          <div className="text-sm font-bold text-white">{homeName}</div>
        </div>
        <span className="text-zinc-400">›</span>
      </button>

      {/* Away assignment */}
      <button
        type="button"
        onClick={() => setMode("assign-away")}
        className="flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/5 px-4 py-3 transition hover:border-white/40 hover:bg-white/10"
      >
        <div className="text-left">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">{awayTeamName} (Away)</div>
          <div className="text-sm font-bold text-white">{awayName}</div>
        </div>
        <span className="text-zinc-400">›</span>
      </button>

      {/* Quick preview of current selections */}
      <div className="mt-1 flex gap-2">
        {hornHome && (
          <button
            type="button"
            onClick={() => preview(hornHome)}
            className="rounded-full border border-white/50 bg-transparent px-3 py-1 text-xs text-white transition hover:border-white hover:bg-white/10"
          >
            ▶ {homeTeamName}
          </button>
        )}
        {hornAway && (
          <button
            type="button"
            onClick={() => preview(hornAway)}
            className="rounded-full border border-white/50 bg-transparent px-3 py-1 text-xs text-white transition hover:border-white hover:bg-white/10"
          >
            ▶ {awayTeamName}
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        Tap a time value in the team picker to calibrate it to the exact second
        in the combined MP3 file.
      </p>
    </PanelShell>
  );
}
