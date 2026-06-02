"use client";

/** Top-down full basketball court — orange wood + white regulation-style lines. */
export function CourtAmbience() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#c97438]" />
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            180deg,
            rgba(0,0,0,0.07) 0px,
            rgba(0,0,0,0.07) 1px,
            transparent 1px,
            transparent 7px,
            rgba(255,255,255,0.05) 7px,
            rgba(255,255,255,0.05) 8px,
            transparent 8px,
            transparent 14px
          )`,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 940 500"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="courtWood"
            patternUnits="userSpaceOnUse"
            width="940"
            height="14"
          >
            <rect width="940" height="14" fill="#c97438" />
            <line
              x1="0"
              y1="1"
              x2="940"
              y2="1"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="8"
              x2="940"
              y2="8"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="940" height="500" fill="url(#courtWood)" />

        <g
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Boundary */}
          <rect x="1.25" y="1.25" width="937.5" height="497.5" />

          {/* Half court */}
          <line x1="470" y1="0" x2="470" y2="500" />

          {/* Center circle */}
          <circle cx="470" cy="250" r="60" />
          <circle cx="470" cy="250" r="20" />

          {/* Left key */}
          <rect x="0" y="170" width="190" height="160" />

          {/* Right key */}
          <rect x="750" y="170" width="190" height="160" />

          {/* Left free-throw semicircle (toward center) */}
          <path d="M 190 190 A 60 60 0 0 1 190 310" />
          <path
            d="M 190 190 A 60 60 0 0 0 190 310"
            strokeDasharray="8 8"
            opacity="0.85"
          />

          {/* Right free-throw semicircle */}
          <path d="M 750 190 A 60 60 0 0 0 750 310" />
          <path
            d="M 750 190 A 60 60 0 0 1 750 310"
            strokeDasharray="8 8"
            opacity="0.85"
          />

          {/* Left three-point arc + corners */}
          <path d="M 0 140 L 253 140" />
          <path d="M 0 360 L 253 360" />
          <path d="M 253 140 A 237.5 237.5 0 0 1 253 360" />

          {/* Right three-point arc + corners */}
          <path d="M 940 140 L 687 140" />
          <path d="M 940 360 L 687 360" />
          <path d="M 687 140 A 237.5 237.5 0 0 0 687 360" />

          {/* Restricted area arcs (left / right) */}
          <path d="M 40 220 A 40 40 0 0 0 40 280" />
          <path d="M 900 220 A 40 40 0 0 1 900 280" />
        </g>

        {/* Backboards + rims (simplified top-down) */}
        <g fill="none" stroke="#ffffff" strokeWidth="2">
          <rect x="4" y="228" width="8" height="44" rx="1" />
          <rect x="928" y="228" width="8" height="44" rx="1" />
        </g>
        <circle cx="40" cy="250" r="9" fill="#e85d04" stroke="#ffffff" strokeWidth="2" />
        <circle cx="900" cy="250" r="9" fill="#e85d04" stroke="#ffffff" strokeWidth="2" />
      </svg>
    </div>
  );
}
