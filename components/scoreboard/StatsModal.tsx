"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";
import { resolveActiveVariant, resolveSportConfig } from "@/lib/sportRegistry";
import { CloseIcon } from "./UiIcons";

type Props = { onClose: () => void };

export function StatsModal({ onClose }: Props) {
  const teamA = useGameStore((s) => s.teamA);
  const teamB = useGameStore((s) => s.teamB);
  const periodScores = useGameStore((s) => s.periodScores);
  const sportId = useGameStore((s) => s.sportId);
  const customSport = useGameStore((s) => s.customSport);
  const timerVariantId = useGameStore((s) => s.timerVariantId);

  const cfg = resolveSportConfig(sportId, customSport);
  const variant = resolveActiveVariant(cfg, timerVariantId);
  const periodLabel = variant?.periodLabel ?? cfg.periodLabel;

  const aArr = periodScores.a;
  const bArr = periodScores.b;
  const length = Math.max(aArr.length, bArr.length, 1);
  const totalA = aArr.reduce((s, v) => s + v, 0);
  const totalB = bArr.reduce((s, v) => s + v, 0);

  const biggestLeadA = Math.max(
    0,
    ...aArr.map((_, i) => sumThrough(aArr, i) - sumThrough(bArr, i)),
  );
  const biggestLeadB = Math.max(
    0,
    ...bArr.map((_, i) => sumThrough(bArr, i) - sumThrough(aArr, i)),
  );

  return (
    <ModalShell onClose={onClose} title="Stats">
      <div className="grid grid-cols-2 gap-4 text-white">
        <Stat label="Score" value={`${teamA.score} - ${teamB.score}`} />
        <Stat
          label="Biggest lead"
          value={`${teamA.name} +${biggestLeadA} | ${teamB.name} +${biggestLeadB}`}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm text-white">
          <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-zinc-400">
            <tr>
              <th className="px-3 py-2">Team</th>
              {Array.from({ length }).map((_, i) => (
                <th key={i} className="px-3 py-2 text-center">
                  {periodLabel} {i + 1}
                </th>
              ))}
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr>
              <td className="px-3 py-2 font-bold">{teamA.name}</td>
              {Array.from({ length }).map((_, i) => (
                <td key={i} className="px-3 py-2 text-center font-stencil">
                  {aArr[i] ?? 0}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-stencil text-lime-400">
                {totalA}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-bold">{teamB.name}</td>
              {Array.from({ length }).map((_, i) => (
                <td key={i} className="px-3 py-2 text-center font-stencil">
                  {bArr[i] ?? 0}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-stencil text-lime-400">
                {totalB}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ModalShell>
  );
}

function sumThrough(arr: number[], idx: number): number {
  let s = 0;
  for (let i = 0; i <= idx; i++) s += arr[i] ?? 0;
  return s;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-widest text-zinc-400">
        {label}
      </div>
      <div className="mt-1 text-base font-bold">{value}</div>
    </div>
  );
}

function ModalShell({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
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
          <h2 className="font-stencil text-3xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-300 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
