"use client";

import { useEffect } from "react";

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener?: (type: string, cb: () => void) => void;
};

type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
};

/**
 * Keeps the screen awake while `active` is true (e.g. during a live game),
 * re-acquiring the lock when the tab becomes visible again. Silently no-ops on
 * browsers without the Screen Wake Lock API.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined") return;
    const nav = navigator as WakeLockNavigator;
    if (!nav.wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let released = false;

    const acquire = async () => {
      try {
        sentinel = await nav.wakeLock!.request("screen");
        sentinel.addEventListener?.("release", () => {
          sentinel = null;
        });
      } catch {
        /* user gesture / permission missing — ignore */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !sentinel && !released) {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      try {
        void sentinel?.release();
      } catch {
        /* ignore */
      }
      sentinel = null;
    };
  }, [active]);
}
