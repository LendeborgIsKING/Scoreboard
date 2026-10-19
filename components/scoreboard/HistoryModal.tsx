"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";
import { CloseIcon } from "./UiIcons";
import {
  MENU_SCROLL_PANE,
  MobileMenuPortal,
  useLockPageScrollWhileOpen,
} from "./MenuScrollLayout";

type Props = { onClose: () => void };

export function HistoryModal({ onClose }: Props) {
  useLockPageScrollWhileOpen();
  const history = useGameStore((s) => s.history);
  const finalize = useGameStore((s) => s.finalizeGame);
  const clear = useGameStore((s) => s.clearHistory);
  const { isMobile } = useIsMobileDevice();
  const backdropClass = isMobile
    ? "fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
    : "absolute inset-0 z-50 bg-black/80 backdrop-blur-sm";
  const shellClass = isMobile
    ? "fixed inset-0 z-[201] flex min-h-0 w-full flex-col bg-black text-white"
    : "absolute left-1/2 top-1/2 flex h-[390px] w-[844px] min-h-0 -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col bg-black text-white";

  const overlay = (
    <motion.div
      className={backdropClass}
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
        className={shellClass}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-black px-5 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-stencil text-2xl max-sm:text-xl sm:text-3xl">
              History
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1 text-zinc-300 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>

        <div
          className={`${MENU_SCROLL_PANE} px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4`}
        >
          {history.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No games saved yet. Tap{" "}
              <span className="mx-1 font-bold text-white">
                Save current game
              </span>{" "}
              to add one.
            </div>
          ) : (
            <div className="space-y-2 pr-1">
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
        </div>
      </motion.div>
    </motion.div>
  );

  return <MobileMenuPortal>{overlay}</MobileMenuPortal>;
}
