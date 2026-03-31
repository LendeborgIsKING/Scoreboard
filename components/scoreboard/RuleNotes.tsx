"use client";

import { motion } from "framer-motion";
import type { SportConfig } from "@/lib/types";
import { resolveActiveVariant } from "@/lib/sportRegistry";

type Props = {
  cfg: SportConfig;
  timerVariantId: string;
  open: boolean;
  onClose: () => void;
};

export function RuleNotes({ cfg, timerVariantId, open, onClose }: Props) {
  if (!open) return null;
  const v = resolveActiveVariant(cfg, timerVariantId);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close rules"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl sm:rounded-2xl"
      >
        <h3 className="text-base font-bold text-white">Official times & notes</h3>
        {v && (
          <p className="mt-2 text-sm font-medium text-cyan-300/90">{v.label}</p>
        )}
        {cfg.rulesReference && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {cfg.rulesReference}
          </p>
        )}
        {v?.hints && v.hints.length > 0 && (
          <ul className="mt-4 list-inside list-disc space-y-1.5 text-sm text-zinc-500">
            {v.hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
