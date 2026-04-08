"use client";

import type { ReactNode } from "react";

/** Typical smartphone content width (CSS px) — aligns with iPhone 14/15 logical ~390pt */
export const MOBILE_APP_WIDTH_PX = 390;

/**
 * One column, phone-sized: full width on small viewports, capped at MOBILE_APP_WIDTH_PX on larger screens.
 * In game mode, it expands to fill the viewport for the landscape flip.
 */
export function MobileAppShell({
  children,
  isGame,
}: {
  children: ReactNode;
  isGame?: boolean;
}) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-zinc-700 sm:items-center sm:bg-zinc-800 sm:py-6">
      <div
        className={`relative flex min-h-[100dvh] w-full flex-col bg-black transition-all duration-500 sm:min-h-[min(844px,calc(100dvh-3rem))] sm:max-h-[844px] sm:shadow-[0_25px_80px_-12px_rgba(0,0,0,0.85)] sm:ring-1 sm:ring-white/[0.06] ${
          isGame
            ? "max-w-none sm:max-w-none sm:rounded-none sm:border-0"
            : "max-w-[390px] sm:rounded-[2.75rem] sm:border-[12px] sm:border-zinc-950"
        } landscape:max-w-none landscape:sm:max-w-none landscape:sm:rounded-none landscape:sm:border-0`}
        style={{ width: "100%", maxWidth: isGame ? "none" : MOBILE_APP_WIDTH_PX }}
      >
        {/* subtle status-bar notch area - hide in game */}
        {!isGame && (
          <div className="flex h-3 shrink-0 justify-center pt-2 sm:h-4 sm:pt-3">
            <div
              className="h-1 w-24 rounded-full bg-zinc-800 sm:w-28"
              aria-hidden
            />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
