"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  analyzeDelivery,
  createSpeechRecognition,
  isWebSpeechSupported,
  type DeliveryMetrics,
  type PauseEvent,
} from "@/lib/speech-analysis";

export interface SpeechAnalysisState {
  isRecording: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  durationSeconds: number;
  metrics: DeliveryMetrics | null;
  error: string | null;
}

const INITIAL_STATE: SpeechAnalysisState = {
  isRecording: false,
  isSupported: false,
  transcript: "",
  interimTranscript: "",
  durationSeconds: 0,
  metrics: null,
  error: null,
};

const PAUSE_THRESHOLD_MS = 800;

type RecognitionLike = ReturnType<typeof createSpeechRecognition>;

export function useSpeechAnalysis() {
  const [state, setState] = useState<SpeechAnalysisState>(INITIAL_STATE);
  const recognitionRef = useRef<RecognitionLike>(null);
  const startTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);
  const pausesRef = useRef<PauseEvent[]>([]);
  const transcriptRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    setState((prev) => ({ ...prev, isSupported: isWebSpeechSupported() }));
  }, []);

  const startRecording = useCallback(() => {
    const recognition = createSpeechRecognition();
    if (!recognition) {
      setState((prev) => ({ ...prev, error: "Speech recognition not supported in this browser." }));
      return;
    }

    recognitionRef.current = recognition;
    startTimeRef.current = Date.now();
    lastSpeechTimeRef.current = Date.now();
    pausesRef.current = [];
    transcriptRef.current = "";
    stoppedRef.current = false;

    setState((prev) => ({
      ...prev,
      isRecording: true,
      transcript: "",
      interimTranscript: "",
      durationSeconds: 0,
      metrics: null,
      error: null,
    }));

    timerRef.current = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      setState((prev) => ({ ...prev, durationSeconds: elapsed }));
    }, 1000);

    recognition.onresult = (event) => {
      const now = Date.now();
      const gap = now - lastSpeechTimeRef.current;
      if (gap >= PAUSE_THRESHOLD_MS && lastSpeechTimeRef.current > startTimeRef.current) {
        pausesRef.current.push({
          startMs: lastSpeechTimeRef.current - startTimeRef.current,
          durationMs: gap,
        });
      }
      lastSpeechTimeRef.current = now;

      let finalTranscript = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        transcriptRef.current += " " + finalTranscript;
        transcriptRef.current = transcriptRef.current.trim();
      }

      setState((prev) => ({
        ...prev,
        transcript: transcriptRef.current,
        interimTranscript: interim,
      }));
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setState((prev) => ({ ...prev, error: `Speech recognition error: ${event.error}` }));
    };

    recognition.onend = () => {
      if (!stoppedRef.current) {
        try { recognition.start(); } catch { /* already stopped */ }
      }
    };

    try {
      recognition.start();
    } catch {
      setState((prev) => ({ ...prev, error: "Failed to start speech recognition.", isRecording: false }));
    }
  }, []);

  const stopRecording = useCallback((): DeliveryMetrics | null => {
    stoppedRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    const transcript = transcriptRef.current;
    const pauses = [...pausesRef.current];

    if (!transcript.trim()) {
      setState((prev) => ({
        ...prev,
        isRecording: false,
        durationSeconds,
        error: "No speech detected. Make sure your microphone is enabled.",
      }));
      return null;
    }

    const metrics = analyzeDelivery(transcript, durationSeconds, pauses);
    setState((prev) => ({
      ...prev,
      isRecording: false,
      durationSeconds,
      metrics,
    }));
    return metrics;
  }, []);

  const reset = useCallback(() => {
    stoppedRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState({ ...INITIAL_STATE, isSupported: isWebSpeechSupported() });
    transcriptRef.current = "";
    pausesRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { ...state, startRecording, stopRecording, reset };
}
