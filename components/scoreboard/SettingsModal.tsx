"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { resolveSportConfig } from "@/lib/sportRegistry";
import { playSfx } from "@/lib/audio";
import {
  BuzzerIcon,
  CheckIcon,
  CloseIcon,
  GearIcon,
  MenuIcon,
  PencilIcon,
} from "./UiIcons";

type Props = {
  onClose: () => void;
  onEdit: () => void;
  onStats: () => void;
  onHistory: () => void;
  onSoundboard: () => void;
};

type Panel =
  | "menu"
  | "sound"
  | "music"
  | "theme"
  | "shotclock"
  | "team-colors";

const THEMES: { id: "dark" | "neon" | "classic" | "stadium"; label: string; chip: string }[] = [
  { id: "dark", label: "Dark", chip: "bg-zinc-900" },
  { id: "neon", label: "Neon", chip: "bg-fuchsia-600" },
  { id: "classic", label: "Classic", chip: "bg-stone-700" },
  { id: "stadium", label: "Stadium", chip: "bg-emerald-700" },
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
  onSoundboard,
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
        className="absolute left-1/2 top-1/2 flex h-[390px] w-[844px] -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col bg-black text-white max-sm:landscape:static max-sm:landscape:h-full max-sm:landscape:w-full max-sm:landscape:translate-x-0 max-sm:landscape:translate-y-0 max-sm:landscape:rotate-0"
      >
        <button
          type="button"
          onClick={panel === "menu" ? onClose : () => setPanel("menu")}
          className="absolute left-6 top-4 flex flex-col items-center text-white"
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
          className="absolute right-6 top-4 flex flex-col items-center text-white"
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
            onTeamColors={() => setPanel("team-colors")}
            onStats={onStats}
            onHistory={onHistory}
            onSoundboard={onSoundboard}
          />
        )}
        {panel === "sound" && <SoundPanel />}
        {panel === "music" && <MusicPanel />}
        {panel === "theme" && <ThemePanel />}
        {panel === "shotclock" && <ShotClockPanel />}
        {panel === "team-colors" && <TeamColorsPanel />}
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
  onTeamColors,
  onStats,
  onHistory,
  onSoundboard,
}: {
  onEdit: () => void;
  onSound: () => void;
  onMusic: () => void;
  onTheme: () => void;
  onShotClock: () => void;
  onTeamColors: () => void;
  onStats: () => void;
  onHistory: () => void;
  onSoundboard: () => void;
}) {
  return (
    <div className="mx-auto mt-20 grid grid-cols-5 gap-x-6 gap-y-4 px-10">
      <Tile label="Edit" icon={<PencilIcon className="h-7 w-7" />} onClick={onEdit} />
      <Tile label="Sound" icon={<BuzzerIcon className="h-7 w-7" />} onClick={onSound} />
      <Tile label="Music" icon={<NoteGlyph />} onClick={onMusic} />
      <Tile label="Theme" icon={<PaletteGlyph />} onClick={onTheme} />
      <Tile label="Shot clock" icon={<ClockGlyph />} onClick={onShotClock} />

      <Tile label="Colors" icon={<DropGlyph />} onClick={onTeamColors} />
      <Tile label="Stats" icon={<BarGlyph />} onClick={onStats} />
      <Tile label="History" icon={<ListGlyph />} onClick={onHistory} />
      <Tile
        label="Soundboard"
        icon={<GearIcon className="h-7 w-7" />}
        onClick={onSoundboard}
      />
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
      className="flex flex-col items-center text-white"
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
        Score chimes, period buzzers, win fanfare and the soundboard pads all
        use this volume.
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
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={`flex items-center gap-3 rounded-xl border-2 p-3 transition ${
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
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="w-16 text-sm font-bold">{label}</span>
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
    <div className="mt-20 flex flex-1 flex-col gap-3 overflow-auto px-12 pb-4">
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
