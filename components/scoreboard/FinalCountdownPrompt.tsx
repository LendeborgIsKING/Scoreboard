"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";

/**
 * Compact prompt that pops up once per game during the final minute of the
 * final period. Tap PLAY IT! to start Europe's "The Final Countdown" from
 * the iconic synth hook (13 s in). Tap "Not now" to dismiss.
 */
export function FinalCountdownPrompt() {
  const visible = useGameStore((s) => s.finalCountdownPromptVisible);
  const dismiss = useGameStore((s) => s.dismissFinalCountdownPrompt);
  const play = useGameStore((s) => s.playFinalCountdown);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[80] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            initial={{ y: 40, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 24 }}
            className="pointer-events-auto mb-12 flex max-w-[min(92%,540px)] flex-col items-center gap-3 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-zinc-900/95 to-zinc-950/95 px-6 py-5 text-center text-white shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.45em] text-amber-300">
              Final Minute
            </span>
            <p className="text-xl font-black leading-tight">
              Play{" "}
              <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                &ldquo;The Final Countdown&rdquo;
              </span>
              ?
            </p>
            <p className="-mt-1 text-xs text-zinc-400">
              Europe · 1986 · let the synth carry you home
            </p>
            <div className="mt-2 flex items-center gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 700, damping: 22 }}
                onClick={play}
                className="rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 px-6 py-2.5 text-sm font-black uppercase tracking-[0.18em] text-amber-950 shadow-[0_6px_18px_-4px_rgba(250,204,21,0.55)]"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Play it!
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 700, damping: 22 }}
                onClick={dismiss}
                className="rounded-full border border-white/30 bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-zinc-300 hover:text-white hover:border-white/70"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Not now
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
