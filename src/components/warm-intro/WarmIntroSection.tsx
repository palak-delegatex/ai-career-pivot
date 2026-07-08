"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import type { WarmIntroApiResponse, WarmIntroContact } from "./types";
import WarmIntroScanning from "./WarmIntroScanning";
import WarmIntroTeaser from "./WarmIntroTeaser";
import WarmIntroUnlocked from "./WarmIntroUnlocked";
import WarmIntroEmpty from "./WarmIntroEmpty";
import {
  trackWarmIntroScanned,
  trackWarmIntroTeaserSeen,
  trackWarmIntroUpgradeClicked,
  trackWarmIntroRevealed,
  trackWarmIntroEdited,
  trackWarmIntroImportNudge,
} from "@/lib/tracking";

// Minimum scanning window (Doherty threshold) — the user must see work happen
// for the result to feel earned even when the API resolves instantly.
const MIN_SCAN_MS = 800;

type State =
  | { kind: "scanning" }
  | { kind: "error" }
  | { kind: "empty" }
  | { kind: "teaser"; data: WarmIntroApiResponse }
  | { kind: "unlocked"; data: WarmIntroApiResponse; contact: WarmIntroContact };

/**
 * Warm-Intro reveal section (AIC-772) — orchestrates the scanning → teaser /
 * unlocked / empty cascade in the JobDetailView sidebar. Replaces JobContactsList.
 *
 * Paywall is server-enforced: free callers never receive contact PII (the API
 * returns `contacts: []` + a PII-free `teaser`). `isPaidUser` is only a client
 * hint; the authoritative gate is the server's `paid` flag.
 */
export default function WarmIntroSection({
  company,
  jobId,
  email,
  isPaidUser,
}: {
  company: string;
  jobId: string;
  email: string;
  isPaidUser?: boolean;
}) {
  const locale = useLocale();
  const [state, setState] = useState<State>({ kind: "scanning" });
  const [draft, setDraft] = useState<{ loading: boolean; message: string }>({
    loading: false,
    message: "",
  });
  const startRef = useRef<number>(0);

  const draftKey = useCallback(
    (contactId: string) => `warm-intro-draft:${jobId}:${contactId}`,
    [jobId],
  );

  // Fetch once on mount, enforcing the minimum scanning window.
  useEffect(() => {
    let cancelled = false;
    startRef.current =
      typeof performance !== "undefined" ? performance.now() : 0;

    const finish = (next: State, result: "found" | "not_found") => {
      const elapsed =
        (typeof performance !== "undefined" ? performance.now() : 0) -
        startRef.current;
      const wait = Math.max(0, MIN_SCAN_MS - elapsed);
      setTimeout(() => {
        if (cancelled) return;
        trackWarmIntroScanned({
          company,
          job_id: jobId,
          result,
          scan_duration_ms: Math.round(elapsed),
        });
        setState(next);
      }, wait);
    };

    fetch(
      `/api/warm-intro?email=${encodeURIComponent(email)}&company=${encodeURIComponent(company)}`,
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: WarmIntroApiResponse) => {
        if (cancelled) return;
        if (data.connectionCount === 0) {
          finish({ kind: "empty" }, "not_found");
          return;
        }
        // Server `paid` is authoritative; `isPaidUser` is only a defensive
        // fallback if the field is ever absent. PII arrives only for paid users.
        const paid = data.paid ?? isPaidUser ?? false;
        if (paid && data.contacts.length > 0) {
          finish(
            { kind: "unlocked", data, contact: data.contacts[0] },
            "found",
          );
        } else {
          finish({ kind: "teaser", data }, "found");
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });

    return () => {
      cancelled = true;
    };
    // isPaidUser is a stable per-job hint; the fetch must run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, email, jobId]);

  // On entering teaser/unlocked, fire the view event + kick off the draft fetch.
  useEffect(() => {
    if (state.kind === "teaser" && state.data.teaser) {
      trackWarmIntroTeaserSeen({
        company,
        job_id: jobId,
        connection_degree: state.data.teaser.connection_degree,
        confidence_score: state.data.teaser.confidence_score,
      });
    }
    if (state.kind === "unlocked") {
      trackWarmIntroRevealed({
        company,
        job_id: jobId,
        contact_name: state.contact.name,
      });
      loadDraft(state.contact.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind]);

  const loadDraft = useCallback(
    async (contactId: string) => {
      // Prefer a user-edited draft persisted locally over regenerating.
      try {
        const saved =
          typeof window !== "undefined"
            ? window.localStorage.getItem(draftKey(contactId))
            : null;
        if (saved) {
          setDraft({ loading: false, message: saved });
          return;
        }
      } catch {
        /* localStorage may be unavailable; fall through to generate */
      }

      setDraft({ loading: true, message: "" });
      try {
        const res = await fetch("/api/warm-intro/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, jobId, contactId, locale }),
        });
        if (!res.ok) throw new Error();
        const { message } = await res.json();
        setDraft({ loading: false, message });
      } catch {
        setDraft({
          loading: false,
          message: "",
        });
      }
    },
    [draftKey, email, jobId, locale],
  );

  const handleEditDraft = useCallback(
    (msg: string) => {
      if (state.kind !== "unlocked") return;
      setDraft((d) => ({ ...d, message: msg }));
      try {
        window.localStorage.setItem(draftKey(state.contact.id), msg);
      } catch {
        /* ignore persistence failure */
      }
      trackWarmIntroEdited({ company, job_id: jobId });
    },
    [state, draftKey, company, jobId],
  );

  const handleUpgrade = useCallback(() => {
    if (state.kind !== "teaser" || !state.data.teaser) return;
    trackWarmIntroUpgradeClicked({
      company,
      job_id: jobId,
      connection_degree: state.data.teaser.connection_degree,
      confidence_score: state.data.teaser.confidence_score,
    });
    window.location.href = `/${locale}/pricing?ref=warm-intro&company=${encodeURIComponent(company)}`;
  }, [state, company, jobId, locale]);

  const handleImport = useCallback(() => {
    trackWarmIntroImportNudge({ company, job_id: jobId });
    window.location.href = `/${locale}/networking`;
  }, [company, jobId, locale]);

  if (state.kind === "scanning") return <WarmIntroScanning company={company} />;

  if (state.kind === "error") {
    return (
      <div className="space-y-3">
        <h3 className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
          Connections at {company}
        </h3>
        <p className="text-[11px] text-slate-600 italic">
          Couldn&apos;t load connections. Try reopening this job.
        </p>
      </div>
    );
  }

  if (state.kind === "empty")
    return <WarmIntroEmpty company={company} onImport={handleImport} />;

  if (state.kind === "teaser" && state.data.teaser) {
    return (
      <WarmIntroTeaser
        company={company}
        role={state.data.teaser.role_title}
        degree={state.data.teaser.connection_degree}
        confidence={state.data.teaser.confidence_score}
        onUpgrade={handleUpgrade}
      />
    );
  }

  if (state.kind === "unlocked") {
    return (
      <WarmIntroUnlocked
        contact={state.contact}
        draftMessage={draft.message}
        draftLoading={draft.loading}
        company={company}
        jobId={jobId}
        onEditDraft={handleEditDraft}
      />
    );
  }

  return null;
}
