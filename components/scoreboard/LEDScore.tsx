"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Digit({ value, colorClass, tint }: { value: string; colorClass: string; tint?: string }) {
  return (
    <div className="relative h-[1em] w-[0.65em] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`absolute inset-0 flex items-center justify-center ${colorClass}`}
          style={tint ? { color: tint } : undefined}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function LEDScore({
  value,
  colorClass,
  tint,
  displayFont,
  ledMode,
}: {
  value: number;
  colorClass: string;
  tint?: string;
  displayFont: string;
  ledMode: boolean;
}) {
  const prev = useRef(value);
  const changed = value !== prev.current;
  useEffect(() => {
    prev.current = value;
  }, [value]);

  const digits = String(value).split("");

  if (!ledMode) {
    return (
      <div className="relative h-[130px] w-full overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={value}
            initial={{ scale: 1.35, opacity: 0, y: -12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className={`absolute inset-0 flex items-center justify-center ${displayFont} text-[140px] leading-[0.9] tracking-tight ${colorClass}`}
            style={tint ? { color: tint } : undefined}
          >
            {value}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-[130px] w-full items-center justify-center gap-[0.02em] ${displayFont} text-[140px] leading-[0.9] tracking-tight ${changed ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]" : ""}`}
    >
      {digits.map((d, i) => (
        <Digit key={`${i}-${digits.length}`} value={d} colorClass={colorClass} tint={tint} />
      ))}
    </div>
  );
}
