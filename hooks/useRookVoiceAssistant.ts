"use client";

import { useEffect, useRef, useState } from "react";

type TeamSide = "a" | "b";
type MusicTrackId = "none" | "hype" | "anthem";

type VoiceOptions = {
  teamAName: string;
  teamBName: string;
  hasFouls: boolean;
  hasTimeouts: boolean;
  hasPossession: boolean;
  enabled?: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  adjustScore: (team: TeamSide, delta: number) => void;
  adjustFouls: (team: TeamSide, delta: number) => void;
  adjustTimeouts: (team: TeamSide, delta: number) => void;
  setPossession: (team: TeamSide | null) => void;
  startShotClock: () => void;
  pauseShotClock: () => void;
  nextPeriod: () => void;
  prevPeriod: () => void;
  resetScoresOnly: () => void;
  playHorn: () => void;
  playWhistle: () => void;
  playFinalCountdown: () => void;
  setMusicEnabled: (enabled: boolean) => void;
  setMusicTrack: (track: MusicTrackId) => void;
  showBanner: (text: string, subtext?: string, flavor?: "info" | "warn") => void;
};

type SpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch {
    // No-op: speech output is optional.
  }
}

function normalize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readNumber(text: string): number | null {
  const numeric = text.match(/\b(\d+)\b/);
  if (numeric) return Number(numeric[1]);
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (text.includes(` ${word} `) || text.startsWith(`${word} `) || text.endsWith(` ${word}`)) {
      return value;
    }
  }
  return null;
}

function includesAny(text: string, patterns: string[]) {
  return patterns.some((p) => text.includes(p));
}

function detectTeam(text: string, teamAName: string, teamBName: string): TeamSide | null {
  const aName = normalize(teamAName);
  const bName = normalize(teamBName);
  if (
    includesAny(text, [" home", " team a", "left team", "our team"]) ||
    (aName.length > 1 && text.includes(aName))
  ) {
    return "a";
  }
  if (
    includesAny(text, [" away", " team b", "right team", "opponent"]) ||
    (bName.length > 1 && text.includes(bName))
  ) {
    return "b";
  }
  return null;
}

export function useRookVoiceAssistant(options: VoiceOptions) {
  const enabled = options.enabled ?? true;
  const optsRef = useRef(options);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const [isListening, setIsListening] = useState(false);
  const dedupeRef = useRef<{ text: string; ts: number }>({ text: "", ts: 0 });

  useEffect(() => {
    optsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) return;

    const Ctor = (
      window as unknown as {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      }
    ).SpeechRecognition ||
      (
        window as unknown as {
          SpeechRecognition?: SpeechRecognitionCtor;
          webkitSpeechRecognition?: SpeechRecognitionCtor;
        }
      ).webkitSpeechRecognition;

    if (!Ctor) return;

    const runCommand = (raw: string) => {
      const now = Date.now();
      const normalized = ` ${normalize(raw)} `;
      if (!normalized.trim()) return;

      // Because it's push-to-talk now, we don't require the "Rook" wake word,
      // but we strip it out if they naturally say it.
      let commandText = normalized.replace(/\brook\b/g, " ").replace(/\s+/g, " ").trim();
      if (includesAny(commandText, ["look", "book", "route", "brooke"])) {
        commandText = commandText
          .replace(/\blook\b/g, "")
          .replace(/\bbook\b/g, "")
          .replace(/\broute\b/g, "")
          .replace(/\bbrooke\b/g, "")
          .replace(/\s+/g, " ")
          .trim();
      }

      if (!commandText) return;

      if (
        dedupeRef.current.text === commandText &&
        now - dedupeRef.current.ts < 2000
      ) {
        return;
      }
      dedupeRef.current = { text: commandText, ts: now };

      const opts = optsRef.current;
      const team = detectTeam(commandText, opts.teamAName, opts.teamBName);
      const scoreNum = Math.max(1, readNumber(commandText) ?? 1);
      const minus = includesAny(commandText, [
        " subtract ",
        " minus ",
        " remove ",
        " decrease ",
        " take away ",
      ]);
      const plus = includesAny(commandText, [" add ", " plus ", " increase ", " score "]);

      if (includesAny(commandText, [" start timer", " start clock", " resume timer", " resume clock"])) {
        opts.startTimer();
        opts.showBanner("Rook", "Timer started.", "info");
        speak("Timer started.");
        return;
      }
      if (includesAny(commandText, [" stop timer", " pause timer", " stop clock", " pause clock"])) {
        opts.pauseTimer();
        opts.showBanner("Rook", "Timer paused.", "info");
        speak("Timer paused.");
        return;
      }
      if (includesAny(commandText, [" reset timer", " reset clock"])) {
        opts.resetTimer();
        opts.showBanner("Rook", "Timer reset.", "info");
        speak("Timer reset.");
        return;
      }
      if (includesAny(commandText, [" start shot clock", " resume shot clock"])) {
        opts.startShotClock();
        opts.showBanner("Rook", "Shot clock started.", "info");
        speak("Shot clock started.");
        return;
      }
      if (includesAny(commandText, [" stop shot clock", " pause shot clock"])) {
        opts.pauseShotClock();
        opts.showBanner("Rook", "Shot clock paused.", "info");
        speak("Shot clock paused.");
        return;
      }
      if (includesAny(commandText, [" next period", " period up", " advance period"])) {
        opts.nextPeriod();
        opts.showBanner("Rook", "Advanced to next period.", "info");
        speak("Next period.");
        return;
      }
      if (includesAny(commandText, [" previous period", " prior period", " period down"])) {
        opts.prevPeriod();
        opts.showBanner("Rook", "Moved to previous period.", "info");
        speak("Previous period.");
        return;
      }
      if (commandText.includes("horn")) {
        opts.playHorn();
        opts.showBanner("Rook", "Horn.", "info");
        speak("Horn.");
        return;
      }
      if (commandText.includes("whistle")) {
        opts.playWhistle();
        opts.showBanner("Rook", "Whistle.", "info");
        speak("Whistle.");
        return;
      }
      if (includesAny(commandText, [" final countdown", " play countdown"])) {
        opts.playFinalCountdown();
        opts.showBanner("Rook", "Playing Final Countdown.", "info");
        speak("Playing final countdown.");
        return;
      }
      if (includesAny(commandText, [" stop music", " music off", " mute music"])) {
        opts.setMusicEnabled(false);
        opts.showBanner("Rook", "Music off.", "info");
        speak("Music off.");
        return;
      }
      if (includesAny(commandText, [" anthem", " star spangled"])) {
        opts.setMusicTrack("anthem");
        opts.setMusicEnabled(true);
        opts.showBanner("Rook", "Music: anthem.", "info");
        speak("Anthem selected.");
        return;
      }
      if (includesAny(commandText, [" hype", " hype track", " music on", " play music"])) {
        opts.setMusicTrack("hype");
        opts.setMusicEnabled(true);
        opts.showBanner("Rook", "Music: hype.", "info");
        speak("Hype music selected.");
        return;
      }
      if (commandText.includes("possession")) {
        if (!opts.hasPossession) {
          opts.showBanner("Rook", "Possession is not available for this sport.", "warn");
          speak("Possession is not available for this sport.");
          return;
        }
        if (!team) {
          opts.showBanner("Rook", "Say home or away for possession.", "warn");
          speak("Say home or away.");
          return;
        }
        opts.setPossession(team);
        opts.showBanner("Rook", `${team === "a" ? "Home" : "Away"} possession set.`, "info");
        speak("Possession set.");
        return;
      }
      if (commandText.includes("timeout")) {
        if (!opts.hasTimeouts) {
          opts.showBanner("Rook", "Timeouts are not available for this sport.", "warn");
          speak("Timeouts are not available for this sport.");
          return;
        }
        if (!team) {
          opts.showBanner("Rook", "Say home or away timeout.", "warn");
          speak("Say home or away timeout.");
          return;
        }
        const delta = minus ? -scoreNum : plus ? scoreNum : -1;
        opts.adjustTimeouts(team, delta);
        opts.showBanner("Rook", `${team === "a" ? "Home" : "Away"} timeout updated.`, "info");
        speak("Timeout updated.");
        return;
      }
      if (commandText.includes("foul")) {
        if (!opts.hasFouls) {
          opts.showBanner("Rook", "Fouls are not available for this sport.", "warn");
          speak("Fouls are not available for this sport.");
          return;
        }
        if (!team) {
          opts.showBanner("Rook", "Say home or away foul.", "warn");
          speak("Say home or away foul.");
          return;
        }
        const delta = minus ? -scoreNum : scoreNum;
        opts.adjustFouls(team, delta);
        opts.showBanner("Rook", `${team === "a" ? "Home" : "Away"} foul updated.`, "info");
        speak("Foul updated.");
        return;
      }
      if (
        includesAny(commandText, [
          " score ",
          " points ",
          " add ",
          " plus ",
          " subtract ",
          " minus ",
        ])
      ) {
        if (!team) {
          opts.showBanner("Rook", "Say home or away when changing score.", "warn");
          speak("Say home or away.");
          return;
        }
        const delta = minus ? -scoreNum : scoreNum;
        opts.adjustScore(team, delta);
        opts.showBanner("Rook", `${team === "a" ? "Home" : "Away"} ${delta > 0 ? "+" : ""}${delta}.`, "info");
        speak("Score updated.");
        return;
      }
      if (includesAny(commandText, [" reset scores", " clear scores"])) {
        opts.resetScoresOnly();
        opts.showBanner("Rook", "Scores reset.", "info");
        speak("Scores reset.");
        return;
      }

      opts.showBanner(
        "Rook command not recognized",
        "Try: 'add 2 to home', 'start timer', 'whistle'.",
        "warn",
      );
    };

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    // For tap-to-talk on mobile, continuous should be false so it turns off
    // automatically when they finish speaking.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (ev) => {
      for (const result of ev.results) {
        if (!result.isFinal) continue;
        const text = result[0]?.transcript ?? "";
        if (text.trim()) runCommand(text);
      }
    };

    recognition.onerror = (ev) => {
      setIsListening(false);
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        optsRef.current.showBanner(
          "Rook mic blocked",
          "Enable microphone permission for voice commands.",
          "warn",
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      setIsListening(false);
      try {
        recognition.stop();
      } catch {
        // No-op
      }
      recognitionRef.current = null;
    };
  }, [enabled]);

  const listen = () => {
    if (!recognitionRef.current) {
      optsRef.current.showBanner("Voice commands not supported", "Please try a different browser.", "warn");
      return;
    }
    if (isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      optsRef.current.showBanner("Listening...", "Say a command like 'Add 2 to home'.", "info");
      speak("Listening.");
    } catch {
      optsRef.current.showBanner("Rook unavailable", "Please try again.", "warn");
    }
  };

  return { listen, isListening };
}

