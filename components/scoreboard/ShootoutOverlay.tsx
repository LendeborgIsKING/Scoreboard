"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";

export function ShootoutOverlay() {
  const shootout = useGameStore((s) => s.shootout);
  const recordShot = useGameStore((s) => s.recordShootoutShot);
  const endShootout = useGameStore((s) => s.endShootout);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);

  if (!shootout?.active) return null;

  const currentTeam = shootout.nextTeam === "a" ? teamA : teamB;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="w-[min(92vw,28rem)] rounded-2xl border border-white/20 bg-zinc-900 p-6 text-center text-white shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">
            {shootout.sport === "hockey" ? "Shootout" : "Penalty Shootout"}
          </p>
          <h2 className="mt-2 text-3xl font-black" style={{ color: currentTeam.color }}>
            {currentTeam.name}
          </h2>
          <div className="mt-6 flex justify-center gap-8 text-4xl font-black">
            <span style={{ color: teamA.color }}>{teamA.name}: {shootout.teamAScore}</span>
            <span className="text-zinc-600">—</span>
            <span style={{ color: teamB.color }}>{teamB.name}: {shootout.teamBScore}</span>
          </div>
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => recordShot(true)}
              className="flex-1 rounded-xl bg-green-600 py-3 font-bold hover:bg-green-500"
            >
              Scored
            </button>
            <button
              type="button"
              onClick={() => recordShot(false)}
              className="flex-1 rounded-xl bg-red-600/80 py-3 font-bold hover:bg-red-500"
            >
              Missed
            </button>
          </div>
          <button
            type="button"
            onClick={endShootout}
            className="mt-4 text-sm text-zinc-500 hover:text-white"
          >
            End shootout
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
