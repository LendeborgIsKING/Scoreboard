"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePortraitMobile } from "@/hooks/usePortraitMobile";

/** Typical smartphone content width (CSS px) — aligns with iPhone 14/15 logical ~390pt */
export const MOBILE_APP_WIDTH_PX = 390;

/** The scoreboard is laid out on a fixed landscape canvas of this size. */
const DESIGN_WIDTH = 844;
const DESIGN_HEIGHT = 390;

/**
 * One column, phone-sized: full width on small viewports, capped at
 * MOBILE_APP_WIDTH_PX on larger screens.
 *
 * On a phone in portrait, during a game we CSS-rotate the entire design canvas
 * 90° and scale it uniformly to fit whatever screen size we're on. The result
 * is the scoreboard looks identical (and proportional) on every device.
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

  if (shouldRotate) {
    return <AutoFitGameShell>{children}</AutoFitGameShell>;
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

/**
 * Renders a fixed-size DESIGN_WIDTH × DESIGN_HEIGHT canvas, rotates it 90° CW
 * (so it appears landscape on a portrait phone), and uniformly scales it to
 * fit whatever screen we're on — accounting for safe-area insets (Dynamic
 * Island on the visual right edge, home bar on the visual left edge).
 */
function AutoFitGameShell({ children }: { children: ReactNode }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const compute = () => {
      const el = measureRef.current;
      if (!el) return;
      const availW = el.clientWidth;
      const availH = el.clientHeight;
      if (!availW || !availH) return;
      // After 90° CW rotation, the design 844×390 canvas becomes
      // visually 390 wide × 844 tall — fit that to the available box.
      const s = Math.min(availW / DESIGN_HEIGHT, availH / DESIGN_WIDTH);
      setScale(Math.max(0.01, s));
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (measureRef.current) ro.observe(measureRef.current);
    window.addEventListener("orientationchange", compute);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* Safe-area padded measurement area. clientWidth/clientHeight here
          gives us the usable box after notch / home-bar insets. */}
      <div
        ref={measureRef}
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          boxSizing: "border-box",
        }}
      >
        {/* The design canvas: fixed 844×390, centered, rotated CW, scaled
            to fit. Centering via translate(-50%, -50%) on the unrotated
            box then layering rotate+scale keeps the visual centered. */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `translate(-50%, -50%) rotate(90deg) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "#000",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
