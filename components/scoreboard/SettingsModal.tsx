"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import {
  hasFeature,
  resolveActiveVariant,
  resolveSportConfig,
} from "@/lib/sportRegistry";
import { CheckIcon, CloseIcon, MenuIcon, PencilIcon } from "./UiIcons";

type Props = { onClose: () => void };
type Mode = "menu" | "edit";

export function SettingsModal({ onClose }: Props) {
  const [mode, setMode] = useState<Mode>("menu");

  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const timerVariantId = useGameStore((s) => s.timerVariantId);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const period = useGameStore((s) => s.period);
  const timer = useGameStore((s) => s.timer);

  const setTeamName = useGameStore((s) => s.setTeamName);
  const setPeriod = useGameStore((s) => s.setPeriod);
  const setClockSeconds = useGameStore((s) => s.setClockSeconds);
  const adjustScore = useGameStore((s) => s.adjustScore);
  const adjustFouls = useGameStore((s) => s.adjustFouls);

  const cfg = resolveSportConfig(sportId, customSport);
  const variant = resolveActiveVariant(cfg, timerVariantId);
  const periodLabel = variant?.periodLabel ?? cfg.periodLabel;
  const hasFouls = hasFeature(cfg, "fouls");

  const [homeName, setHomeName] = useState(teamA.name);
  const [awayName, setAwayName] = useState(teamB.name);
  const [periodDraft, setPeriodDraft] = useState(period);
  const [minutesDraft, setMinutesDraft] = useState(
    Math.floor(timer.countdownFromSeconds / 60),
  );
  const [secondsDraft, setSecondsDraft] = useState(
    timer.countdownFromSeconds % 60,
  );

  const applyEdit = () => {
    setTeamName("a", homeName.trim() || "HOME");
    setTeamName("b", awayName.trim() || "AWAY");
    setPeriod(periodDraft);
    const total = Math.max(0, (minutesDraft * 60) + secondsDraft);
    setClockSeconds(total);
  };

  if (mode === "menu") {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <motion.div
          initial={{ y: 16, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative flex h-[390px] w-[844px] flex-col bg-black text-white"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute left-8 top-6 flex flex-col items-center text-white"
            aria-label="Exit settings"
          >
            <CircleShell>
              <MenuIcon className="h-8 w-8" />
            </CircleShell>
            <span className="mt-1 text-3xl font-black">Exit</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-8 top-6 flex flex-col items-center text-white"
            aria-label="Close settings"
          >
            <CircleShell>
              <CloseIcon className="h-8 w-8" />
            </CircleShell>
            <span className="mt-1 text-3xl font-black">Close</span>
          </button>

          <div className="mx-auto mt-24 grid grid-cols-3 gap-8">
            <motion.button
              type="button"
              onClick={() => setMode("edit")}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.04 }}
              className="flex flex-col items-center text-white"
            >
              <CircleShell>
                <PencilIcon className="h-8 w-8" />
              </CircleShell>
              <span className="mt-2 text-4xl font-black">Edit</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="h-[390px] w-[844px] overflow-auto bg-black px-8 py-6 text-white"
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMode("menu")}
            className="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
          >
            Back
          </button>
          <h2 className="font-stencil text-3xl">Edit</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-400">
              Team Names
            </h3>
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500">Home</label>
              <input
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/30"
              />
              <label className="block text-xs text-zinc-500">Away</label>
              <input
                value={awayName}
                onChange={(e) => setAwayName(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-400">
              {periodLabel} / Clock
            </h3>
            <div className="space-y-3">
              <label className="block text-xs text-zinc-500">{periodLabel}</label>
              <input
                type="number"
                min={1}
                value={periodDraft}
                onChange={(e) => setPeriodDraft(Number(e.target.value) || 1)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-zinc-500">Minutes</label>
                  <input
                    type="number"
                    min={0}
                    value={minutesDraft}
                    onChange={(e) =>
                      setMinutesDraft(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500">Seconds</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={secondsDraft}
                    onChange={(e) =>
                      setSecondsDraft(
                        Math.max(0, Math.min(59, Number(e.target.value) || 0)),
                      )
                    }
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-400">
              Subtract Points
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => adjustScore("a", -1)}
                className="rounded-full bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-white/90 active:scale-95"
              >
                Home -1
              </button>
              <button
                type="button"
                onClick={() => adjustScore("a", -2)}
                className="rounded-full bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-white/90 active:scale-95"
              >
                Home -2
              </button>
              <button
                type="button"
                onClick={() => adjustScore("b", -1)}
                className="rounded-full bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-white/90 active:scale-95"
              >
                Away -1
              </button>
              <button
                type="button"
                onClick={() => adjustScore("b", -2)}
                className="rounded-full bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-white/90 active:scale-95"
              >
                Away -2
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-zinc-400">
              Fouls
            </h3>
            {hasFouls ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => adjustFouls("a", -1)}
                  className="rounded-full bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-white/90 active:scale-95"
                >
                  Home Foul -1
                </button>
                <button
                  type="button"
                  onClick={() => adjustFouls("b", -1)}
                  className="rounded-full bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-white/90 active:scale-95"
                >
                  Away Foul -1
                </button>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Fouls are not enabled for this sport.
              </p>
            )}
          </section>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setMode("menu")}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Back
          </button>
          <button
            type="button"
            onClick={applyEdit}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90 active:scale-95"
          >
            <CheckIcon className="h-4 w-4" />
            Apply
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CircleShell({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow">
      {children}
    </span>
  );
}
