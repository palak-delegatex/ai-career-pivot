"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

export interface SpeechMetrics {
  durationSeconds: number;
  wordCount: number;
  wordsPerMinute: number;
  fillerWords: { word: string; count: number }[];
  fillerWordTotal: number;
  fillerWordPercentage: number;
}

interface RecordingState {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  interimTranscript: string;
  audioUrl: string | null;
  metrics: SpeechMetrics | null;
  error: string | null;
  supported: boolean;
}

const FILLER_WORDS = [
  "um", "uh", "uhh", "umm", "er", "ah", "ahh",
  "like", "basically", "actually", "literally", "honestly",
  "you know", "i mean", "sort of", "kind of", "right",
];

function computeMetrics(transcript: string, durationMs: number): SpeechMetrics {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const durationSeconds = Math.max(durationMs / 1000, 1);
  const wordsPerMinute = Math.round((wordCount / durationSeconds) * 60);

  const lower = transcript.toLowerCase();
  const fillerWords: { word: string; count: number }[] = [];

  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      fillerWords.push({ word: filler, count: matches.length });
    }
  }

  const fillerWordTotal = fillerWords.reduce((sum, f) => sum + f.count, 0);
  const fillerWordPercentage = wordCount > 0
    ? Math.round((fillerWordTotal / wordCount) * 100)
    : 0;

  return {
    durationSeconds: Math.round(durationSeconds),
    wordCount,
    wordsPerMinute,
    fillerWords,
    fillerWordTotal,
    fillerWordPercentage,
  };
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (
    (w.SpeechRecognition as SpeechRecognitionConstructor) ??
    (w.webkitSpeechRecognition as SpeechRecognitionConstructor) ??
    null
  );
}

export function useVoiceRecorder() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isTranscribing: false,
    transcript: "",
    interimTranscript: "",
    audioUrl: null,
    metrics: null,
    error: null,
    supported: typeof window !== "undefined" && (!!getSpeechRecognition() || !!navigator.mediaDevices),
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const transcriptRef = useRef<string>("");
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass && !navigator.mediaDevices) {
      setState((s) => ({
        ...s,
        error: "Voice recording is not supported in this browser. Please use Chrome or Edge.",
      }));
      return;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    transcriptRef.current = "";
    chunksRef.current = [];
    startTimeRef.current = Date.now();

    setState((s) => ({
      ...s,
      isRecording: true,
      isTranscribing: true,
      transcript: "",
      interimTranscript: "",
      audioUrl: null,
      metrics: null,
      error: null,
    }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;
          setState((s) => ({ ...s, audioUrl: url }));
        }
      };

      mediaRecorder.start();
    } catch {
      setState((s) => ({
        ...s,
        error: "Microphone access denied. Please allow microphone access and try again.",
        isRecording: false,
        isTranscribing: false,
      }));
      return;
    }

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let final = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }
        transcriptRef.current = final.trim();
        setState((s) => ({
          ...s,
          transcript: final.trim(),
          interimTranscript: interim,
        }));
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech") return;
        if (event.error === "aborted") return;
        setState((s) => ({
          ...s,
          error: `Speech recognition error: ${event.error}`,
        }));
      };

      recognition.onend = () => {
        setState((s) => ({ ...s, isTranscribing: false }));
      };

      recognition.start();
    }
  }, []);

  const stopRecording = useCallback((): { transcript: string; metrics: SpeechMetrics } | null => {
    const duration = Date.now() - startTimeRef.current;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    const transcript = transcriptRef.current;
    const metrics = computeMetrics(transcript, duration);

    setState((s) => ({
      ...s,
      isRecording: false,
      isTranscribing: false,
      transcript,
      interimTranscript: "",
      metrics,
    }));

    if (!transcript.trim()) return null;
    return { transcript, metrics };
  }, []);

  const clearRecording = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    transcriptRef.current = "";
    setState((s) => ({
      ...s,
      transcript: "",
      interimTranscript: "",
      audioUrl: null,
      metrics: null,
      error: null,
    }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
