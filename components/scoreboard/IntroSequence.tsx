"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { playSfxClip, setMusic } from "@/lib/audio";

export function IntroSequence() {
  const intro = useGameStore((s) => s.introSequence);
  const advance = useGameStore((s) => s.advanceIntroSequence);
  const dismiss = useGameStore((s) => s.dismissIntroSequence);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);

  useEffect(() => {
    if (!intro?.active) return;
    if (intro.phase === "teamA") {
      setMusic("anthem");
    }
    const id = window.setTimeout(() => advance(), intro.phase === "versus" ? 2500 : 2200);
    return () => window.clearTimeout(id);
  }, [intro, advance]);

  useEffect(() => {
    if (intro?.phase === "versus") {
      playSfxClip("/music/kernkraft.mp3", 0, 8);
    }
  }, [intro?.phase]);

  if (!intro?.active) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-[90] flex flex-col items-center justify-center bg-black text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {intro.phase === "teamA" && (
          <motion.div
            key="a"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            {teamA.logo && (
              <img src={teamA.logo} alt="" className="mx-auto mb-4 h-24 w-24 object-contain" />
            )}
            <h1 className="text-5xl font-black" style={{ color: teamA.color }}>
              {teamA.name}
            </h1>
          </motion.div>
        )}
        {intro.phase === "teamB" && (
          <motion.div
            key="b"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            {teamB.logo && (
              <img src={teamB.logo} alt="" className="mx-auto mb-4 h-24 w-24 object-contain" />
            )}
            <h1 className="text-5xl font-black" style={{ color: teamB.color }}>
              {teamB.name}
            </h1>
          </motion.div>
        )}
        {intro.phase === "versus" && (
          <motion.div
            key="vs"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <p className="text-sm font-bold uppercase tracking-[0.4em] text-zinc-500">
              Tonight&apos;s Matchup
            </p>
            <p className="mt-6 text-4xl font-black">
              <span style={{ color: teamA.color }}>{teamA.name}</span>
              <span className="mx-4 text-zinc-600">VS</span>
              <span style={{ color: teamB.color }}>{teamB.name}</span>
            </p>
          </motion.div>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="absolute bottom-8 text-sm text-zinc-500 hover:text-white"
        >
          Skip intro
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
