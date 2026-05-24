"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  color: string;
  shape: "rect" | "circle" | "streamer";
  life: number;
};

const COLORS = [
  "#facc15",
  "#22c55e",
  "#3b82f6",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#f97316",
  "#ffffff",
];

/**
 * Fullscreen win celebration. Shown ~3 s after the final whistle:
 *   • non-stop confetti raining from the top
 *   • giant pulsing winner name with a sweeping gold gradient
 *   • final score readout
 *   • giant "PLAY AGAIN" + "CLOSE" buttons
 *   • little fireworks bursts in the background
 */
export function GameOverOverlay() {
  const celebration = useGameStore((s) => s.gameOverCelebration);
  const dismiss = useGameStore((s) => s.dismissGameOverCelebration);
  const resetGame = useGameStore((s) => s.resetGame);
  const setUiPhase = useGameStore((s) => s.setUiPhase);

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          className="absolute inset-0 z-[90] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Dark backdrop with subtle gold glow */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(40,28,0,0.92) 0%, rgba(0,0,0,0.95) 70%)",
            }}
          />

          {/* Sweeping spotlight */}
          <motion.div
            aria-hidden
            className="absolute inset-0 mix-blend-screen"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(250,204,21,0.18) 30deg, transparent 60deg, transparent 360deg)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          />

          <ConfettiRain />
          <FireworkBursts />

          <div className="relative z-10 flex flex-col items-center gap-4 px-8 py-6 text-center">
            <motion.span
              className="text-sm font-bold uppercase tracking-[0.5em] text-yellow-300/80"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              FINAL
            </motion.span>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 16,
                delay: 0.15,
              }}
              className="relative"
            >
              <h1
                className="font-stencil text-[6.5rem] leading-none tracking-[0.04em]"
                style={{
                  background:
                    "linear-gradient(180deg, #fffbe6 0%, #facc15 45%, #b45309 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter:
                    "drop-shadow(0 4px 12px rgba(250,204,21,0.45)) drop-shadow(0 0 32px rgba(250,204,21,0.25))",
                }}
              >
                {celebration.winnerName}
              </h1>
              {/* Pulse halo behind the name */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -inset-8 -z-10 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(250,204,21,0.25), transparent 70%)",
                }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-3xl font-black uppercase tracking-[0.25em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
            >
              WINS
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="mt-2 flex items-center gap-4 text-2xl font-bold text-white/90"
            >
              <span
                className={
                  celebration.winnerSide === "a"
                    ? "text-yellow-300"
                    : "text-white/60"
                }
              >
                {celebration.finalScoreA}
              </span>
              <span className="text-white/30">—</span>
              <span
                className={
                  celebration.winnerSide === "b"
                    ? "text-yellow-300"
                    : "text-white/60"
                }
              >
                {celebration.finalScoreB}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-3"
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 700, damping: 22 }}
                onClick={() => {
                  dismiss();
                  resetGame();
                }}
                className="rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 px-7 py-3 text-base font-black uppercase tracking-[0.2em] text-amber-950 shadow-[0_8px_24px_-6px_rgba(250,204,21,0.6)]"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Play again
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 700, damping: 22 }}
                onClick={() => {
                  dismiss();
                  setUiPhase("menu");
                }}
                className="rounded-full border-2 border-white/50 bg-transparent px-6 py-3 text-base font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10 hover:border-white"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Exit
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 700, damping: 22 }}
                onClick={dismiss}
                className="rounded-full border-2 border-white/30 bg-transparent px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white hover:border-white/80"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                Close
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Continuous confetti rain — fills the screen for the full celebration.
// ---------------------------------------------------------------------------

function ConfettiRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const partsRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const mountedAt = useRef<number>(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = (t: number) => {
      const dt = 1; // frames at ~60Hz; not strictly needed for visual feel

      // Spawn particles at the top continuously for first 8s, then taper.
      const elapsed = t - mountedAt.current;
      const spawnRate = elapsed < 8000 ? 6 : elapsed < 14000 ? 2 : 0;
      if (spawnRate > 0 && t - lastSpawnRef.current > 16) {
        lastSpawnRef.current = t;
        for (let i = 0; i < spawnRate; i++) {
          const shape =
            Math.random() < 0.7
              ? "rect"
              : Math.random() < 0.6
                ? "circle"
                : "streamer";
          partsRef.current.push({
            x: Math.random() * w,
            y: -10,
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 3,
            size: shape === "streamer" ? 18 + Math.random() * 14 : 5 + Math.random() * 7,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 0.3,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            shape,
            life: 1,
          });
        }
      }

      ctx.clearRect(0, 0, w, h);
      const alive: Particle[] = [];
      for (const p of partsRef.current) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.04;
        p.vx *= 0.998;
        p.rot += p.vrot;
        if (p.y > h + 60) {
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.95;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.5);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // streamer: thin tall rectangle
          ctx.fillRect(-1.5, -p.size / 2, 3, p.size);
        }
        ctx.restore();
        alive.push(p);
      }
      partsRef.current = alive;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      partsRef.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20"
      aria-hidden
    />
  );
}

// ---------------------------------------------------------------------------
// Background fireworks bursts — adds extra cinematic depth.
// ---------------------------------------------------------------------------

function FireworkBursts() {
  // Random positioned bursts, staggered start delays.
  const bursts = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: 10 + Math.random() * 80, // %
    top: 15 + Math.random() * 60, // %
    delay: i * 0.55 + Math.random() * 0.4,
    color: COLORS[i % COLORS.length],
    size: 80 + Math.random() * 80,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
      {bursts.map((b) => (
        <motion.div
          key={b.id}
          className="absolute rounded-full"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: b.size,
            height: b.size,
            translate: "-50% -50%",
            background: `radial-gradient(circle, ${b.color} 0%, ${b.color}00 65%)`,
            mixBlendMode: "screen",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1.6], opacity: [0, 0.9, 0] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            repeatDelay: 2.5,
            delay: b.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
