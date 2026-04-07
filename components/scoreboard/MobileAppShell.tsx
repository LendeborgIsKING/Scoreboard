"use client";

import type { ReactNode } from "react";

/**
 * Centers content in a phone-shaped frame on larger screens; full-bleed black on small screens.
 */
export function MobileAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] justify-center bg-zinc-700 sm:items-center sm:bg-zinc-800 sm:py-6">
      <div
        className="relative flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-black sm:min-h-[min(852px,calc(100dvh-3rem))] sm:max-h-[852px] sm:rounded-[2.75rem] sm:border-[12px] sm:border-zinc-950 sm:shadow-[0_25px_80px_-12px_rgba(0,0,0,0.85)] sm:ring-1 sm:ring-white/[0.06]"
        style={{ maxWidth: "100%" }}
      >
        {/* subtle status-bar notch area */}
        <div className="flex h-3 shrink-0 justify-center pt-2 sm:h-4 sm:pt-3">
          <div className="h-1 w-24 rounded-full bg-zinc-800 sm:w-28" aria-hidden />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
