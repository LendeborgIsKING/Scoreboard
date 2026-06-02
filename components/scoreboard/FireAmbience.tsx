"use client";

import { useMemo, type CSSProperties } from "react";
import { motion } from "framer-motion";

type FlameSpec = {
  id: number;
  x: number;
  w: number;
  h: number;
  delay: number;
  dur: number;
  lean: number;
};

function makeFlames(count: number, baseH: number): FlameSpec[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    // Even spacing across full width — no offset bias
    x: ((i + 0.5) / count) * 100,
    w: 3.2 + (i % 4) * 0.9,
    h: baseH + (i % 6) * 4 + ((i * 5) % 7),
    delay: i * 0.05,
    dur: 0.65 + (i % 5) * 0.12,
    lean: -6 + (i % 7) * 2,
  }));
}

/** Organic flame path — narrow base, bulging mid, tapered tip with slight asymmetry. */
function flamePath(lean = 0): string {
  const l = lean;
  return [
    `M ${20 + l * 0.2} 100`,
    `C ${6 + l} 78 ${2 + l * 0.5} 52 ${10 + l} 32`,
    `C ${14 + l * 0.6} 14 ${18 + l * 0.3} 4 ${20 + l * 0.15} 0`,
    `C ${22 - l * 0.3} 4 ${26 - l * 0.6} 14 ${30 - l} 32`,
    `C ${38 - l * 0.5} 52 ${34 - l} 78 ${20 + l * 0.2} 100`,
    "Z",
  ].join(" ");
}

function FlameSvg({
  lean,
  className,
  filterId,
}: {
  lean: number;
  className?: string;
  filterId: string;
}) {
  return (
    <svg
      viewBox="0 0 40 100"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <path
        d={flamePath(lean)}
        fill="url(#fireFlameGrad)"
        filter={`url(#${filterId})`}
      />
      <path
        d={flamePath(lean * 0.6)}
        fill="url(#fireCoreGrad)"
        opacity="0.85"
        transform="scale(0.55) translate(16 38)"
      />
    </svg>
  );
}

function FlameRow({
  flames,
  className,
  style,
  filterId,
}: {
  flames: FlameSpec[];
  className: string;
  style?: CSSProperties;
  filterId: string;
}) {
  return (
    <div className={className} style={style}>
      {flames.map((f) => (
        <motion.div
          key={f.id}
          className="absolute bottom-0 origin-bottom"
          style={{
            left: `${f.x - f.w / 2}%`,
            width: `${f.w}%`,
            height: `${f.h}%`,
          }}
          animate={{
            scaleY: [0.88, 1.18, 0.92, 1.08, 0.88],
            scaleX: [1, 0.82, 1.06, 0.9, 1],
            x: [0, f.lean * 0.15, -f.lean * 0.1, f.lean * 0.08, 0],
            opacity: [0.72, 1, 0.78, 0.95, 0.72],
          }}
          transition={{
            duration: f.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: f.delay,
          }}
        >
          <FlameSvg lean={f.lean} className="h-full w-full" filterId={filterId} />
        </motion.div>
      ))}
    </div>
  );
}

function SideFlames({
  side,
  count,
  filterId,
  intensity = 1,
}: {
  side: "left" | "right";
  count: number;
  filterId: string;
  intensity?: number;
}) {
  const flames = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        y: 4 + ((i + 0.5) / count) * 88,
        w: 16 + (i % 3) * 3,
        h: 11 + (i % 4) * 2,
        delay: i * 0.11,
        dur: 0.9 + (i % 4) * 0.14,
        lean: side === "left" ? -4 + (i % 3) : 4 - (i % 3),
      })),
    [count, side],
  );

  return (
    <div
      className={`absolute ${side === "left" ? "left-0" : "right-0"} inset-y-0 w-[20%]`}
      style={{ opacity: intensity }}
    >
      {flames.map((f) => (
        <div
          key={f.id}
          className={`absolute ${side === "left" ? "left-0" : "right-0"}`}
          style={{
            top: `${f.y}%`,
            width: `${f.w}%`,
            height: `${f.h}%`,
            transform: side === "left" ? "rotate(-90deg)" : "rotate(90deg)",
            transformOrigin: side === "left" ? "left center" : "right center",
          }}
        >
          <motion.div
            className={`h-full w-full ${side === "left" ? "origin-left" : "origin-right"}`}
            animate={{
              scaleY: [0.85, 1.12, 0.9, 1.05, 0.85],
              scaleX: [1, 0.88, 1.04, 0.92, 1],
              opacity: [0.55, 0.88, 0.6, 0.82, 0.55],
            }}
            transition={{
              duration: f.dur,
              repeat: Infinity,
              ease: "easeInOut",
              delay: f.delay,
            }}
          >
            <FlameSvg lean={f.lean} className="h-full w-full" filterId={filterId} />
          </motion.div>
        </div>
      ))}
    </div>
  );
}

function Embers() {
  const embers = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: 5 + (i / 19) * 90,
        size: 1.5 + (i % 3),
        delay: i * 0.32,
        dur: 2.2 + (i % 5) * 0.4,
        drift: -10 + (i % 9) * 2.5,
      })),
    [],
  );

  return (
    <>
      {embers.map((e) => (
        <motion.span
          key={e.id}
          className="absolute bottom-[8%] rounded-full bg-amber-200 shadow-[0_0_6px_2px_rgba(251,191,36,0.8)]"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
          }}
          animate={{
            y: [0, -120 - (e.id % 4) * 30],
            x: [0, e.drift, e.drift * 0.5],
            opacity: [0, 0.9, 0.7, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: e.dur,
            repeat: Infinity,
            ease: "easeOut",
            delay: e.delay,
          }}
        />
      ))}
    </>
  );
}

export function FireAmbience() {
  const edgeFlames = useMemo(() => makeFlames(24, 28), []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Shared SVG defs — turbulence warp + gradients */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <linearGradient id="fireFlameGrad" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#450a0a" stopOpacity="0.95" />
            <stop offset="22%" stopColor="#b91c1c" />
            <stop offset="48%" stopColor="#ea580c" />
            <stop offset="72%" stopColor="#fbbf24" />
            <stop offset="92%" stopColor="#fef9c3" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fffbeb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fireCoreGrad" x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor="#7f1d1d" stopOpacity="0" />
            <stop offset="35%" stopColor="#f97316" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
          <filter id="fireWarp" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05 0.22"
              numOctaves="2"
              seed="2"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="2.8s"
                values="0.05 0.22;0.07 0.28;0.04 0.18;0.06 0.25;0.05 0.22"
                repeatCount="indefinite"
              />
              <animate
                attributeName="seed"
                dur="1.4s"
                values="2;5;8;3;2"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="14"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
          <filter id="fireWarpSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04 0.16"
              numOctaves="2"
              seed="6"
              result="noise"
            >
              <animate
                attributeName="seed"
                dur="2s"
                values="6;9;4;7;6"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="9"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
        </defs>
      </svg>

      {/* Even ambient glow on all four edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(234,88,12,0.22)_0%,transparent_50%),radial-gradient(ellipse_at_bottom,_rgba(234,88,12,0.22)_0%,transparent_50%),radial-gradient(ellipse_at_left,_rgba(185,28,28,0.18)_0%,transparent_45%),radial-gradient(ellipse_at_right,_rgba(185,28,28,0.18)_0%,transparent_45%)]" />

      {/* Bottom edge — matches top */}
      <div className="absolute inset-x-0 bottom-0 h-[38%] mix-blend-screen">
        <FlameRow
          flames={edgeFlames}
          className="absolute inset-0"
          filterId="fireWarp"
        />
      </div>

      {/* Top edge — same intensity as bottom */}
      <div className="absolute inset-x-0 top-0 h-[38%] mix-blend-screen">
        <FlameRow
          flames={edgeFlames}
          className="absolute inset-0 rotate-180"
          filterId="fireWarp"
        />
      </div>

      {/* Away (left) and home (right) — matched */}
      <SideFlames side="left" count={10} filterId="fireWarpSoft" />
      <SideFlames side="right" count={10} filterId="fireWarpSoft" />

      {/* Rising sparks — spread evenly */}
      <div className="absolute inset-0 mix-blend-screen">
        <Embers />
      </div>

      {/* Center flicker — not bottom-heavy */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.08)_0%,transparent_55%)] mix-blend-overlay"
        animate={{ opacity: [0.35, 0.65, 0.4, 0.6, 0.35] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
