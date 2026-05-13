"use client";

import { motion } from "framer-motion";

export function ThemeAmbience({ theme }: { theme: string }) {
  if (theme === "fire") return <FireAmbience />;
  if (theme === "ice") return <IceAmbience />;
  return null;
}

/** Animated flame tongues along all four edges */
function FireAmbience() {
  const bottom = Array.from({ length: 16 }, (_, i) => i);
  const top = Array.from({ length: 12 }, (_, i) => i);
  const v = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-x-0 bottom-0 h-32">
        {bottom.map((i) => (
          <motion.div
            key={`fb-${i}`}
            className="absolute bottom-0 w-[7%] rounded-t-[45%] bg-gradient-to-t from-red-700/95 via-amber-500/70 to-transparent"
            style={{
              left: `${(i / 16) * 92 + 4}%`,
              filter: "blur(1.5px)",
            }}
            animate={{
              scaleY: [0.75, 1.2, 0.85, 1.1, 0.75],
              opacity: [0.5, 1, 0.55, 0.95, 0.5],
              y: [4, -10, 0, -6, 4],
            }}
            transition={{
              duration: 1.05 + (i % 4) * 0.09,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.06,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 h-24">
        {top.map((i) => (
          <motion.div
            key={`ft-${i}`}
            className="absolute top-0 w-[8%] rounded-b-[40%] bg-gradient-to-b from-orange-600/85 via-yellow-500/45 to-transparent"
            style={{
              left: `${(i / 12) * 88 + 6}%`,
              filter: "blur(1.5px)",
            }}
            animate={{
              scaleY: [0.8, 1.15, 0.9, 1.05, 0.8],
              opacity: [0.35, 0.85, 0.45, 0.8, 0.35],
              y: [-2, 8, -4, 6, -2],
            }}
            transition={{
              duration: 1.2 + (i % 3) * 0.1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.08,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-y-0 left-0 w-24">
        {v.map((i) => (
          <motion.div
            key={`fl-${i}`}
            className="absolute left-0 w-full rounded-r-[35%] bg-gradient-to-r from-red-600/90 via-orange-500/50 to-transparent"
            style={{
              top: `${8 + i * 10.5}%`,
              height: "12%",
              filter: "blur(1.5px)",
            }}
            animate={{
              scaleX: [0.85, 1.2, 0.92, 1.1, 0.85],
              opacity: [0.45, 0.95, 0.5, 0.9, 0.45],
              x: [0, 4, -2, 3, 0],
            }}
            transition={{
              duration: 1.1 + (i % 4) * 0.07,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.09,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-y-0 right-0 w-24">
        {v.map((i) => (
          <motion.div
            key={`fr-${i}`}
            className="absolute right-0 w-full rounded-l-[35%] bg-gradient-to-l from-amber-600/90 via-red-600/45 to-transparent"
            style={{
              top: `${12 + i * 10}%`,
              height: "12%",
              filter: "blur(1.5px)",
            }}
            animate={{
              scaleX: [0.85, 1.15, 0.9, 1.08, 0.85],
              opacity: [0.45, 0.95, 0.5, 0.88, 0.45],
              x: [0, -4, 2, -3, 0],
            }}
            transition={{
              duration: 1.08 + (i % 5) * 0.06,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.11,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Frost wash + crack pattern + crystal specks */
function IceAmbience() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100/20 via-transparent to-cyan-300/15 mix-blend-soft-light" />
      <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.45)_0%,transparent_50%),radial-gradient(ellipse_at_70%_60%,rgba(200,240,255,0.35)_0%,transparent_45%)]" />
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.65'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="iceCrack" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(200,230,255,0.7)" />
            <stop offset="100%" stopColor="rgba(150,200,255,0.2)" />
          </linearGradient>
        </defs>
        <path
          d="M -2 18 L 12 16 L 28 35 L 44 22 L 58 48 L 72 30 L 88 52 L 102 38"
          stroke="url(#iceCrack)"
          strokeWidth="0.35"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 8 62 L 22 58 L 38 72 L 52 65 L 68 78 L 84 70 L 100 82"
          stroke="rgba(190,230,255,0.45)"
          strokeWidth="0.28"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 35 -2 L 32 28 L 48 42 L 40 68 L 55 88"
          stroke="rgba(210,240,255,0.5)"
          strokeWidth="0.3"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 72 8 L 68 32 L 78 48 L 70 72 L 82 96"
          stroke="url(#iceCrack)"
          strokeWidth="0.32"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 0 42 Q 25 38 50 45 T 100 40 M 15 88 L 35 92 L 55 85 L 75 95"
          stroke="rgba(160,210,255,0.35)"
          strokeWidth="0.25"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute inset-0 bg-[linear-gradient(125deg,transparent_40%,rgba(255,255,255,0.08)_50%,transparent_60%)] mix-blend-overlay" />
      <div className="absolute inset-0 backdrop-blur-[0.8px]" />
    </div>
  );
}
