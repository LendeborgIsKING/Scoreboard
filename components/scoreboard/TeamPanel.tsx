"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { TeamId, TeamState } from "@/lib/types";
import { useGameStore } from "@/lib/gameStore";

type Props = {
  team: TeamId;
  data: TeamState;
  active: boolean;
  hype: boolean;
};

export function TeamPanel({ team, data, active, hype }: Props) {
  const setPossession = useGameStore((s) => s.setPossession);

  return (
    <motion.div
      data-team={team}
      layout
      className={`relative flex min-h-[min(40vh,320px)] flex-1 flex-col items-center justify-center rounded-3xl border-2 px-4 py-8 transition-shadow duration-300 sm:px-8 ${
        active
          ? "border-white/30 shadow-[0_0_60px_-10px_rgba(255,255,255,0.35)]"
          : "border-white/10 shadow-none"
      }`}
      style={{
        background: `linear-gradient(165deg, ${data.color}22 0%, transparent 55%), rgba(15,15,18,0.85)`,
        boxShadow: active
          ? `0 0 80px -20px ${data.color}88, inset 0 0 60px -30px ${data.color}44`
          : undefined,
      }}
    >
      <button
        type="button"
        onClick={() => setPossession(team)}
        className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400 transition hover:text-zinc-200"
      >
        {data.name}
      </button>
      <div className="relative">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={data.score}
            initial={{ scale: hype ? 1.25 : 1.08, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0.4 }}
            transition={{
              type: "spring",
              stiffness: hype ? 420 : 500,
              damping: hype ? 22 : 30,
            }}
            className="font-mono text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-lg sm:text-8xl md:text-9xl"
            style={{ textShadow: `0 0 40px ${data.color}99` }}
          >
            {data.score}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
