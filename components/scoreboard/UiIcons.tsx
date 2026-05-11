"use client";

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
  ...props,
});

/** Stroke icons — Lucide ISC (mic + mic-off) */
const strokeBase = (props: IconProps) => ({
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export function GearIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19.14 12.94a7.96 7.96 0 0 0 .05-.94 7.96 7.96 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7.3 7.3 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.7 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.96 7.96 0 0 0-.05.94c0 .32.02.63.05.94L2.82 14.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.39 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.22 1.13-.55 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5v-2h5V5h-5V3Zm-2 4 5 5-5 5v-3H3v-4h9V7Z" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.72-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h3v16H7zM14 4h3v16h-3z" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.7 2.88 18.29 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.29-6.3 1.42 1.42Z" />
    </svg>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8Z" />
    </svg>
  );
}

export function ResetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M17.65 6.35A8 8 0 1 0 19.73 15h-2.12a6 6 0 1 1-1.48-6.06L13 12h7V5l-2.35 1.35Z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z" />
    </svg>
  );
}

export function StopwatchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 1h6v2H9V1Zm10.03 5.39 1.41-1.41-1.42-1.42-1.44 1.44A9 9 0 1 0 19.03 6.4ZM12 20a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm1-11h-2v6h2V9Z" />
    </svg>
  );
}

export function BuzzerIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 19h18v2H3v-2Zm2-2h14v-2a7 7 0 0 0-14 0v2Zm6-11h2V3h-2v3ZM3.87 7.24l1.42-1.42 1.76 1.77-1.41 1.42-1.77-1.77Zm14.5.35 1.76-1.77 1.42 1.42-1.77 1.77-1.41-1.42Z" />
    </svg>
  );
}

export function WhistleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 9c-1.1 0-2 .9-2 2 0 .41.13.8.35 1.13l-6.29 3.02A5.48 5.48 0 0 0 3 14.5C3 17.54 5.46 20 8.5 20S14 17.54 14 14.5c0-.36-.04-.71-.1-1.06l8.09-3.89C21.53 9.22 20.82 9 20 9h-6Zm-5.5 9.5A4 4 0 0 1 4.5 14.5a4 4 0 0 1 4-4 4 4 0 0 1 4 4 4 4 0 0 1-4 4Z" />
    </svg>
  );
}

export function TriangleLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 4 6 12l9 8V4Z" />
    </svg>
  );
}

export function TriangleRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 4v16l9-8-9-8Z" />
    </svg>
  );
}

export function MicrophoneIcon(props: IconProps) {
  return (
    <svg {...strokeBase(props)}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

export function MicSlashIcon(props: IconProps) {
  return (
    <svg {...strokeBase(props)}>
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
