"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function FreeUploadClient() {
  const t = useTranslations("freeSnapshot");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [dropActive, setDropActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BENEFITS = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
    t("benefit4"),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeFile) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", resumeFile);
    if (email) formData.append("email", email);

    try {
      const res = await fetch("/api/intake/free-snapshot", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to analyze resume");
      }

      const data = await res.json();
      sessionStorage.setItem("free_snapshot", JSON.stringify(data.snapshot));
      sessionStorage.setItem("free_profile", JSON.stringify(data.profile));
      router.push("/free-results");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
      setLoading(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-600/20 border border-teal-600/30 text-teal-400 text-xs font-semibold mb-4">
          {t("badge")}
        </div>
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
          {t("heading")}
        </h1>
        <p className="text-slate-400 leading-relaxed">
          {t("subheading")}
        </p>
      </div>

      <ul className="space-y-2 mb-8">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-3 text-sm text-slate-300">
            <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {b}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label
          className={`block w-full px-4 py-6 rounded-2xl bg-slate-800/60 border-2 border-dashed cursor-pointer text-center transition-all duration-200 ${
            dropActive
              ? "border-teal-400 bg-teal-950/30"
              : resumeFile
                ? "border-teal-600 bg-teal-950/10"
                : "border-slate-600 hover:border-teal-600"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
          onDragLeave={() => setDropActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) setResumeFile(file);
          }}
        >
          {resumeFile ? (
            <div>
              <div className="text-teal-400 font-semibold mb-1">{resumeFile.name}</div>
              <div className="text-slate-500 text-xs">{t("clickToChange")}</div>
            </div>
          ) : (
            <div>
              <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-slate-300 font-medium mb-1">
                {dropActive ? t("dropActive") : t("uploadPrompt")}
              </div>
              <div className="text-slate-500 text-xs">{t("fileFormats")}</div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="sr-only"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        />

        {error && (
          <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!resumeFile || loading}
          className="w-full px-6 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
              {t("analyzing")}
            </span>
          ) : (
            t("submitButton")
          )}
        </button>
      </form>

      <p className="text-slate-500 text-xs text-center mt-6">
        {t("footerNote")}
      </p>
    </main>
  );
}
