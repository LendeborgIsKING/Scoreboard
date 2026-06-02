"use client";

import { FireAmbience } from "./FireAmbience";

export function ThemeAmbience({ theme }: { theme: string }) {
  if (theme === "ice") return <IceAmbience />;
  return null;
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
