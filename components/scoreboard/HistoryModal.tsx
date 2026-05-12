"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { CloseIcon } from "./UiIcons";

type Props = { onClose: () => void };

export function HistoryModal({ onClose }: Props) {
  const history = useGameStore((s) => s.history);
  const finalize = useGameStore((s) => s.finalizeGame);
  const clear = useGameStore((s) => s.clearHistory);

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
          <h2 className="font-stencil text-3xl">History</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => finalize()}
              className="rounded-full border border-white/50 bg-transparent px-3 py-1 text-xs uppercase tracking-widest text-white transition hover:border-white hover:bg-white/10"
            >
              Save current game
            </button>
            <button
              type="button"
              onClick={() => clear()}
              className="rounded-full bg-red-600/20 px-3 py-1 text-xs uppercase tracking-widest text-red-300 hover:bg-red-600/30"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-zinc-300 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            No games saved yet. Tap{" "}
            <span className="mx-1 font-bold text-white">Save current game</span>{" "}
            to add one.
          </div>
        ) : (
          <div className="flex-1 space-y-2 overflow-auto pr-1">
            {history.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                    {g.sportName} · {g.periodLabel} {g.finalPeriod} ·{" "}
                    {new Date(g.finishedAt).toLocaleString()}
                  </div>
                  <div className="mt-0.5 text-base font-bold">
                    <span
                      className={
                        g.winner === "a"
                          ? "text-lime-400"
                          : g.winner === "tie"
                            ? "text-zinc-300"
                            : "text-zinc-400"
                      }
                    >
                      {g.teamA.name} {g.teamA.score}
                    </span>
                    <span className="mx-2 text-white/40">vs</span>
                    <span
                      className={
                        g.winner === "b"
                          ? "text-lime-400"
                          : g.winner === "tie"
                            ? "text-zinc-300"
                            : "text-zinc-400"
                      }
                    >
                      {g.teamB.name} {g.teamB.score}
                    </span>
                  </div>
                </div>
                <div className="text-xs uppercase tracking-widest text-zinc-400">
                  {g.winner === "tie" ? "Tie" : "W"}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
