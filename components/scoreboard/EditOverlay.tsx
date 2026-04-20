"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import {
  hasFeature,
  resolveActiveVariant,
  resolveSportConfig,
} from "@/lib/sportRegistry";
import { formatSeconds } from "@/lib/format";
import { SportLineIcon } from "./SportLineIcons";
import { PickerWheel } from "./PickerWheel";
import {
  BuzzerIcon,
  CheckIcon,
  PlayIcon,
  StopwatchIcon,
  TriangleLeftIcon,
  TriangleRightIcon,
  WhistleIcon,
} from "./UiIcons";

type Props = { onClose: () => void };
type Popover = null | "period" | "clock" | "teamA" | "teamB";

const PERIOD_VALUES = Array.from({ length: 20 }, (_, i) => i + 1);
const MIN_VALUES = Array.from({ length: 61 }, (_, i) => i);
const SEC_VALUES = Array.from({ length: 60 }, (_, i) => i);
const DEC_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function EditOverlay({ onClose }: Props) {
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

  const [popover, setPopover] = useState<Popover>(null);
  const [homeDraft, setHomeDraft] = useState(teamA.name);
  const [awayDraft, setAwayDraft] = useState(teamB.name);

  const totalSec = timer.countdownFromSeconds;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const [minDraft, setMinDraft] = useState(min);
  const [secDraft, setSecDraft] = useState(sec);
  const [decDraft, setDecDraft] = useState(0);

  const commitHome = () => {
    const next = homeDraft.trim() || "HOME";
    if (next !== teamA.name) setTeamName("a", next);
  };
  const commitAway = () => {
    const next = awayDraft.trim() || "AWAY";
    if (next !== teamB.name) setTeamName("b", next);
  };
  const commitClock = () => {
    const total = Math.max(0, minDraft * 60 + secDraft);
    if (total !== totalSec) setClockSeconds(total);
  };

  const closePopover = () => {
    if (popover === "teamA") commitHome();
    if (popover === "teamB") commitAway();
    if (popover === "clock") commitClock();
    setPopover(null);
  };

  const onApply = () => {
    commitHome();
    commitAway();
    commitClock();
    onClose();
  };

  return (
    <motion.div
      className="absolute inset-0 z-40 overflow-hidden bg-black text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 8, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative h-full w-full overflow-hidden bg-black text-white"
      >
        <CornerBtn
          position="left"
          ariaLabel="Stopwatch (set clock)"
          onClick={() => setPopover("clock")}
        >
          <StopwatchIcon className="h-8 w-8" />
        </CornerBtn>

        <button
          type="button"
          className="absolute left-28 top-6 flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow"
          aria-label="Play/pause (disabled in edit)"
          disabled
        >
          <PlayIcon className="h-8 w-8" />
        </button>

        <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-4">
          <button
            type="button"
            onClick={() => setPopover("clock")}
            className="font-stencil text-5xl tracking-[0.1em] text-red-500"
            style={{
              padding: "6px 14px",
              border: "2px dashed #ef4444",
              borderRadius: 10,
            }}
            aria-label="Edit clock"
          >
            {formatSeconds(totalSec)}
          </button>
          <button
            type="button"
            onClick={() => setPopover("period")}
            className="font-stencil text-3xl tracking-[0.1em] text-white"
            style={{
              padding: "6px 10px",
              border: "2px dashed rgba(255,255,255,0.6)",
              borderRadius: 10,
            }}
            aria-label="Edit period"
          >
            {ordinal(period)}
          </button>
        </div>

        <CornerBtn
          position="right"
          ariaLabel="Apply edits"
          onClick={onApply}
        >
          <CheckIcon className="h-8 w-8" />
        </CornerBtn>

        <div className="absolute left-24 right-24 top-[90px] grid grid-cols-[1fr_auto_1fr] items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setPopover("teamA")}
              className="w-full text-center"
            >
              <div
                className="mx-auto inline-block px-4 py-1 text-xl font-black text-white"
                style={{
                  border: "2px dashed rgba(255,255,255,0.7)",
                  borderRadius: 10,
                }}
              >
                {teamA.name}
              </div>
            </button>
            <div className="font-stencil text-[110px] leading-[0.9] text-lime-400">
              {teamA.score}
            </div>
            <TimeoutDots count={teamA.timeouts} />
          </div>

          <div className="flex flex-col items-center gap-2 pt-3 text-white/90">
            <SportLineIcon sportId={cfg.id} className="h-10 w-10 text-white" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setPopover("teamB")}
              className="w-full text-center"
            >
              <div
                className="mx-auto inline-block px-4 py-1 text-xl font-black text-white"
                style={{
                  border: "2px dashed rgba(255,255,255,0.7)",
                  borderRadius: 10,
                }}
              >
                {teamB.name}
              </div>
            </button>
            <div className="font-stencil text-[110px] leading-[0.9] text-lime-400">
              {teamB.score}
            </div>
            <TimeoutDots count={teamB.timeouts} />
          </div>
        </div>

        <div className="absolute left-3 top-[100px] flex flex-col gap-2">
          {[-1, -2, -3].map((n) => (
            <ScorePill
              key={`a${n}`}
              label={String(n)}
              onClick={() => adjustScore("a", n)}
            />
          ))}
        </div>
        <div className="absolute right-3 top-[100px] flex flex-col gap-2">
          {[-1, -2, -3].map((n) => (
            <ScorePill
              key={`b${n}`}
              label={String(n)}
              onClick={() => adjustScore("b", n)}
            />
          ))}
        </div>

        {hasFouls && (
          <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
            <div className="flex items-center gap-3 text-white">
              <button
                type="button"
                onClick={() => adjustFouls("a", -1)}
                className="text-red-500 hover:text-red-300"
                aria-label="Team 1 foul -1"
              >
                <TriangleLeftIcon className="h-7 w-7" />
              </button>
              <span className="text-lg font-black tracking-widest text-white">
                Fouls
              </span>
              <button
                type="button"
                onClick={() => adjustFouls("b", -1)}
                className="text-red-500 hover:text-red-300"
                aria-label="Team 2 foul -1"
              >
                <TriangleRightIcon className="h-7 w-7" />
              </button>
            </div>
            <div className="flex items-center gap-3 font-stencil text-2xl text-yellow-300">
              <button
                type="button"
                onClick={() => adjustFouls("a", 1)}
                className="rounded-full border border-red-500 px-2 text-sm text-red-500"
                aria-label="Team 1 foul +1"
              >
                -
              </button>
              <span>{teamA.fouls}</span>
              <span className="text-white/60">X</span>
              <span>{teamB.fouls}</span>
              <button
                type="button"
                onClick={() => adjustFouls("b", 1)}
                className="rounded-full border border-red-500 px-2 text-sm text-red-500"
                aria-label="Team 2 foul +1"
              >
                -
              </button>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex items-center gap-2 text-white/70">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40"
            aria-label="Buzzer"
          >
            <BuzzerIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40"
            aria-label="Whistle"
          >
            <WhistleIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          {periodLabel} / {cfg.name} - edit
        </div>

        <AnimatePresence>
          {popover && (
            <motion.div
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/60"
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
                    <span className="pb-[90px] font-stencil text-3xl text-white">:</span>
                    <PickerWheel
                      values={SEC_VALUES}
                      value={secDraft}
                      onChange={(v) => setSecDraft(Number(v))}
                      label="SEC"
                      width={64}
                    />
                    <span className="pb-[90px] font-stencil text-3xl text-white">.</span>
                    <PickerWheel
                      values={DEC_VALUES}
                      value={decDraft}
                      onChange={(v) => setDecDraft(Number(v))}
                      label="DEC"
                      width={64}
                    />
                  </div>
                )}

                {(popover === "teamA" || popover === "teamB") && (
                  <div className="flex w-[320px] flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      {popover === "teamA" ? "Team 1" : "Team 2"}
                    </label>
                    <input
                      autoFocus
                      value={popover === "teamA" ? homeDraft : awayDraft}
                      onChange={(e) =>
                        popover === "teamA"
                          ? setHomeDraft(e.target.value)
                          : setAwayDraft(e.target.value)
                      }
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
      </motion.div>
    </motion.div>
  );
}

function CornerBtn({
  children,
  position,
  ariaLabel,
  onClick,
}: {
  children: ReactNode;
  position: "left" | "right";
  ariaLabel: string;
  onClick: () => void;
}) {
  const side = position === "left" ? "left-6" : "right-6";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.04 }}
      aria-label={ariaLabel}
      className={`absolute top-6 ${side} flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow`}
    >
      {children}
    </motion.button>
  );
}

function ScorePill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.08 }}
      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-red-500 bg-black font-black text-red-400"
    >
      {label}
    </motion.button>
  );
}

function TimeoutDots({ count }: { count: number }) {
  const dots = Math.max(0, Math.min(5, count));
  return (
    <div className="flex items-center justify-center gap-1 rounded-full border border-white/20 px-2 py-[3px]">
      {Array.from({ length: dots }).map((_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full bg-white" />
      ))}
      {dots === 0 && <span className="text-[10px] text-white/50">0</span>}
    </div>
  );
}
