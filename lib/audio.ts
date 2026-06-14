"use client";

/**
 * Lightweight Web Audio engine — synthesizes SFX and music from oscillators
 * and noise, so no audio files need to be hosted.
 */

export type SfxName =
  | "chime"
  | "buzzer"
  | "horn"
  | "cheer"
  | "boo"
  | "whistle"
  | "swoosh"
  | "ding"
  | "tada"
  | "click"
  | "tick";

export type MusicTrack = "none" | "hype" | "anthem";

let ctx: AudioContext | null = null;
let masterSfxGain: GainNode | null = null;
let masterMusicGain: GainNode | null = null;

let musicNodes: { stop: () => void } | null = null;
let currentTrack: MusicTrack = "none";

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctor();
    masterSfxGain = ctx.createGain();
    masterSfxGain.gain.value = 0.6;
    masterSfxGain.connect(ctx.destination);
    masterMusicGain = ctx.createGain();
    masterMusicGain.gain.value = 0.3;
    masterMusicGain.connect(ctx.destination);
  } catch {
    return null;
  }
  return ctx;
}

let audioUnlocked = false;
/** Resume the audio context on the very first user gesture. iOS/Safari leaves
 *  it suspended until then; doing this proactively means the first real tap
 *  doesn't lose any audio. */
export function primeAudioOnFirstGesture() {
  if (typeof window === "undefined" || audioUnlocked) return;
  const unlock = () => {
    audioUnlocked = true;
    const c = ensureCtx();
    if (c && c.state === "suspended") c.resume().catch(() => {});
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: false, passive: true });
  window.addEventListener("touchstart", unlock, { once: false, passive: true });
  window.addEventListener("keydown", unlock, { once: false });
}

export function setSfxVolume(v: number) {
  ensureCtx();
  if (masterSfxGain) masterSfxGain.gain.value = Math.max(0, Math.min(1, v));
}

export function setMusicVolume(v: number) {
  ensureCtx();
  if (masterMusicGain) masterMusicGain.gain.value = Math.max(0, Math.min(1, v));
}

function noiseBuffer(c: AudioContext, durationSec: number): AudioBuffer {
  const sampleRate = c.sampleRate;
  const length = Math.floor(sampleRate * durationSec);
  const buf = c.createBuffer(1, length, sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function envGain(c: AudioContext, peak: number, attack: number, release: number) {
  const g = c.createGain();
  const now = c.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
  return g;
}

function chime(c: AudioContext, dest: AudioNode) {
  const o = c.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(880, c.currentTime);
  o.frequency.linearRampToValueAtTime(1320, c.currentTime + 0.1);
  const g = envGain(c, 0.4, 0.005, 0.18);
  o.connect(g).connect(dest);
  o.start();
  o.stop(c.currentTime + 0.2);
}

function buzzer(c: AudioContext, dest: AudioNode) {
  const o = c.createOscillator();
  o.type = "square";
  o.frequency.value = 220;
  const g = envGain(c, 0.35, 0.01, 0.55);
  o.connect(g).connect(dest);
  o.start();
  o.stop(c.currentTime + 0.6);
}

function horn(c: AudioContext, dest: AudioNode) {
  const o1 = c.createOscillator();
  const o2 = c.createOscillator();
  o1.type = "sawtooth";
  o2.type = "sawtooth";
  o1.frequency.value = 196;
  o2.frequency.value = 261.6;
  const g = envGain(c, 0.45, 0.02, 0.95);
  o1.connect(g);
  o2.connect(g);
  g.connect(dest);
  o1.start();
  o2.start();
  o1.stop(c.currentTime + 1.1);
  o2.stop(c.currentTime + 1.1);
}

function cheer(c: AudioContext, dest: AudioNode) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 1.6);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(800, c.currentTime);
  filter.frequency.linearRampToValueAtTime(1600, c.currentTime + 0.4);
  filter.Q.value = 1.4;
  const g = envGain(c, 0.55, 0.05, 1.5);
  src.connect(filter).connect(g).connect(dest);
  src.start();
  src.stop(c.currentTime + 1.6);
}

function boo(c: AudioContext, dest: AudioNode) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 1.4);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(700, c.currentTime);
  filter.frequency.linearRampToValueAtTime(180, c.currentTime + 0.6);
  const g = envGain(c, 0.5, 0.04, 1.3);
  src.connect(filter).connect(g).connect(dest);
  src.start();
  src.stop(c.currentTime + 1.4);
}

function whistle(c: AudioContext, dest: AudioNode) {
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(2200, c.currentTime);
  o.frequency.linearRampToValueAtTime(2700, c.currentTime + 0.18);
  const g = envGain(c, 0.32, 0.005, 0.4);
  o.connect(g).connect(dest);
  o.start();
  o.stop(c.currentTime + 0.45);
}

function swoosh(c: AudioContext, dest: AudioNode) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.5);
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(2000, c.currentTime);
  filter.frequency.linearRampToValueAtTime(400, c.currentTime + 0.4);
  const g = envGain(c, 0.4, 0.01, 0.45);
  src.connect(filter).connect(g).connect(dest);
  src.start();
  src.stop(c.currentTime + 0.5);
}

function ding(c: AudioContext, dest: AudioNode) {
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = 1760;
  const g = envGain(c, 0.32, 0.002, 0.35);
  o.connect(g).connect(dest);
  o.start();
  o.stop(c.currentTime + 0.4);
}

function tada(c: AudioContext, dest: AudioNode) {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const start = c.currentTime + i * 0.08;
    const g = c.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.35, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    o.connect(g).connect(dest);
    o.start(start);
    o.stop(start + 0.5);
  });
}

function clickSfx(c: AudioContext, dest: AudioNode) {
  const o = c.createOscillator();
  o.type = "square";
  o.frequency.value = 1800;
  const g = envGain(c, 0.18, 0.002, 0.05);
  o.connect(g).connect(dest);
  o.start();
  o.stop(c.currentTime + 0.06);
}

/** Very short, soft tap — used for button press feedback. */
function tickSfx(c: AudioContext, dest: AudioNode) {
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = 2400;
  const g = envGain(c, 0.08, 0.001, 0.03);
  o.connect(g).connect(dest);
  o.start();
  o.stop(c.currentTime + 0.04);
}

export function playSfx(name: SfxName) {
  const c = ensureCtx();
  if (!c || !masterSfxGain) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  switch (name) {
    case "chime":
      chime(c, masterSfxGain);
      break;
    case "buzzer":
      buzzer(c, masterSfxGain);
      break;
    case "horn":
      horn(c, masterSfxGain);
      break;
    case "cheer":
      cheer(c, masterSfxGain);
      break;
    case "boo":
      boo(c, masterSfxGain);
      break;
    case "whistle":
      whistle(c, masterSfxGain);
      break;
    case "swoosh":
      swoosh(c, masterSfxGain);
      break;
    case "ding":
      ding(c, masterSfxGain);
      break;
    case "tada":
      tada(c, masterSfxGain);
      break;
    case "click":
      clickSfx(c, masterSfxGain);
      break;
    case "tick":
      tickSfx(c, masterSfxGain);
      break;
  }
}

/** Basketball shot sample — routed through master SFX gain with other effects. */
export const BASKETBALL_SCORE_SFX_SRC = "/sfx/basketball-swish.mp3";

/** Tracks the currently-playing SFX clip so we can stop it before the next. */
let activeClip: { stop: () => void } | null = null;

/** Cache of pre-fetched audio buffers (decoded once, played instantly). */
const decodedClipCache = new Map<string, AudioBuffer>();
const decodeInflight = new Map<string, Promise<AudioBuffer>>();

/** Pre-fetch + decode an audio file so the next `playSfxClip` of it is instant.
 *  Safe to call multiple times — caches the decoded buffer. */
export async function prefetchSfxClip(src: string): Promise<void> {
  const c = ensureCtx();
  if (!c) return;
  if (decodedClipCache.has(src)) return;
  if (decodeInflight.has(src)) {
    await decodeInflight.get(src);
    return;
  }
  const p = (async () => {
    const resp = await fetch(src);
    const arr = await resp.arrayBuffer();
    return await new Promise<AudioBuffer>((resolve, reject) => {
      c.decodeAudioData(arr, resolve, reject);
    });
  })();
  decodeInflight.set(src, p);
  try {
    const buf = await p;
    decodedClipCache.set(src, buf);
  } catch {
    /* ignore — fall back to streaming on play */
  } finally {
    decodeInflight.delete(src);
  }
}

export type PlayClipOptions = {
  onEnded?: () => void;
};

/** Stop whatever clip is currently playing (horn, basketball swish, etc.). */
export function stopActiveSfxClip() {
  if (activeClip) {
    activeClip.stop();
    activeClip = null;
  }
}

/** One-shot sampled SFX (mono/stereo clips) via Web Audio gain graph.
 *  Optional `startSec` / `endSec` let you play a sub-clip from a longer file.
 *  Calling this while a clip is already playing stops the previous one first.
 *
 *  If the file has been pre-decoded with `prefetchSfxClip`, this uses an
 *  `AudioBufferSourceNode` for zero-latency playback. Otherwise it falls
 *  back to a streaming `<audio>` element.
 */
export function playSfxClip(
  src: string,
  startSec = 0,
  endSec?: number,
  opts: PlayClipOptions = {},
) {
  // Stop any currently playing clip
  stopActiveSfxClip();
  const c = ensureCtx();
  if (!c || !masterSfxGain) return;
  if (c.state === "suspended") c.resume().catch(() => {});

  // Fast path: decoded buffer cached → instant playback, sample-accurate stop.
  const cached = decodedClipCache.get(src);
  if (cached) {
    const node = c.createBufferSource();
    node.buffer = cached;
    node.connect(masterSfxGain);
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      try { node.stop(); } catch { /* already stopped */ }
      try { node.disconnect(); } catch { /* ignore */ }
      if (activeClip === handle) activeClip = null;
    };
    node.onended = () => {
      const wasActive = activeClip === handle;
      stop();
      if (wasActive) opts.onEnded?.();
    };
    const handle = { stop };
    activeClip = handle;
    const duration = endSec != null ? Math.max(0, endSec - startSec) : undefined;
    if (duration != null) node.start(0, startSec, duration);
    else node.start(0, startSec);
    return;
  }

  // Slow path: stream via <audio>.
  const audio = new Audio(src);
  audio.preload = "auto";

  let source: MediaElementAudioSourceNode | null = null;
  try {
    source = c.createMediaElementSource(audio);
    source.connect(masterSfxGain);
  } catch {
    audio.volume = Math.min(1, Math.max(0, masterSfxGain.gain.value));
  }

  let finished = false;
  function cleanup(natural = false) {
    audio.removeEventListener("ended", onEnded);
    audio.removeEventListener("timeupdate", onTimeUpdate);
    audio.removeEventListener("error", onErr);
    try { audio.pause(); } catch { /* ignore */ }
    try { source?.disconnect(); } catch { /* ignore */ }
    audio.removeAttribute("src");
    try { audio.load(); } catch { /* ignore */ }
    const wasActive = activeClip === handle;
    if (wasActive) activeClip = null;
    if (natural && wasActive && !finished) {
      finished = true;
      opts.onEnded?.();
    }
  }

  const handle = { stop: () => cleanup(false) };
  activeClip = handle;

  function onTimeUpdate() {
    if (endSec != null && audio.currentTime >= endSec) cleanup(true);
  }
  function onEnded() { cleanup(true); }
  function onErr() { cleanup(false); }

  if (endSec != null) audio.addEventListener("timeupdate", onTimeUpdate);
  audio.addEventListener("ended", onEnded);
  audio.addEventListener("error", onErr, { once: true });

  const startPlayback = () => {
    audio.currentTime = startSec;
    audio.play().catch(() => cleanup(false));
  };

  if (startSec > 0) {
    if (audio.readyState >= 2) {
      startPlayback();
    } else {
      audio.addEventListener("canplay", startPlayback, { once: true });
      audio.load();
    }
  } else {
    audio.play().catch(() => cleanup(false));
  }
}

/** Short haptic vibration on supported devices. Safe no-op elsewhere. */
export function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

/**
 * File-based looping music. `src` is a static path; the track plays from
 * `loopStart` and either snaps back at `loopEnd` (if provided) or restarts
 * from `loopStart` once it ends. Routed through the master music gain via a
 * MediaElementAudioSourceNode so the music volume slider applies.
 */
function startTrackFromFile(
  c: AudioContext,
  dest: AudioNode,
  src: string,
  loopStart: number,
  loopEnd?: number,
): { stop: () => void } {
  const audio = new Audio(src);
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";
  audio.loop = false;
  audio.currentTime = loopStart;

  let source: MediaElementAudioSourceNode | null = null;
  try {
    source = c.createMediaElementSource(audio);
    source.connect(dest);
  } catch {
    // Fallback: route through default destination if Web Audio routing fails.
  }

  const onTimeUpdate = () => {
    if (loopEnd != null && audio.currentTime >= loopEnd) {
      audio.currentTime = loopStart;
    }
  };
  const onEnded = () => {
    audio.currentTime = loopStart;
    audio.play().catch(() => {});
  };
  audio.addEventListener("timeupdate", onTimeUpdate);
  audio.addEventListener("ended", onEnded);

  const onCanPlay = () => {
    audio.currentTime = loopStart;
    audio.play().catch(() => {});
  };
  if (audio.readyState >= 2) onCanPlay();
  else audio.addEventListener("canplay", onCanPlay, { once: true });

  return {
    stop: () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
      try {
        source?.disconnect();
      } catch {
        /* ignore */
      }
      audio.src = "";
      try {
        audio.load();
      } catch {
        /* ignore */
      }
    },
  };
}

/** PD US Gov — Army Field Band; source .oga: https://commons.wikimedia.org/wiki/File:%22The_Star-Spangled_Banner%22_-_Choral_with_band_accompaniment_-_United_States_Army_Field_Band.oga */
const ANTHEM_MP3 = "/music/star-spangled-banner-anthem.mp3";

export function setMusic(track: MusicTrack) {
  const c = ensureCtx();
  if (!c || !masterMusicGain) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  if (track === currentTrack) return;
  if (musicNodes) {
    musicNodes.stop();
    musicNodes = null;
  }
  currentTrack = track;
  if (track === "none") return;
  if (track === "hype")
    musicNodes = startTrackFromFile(
      c,
      masterMusicGain,
      "/music/kernkraft.mp3",
      45,
      105,
    );
  if (track === "anthem")
    musicNodes = startTrackFromFile(c, masterMusicGain, ANTHEM_MP3, 0);
}

export function getCurrentTrack(): MusicTrack {
  return currentTrack;
}

// ---------------------------------------------------------------------------
// Theme ambient layer — separate from the music track, plays low-level
// background audio tied to the selected visual theme.
// ---------------------------------------------------------------------------

let themeAmbientNodes: { stop: () => void } | null = null;
let currentThemeAmbient: string = "none";

/** Theme → ambient config. `loopEnd` = 0 means full file. */
const THEME_AMBIENTS: Record<string, { src: string; loopStart: number; loopEnd: number }> = {
  stadium: { src: "/sfx/stadium-roar.mp3", loopStart: 0, loopEnd: 22 },
};

export function setThemeAmbient(themeId: string) {
  if (themeId === currentThemeAmbient) return;
  if (themeAmbientNodes) {
    themeAmbientNodes.stop();
    themeAmbientNodes = null;
  }
  currentThemeAmbient = themeId;
  const cfg = THEME_AMBIENTS[themeId];
  if (!cfg) return;
  const c = ensureCtx();
  if (!c || !masterMusicGain) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  themeAmbientNodes = startTrackFromFile(c, masterMusicGain, cfg.src, cfg.loopStart, cfg.loopEnd);
}

export function stopThemeAmbient() {
  if (themeAmbientNodes) {
    themeAmbientNodes.stop();
    themeAmbientNodes = null;
  }
  currentThemeAmbient = "none";
}
