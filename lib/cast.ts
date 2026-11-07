"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "./gameStore";

export const CAST_CHANNEL = "scoreboard-cast-v1";
export const DISPLAY_PATH = "/display";

export type CastMethod = "cast" | "window" | "airplay" | "fullscreen";

export type CastStatus = {
  connected: boolean;
  method: CastMethod | null;
  label: string;
};

type CastEnvelope = {
  type: "state";
  payload: Record<string, unknown>;
};

type PresentationConnectionLike = {
  state: string;
  send: (message: string) => void;
  close?: () => void;
  terminate?: () => void;
  addEventListener: (name: string, fn: (ev?: Event) => void) => void;
  removeEventListener: (name: string, fn: (ev?: Event) => void) => void;
};

type ScreenDetailsLike = {
  currentScreen: { availLeft: number; availTop: number };
  screens: Array<{
    availLeft: number;
    availTop: number;
    availWidth: number;
    availHeight: number;
    isPrimary?: boolean;
  }>;
};

const listeners = new Set<(status: CastStatus) => void>();

let role: "controller" | "display" = "controller";
let status: CastStatus = { connected: false, method: null, label: "" };
let channel: BroadcastChannel | null = null;
let presentation: PresentationConnectionLike | null = null;
let displayWindow: Window | null = null;
let lastJson = "";
let unsubscribeStore: (() => void) | null = null;
let windowPoll: number | null = null;
let publishPulse: number | null = null;
let airplayVideo: HTMLVideoElement | null = null;
let airplayStream: MediaStream | null = null;
let snapshotHandler: ((payload: Record<string, unknown>) => void) | null = null;

function emit() {
  for (const fn of listeners) fn(status);
}

function setStatus(next: CastStatus) {
  status = next;
  emit();
  return status;
}

export function getCastStatus() {
  return status;
}

export function isDisplayRole() {
  if (role === "display") return true;
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith(DISPLAY_PATH);
}

export function setCastRole(next: "controller" | "display") {
  role = next;
}

export function displayUrl() {
  if (typeof window === "undefined") return DISPLAY_PATH;
  return new URL(DISPLAY_PATH, window.location.origin).href;
}

export function subscribeCastStatus(fn: (status: CastStatus) => void) {
  listeners.add(fn);
  fn(status);
  return () => {
    listeners.delete(fn);
  };
}

export function useCastStatus() {
  const [current, setCurrent] = useState(status);
  useEffect(() => subscribeCastStatus(setCurrent), []);
  return current;
}

function pickState(): Record<string, unknown> {
  const raw = useGameStore.getState() as unknown as Record<string, unknown>;
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "function") continue;
    if (key === "history" || key === "undoStack") continue;
    payload[key] = value;
  }
  return payload;
}

function publish() {
  if (role !== "controller") return;
  let payload = pickState();
  let json = JSON.stringify({ type: "state", payload } satisfies CastEnvelope);
  if (json.length > 56_000) {
    const slim = {
      ...payload,
      teamA: { ...(payload.teamA as object), logo: null },
      teamB: { ...(payload.teamB as object), logo: null },
    };
    payload = slim;
    json = JSON.stringify({ type: "state", payload } satisfies CastEnvelope);
  }
  if (json === lastJson) return;
  lastJson = json;
  try {
    channel?.postMessage({ type: "state", payload });
  } catch {
    /* ignore */
  }
  try {
    if (presentation && presentation.state === "connected") {
      presentation.send(json);
    }
  } catch {
    /* ignore */
  }
}

function ensureChannel() {
  if (typeof window === "undefined" || channel) return channel;
  try {
    channel = new BroadcastChannel(CAST_CHANNEL);
    channel.addEventListener("message", (ev) => {
      if (role !== "controller") return;
      const data = ev.data as { type?: string } | undefined;
      if (data?.type === "hello") forcePublish();
    });
  } catch {
    channel = null;
  }
  return channel;
}

function forcePublish() {
  lastJson = "";
  publish();
}

function startPublishing() {
  if (unsubscribeStore) return;
  ensureChannel();
  unsubscribeStore = useGameStore.subscribe(() => publish());
  if (publishPulse == null) {
    publishPulse = window.setInterval(() => {
      if (status.connected) publish();
    }, 2000);
  }
  publish();
}

function stopWindowPoll() {
  if (windowPoll != null) {
    window.clearInterval(windowPoll);
    windowPoll = null;
  }
}

function onPresentationClosed() {
  presentation = null;
  if (!displayWindow || displayWindow.closed) {
    setStatus({ connected: false, method: null, label: "" });
  }
}

function attachPresentation(connection: PresentationConnectionLike) {
  if (presentation && presentation !== connection) {
    try {
      presentation.close?.();
    } catch {
      /* ignore */
    }
  }
  presentation = connection;
  const closed = () => onPresentationClosed();
  connection.addEventListener("close", closed);
  connection.addEventListener("terminate", closed);
  connection.addEventListener("message", () => forcePublish());
  startPublishing();
  forcePublish();
  const name =
    "id" in connection && typeof (connection as { id?: string }).id === "string"
      ? (connection as { id: string }).id
      : "TV";
  setStatus({ connected: true, method: "cast", label: name });
}

function watchDisplayWindow(win: Window) {
  displayWindow = win;
  stopWindowPoll();
  windowPoll = window.setInterval(() => {
    if (!displayWindow || displayWindow.closed) {
      displayWindow = null;
      stopWindowPoll();
      if (!presentation || presentation.state !== "connected") {
        setStatus({ connected: false, method: null, label: "" });
      }
    }
  }, 800);
}

function stopAirplay() {
  try {
    airplayStream?.getTracks().forEach((t) => t.stop());
  } catch {
    /* ignore */
  }
  airplayStream = null;
  if (airplayVideo) {
    try {
      airplayVideo.pause();
      airplayVideo.srcObject = null;
      airplayVideo.remove();
    } catch {
      /* ignore */
    }
    airplayVideo = null;
  }
}

function isUserCancel(err: unknown) {
  const name = err && typeof err === "object" && "name" in err ? String(err.name) : "";
  const message = err instanceof Error ? err.message : String(err ?? "");
  return (
    name === "AbortError" ||
    name === "NotAllowedError" ||
    /cancel|abort|dismiss/i.test(message)
  );
}

async function startPresentation(): Promise<boolean> {
  const Request = (
    window as unknown as {
      PresentationRequest?: new (urls: string[]) => {
        start: () => Promise<PresentationConnectionLike>;
      };
    }
  ).PresentationRequest;
  if (!Request) return false;
  const connection = await new Request([displayUrl()]).start();
  attachPresentation(connection);
  return true;
}

async function openDisplayWindow(): Promise<boolean> {
  const url = displayUrl();
  const nav = window.navigator as Navigator & {
    getScreenDetails?: () => Promise<ScreenDetailsLike>;
  };
  let features = "popup=yes,width=1920,height=1080";
  try {
    if (typeof nav.getScreenDetails === "function") {
      const details = await nav.getScreenDetails();
      const other =
        details.screens.find(
          (s) =>
            s.availLeft !== details.currentScreen.availLeft ||
            s.availTop !== details.currentScreen.availTop,
        ) ?? details.screens.find((s) => !s.isPrimary);
      if (other) {
        features = `popup=yes,left=${other.availLeft},top=${other.availTop},width=${other.availWidth},height=${other.availHeight}`;
      }
    }
  } catch {
    /* permission denied — still open a window */
  }
  const win = window.open(url, "scoreboard-tv", features);
  if (!win) return false;
  watchDisplayWindow(win);
  startPublishing();
  setStatus({ connected: true, method: "window", label: "TV window" });
  return true;
}

async function promptAirPlay(): Promise<boolean> {
  const video = document.createElement("video");
  video.setAttribute("x-webkit-airplay", "allow");
  video.setAttribute("webkit-playsinline", "true");
  video.playsInline = true;
  video.muted = true;
  video.autoplay = true;
  video.style.cssText =
    "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:0;top:0";
  document.body.appendChild(video);
  airplayVideo = video;

  const mediaDevices = navigator.mediaDevices as MediaDevices & {
    getDisplayMedia?: (constraints: DisplayMediaStreamOptions) => Promise<MediaStream>;
  };
  if (typeof mediaDevices.getDisplayMedia === "function") {
    try {
      const stream = await mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        preferCurrentTab: true,
      } as DisplayMediaStreamOptions & { preferCurrentTab?: boolean });
      airplayStream = stream;
      video.srcObject = stream;
      await video.play().catch(() => {});
    } catch (err) {
      if (isUserCancel(err)) {
        video.remove();
        airplayVideo = null;
        return false;
      }
    }
  }

  const picker = (
    video as HTMLVideoElement & { webkitShowPlaybackTargetPicker?: () => void }
  ).webkitShowPlaybackTargetPicker;
  if (typeof picker === "function") {
    picker.call(video);
    setStatus({ connected: true, method: "airplay", label: "AirPlay" });
    return true;
  }
  const remote = (
    video as HTMLVideoElement & {
      remote?: { prompt?: () => Promise<void>; watchAvailability?: unknown };
    }
  ).remote;
  if (remote && typeof remote.prompt === "function") {
    await remote.prompt();
    setStatus({ connected: true, method: "airplay", label: "AirPlay / Cast" });
    return true;
  }
  video.remove();
  airplayVideo = null;
  return false;
}

export async function requestScoreboardFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  try {
    if (document.fullscreenElement) return true;
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: "hide" });
      return true;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function startCastToTv(): Promise<CastStatus> {
  startPublishing();

  if ("PresentationRequest" in window) {
    try {
      await startPresentation();
      return status;
    } catch (err) {
      if (isUserCancel(err)) return status;
    }
  }

  try {
    if (await promptAirPlay()) return status;
  } catch (err) {
    if (isUserCancel(err)) return status;
  }

  try {
    if (await openDisplayWindow()) {
      void requestScoreboardFullscreen();
      return status;
    }
  } catch {
    /* ignore */
  }

  const full = await requestScoreboardFullscreen();
  if (full) {
    setStatus({
      connected: true,
      method: "fullscreen",
      label: "Fullscreen — use Screen Mirroring / Smart View",
    });
  }
  return status;
}

export async function startTvWindow() {
  startPublishing();
  return openDisplayWindow();
}

export async function startFullscreenCast() {
  const ok = await requestScoreboardFullscreen();
  if (ok) {
    setStatus({
      connected: true,
      method: "fullscreen",
      label: "Fullscreen — use Screen Mirroring / Smart View / AirPlay",
    });
  }
  return ok;
}

export function stopCasting() {
  try {
    presentation?.terminate?.();
    presentation?.close?.();
  } catch {
    /* ignore */
  }
  presentation = null;
  try {
    if (displayWindow && !displayWindow.closed) displayWindow.close();
  } catch {
    /* ignore */
  }
  displayWindow = null;
  stopWindowPoll();
  stopAirplay();
  try {
    if (document.fullscreenElement) void document.exitFullscreen();
  } catch {
    /* ignore */
  }
  setStatus({ connected: false, method: null, label: "" });
}

export function onCastSnapshot(fn: (payload: Record<string, unknown>) => void) {
  snapshotHandler = fn;
  return () => {
    if (snapshotHandler === fn) snapshotHandler = null;
  };
}

function applyIncoming(raw: unknown) {
  if (!raw || typeof raw !== "object") return;
  const msg = raw as { type?: string; payload?: Record<string, unknown> };
  if (msg.type !== "state" || !msg.payload) return;
  snapshotHandler?.(msg.payload);
}

/** Controller: keep the TV in sync for the whole game. */
export function startCastPublisher() {
  if (typeof window === "undefined" || isDisplayRole()) return () => {};
  role = "controller";
  startPublishing();
  const request = (
    window as unknown as {
      PresentationRequest?: new (urls: string[]) => {
        addEventListener: (
          name: string,
          fn: (ev: { connection: PresentationConnectionLike }) => void,
        ) => void;
      };
    }
  ).PresentationRequest;
  const presentationNav = navigator as Navigator & {
    presentation?: { defaultRequest?: unknown };
  };
  if (request && presentationNav.presentation) {
    try {
      const def = new request([displayUrl()]);
      presentationNav.presentation.defaultRequest = def;
      def.addEventListener("connectionavailable", (ev) => {
        attachPresentation(ev.connection);
      });
    } catch {
      /* ignore */
    }
  }
  return () => {};
}

/** TV / second window: receive live scoreboard state. */
export function startCastReceiver() {
  if (typeof window === "undefined") return () => {};
  role = "display";
  try {
    useGameStore.persist.setOptions({
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    });
  } catch {
    /* ignore */
  }
  const ch = ensureChannel();
  const onMessage = (ev: MessageEvent) => applyIncoming(ev.data);
  ch?.addEventListener("message", onMessage);
  try {
    ch?.postMessage({ type: "hello" });
  } catch {
    /* ignore */
  }

  const presentationNav = navigator as Navigator & {
    presentation?: {
      receiver?: {
        connectionList: Promise<{
          connections: PresentationConnectionLike[];
          addEventListener: (
            name: string,
            fn: (ev: { connection: PresentationConnectionLike }) => void,
          ) => void;
        }>;
      };
    };
  };
  const receiver = presentationNav.presentation?.receiver;
  const listen = (connection: PresentationConnectionLike) => {
    const onData = (ev: Event) => {
      const data = (ev as MessageEvent).data;
      if (typeof data === "string") {
        try {
          applyIncoming(JSON.parse(data));
        } catch {
          /* ignore */
        }
      } else {
        applyIncoming(data);
      }
    };
    connection.addEventListener("message", onData as unknown as (ev?: Event) => void);
    try {
      connection.send(JSON.stringify({ type: "hello" }));
    } catch {
      /* ignore */
    }
  };
  if (receiver) {
    void receiver.connectionList.then((list) => {
      list.connections.forEach(listen);
      list.addEventListener("connectionavailable", (ev) => listen(ev.connection));
    });
  }

  return () => {
    ch?.removeEventListener("message", onMessage);
  };
}

export function applyDisplaySnapshot(payload: Record<string, unknown>) {
  useGameStore.setState({
    ...payload,
    presentationMode: true,
    musicEnabled: false,
    musicTrack: "none" as const,
  });
}
