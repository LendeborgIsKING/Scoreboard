"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { playSfx, type SfxName } from "@/lib/audio";
import { CloseIcon } from "./UiIcons";

type Props = { onClose: () => void };

const PADS: { id: SfxName; label: string; emoji: string; tone: string }[] = [
  { id: "cheer", label: "Cheer", emoji: "Y", tone: "bg-lime-500/20 border-lime-400/40 text-lime-200" },
  { id: "boo", label: "Boo", emoji: "B", tone: "bg-zinc-500/20 border-zinc-400/40 text-zinc-200" },
  { id: "horn", label: "Horn", emoji: "H", tone: "bg-orange-500/20 border-orange-400/40 text-orange-200" },
  { id: "whistle", label: "Whistle", emoji: "W", tone: "bg-cyan-500/20 border-cyan-400/40 text-cyan-200" },
  { id: "swoosh", label: "Swoosh", emoji: "S", tone: "bg-purple-500/20 border-purple-400/40 text-purple-200" },
  { id: "ding", label: "Ding", emoji: "D", tone: "bg-yellow-500/20 border-yellow-400/40 text-yellow-200" },
  { id: "tada", label: "Ta-da", emoji: "T", tone: "bg-pink-500/20 border-pink-400/40 text-pink-200" },
  { id: "buzzer", label: "Buzzer", emoji: "Z", tone: "bg-red-500/20 border-red-400/40 text-red-200" },
];

export function SoundboardModal({ onClose }: Props) {
  const sfxEnabled = useGameStore((s) => s.sfxEnabled);

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute left-1/2 top-1/2 flex h-[390px] w-[844px] -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col bg-black p-5 text-white max-sm:landscape:static max-sm:landscape:h-full max-sm:landscape:w-full max-sm:landscape:translate-x-0 max-sm:landscape:translate-y-0 max-sm:landscape:rotate-0"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-stencil text-3xl">Soundboard</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-300 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        {!sfxEnabled && (
          <div className="mb-2 rounded-md bg-yellow-500/20 px-3 py-1 text-xs uppercase tracking-widest text-yellow-200">
            Sound effects are muted (toggle in settings)
          </div>
        )}
        <div className="grid grid-cols-4 gap-3">
          {PADS.map((p) => (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => playSfx(p.id)}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.04 }}
              className={`flex h-24 flex-col items-center justify-center rounded-2xl border-2 ${p.tone}`}
            >
              <div className="font-stencil text-3xl">{p.emoji}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest">
                {p.label}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
