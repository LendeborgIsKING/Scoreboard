"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/gameStore";

export function BannerOverlay() {
  const banner = useGameStore((s) => s.banner);
  const clearBanner = useGameStore((s) => s.clearBanner);

  useEffect(() => {
    if (!banner) return;
    const ms = banner.flavor === "win" ? 3500 : 1600;
    const t = window.setTimeout(() => clearBanner(), ms);
    return () => window.clearTimeout(t);
  }, [banner, clearBanner]);

  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          key={banner.id}
          initial={{ scale: 0.6, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.1, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        >
          <div
            className={`font-stencil text-7xl tracking-[0.06em] drop-shadow-2xl ${flavorClass(
              banner.flavor,
            )}`}
          >
            {banner.text}
          </div>
          {banner.subtext && (
            <div className="mt-1 text-sm font-bold uppercase tracking-[0.3em] text-white/80">
              {banner.subtext}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function flavorClass(flavor?: "score" | "win" | "info" | "warn") {
  switch (flavor) {
    case "win":
      return "text-yellow-300";
    case "score":
      return "text-lime-300";
    case "warn":
      return "text-red-400";
    default:
      return "text-white";
  }
}
