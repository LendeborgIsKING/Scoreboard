"use client";

import type { BracketState, RoundRobinState } from "./types";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawMatchBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  teamA: string | null,
  teamB: string | null,
  winner: "a" | "b" | null | undefined,
) {
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = "#18181b";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.stroke();

  const rowH = h / 2;
  ctx.font = "700 14px system-ui, sans-serif";
  ctx.textAlign = "left";

  ctx.fillStyle =
    winner === "a" ? "#fbbf24" : teamA ? "#ffffff" : "rgba(255,255,255,0.3)";
  ctx.fillText((teamA || "TBD").slice(0, 18), x + 10, y + rowH * 0.65);

  ctx.beginPath();
  ctx.moveTo(x + 6, y + rowH);
  ctx.lineTo(x + w - 6, y + rowH);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.stroke();

  ctx.fillStyle =
    winner === "b" ? "#fbbf24" : teamB ? "#ffffff" : "rgba(255,255,255,0.3)";
  ctx.fillText((teamB || "TBD").slice(0, 18), x + 10, y + rowH + rowH * 0.65);
}

export function renderBracketCanvas(bracket: BracketState): HTMLCanvasElement {
  const rounds = [...new Set(bracket.matches.map((m) => m.round))].sort(
    (a, b) => a - b,
  );
  const W = Math.max(900, rounds.length * 220 + 80);
  const H = bracket.teamCount === 8 ? 520 : 360;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0b0b0d");
  grad.addColorStop(1, "#000000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `${bracket.name} — ${bracket.format === "double-elim" ? "Double Elimination" : "Single Elimination"}`,
    W / 2,
    40,
  );

  const boxW = 180;
  const boxH = 56;
  const colGap = 200;
  const startX = 40;

  rounds.forEach((round, colIdx) => {
    const roundMatches = bracket.matches
      .filter((m) => m.round === round && m.bracketSide !== "losers")
      .sort((a, b) => a.position - b.position);
    if (roundMatches.length === 0) return;

    const slotH = H / roundMatches.length;
    roundMatches.forEach((m, i) => {
      const x = startX + colIdx * colGap;
      const y = slotH * i + (slotH - boxH) / 2 + 60;
      drawMatchBox(ctx, x, y, boxW, boxH, m.teamA, m.teamB, m.winner);
    });
  });

  if (bracket.format === "double-elim") {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Losers Bracket", 40, H - 140);

    const loserRounds = [...new Set(
      bracket.matches
        .filter((m) => m.bracketSide === "losers")
        .map((m) => m.round),
    )].sort((a, b) => a - b);

    loserRounds.forEach((round, colIdx) => {
      const roundMatches = bracket.matches
        .filter((m) => m.round === round && m.bracketSide === "losers")
        .sort((a, b) => a.position - b.position);
      const slotH = 100;
      roundMatches.forEach((m, i) => {
        const x = 40 + colIdx * 200;
        const y = H - 120 + i * slotH;
        drawMatchBox(ctx, x, y, boxW, boxH, m.teamA, m.teamB, m.winner);
      });
    });
  }

  return canvas;
}

export function renderRoundRobinCanvas(rr: RoundRobinState): HTMLCanvasElement {
  const W = 900;
  const H = 80 + rr.teams.length * 36 + 40;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(rr.name, W / 2, 36);

  const cols = ["Team", "P", "W", "L", "T", "Pts", "GF", "GA"];
  const colX = [40, 340, 400, 450, 500, 550, 620, 690];
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  cols.forEach((c, i) => ctx.fillText(c, colX[i], 64));

  rr.teams.forEach((t, row) => {
    const y = 90 + row * 32;
    const vals = [
      t.name,
      String(t.played),
      String(t.wins),
      String(t.losses),
      String(t.ties),
      String(t.points),
      String(t.goalsFor),
      String(t.goalsAgainst),
    ];
    ctx.fillStyle = row === 0 ? "#fbbf24" : "#ffffff";
    vals.forEach((v, i) => ctx.fillText(v.slice(0, i === 0 ? 22 : 6), colX[i], y));
  });

  return canvas;
}

export async function shareBracketImage(
  canvas: HTMLCanvasElement,
  title: string,
): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) return;
  const file = new File([blob], `${title}.png`, { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
