"use client";

import Image from "next/image";

const SPORT_IMAGE_SRC: Partial<Record<string, string>> = {
  basketball: "/sports/basketball.png",
  football: "/sports/football.png",
  baseball: "/sports/baseball.png",
};

/** Sport menu icons — PNG artwork where provided, else minimal line SVG */
export function SportLineIcon({
  sportId,
  className = "h-10 w-10",
}: {
  sportId: string;
  className?: string;
}) {
  const imageSrc = SPORT_IMAGE_SRC[sportId];
  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt=""
        width={48}
        height={48}
        className={`${className} shrink-0 object-contain`}
        aria-hidden
      />
    );
  }

  const stroke = "currentColor";
  const common = {
    className: `${className} shrink-0 text-white`,
    viewBox: "0 0 48 48",
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (sportId) {
    case "hockey":
      return (
        <svg {...common}>
          <path
            d="M10 32 L28 14 L32 18 L18 34 Z"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <ellipse cx="34" cy="34" rx="5" ry="3" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case "soccer":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="14" stroke={stroke} strokeWidth="2" />
          <path
            d="M24 14l6 4v8l-6 4-6-4v-8z"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M18 22h12M18 26h12"
            stroke={stroke}
            strokeWidth="1.2"
          />
        </svg>
      );
    case "volleyball":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="14" stroke={stroke} strokeWidth="2" />
          <path
            d="M24 10c-6 6-6 22 0 28M24 10c6 6 6 22 0 28M14 18c10 4 10 8 20 12M14 30c10-4 10-8 20-12"
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    case "tennis":
      return (
        <svg {...common}>
          <ellipse cx="24" cy="24" rx="10" ry="16" stroke={stroke} strokeWidth="2" />
          <path d="M24 8v32" stroke={stroke} strokeWidth="1.5" />
          <path d="M14 16h20M14 24h20M14 32h20" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case "rugby":
      return (
        <svg {...common}>
          <ellipse cx="24" cy="24" rx="16" ry="9" stroke={stroke} strokeWidth="2" />
          <path
            d="M18 22h12M18 26h12"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "pickleball":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="14" stroke={stroke} strokeWidth="2" />
          <circle cx="24" cy="24" r="4" stroke={stroke} strokeWidth="1.5" />
          <path d="M24 10v6M24 32v6M10 24h6M32 24h6" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );
    case "custom":
      return (
        <svg {...common}>
          <circle cx="24" cy="20" r="6" stroke={stroke} strokeWidth="2" />
          <path
            d="M16 34h16M20 30h8"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="14" stroke={stroke} strokeWidth="2" />
          <path d="M24 16v16M16 24h16" stroke={stroke} strokeWidth="2" />
        </svg>
      );
  }
}
