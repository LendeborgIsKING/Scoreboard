"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { ThemeAmbience } from "./ThemeAmbience";
import { CourtAmbience } from "./CourtAmbience";
import { FireAmbience } from "./FireAmbience";
import { formatClockSmart } from "@/lib/format";
import { scoreFontClass } from "@/lib/themeDisplayFont";

export function JumbotronOverlay() {
  const jumbo = useGameStore((s) => s.jumbotron);
  const setJumbo = useGameStore((s) => s.setJumbotron);
  const theme = useGameStore((s) => s.theme);
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  useEffect(() => {
    if (!jumbo) return;
    const totalMs = jumbo.durationSeconds * 1000;
    const tick = () => {
      const elapsed = Date.now() - jumbo.runStartedAt;
      const remain = Math.max(0, totalMs - elapsed);
      setTimeLeftMs(remain);
      if (remain <= 0) {
        setJumbo(null);
      }
    };
    tick();
    const interval = window.setInterval(tick, 100);
    return () => window.clearInterval(interval);
  }, [jumbo, setJumbo]);

  const team = jumbo?.teamId === "a" ? teamA : jumbo?.teamId === "b" ? teamB : null;
  const displayFont = scoreFontClass(theme);

  return (
    <AnimatePresence>
      {jumbo && (
        <motion.div
          className="absolute inset-0 z-[150] flex flex-col items-center justify-center overflow-hidden bg-black text-white"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 opacity-40">
            <ThemeAmbience theme={theme} />
            {theme === "court" && <CourtAmbience />}
            {theme === "fire" && <FireAmbience />}
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
            {team?.logo && (
              <motion.img
                src={team.logo}
                alt={team.name}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.05, 1], opacity: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8 max-h-48 max-w-48 object-contain drop-shadow-2xl"
              />
            )}
            
            <h1
              className="text-6xl font-black uppercase tracking-tight sm:text-8xl drop-shadow-xl"
              style={{ color: team?.color || "#fff" }}
            >
              {jumbo.text}
            </h1>
            
            {jumbo.subtext && (
              <h2 className="mt-4 text-2xl font-bold uppercase tracking-widest text-white/80 drop-shadow-lg sm:text-4xl">
                {jumbo.subtext}
              </h2>
            )}

            <div className={`mt-12 text-8xl font-black tabular-nums tracking-wider sm:text-[140px] drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] ${displayFont}`}>
              {formatClockSmart(timeLeftMs)}
            </div>

            <button
              onClick={() => setJumbo(null)}
              className="mt-16 rounded-full border-2 border-white/30 bg-black/50 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white/70 backdrop-blur transition hover:border-white/80 hover:bg-white/10 hover:text-white"
            >
              Skip / Resume
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
