"use client";

/**
 * Lightweight Web Audio engine — synthesizes SFX and music from oscillators
 * and noise, so no audio files need to be hosted.
 */

export type SfxName =
  | "chime"
  | "buzzer"
  | "horn"
  | "whistle"
  | "swoosh"
  | "ding"
  | "tada"
  | "click"
  | "tick";

export type MusicTrack = import("./types").MusicTrackId;

let ctx: AudioContext | null = null;
let masterSfxGain: GainNode | null = null;
let masterMusicGain: GainNode | null = null;

let musicNodes: MusicHandle | null = null;
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
    // iOS: play through the silent/ringer switch like a media app.
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) {
      try {
        nav.audioSession.type = "playback";
      } catch {
        /* ignore */
      }
    }
    masterSfxGain = ctx.createGain();
    masterSfxGain.gain.value = 0.6;
    masterSfxGain.connect(ctx.destination);
    masterMusicGain = ctx.createGain();
    masterMusicGain.gain.value = 0.3;
    masterMusicGain.connect(ctx.destination);
    ambientGain = ctx.createGain();
    ambientGain.gain.value = crowdIntensityMultiplier;
    ambientGain.connect(ctx.destination);
  } catch {
    return null;
  }
  return ctx;
}

let resumeInFlight: Promise<AudioContext | null> | null = null;

/** Safari can leave `resume()` pending forever when called outside a gesture. */
const RESUME_TIMEOUT_MS = 1200;

function resumeWithTimeout(c: AudioContext): Promise<void> {
  return Promise.race([
    c.resume().catch(() => {}),
    new Promise<void>((r) => window.setTimeout(r, RESUME_TIMEOUT_MS)),
  ]);
}

/** Await a running AudioContext (required on iOS / after tab backgrounding). */
export async function ensureAudioRunning(): Promise<AudioContext | null> {
  const c = ensureCtx();
  if (!c || !masterSfxGain) return null;
  if (c.state === "running") return c;
  if (resumeInFlight) return resumeInFlight;

  resumeInFlight = (async () => {
    try {
      // Silent one-sample buffer helps iOS unlock output inside the gesture.
      const buf = c.createBuffer(1, 1, c.sampleRate);
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.start(0);
      await resumeWithTimeout(c);
    } catch {
      return null;
    }
    return (c.state as string) === "running" ? c : null;
  })().finally(() => {
    resumeInFlight = null;
  });

  return resumeInFlight;
}

/** Resume the context and restart any music element the browser paused. */
function resumeActiveAudio() {
  void ensureAudioRunning();
  musicNodes?.resume();
}

/** Sync Web Audio master gains from persisted game prefs (after hydration). */
export function applyAudioOutputPrefs(prefs: {
  sfxEnabled: boolean;
  sfxVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
}) {
  ensureCtx();
  setSfxVolume(prefs.sfxEnabled ? prefs.sfxVolume : 0);
  setMusicVolume(prefs.musicEnabled ? prefs.musicVolume : 0);
}

/** Resume audio when the tab or window becomes active again. */
export function watchAudioLifecycle(): () => void {
  if (typeof window === "undefined") return () => {};
  const resumeIfNeeded = () => {
    if (document.visibilityState === "visible") resumeActiveAudio();
  };
  document.addEventListener("visibilitychange", resumeIfNeeded);
  window.addEventListener("pageshow", resumeIfNeeded);
  window.addEventListener("focus", resumeIfNeeded);
  return () => {
    document.removeEventListener("visibilitychange", resumeIfNeeded);
    window.removeEventListener("pageshow", resumeIfNeeded);
    window.removeEventListener("focus", resumeIfNeeded);
  };
}

let gestureListenersAttached = false;

/** Resume the audio context on every user gesture where it isn't running.
 *  iOS/Safari starts it suspended and re-suspends it after interruptions
 *  (calls, Siri, backgrounding), and only a gesture can wake it again. */
export function primeAudioOnFirstGesture() {
  if (typeof window === "undefined" || gestureListenersAttached) return;
  gestureListenersAttached = true;
  const unlock = () => {
    if (ctx?.state === "running" && !musicNodes?.needsResume()) return;
    resumeActiveAudio();
  };
  window.addEventListener("pointerdown", unlock, { passive: true, capture: true });
  window.addEventListener("touchend", unlock, { passive: true, capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
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

export function speakAnnouncement(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch {
    // No-op
  }
}

function dispatchSfx(c: AudioContext, name: SfxName) {
  if (!masterSfxGain) return;
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

export function playSfx(name: SfxName) {
  void ensureAudioRunning().then((c) => {
    if (!c) return;
    dispatchSfx(c, name);
  });
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
function playSfxClipWithContext(
  c: AudioContext,
  src: string,
  startSec = 0,
  endSec?: number,
  opts: PlayClipOptions = {},
) {
  if (!masterSfxGain) return;

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

  playElementFrom(audio, startSec).catch(() => cleanup(false));
}

/** Start an element at `startSec` with `play()` called synchronously, so it
 *  still counts as part of the user gesture (Safari rejects deferred plays). */
function playElementFrom(audio: HTMLAudioElement, startSec: number): Promise<void> {
  if (startSec > 0) {
    const seek = () => {
      if (Math.abs(audio.currentTime - startSec) > 0.25) audio.currentTime = startSec;
    };
    try {
      audio.currentTime = startSec;
    } catch {
      /* not seekable yet */
    }
    if (audio.readyState < 1) audio.addEventListener("loadedmetadata", seek, { once: true });
  }
  return audio.play();
}

export function playSfxClip(
  src: string,
  startSec = 0,
  endSec?: number,
  opts: PlayClipOptions = {},
) {
  stopActiveSfxClip();
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "running" || !decodedClipCache.has(src)) {
    if (c.state !== "running") void ensureAudioRunning();
    playSfxClipWithContext(c, src, startSec, endSec, opts);
    return;
  }
  void ensureAudioRunning().then((running) => {
    if (!running) return;
    playSfxClipWithContext(running, src, startSec, endSec, opts);
  });
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
type MusicHandle = {
  stop: () => void;
  /** Re-issue `play()` if the browser paused or blocked the element. */
  resume: () => void;
  needsResume: () => boolean;
};

function routeElement(
  c: AudioContext,
  audio: HTMLAudioElement,
  dest: AudioNode,
): MediaElementAudioSourceNode | null {
  try {
    const source = c.createMediaElementSource(audio);
    source.connect(dest);
    return source;
  } catch {
    // Element plays to the default output; approximate the music volume.
    audio.volume = Math.min(1, Math.max(0, masterMusicGain?.gain.value ?? 1));
    return null;
  }
}

function startTrackFromFile(
  c: AudioContext,
  dest: AudioNode,
  src: string,
  loopStart: number,
  loopEnd?: number,
): MusicHandle {
  const audio = new Audio(src);
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";
  audio.loop = false;
  const source = routeElement(c, audio, dest);
  let stopped = false;

  const onTimeUpdate = () => {
    if (loopEnd != null && audio.currentTime >= loopEnd) {
      audio.currentTime = loopStart;
    }
  };
  const onEnded = () => {
    if (stopped) return;
    playElementFrom(audio, loopStart).catch(() => {});
  };
  audio.addEventListener("timeupdate", onTimeUpdate);
  audio.addEventListener("ended", onEnded);

  playElementFrom(audio, loopStart).catch(() => {});

  return {
    stop: () => {
      stopped = true;
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
      audio.removeAttribute("src");
      try {
        audio.load();
      } catch {
        /* ignore */
      }
    },
    needsResume: () => !stopped && audio.paused,
    resume: () => {
      if (!stopped && audio.paused) audio.play().catch(() => {});
    },
  };
}

type ShuffleSong = {
  src: string;
  start: number;
  end?: number;
  fade?: number;
};

const SHUFFLE_PLAYLIST: ShuffleSong[] = [
  { src: "/music/dont-stop-believin.mp3", start: 0, end: 195, fade: 4 },
  { src: "/music/enter-sandman.mp3", start: 0, end: 120, fade: 4 },
  { src: "/music/we-will-rock-you.mp3", start: 0 },
  { src: "/music/mr-brightside.mp3", start: 0, end: 97, fade: 4 },
  { src: "/music/seven-nation-army.mp3", start: 0, end: 157, fade: 4 },
  { src: "/music/lose-yourself.mp3", start: 0 },
  { src: "/music/thunderstruck.mp3", start: 0 },
  { src: "/music/cult-of-personality.mp3", start: 0 },
];

function startShufflePlaylist(
  c: AudioContext,
  dest: AudioNode
): MusicHandle {
  let stopped = false;
  
  const activeAudio = new Audio();
  activeAudio.crossOrigin = "anonymous";
  activeAudio.preload = "auto";
  activeAudio.loop = false;

  const activeGain = c.createGain();
  activeGain.gain.value = 1;
  activeGain.connect(dest);

  const activeSource = routeElement(c, activeAudio, activeGain);

  let timeoutId: number | null = null;
  let fadeTimeoutId: number | null = null;
  let queue: number[] = [];
  let lastIndex = -1;
  let currentSong: ShuffleSong | null = null;
  let fadeTriggered = false;
  let consecutiveErrors = 0;

  /** Every song plays once before any repeats; no back-to-back repeat across rounds. */
  const nextIndex = () => {
    if (queue.length === 0) {
      queue = SHUFFLE_PLAYLIST.map((_, i) => i);
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
      if (queue.length > 1 && queue[0] === lastIndex) queue.push(queue.shift()!);
    }
    return queue.shift()!;
  };

  const cleanupTimers = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (fadeTimeoutId !== null) {
      window.clearTimeout(fadeTimeoutId);
      fadeTimeoutId = null;
    }
  };

  const playNext = () => {
    if (stopped) return;
    cleanupTimers();
    
    const index = nextIndex();
    lastIndex = index;
    currentSong = SHUFFLE_PLAYLIST[index];
    fadeTriggered = false;

    // Reset gain in case it was faded out
    activeGain.gain.cancelScheduledValues(c.currentTime);
    activeGain.gain.setValueAtTime(1, c.currentTime);

    activeAudio.src = currentSong.src;
    // A blocked play() (no gesture yet) stays paused; the next tap resumes it.
    playElementFrom(activeAudio, currentSong.start).catch(() => {});
  };

  const onError = () => {
    if (stopped) return;
    consecutiveErrors += 1;
    if (consecutiveErrors >= SHUFFLE_PLAYLIST.length) return;
    timeoutId = window.setTimeout(playNext, 500);
  };
  const onPlaying = () => {
    consecutiveErrors = 0;
  };

  const onTimeUpdate = () => {
    if (stopped || !currentSong) return;
    const song = currentSong;
    if (song.end && song.fade && !fadeTriggered) {
      if (activeAudio.currentTime >= song.end - song.fade) {
        fadeTriggered = true;
        activeGain.gain.cancelScheduledValues(c.currentTime);
        activeGain.gain.setValueAtTime(activeGain.gain.value, c.currentTime);
        activeGain.gain.linearRampToValueAtTime(0.001, c.currentTime + song.fade);
        fadeTimeoutId = window.setTimeout(playNext, song.fade * 1000);
      }
    } else if (song.end && !song.fade && activeAudio.currentTime >= song.end) {
      playNext();
    }
  };

  const onEnded = () => {
    if (!stopped) playNext();
  };

  activeAudio.addEventListener("timeupdate", onTimeUpdate);
  activeAudio.addEventListener("ended", onEnded);
  activeAudio.addEventListener("error", onError);
  activeAudio.addEventListener("playing", onPlaying);

  playNext();

  const isPausedMidSong = () =>
    !stopped && timeoutId === null && activeAudio.paused && !activeAudio.ended;

  return {
    stop: () => {
      stopped = true;
      cleanupTimers();
      activeAudio.removeEventListener("timeupdate", onTimeUpdate);
      activeAudio.removeEventListener("ended", onEnded);
      activeAudio.removeEventListener("error", onError);
      activeAudio.removeEventListener("playing", onPlaying);
      try { activeAudio.pause(); } catch {}
      try { activeAudio.removeAttribute("src"); } catch {}
      try { activeAudio.load(); } catch {}
      try { activeSource?.disconnect(); } catch {}
      try { activeGain?.disconnect(); } catch {}
    },
    needsResume: isPausedMidSong,
    resume: () => {
      if (isPausedMidSong()) activeAudio.play().catch(() => {});
    },
  };
}

/** PD US Gov — Army Field Band; source .oga: https://commons.wikimedia.org/wiki/File:%22The_Star-Spangled_Banner%22_-_Choral_with_band_accompaniment_-_United_States_Army_Field_Band.oga */
const ANTHEM_MP3 = "/music/star-spangled-banner-anthem.mp3";

/** Must stay synchronous: `play()` has to run inside the triggering gesture,
 *  and rapid toggles must apply in call order. */
export function setMusic(track: MusicTrack) {
  if (track === currentTrack) {
    musicNodes?.resume();
    return;
  }
  if (musicNodes) {
    musicNodes.stop();
    musicNodes = null;
  }
  currentTrack = track;
  // YouTube audio is handled by the IFrame player component.
  if (track === "none" || track === "youtube") return;

  const c = ensureCtx();
  if (!c || !masterMusicGain) return;
  if (c.state !== "running") void ensureAudioRunning();

  if (track === "hype")
    musicNodes = startTrackFromFile(c, masterMusicGain, "/music/kernkraft.mp3", 45, 105);
  if (track === "anthem")
    musicNodes = startTrackFromFile(c, masterMusicGain, ANTHEM_MP3, 0);
  if (track === "shuffle")
    musicNodes = startShufflePlaylist(c, masterMusicGain);
}

export function getCurrentTrack(): MusicTrack {
  return currentTrack;
}

// ---------------------------------------------------------------------------
// Theme ambient layer — separate from the music track, plays low-level
// background audio tied to the selected visual theme.
// ---------------------------------------------------------------------------

let ambientGain: GainNode | null = null;
let crowdIntensityMultiplier = 0.4;

const CROWD_STADIUM_HOUR = "/sfx/crowd-stadium-hour.mp3";
const CROWD_HEY_CHANT = "/sfx/crowd-hey-hey-hey.mp3";
/** Never sample the first five minutes of the hour-long stadium bed. */
const CROWD_MIN_START_SEC = 5 * 60;
/** Loop a random ten-minute window from the stadium file. */
const CROWD_SEGMENT_SEC = 10 * 60;

let gameCrowdNodes: { stop: () => void } | null = null;
let hockeyCrowdSession = 0;

export function setCrowdIntensity(v: number) {
  crowdIntensityMultiplier = Math.max(0, Math.min(1, v));
  if (ambientGain) ambientGain.gain.value = crowdIntensityMultiplier;
}

function pickRandomStadiumSegment(): Promise<{
  loopStart: number;
  loopEnd: number;
}> {
  return new Promise((resolve) => {
    const probe = new Audio(CROWD_STADIUM_HOUR);
    probe.preload = "metadata";
    const done = () => {
      const dur =
        Number.isFinite(probe.duration) && probe.duration > 0
          ? probe.duration
          : 3600;
      const maxStart = Math.max(CROWD_MIN_START_SEC, dur - CROWD_SEGMENT_SEC);
      const span = Math.max(0, maxStart - CROWD_MIN_START_SEC);
      const loopStart = CROWD_MIN_START_SEC + Math.random() * span;
      const loopEnd = Math.min(loopStart + CROWD_SEGMENT_SEC, dur);
      resolve({ loopStart, loopEnd });
      probe.src = "";
      try {
        probe.load();
      } catch {
        /* ignore */
      }
    };
    probe.addEventListener("loadedmetadata", done, { once: true });
    probe.addEventListener("error", () => {
      resolve({
        loopStart: CROWD_MIN_START_SEC,
        loopEnd: CROWD_MIN_START_SEC + CROWD_SEGMENT_SEC,
      });
    }, { once: true });
    probe.load();
  });
}

/** Start “hey hey hey” this many seconds before the 10-minute stadium slice ends. */
const CROWD_HEY_LEAD_SEC = 1;
/** Restart the stadium bed this many seconds before the hey clip ends. */
const CROWD_BED_RESTART_BEFORE_HEY_END_SEC = 0.5;

let hockeyCrowdPlaying = false;

export function isHockeyCrowdPlaying() {
  return hockeyCrowdPlaying;
}

/**
 * Hockey menu crowd: random 10-minute stadium slice (after 5:00 in the hour file).
 * Hey-hey-hey plays only in the last second of each slice; the bed restarts 0.5s
 * before the hey clip ends, then repeats.
 */
export function startHockeyCrowd() {
  if (hockeyCrowdPlaying) return;
  stopHockeyCrowd();
  hockeyCrowdPlaying = true;
  const session = ++hockeyCrowdSession;

  void ensureAudioRunning().then(async (c) => {
    if (session !== hockeyCrowdSession) return;
    if (!c || !ambientGain) {
      hockeyCrowdPlaying = false;
      return;
    }
    const { loopStart, loopEnd } = await pickRandomStadiumSegment();

    const bed = new Audio(CROWD_STADIUM_HOUR);
    bed.crossOrigin = "anonymous";
    bed.preload = "auto";

    const chant = new Audio(CROWD_HEY_CHANT);
    chant.crossOrigin = "anonymous";
    chant.preload = "auto";

    let bedSource: MediaElementAudioSourceNode | null = null;
    let chantSource: MediaElementAudioSourceNode | null = null;
    try {
      bedSource = c.createMediaElementSource(bed);
      bedSource.connect(ambientGain);
      chantSource = c.createMediaElementSource(chant);
      chantSource.connect(ambientGain);
    } catch {
      /* fallback: element audio only */
    }

    let stopped = false;
    let chantTriggered = false;
    let handoffPending = false;

    const beginBedCycle = () => {
      chantTriggered = false;
      handoffPending = false;
      try {
        chant.pause();
      } catch {
        /* ignore */
      }
      chant.currentTime = 0;
      bed.currentTime = loopStart;
      bed.play().catch(() => {});
    };

    const onBedTimeUpdate = () => {
      if (stopped || chantTriggered) return;
      if (bed.currentTime >= loopEnd - CROWD_HEY_LEAD_SEC) {
        chantTriggered = true;
        chant.currentTime = 0;
        chant.play().catch(() => {});
      }
      if (bed.currentTime >= loopEnd - 0.05) {
        try {
          bed.pause();
        } catch {
          /* ignore */
        }
      }
    };

    const onChantTimeUpdate = () => {
      if (stopped || handoffPending) return;
      const d =
        Number.isFinite(chant.duration) && chant.duration > 0
          ? chant.duration
          : 3;
      if (chant.currentTime >= d - CROWD_BED_RESTART_BEFORE_HEY_END_SEC) {
        handoffPending = true;
        beginBedCycle();
      }
    };

    bed.addEventListener("timeupdate", onBedTimeUpdate);
    chant.addEventListener("timeupdate", onChantTimeUpdate);

    const onBedReady = () => {
      beginBedCycle();
    };
    if (bed.readyState >= 2) onBedReady();
    else bed.addEventListener("canplay", onBedReady, { once: true });

    gameCrowdNodes = {
      stop: () => {
        stopped = true;
        hockeyCrowdPlaying = false;
        bed.removeEventListener("timeupdate", onBedTimeUpdate);
        chant.removeEventListener("timeupdate", onChantTimeUpdate);
        try {
          bed.pause();
          chant.pause();
        } catch {
          /* ignore */
        }
        try {
          bedSource?.disconnect();
          chantSource?.disconnect();
        } catch {
          /* ignore */
        }
        bed.src = "";
        chant.src = "";
        try {
          bed.load();
          chant.load();
        } catch {
          /* ignore */
        }
      },
    };
  });
}

export function stopHockeyCrowd() {
  hockeyCrowdSession += 1;
  if (gameCrowdNodes) {
    gameCrowdNodes.stop();
    gameCrowdNodes = null;
  }
  hockeyCrowdPlaying = false;
}

/** Toggle from Hockey → Crowd; returns whether crowd is now playing. */
export function toggleHockeyCrowd(): boolean {
  if (hockeyCrowdPlaying) {
    stopHockeyCrowd();
    return false;
  }
  startHockeyCrowd();
  return true;
}

/** @deprecated Crowd is manual from Hockey settings. */
export function startGameCrowdAmbient() {}

/** @deprecated Use stopHockeyCrowd. */
export function stopGameCrowdAmbient() {
  stopHockeyCrowd();
}

export function setThemeAmbient(_themeId: string) {}

export function stopThemeAmbient() {
  stopHockeyCrowd();
}
