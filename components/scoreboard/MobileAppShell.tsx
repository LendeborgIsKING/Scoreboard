"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePortraitMobile } from "@/hooks/usePortraitMobile";
import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";
import { useGameStore } from "@/lib/gameStore";

/** Typical smartphone content width (CSS px) — aligns with iPhone 14/15 logical ~390pt */
export const MOBILE_APP_WIDTH_PX = 390;

/** The scoreboard is laid out on a fixed landscape canvas of this size. */
const DESIGN_WIDTH = 844;
const DESIGN_HEIGHT = 390;

/**
 * One column, phone-sized: full screen on mobile devices, capped at
 * MOBILE_APP_WIDTH_PX on desktop screens.
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
  const { isMobile, mounted } = useIsMobileDevice();
  const displayFlipped = useGameStore((s) => s.displayFlipped);

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

  // Only rotate once the user has started a game — menu and setup stay normal portrait.
  const shouldRotate = isPortraitMobile && !!isGame;

  if (!mounted) {
    return (
      <div className="flex min-h-[100dvh] w-full flex-col bg-black">
        {children}
      </div>
    );
  }

  if (isMobile) {
    if (shouldRotate) {
      return <AutoFitGameShell>{children}</AutoFitGameShell>;
    }

    // Physically in landscape (or menu/setup in portrait)
    const flip = isGame && displayFlipped;
    return (
      <div
        className="relative flex min-h-[100dvh] w-full flex-col bg-black overflow-hidden"
        style={{
          // When flipped 180°, the physical insets swap sides — so swap the
          // padding too, keeping buttons clear of the notch / home bar.
          paddingLeft: isGame
            ? `max(1.5rem, env(safe-area-inset-${flip ? "right" : "left"}))`
            : undefined,
          paddingRight: isGame
            ? `max(1.5rem, env(safe-area-inset-${flip ? "left" : "right"}))`
            : undefined,
          paddingTop: isGame
            ? `env(safe-area-inset-${flip ? "bottom" : "top"})`
            : undefined,
          paddingBottom: isGame
            ? `env(safe-area-inset-${flip ? "top" : "bottom"})`
            : undefined,
        }}
      >
        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y"
          style={flip ? { transform: "rotate(180deg)" } : undefined}
        >
          {children}
        </div>
      </div>
    );
  }

  // Normal (landscape / desktop) shell.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-800 py-6">
      <div
        className={`relative flex aspect-[390/844] w-[390px] max-w-[390px] flex-col bg-black rounded-[2.75rem] border-[12px] border-zinc-950 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06] transition-transform duration-500 ${
          isGame ? "-rotate-90" : ""
        }`}
      >
        {/* Safe top inset when playing on a notched phone */}
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
 * Renders a fixed-size DESIGN_WIDTH × DESIGN_HEIGHT canvas, rotates it 90° CW
 * (so it appears landscape on a portrait phone), and uniformly scales it to
 * fit whatever screen we're on — accounting for safe-area insets (Dynamic
 * Island on the visual right edge, home bar on the visual left edge).
 */
function AutoFitGameShell({ children }: { children: ReactNode }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const displayFlipped = useGameStore((s) => s.displayFlipped);
  // Base portrait rotation is 270° (CCW) — this is upright for the common grip
  // (rotating the phone clockwise into landscape). Flipping adds 180° → 90°.
  const rotation = displayFlipped ? 90 : 270;

  useEffect(() => {
    const compute = () => {
      const el = measureRef.current;
      if (!el) return;
      const availW = el.clientWidth;
      const availH = el.clientHeight;
      if (!availW || !availH) return;
      // After 90° CW or 270° CCW rotation, the design 844×390 canvas becomes
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
        {/* The design canvas: fixed 844×390, centered, rotated, scaled
            to fit. Centering via translate(-50%, -50%) on the unrotated
            box then layering rotate+scale keeps the visual centered. */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
            transformOrigin: "center center",
            boxSizing: "border-box",
            // Since the design canvas is rotated:
            // - At 90deg CW: Left corresponds to physical TOP of the phone, Right to physical BOTTOM.
            // - At 270deg CCW: Left corresponds to physical BOTTOM of the phone, Right to physical TOP.
            paddingLeft: rotation === 90
              ? "max(1.5rem, env(safe-area-inset-top))"
              : "max(1.5rem, env(safe-area-inset-bottom))",
            paddingRight: rotation === 90
              ? "max(1.5rem, env(safe-area-inset-bottom))"
              : "max(1.5rem, env(safe-area-inset-top))",
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
