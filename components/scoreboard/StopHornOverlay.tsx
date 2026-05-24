"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";

/**
 * Fullscreen blocker that appears the instant a hockey goal horn starts.
 * Tap anywhere on the giant red button to silence the horn and go back to
 * the scoreboard. Auto-dismisses when the horn finishes on its own.
 */
export function StopHornOverlay() {
  const hornPlaying = useGameStore((s) => s.hornPlaying);
  const stopHorn = useGameStore((s) => s.stopHorn);

  return (
    <AnimatePresence>
      {hornPlaying && (
        <motion.button
          type="button"
          onClick={stopHorn}
          onTouchStart={stopHorn}
          aria-label="Stop horn"
          className="absolute inset-0 z-[100] flex items-center justify-center overflow-hidden focus:outline-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ touchAction: "manipulation" }}
        >
          {/* Pulsing crimson background */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, #ff1f1f 0%, #7a0010 60%, #2c0006 100%)",
            }}
            animate={{ opacity: [0.92, 1, 0.92] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Glass shine */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-overlay"
            style={{
              background:
                "linear-gradient(140deg, rgba(255,255,255,0.18) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.25) 100%)",
            }}
          />

          {/* The actual button label — a big tappable plate */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-3 px-12 py-8 text-white"
            initial={{ scale: 0.85 }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-sm font-bold uppercase tracking-[0.4em] text-white/80">
              GOAL!
            </span>
            <span className="font-stencil text-[7rem] leading-none tracking-[0.05em] drop-shadow-[0_6px_24px_rgba(0,0,0,0.6)]">
              STOP HORN
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              Tap anywhere to silence
            </span>
          </motion.div>

          {/* Outer glowing ring */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-6 rounded-[2rem] ring-4 ring-white/40"
            animate={{ opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
