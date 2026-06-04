export function formatSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Smooth clock formatting from milliseconds. Above one minute it shows
 * `M:SS` (rounding up like a real game clock). In the final minute it shows
 * `SS.t` with tenths of a second so the countdown reads smoothly.
 */
export function formatClockSmart(ms: number): string {
  const totalMs = Math.max(0, ms);
  if (totalMs >= 60_000) {
    return formatSeconds(Math.ceil(totalMs / 1000));
  }
  const tenths = Math.ceil(totalMs / 100); // count down by 0.1s
  const s = Math.floor(tenths / 10);
  const t = tenths % 10;
  return `${s}.${t}`;
}
