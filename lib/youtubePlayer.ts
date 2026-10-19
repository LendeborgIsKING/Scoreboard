"use client";

type YTPlayerInstance = {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  stopVideo: () => void;
  pauseVideo: () => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: string | HTMLElement,
        options: Record<string, unknown>,
      ) => YTPlayerInstance;
      PlayerState: { PLAYING: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let player: YTPlayerInstance | null = null;
let apiReady = false;
let pendingVideoId: string | null = null;
let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="youtube.com/iframe_api"]',
    );
    if (existing && window.YT?.Player) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });

  return apiLoadPromise;
}

function flushPending() {
  if (!apiReady || !player || !pendingVideoId) return;
  const id = pendingVideoId;
  pendingVideoId = null;
  player.loadVideoById(id);
  player.playVideo();
}

export async function initYouTubePlayer(
  container: HTMLElement,
): Promise<void> {
  await loadYouTubeApi();
  if (player) return;

  player = new window.YT!.Player(container, {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      playsinline: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      fs: 0,
      origin:
        typeof window !== "undefined" ? window.location.origin : undefined,
    },
    events: {
      onReady: () => {
        apiReady = true;
        flushPending();
      },
    },
  });
}

/** Call synchronously from a click/tap handler so autoplay with sound is allowed. */
export function playYouTubeVideo(videoId: string): void {
  pendingVideoId = videoId;
  if (apiReady && player) {
    flushPending();
  }
}

export function stopYouTubeVideo(): void {
  pendingVideoId = null;
  if (player) {
    player.stopVideo();
  }
}

export function setYouTubeVolume(volume01: number): void {
  if (!player || !apiReady) return;
  player.setVolume(Math.round(Math.max(0, Math.min(1, volume01)) * 100));
}

export function destroyYouTubePlayer(): void {
  pendingVideoId = null;
  apiReady = false;
  if (player) {
    player.destroy();
    player = null;
  }
}
