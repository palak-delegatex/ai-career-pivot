"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// AIC-334: browser Text-to-Speech for the AI interviewer, so voice-mode
// interviews are spoken aloud rather than read. Wraps the Web Speech API's
// SpeechSynthesis with graceful degradation — if the browser has no support,
// `supported` is false and speak() is a no-op.

export interface UseSpeechSynthesis {
  /** True if the browser exposes speechSynthesis. */
  supported: boolean;
  /** Whether a preferred voice is currently being spoken. */
  speaking: boolean;
  /** Speak the given text, cancelling anything already in progress. */
  speak: (text: string) => void;
  /** Stop any in-progress speech immediately. */
  cancel: () => void;
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (voices.length === 0) return undefined;
  // Prefer a natural-sounding en-US voice; fall back to any English voice, then
  // the first available voice.
  return (
    voices.find((v) => v.lang === "en-US" && /natural|google|samantha/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0]
  );
}

export function useSpeechSynthesis(): UseSpeechSynthesis {
  // Read support from an external system (the browser) rather than syncing it
  // into an effect — false during SSR, true once hydrated where the API exists.
  const supported = useSyncExternalStore(
    () => () => {},
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false
  );
  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!supported) return;

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    // Voices load asynchronously in some browsers.
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      // Never leave the tab talking after unmount.
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    // Cancel anything mid-utterance so questions don't stack up.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);
    const voice = pickVoice(voicesRef.current);
    if (voice) utterance.voice = voice;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return { supported, speaking, speak, cancel };
}
