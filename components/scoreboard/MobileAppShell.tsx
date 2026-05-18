"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePortraitMobile } from "@/hooks/usePortraitMobile";

/** Typical smartphone content width (CSS px) — aligns with iPhone 14/15 logical ~390pt */
export const MOBILE_APP_WIDTH_PX = 390;

/**
 * One column, phone-sized: full width on small viewports, capped at
 * MOBILE_APP_WIDTH_PX on larger screens.
 *
 * On a small phone held in portrait (where the OS won't lock orientation, e.g.
 * iOS Safari) we CSS-rotate the entire shell 90° so the app always appears in
 * landscape without any OS intervention.
 */
export function MobileAppShell({
  children,
  isGame,
}: {
  children: ReactNode;
  isGame?: boolean;
}) {
  const isPortraitMobile = usePortraitMobile();

  // Only rotate once the user has started a game — menu and setup stay normal portrait.
  const shouldRotate = isPortraitMobile && !!isGame;

  // CSS rotation trick: rotate the root container so the content fills the
  // screen in landscape even if the device is physically held portrait.
  //
  // Math:  portrait phone  → 100vw = short side, 100vh = long side
  //   • Set element width = 100vh (long side) — after 90° rotation this
  //     becomes the visual height, filling the screen top-to-bottom.
  //   • Set element height = 100vw (short side) — after rotation this fills
  //     the screen left-to-right.
  //   • transform-origin: 0 0  (top-left corner stays fixed)
  //   • rotate(90deg) spins it clockwise, then translateY(-100vw) moves the
  //     result back into the viewport so top-left aligns with screen corner.
  const rotateStyle: CSSProperties = shouldRotate
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vh",
        height: "100vw",
        transformOrigin: "0 0",
        transform: "rotate(90deg) translateY(-100vw)",
        overflow: "hidden",
        background: "#000",
      }
    : {};

  if (shouldRotate) {
    // Simplified shell — no phone-mockup frame, just full-screen rotated.
    return (
      <div style={rotateStyle}>
        <div className="flex h-full w-full flex-col overflow-hidden bg-black">
          {children}
        </div>
      </div>
    );
  }

  // Normal (landscape / desktop) shell.
  return (
    <div className="flex min-h-[100dvh] justify-center bg-zinc-700 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] sm:items-center sm:bg-zinc-800 sm:py-6">
      <div
        className={`relative flex min-h-[100dvh] w-full flex-col bg-black transition-transform duration-500 sm:h-auto sm:aspect-[390/844] sm:w-[390px] sm:max-w-[390px] sm:rounded-[2.75rem] sm:border-[12px] sm:border-zinc-950 sm:shadow-[0_25px_80px_-12px_rgba(0,0,0,0.85)] sm:ring-1 sm:ring-white/[0.06] ${
          isGame ? "sm:-rotate-90" : ""
        }`}
        style={{ width: "100%" }}
      >
        {/* Safe top inset when playing on a notched phone */}
        {isGame ? (
          <div
            className="shrink-0 max-sm:h-[env(safe-area-inset-top)] sm:hidden"
            aria-hidden
          />
        ) : (
          <div className="flex h-3 shrink-0 justify-center pt-2 max-sm:pt-[max(0.5rem,env(safe-area-inset-top))] sm:h-4 sm:pt-3">
            <div
              className="h-1 w-24 rounded-full bg-zinc-800 sm:w-28"
              aria-hidden
            />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y">
          {children}
        </div>
      </div>
    </div>
  );
}
