"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the viewport is narrower than 640 CSS px AND taller than
 * it is wide (i.e. a phone held in portrait).  Used to CSS-rotate the entire
 * app so it appears in landscape even when the OS won't lock orientation.
 */
export function usePortraitMobile(): boolean {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsPortrait(w < 640 && h > w);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return isPortrait;
}
