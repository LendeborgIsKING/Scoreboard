"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { hasFeature, resolveSportConfig } from "@/lib/sportRegistry";

export function RefereeTimerOverlay() {
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const timer = useGameStore((s) => s.refereeTimer);
  const dismiss = useGameStore((s) => s.dismissRefereeTimer);
  const cfg = resolveSportConfig(sportId, customSport);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!timer?.active) return;
    const tick = () => {
      const elapsed = (Date.now() - timer.runStartedAt) / 1000;
      const rem = Math.max(0, Math.ceil(timer.durationSeconds - elapsed));
      setRemaining(rem);
      if (rem <= 0) dismiss();
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [timer, dismiss]);

  if (!hasFeature(cfg, "refereeTimers") || !timer?.active) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-[65] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={dismiss}
      >
        <motion.div
          className="rounded-3xl border-2 border-amber-400/60 bg-zinc-950 px-12 py-10 text-center shadow-2xl"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">
            {timer.label}
          </p>
          <p className="mt-4 font-mono text-8xl font-black text-white tabular-nums">
            {remaining}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-6 text-sm text-zinc-500 hover:text-white"
          >
            Dismiss
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function RefereeQuickTimers({
  compact,
  onAfterStart,
}: {
  compact?: boolean;
  /** Close settings / return to scoreboard after starting a timer */
  onAfterStart?: () => void;
}) {
  const start = useGameStore((s) => s.startRefereeTimer);
  const presets = [
    { sec: 20, label: "20s" },
    { sec: 30, label: "30s" },
    { sec: 60, label: "60s" },
    { sec: 90, label: "90s" },
  ];
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-2"}`}>
      {presets.map((p) => (
        <button
          key={p.sec}
          type="button"
          onClick={() => {
            start(p.sec, `${p.label} Timer`);
            onAfterStart?.();
          }}
          className="rounded-full border border-white/30 px-3 py-1 text-xs font-bold text-white hover:bg-white/10"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
