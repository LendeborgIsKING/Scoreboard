"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { useShotClockDisplay } from "@/hooks/useShotClockDisplay";
import { useShotClockTick } from "@/hooks/useShotClockTick";

export function ShotClock({
  onClick,
  fontClass = "font-display-stadium",
}: {
  onClick: () => void;
  /** Theme score font (see lib/themeDisplayFont.ts); defaults to stadium stencil */
  fontClass?: string;
}) {
  const sc = useGameStore((s) => s.shotClock);
  useShotClockTick();
  const seconds = useShotClockDisplay();
  const low = seconds <= 5 && seconds > 0;
  if (!sc.enabled) return null;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      animate={
        low
          ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }
          : { scale: 1, opacity: 1 }
      }
      transition={
        low
          ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.2 }
      }
      className={`flex h-10 min-w-[68px] items-center justify-center rounded-md border-2 px-2 ${fontClass} text-3xl leading-none tracking-[0.1em] ${
        low
          ? "border-red-500 bg-red-500/10 text-red-300"
          : "border-orange-400/70 bg-orange-400/5 text-orange-300"
      }`}
      aria-label="Shot clock"
    >
      {seconds}
    </motion.button>
  );
}
