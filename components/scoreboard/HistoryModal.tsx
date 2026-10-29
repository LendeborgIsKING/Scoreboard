"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";
import { CloseIcon } from "./UiIcons";
import {
  FitScreen,
  MenuOverlayHeader,
  MobileMenuPortal,
  useLockPageScrollWhileOpen,
} from "./MenuScrollLayout";
import { SettingsLayoutProvider, useSettingsLayout } from "./SettingsLayoutContext";
import { usePhoneLandscape } from "@/hooks/usePhoneLandscape";

type Props = { onClose: () => void };

/** Keeps the list on one screen without scrolling. */
const VISIBLE_GAMES = 6;

export function HistoryModal({ onClose }: Props) {
  useLockPageScrollWhileOpen();
  const history = useGameStore((s) => s.history);
  const finalize = useGameStore((s) => s.finalizeGame);
  const clear = useGameStore((s) => s.clearHistory);
  const { isMobile } = useIsMobileDevice();
  const { isPhoneLandscape } = usePhoneLandscape();
  const backdropClass = isMobile
    ? "fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm"
    : "absolute inset-0 z-50 bg-black/80 backdrop-blur-sm";
  const shellClass = isMobile
    ? "fixed inset-0 z-[201] flex min-h-0 w-full flex-col bg-black text-white"
    : "absolute left-1/2 top-1/2 flex h-[390px] w-[844px] min-h-0 -translate-x-1/2 -translate-y-1/2 rotate-90 flex-col bg-black text-white";

  const visible = history.slice(0, VISIBLE_GAMES);
  const hidden = history.length - visible.length;

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
        <SettingsLayoutProvider>
          <MenuOverlayHeader
            title="History"
            compact={isPhoneLandscape}
            left={<span aria-hidden />}
            right={
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-zinc-300 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            }
          />

        <FitScreen
          className={
            isPhoneLandscape
              ? "px-[max(0.5rem,env(safe-area-inset-left))]"
              : undefined
          }
        >
          <HistoryList visible={visible} hidden={hidden} historyLength={history.length} />
        </FitScreen>

        <div
          className={`flex shrink-0 justify-center gap-3 px-5 pt-2 ${
            isPhoneLandscape
              ? "pb-[max(0.35rem,env(safe-area-inset-bottom))]"
              : "pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          }`}
        >
          <button
            type="button"
            onClick={() => finalize()}
            className="rounded-full border border-white/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:border-white hover:bg-white/10"
          >
            Save current game
          </button>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => clear()}
              className="rounded-full bg-red-600/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-300 hover:bg-red-600/30"
            >
              Clear
            </button>
          )}
        </div>
        </SettingsLayoutProvider>
      </motion.div>
    </motion.div>
  );

  return <MobileMenuPortal>{overlay}</MobileMenuPortal>;
}

function HistoryList({
  visible,
  hidden,
  historyLength,
}: {
  visible: ReturnType<typeof useGameStore.getState>["history"];
  hidden: number;
  historyLength: number;
}) {
  const { isPhoneLandscape } = useSettingsLayout();
  return (
          <div className={`mx-auto w-full px-5 py-2 ${isPhoneLandscape ? "max-w-5xl" : "max-w-md"}`}>
            {historyLength === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                No games saved yet.
              </div>
            ) : (
              <div
                className={
                  isPhoneLandscape
                    ? "grid grid-cols-2 gap-2"
                    : "flex flex-col gap-2"
                }
              >
                {visible.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center"
                  >
                    <div className="truncate text-[10px] uppercase tracking-widest text-zinc-500">
                      {g.sportName} · {g.periodLabel} {g.finalPeriod} ·{" "}
                      {new Date(g.finishedAt).toLocaleDateString()}
                    </div>
                    <div className="mt-0.5 truncate text-base font-bold">
                      <span className={winnerClass(g.winner === "a", g.winner === "tie")}>
                        {g.teamA.name} {g.teamA.score}
                      </span>
                      <span className="mx-2 text-white/40">–</span>
                      <span className={winnerClass(g.winner === "b", g.winner === "tie")}>
                        {g.teamB.score} {g.teamB.name}
                      </span>
                    </div>
                  </div>
                ))}
                {hidden > 0 && (
                  <p
                    className={`text-center text-xs text-zinc-500 ${
                      isPhoneLandscape ? "col-span-2" : ""
                    }`}
                  >
                    + {hidden} older game{hidden === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            )}
          </div>
  );
}

function winnerClass(won: boolean, tie: boolean) {
  if (won) return "text-lime-400";
  return tie ? "text-zinc-300" : "text-zinc-400";
}
