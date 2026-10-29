"use client";

import { useEffect, useState } from "react";
import { useIsMobileDevice } from "@/hooks/useIsMobileDevice";

/** True on touch phones/tablets held in landscape (width ≥ height). */
export function usePhoneLandscape(): {
  isPhoneLandscape: boolean;
  mounted: boolean;
} {
  const { isMobile, mounted: mobileMounted } = useIsMobileDevice();
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    if (!mobileMounted) return;
    const check = () => {
      setLandscape(window.innerWidth >= window.innerHeight);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, [mobileMounted]);

  return {
    isPhoneLandscape: mobileMounted && isMobile && landscape,
    mounted: mobileMounted,
  };
}
