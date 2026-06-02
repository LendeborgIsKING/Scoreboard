"use client";

const BONUS_FOUL_THRESHOLD = 5;
const TIMEOUT_DOT_MAX = 7;

export function TimeoutDots({
  remaining,
  teamLabel,
  onAdjust,
  editing,
}: {
  remaining: number;
  teamLabel: string;
  onAdjust: (delta: number) => void;
  editing: boolean;
}) {
  const capped = Math.min(TIMEOUT_DOT_MAX, Math.max(0, remaining));
  const delta = editing ? 1 : -1;

  return (
    <button
      type="button"
      onClick={() => onAdjust(delta)}
      className="flex flex-col items-center gap-0.5 touch-manipulation"
      aria-label={`${teamLabel} timeouts remaining: ${remaining}. Tap to ${editing ? "add" : "use"} timeout.`}
    >
      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
        TO
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: TIMEOUT_DOT_MAX }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full border ${
              i < capped
                ? "border-amber-400 bg-amber-400"
                : "border-white/25 bg-transparent"
            }`}
          />
        ))}
      </div>
    </button>
  );
}

export function ScoreMargin({
  scoreA,
  scoreB,
  teamAName,
  teamBName,
  teamAColor,
  teamBColor,
  displayFont,
}: {
  scoreA: number;
  scoreB: number;
  teamAName: string;
  teamBName: string;
  teamAColor: string;
  teamBColor: string;
  displayFont: string;
}) {
  const diff = scoreA - scoreB;
  if (diff === 0) {
    return (
      <div className="flex flex-col items-center">
        <span
          className={`${displayFont} text-lg tracking-wide text-zinc-400`}
        >
          TIED
        </span>
      </div>
    );
  }
  const leading = diff > 0 ? "a" : "b";
  const margin = Math.abs(diff);
  const name = leading === "a" ? teamAName : teamBName;
  const color = leading === "a" ? teamAColor : teamBColor;

  return (
    <div className="flex flex-col items-center leading-tight">
      <span
        className={`${displayFont} text-2xl text-white`}
        style={{ color }}
      >
        +{margin}
      </span>
      <span className="max-w-[5rem] truncate text-[9px] font-bold uppercase tracking-wider text-white/50">
        {name}
      </span>
    </div>
  );
}

export function BoxScoreTable({
  periodScores,
  period,
  periodLabel,
  maxPeriods,
  teamAName,
  teamBName,
  teamAColor,
  teamBColor,
  scoreA,
  scoreB,
}: {
  periodScores: { a: number[]; b: number[] };
  period: number;
  periodLabel: string;
  maxPeriods: number;
  teamAName: string;
  teamBName: string;
  teamAColor: string;
  teamBColor: string;
  scoreA: number;
  scoreB: number;
}) {
  const cols = maxPeriods > 0 ? maxPeriods : 4;
  const headers = Array.from({ length: cols }, (_, i) => {
    const n = i + 1;
    return periodLabel.length <= 2
      ? `${periodLabel} ${n}`
      : `Quarter ${n}`;
  });

  const cell = (arr: number[], qi: number) => {
    if (qi > period - 1) return "—";
    return String(arr[qi] ?? 0);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left text-sm text-white">
        <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-zinc-400">
          <tr>
            <th className="px-3 py-2">Team</th>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-center">
                {h}
              </th>
            ))}
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          <tr>
            <td className="px-3 py-2 font-bold" style={{ color: teamBColor }}>
              {teamBName}
            </td>
            {Array.from({ length: cols }, (_, qi) => (
              <td key={`b-${qi}`} className="px-3 py-2 text-center font-stencil tabular-nums">
                {cell(periodScores.b, qi)}
              </td>
            ))}
            <td className="px-3 py-2 text-right font-stencil tabular-nums text-orange-300">
              {scoreB}
            </td>
          </tr>
          <tr>
            <td className="px-3 py-2 font-bold" style={{ color: teamAColor }}>
              {teamAName}
            </td>
            {Array.from({ length: cols }, (_, qi) => (
              <td key={`a-${qi}`} className="px-3 py-2 text-center font-stencil tabular-nums">
                {cell(periodScores.a, qi)}
              </td>
            ))}
            <td className="px-3 py-2 text-right font-stencil tabular-nums text-orange-300">
              {scoreA}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function FoulBonusLabels({
  awayFouls,
  homeFouls,
}: {
  awayFouls: number;
  homeFouls: number;
}) {
  const awayBonus = awayFouls >= BONUS_FOUL_THRESHOLD;
  const homeBonus = homeFouls >= BONUS_FOUL_THRESHOLD;
  if (!awayBonus && !homeBonus) return null;

  return (
    <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.15em]">
      <span
        className={
          awayBonus
            ? "text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
            : "invisible"
        }
      >
        Bonus
      </span>
      <span className="text-white/20">|</span>
      <span
        className={
          homeBonus
            ? "text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
            : "invisible"
        }
      >
        Bonus
      </span>
    </div>
  );
}

export function ResetFoulsChip({
  onReset,
  onDismiss,
}: {
  onReset: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onReset}
        className="rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200 hover:bg-amber-400/20"
      >
        Reset fouls
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="px-1 text-[10px] text-white/40 hover:text-white/70"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
