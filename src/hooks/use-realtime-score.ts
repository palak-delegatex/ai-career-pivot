"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { JDKeywords, EnrichedJDKeywords } from "@/lib/ats-scoring";

export interface RealtimeScores {
  overall: { score: number; label: string } | null;
  formatting: { score: number; issueCount: number; criticalCount: number } | null;
  searchability: { score: number; contactFields: Record<string, boolean>; jobTitleMatch: boolean } | null;
  recruiterTips: { score: number; actionVerbRate: number; measurableResultRate: number } | null;
  keywords: {
    hardSkillScore: number;
    softSkillScore: number;
    matched: number;
    missing: number;
    total: number;
    topMissing: { keyword: string; category: string; skillType: string }[];
  } | null;
  keywordDensity: { score: number } | null;
  loading: boolean;
  error: string | null;
}

const INITIAL_SCORES: RealtimeScores = {
  overall: null,
  formatting: null,
  searchability: null,
  recruiterTips: null,
  keywords: null,
  keywordDensity: null,
  loading: false,
  error: null,
};

export function useRealtimeScore(debounceMs = 500) {
  const [scores, setScores] = useState<RealtimeScores>(INITIAL_SCORES);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const score = useCallback(
    (resumeText: string, jdKeywords?: JDKeywords, enriched?: EnrichedJDKeywords) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setScores(prev => ({ ...prev, loading: true, error: null }));

        try {
          const res = await fetch("/api/scoring/realtime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resumeText, jdKeywords, enriched }),
            signal: controller.signal,
          });

          if (!res.ok || !res.body) {
            setScores(prev => ({ ...prev, loading: false, error: "Scoring failed" }));
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            let eventName = "";
            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventName = line.slice(7).trim();
              } else if (line.startsWith("data: ") && eventName) {
                try {
                  const data = JSON.parse(line.slice(6));
                  setScores(prev => {
                    switch (eventName) {
                      case "formatting":
                        return { ...prev, formatting: data };
                      case "searchability":
                        return { ...prev, searchability: data };
                      case "recruiter_tips":
                        return { ...prev, recruiterTips: data };
                      case "keywords":
                        return { ...prev, keywords: data };
                      case "keyword_density":
                        return { ...prev, keywordDensity: data };
                      case "overall":
                        return { ...prev, overall: data, loading: false };
                      case "done":
                        return { ...prev, loading: false };
                      case "error":
                        return { ...prev, loading: false, error: data.message };
                      default:
                        return prev;
                    }
                  });
                } catch {
                  // skip malformed JSON lines
                }
                eventName = "";
              }
            }
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") return;
          setScores(prev => ({ ...prev, loading: false, error: "Scoring failed" }));
        }
      }, debounceMs);
    },
    [debounceMs]
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
    setScores(INITIAL_SCORES);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return { scores, score, reset };
}
