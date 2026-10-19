"use client";

import { useEffect, useRef } from "react";
import {
  initYouTubePlayer,
  setYouTubeVolume,
  stopYouTubeVideo,
} from "@/lib/youtubePlayer";

type Props = {
  active: boolean;
  videoId: string | null;
  volume: number;
  expanded?: boolean;
  onClose?: () => void;
};

export function YouTubePlayer({
  active,
  videoId,
  volume,
  expanded = false,
  onClose,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    void initYouTubePlayer(el);
  }, []);

  useEffect(() => {
    if (!active || !videoId) {
      stopYouTubeVideo();
    }
  }, [active, videoId]);

  useEffect(() => {
    setYouTubeVolume(volume);
  }, [volume]);

  if (!active || !videoId) return null;

  return (
    <div
      className={`fixed z-[80] overflow-hidden rounded-xl border border-white/20 bg-black shadow-2xl transition-all duration-300 ${
        expanded
          ? "top-1/2 left-1/2 w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2"
          : "bottom-4 left-4 w-56"
      }`}
    >
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm font-bold text-white hover:bg-red-500/80"
          aria-label="Stop YouTube"
        >
          ×
        </button>
      )}
    </div>
  );
}
