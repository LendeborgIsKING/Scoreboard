"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";
import { useGameStore } from "@/lib/gameStore";
import { RotateIcon } from "./UiIcons";
import { pressFeedback } from "@/lib/feedback";

/** Typical smartphone content width (CSS px) — aligns with iPhone 14/15 logical ~390pt */
export const MOBILE_APP_WIDTH_PX = 390;

/** The scoreboard is laid out on a fixed landscape canvas of this size. */
const DESIGN_WIDTH = 844;
const DESIGN_HEIGHT = 390;

/**
 * Phone-sized shell.
 *
 * During a game on a mobile device, the fixed 844×390 landscape scoreboard is
 * rendered at its native size and then uniformly SCALED to fit the available
 * screen (inside the safe area). This guarantees nothing is ever cut off, and
 * it auto-rotates to stay upright in either orientation — matching the behavior
 * of native scoreboard apps. Menu / setup screens stay normal portrait.
 */
export function MobileAppShell({
  children,
  isGame,
}: {
  children: ReactNode;
  isGame?: boolean;
}) {
  const { isMobile, mounted } = useIsMobileDevice();

  useEffect(() => {
    if (!mounted) return;
    if (isMobile) {
      document.body.classList.add("mobile-device");
    } else {
      document.body.classList.remove("mobile-device");
    }
    return () => {
      document.body.classList.remove("mobile-device");
    };
  }, [isMobile, mounted]);

  if (!mounted) {
    return (
      <div className="flex min-h-[100dvh] w-full flex-col bg-black">
        {children}
      </div>
    );
  }

  if (isMobile) {
    // The live scoreboard is always rendered through the auto-fit shell so it
    // scales to fit and rotates with the device. Menu / setup stay portrait.
    if (isGame) {
      return <AutoFitGameShell>{children}</AutoFitGameShell>;
    }

    return (
      <div
        className="relative flex min-h-[100dvh] w-full flex-col bg-black overflow-hidden"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y">
          {children}
        </div>
      </div>
    );
  }

  // Desktop: simulated phone frame.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-800 py-6">
      <div
        className={`relative flex aspect-[390/844] w-[390px] max-w-[390px] flex-col bg-black rounded-[2.75rem] border-[12px] border-zinc-950 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06] transition-transform duration-500 ${
          isGame ? "-rotate-90" : ""
        }`}
      >
        {isGame ? (
          <div className="shrink-0" aria-hidden />
        ) : (
          <div className="flex h-4 shrink-0 justify-center pt-3">
            <div
              className="h-1 w-28 rounded-full bg-zinc-800"
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
 * Renders the fixed-size DESIGN_WIDTH × DESIGN_HEIGHT canvas, centered, rotated
 * to stay upright for the current device orientation, and uniformly scaled to
 * fit the available safe area. Because we always fit the whole design, the
 * scoreboard can never be cut off — it just scales down on smaller screens.
 */
function AutoFitGameShell({ children }: { children: ReactNode }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isLandscape, setIsLandscape] = useState(true);
  const displayFlipped = useGameStore((s) => s.displayFlipped);
  const toggleDisplayFlip = useGameStore((s) => s.toggleDisplayFlip);

  useEffect(() => {
    const compute = () => {
      const el = measureRef.current;
      if (!el) return;
      const availW = el.clientWidth;
      const availH = el.clientHeight;
      if (!availW || !availH) return;
      const landscape = window.innerWidth >= window.innerHeight;
      setIsLandscape(landscape);
      // Visual bounding box of the design after rotation:
      // - Landscape (0/180°): 844 wide × 390 tall.
      // - Portrait (90/270°): 390 wide × 844 tall.
      const boxW = landscape ? DESIGN_WIDTH : DESIGN_HEIGHT;
      const boxH = landscape ? DESIGN_HEIGHT : DESIGN_WIDTH;
      const s = Math.min(availW / boxW, availH / boxH);
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

  // Keep the scoreboard upright for the current orientation; the flip button
  // adds 180° so the user can correct either grip when rotation is locked.
  const rotation = isLandscape
    ? displayFlipped
      ? 180
      : 0
    : displayFlipped
      ? 90
      : 270;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* Safe-area inset measurement box — its measured size already excludes
          the notch / Dynamic Island / home bar, so the scaled design centers
          within the usable area in every orientation. Positioned via inset (not
          padding) so clientWidth/Height reflect the real available space. */}
      <div
        ref={measureRef}
        style={{
          position: "absolute",
          top: "env(safe-area-inset-top)",
          bottom: "env(safe-area-inset-bottom)",
          left: "env(safe-area-inset-left)",
          right: "env(safe-area-inset-right)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
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
      <button
        type="button"
        aria-label="Flip screen orientation 180 degrees"
        onClick={() => {
          pressFeedback();
          toggleDisplayFlip();
        }}
        className="fixed z-[220] flex h-12 w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 border-white/60 bg-black/60 text-white shadow transition-colors hover:bg-white/10 active:bg-white/20"
        style={{
          top: "max(0.75rem, env(safe-area-inset-top))",
          right: "max(0.75rem, env(safe-area-inset-right))",
          WebkitTapHighlightColor: "transparent",
          backdropFilter: "blur(4px)",
        }}
      >
        <RotateIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
