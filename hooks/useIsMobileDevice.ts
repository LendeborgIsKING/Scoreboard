"use client";

import { useEffect, useState } from "react";

/**
 * Detects a touch-capable handheld device (phone/tablet) as opposed to a
 * desktop browser. Used to decide between the full-screen mobile layout and
 * the simulated phone-frame desktop preview.
 *
 * Returns `mounted` so callers can avoid hydration mismatches (SSR can't know
 * the device type).
 */
export function useIsMobileDevice(): { isMobile: boolean; mounted: boolean } {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => {
      const touchSupport =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const smallScreen =
        window.innerWidth < 1024 || window.innerHeight < 1024;
      setIsMobile(touchSupport && smallScreen);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return { isMobile, mounted };
}
