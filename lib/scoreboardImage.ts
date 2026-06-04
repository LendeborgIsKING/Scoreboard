"use client";

export type ScoreboardShareData = {
  sportName: string;
  periodLabel: string;
  period: number;
  teamA: { name: string; color: string; score: number };
  teamB: { name: string; color: string; score: number };
  periodScores?: { a: number[]; b: number[] };
};

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

/** Render a clean, share-ready scoreboard card to a PNG canvas. */
export function renderScoreboardCanvas(
  data: ScoreboardShareData,
): HTMLCanvasElement {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0b0b0d");
  grad.addColorStop(1, "#000000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Border frame
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  roundRect(ctx, 24, 24, W - 48, H - 48, 28);
  ctx.stroke();

  // Header
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `${data.sportName.toUpperCase()}  ·  ${data.periodLabel} ${data.period}`,
    W / 2,
    96,
  );

  const colCenterA = W * 0.27;
  const colCenterB = W * 0.73;

  const drawTeam = (
    cx: number,
    team: { name: string; color: string; score: number },
  ) => {
    ctx.fillStyle = team.color;
    ctx.font = "800 44px system-ui, sans-serif";
    ctx.textAlign = "center";
    const name = team.name.length > 14 ? team.name.slice(0, 14) + "…" : team.name;
    ctx.fillText(name.toUpperCase(), cx, 210);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 200px system-ui, sans-serif";
    ctx.fillText(String(team.score), cx, 430);
  };

  drawTeam(colCenterA, data.teamA);
  drawTeam(colCenterB, data.teamB);

  // Divider
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "800 90px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("–", W / 2, 410);

  // Per-period line (optional)
  if (data.periodScores) {
    const cols = Math.max(
      data.periodScores.a.length,
      data.periodScores.b.length,
    );
    if (cols > 0) {
      const line = (arr: number[]) =>
        Array.from({ length: cols }, (_, i) => arr[i] ?? 0).join("  ·  ");
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "600 22px system-ui, sans-serif";
      ctx.fillText(line(data.periodScores.a), colCenterA, 500);
      ctx.fillText(line(data.periodScores.b), colCenterB, 500);
    }
  }

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillText("Scoreboard", W / 2, H - 48);

  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * Share the scoreboard image via the Web Share API when available (with file
 * support), otherwise fall back to downloading the PNG.
 */
export async function shareScoreboardImage(data: ScoreboardShareData) {
  const canvas = renderScoreboardCanvas(data);
  const blob = await canvasToBlob(canvas);
  if (!blob) return;
  const fileName = `scoreboard-${data.teamA.score}-${data.teamB.score}.png`;
  const file = new File([blob], fileName, { type: "image/png" });

  const nav = navigator as Navigator & {
    canShare?: (d: { files?: File[] }) => boolean;
    share?: (d: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };

  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: "Scoreboard",
        text: `${data.teamA.name} ${data.teamA.score} - ${data.teamB.score} ${data.teamB.name}`,
      });
      return;
    } catch {
      /* user cancelled or share failed — fall through to download */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
