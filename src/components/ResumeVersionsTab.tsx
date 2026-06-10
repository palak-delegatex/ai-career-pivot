"use client";

import { useState, useEffect, useCallback } from "react";
import ResumeVersionList, { type ResumeVersion } from "./ResumeVersionList";
import ResumeBuilder from "./ResumeBuilder";
import ResumeComparison from "./ResumeComparison";
import type { PivotPlan, UserProfile } from "@/lib/intake";

type View =
  | { kind: "list" }
  | { kind: "builder"; version?: ResumeVersion }
  | { kind: "comparison"; a: ResumeVersion; b: ResumeVersion };

interface ResumeVersionsTabProps {
  email: string;
  profile: UserProfile;
  plan: PivotPlan;
}

export default function ResumeVersionsTab({
  email,
  profile,
  plan,
}: ResumeVersionsTabProps) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ kind: "list" });
  const [saving, setSaving] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/resume-versions?email=${encodeURIComponent(email)}`
      );
      if (res.ok) {
        const { versions: data } = await res.json();
        setVersions(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  async function handleSave(data: {
    name: string;
    target_role: string;
    target_company: string;
    template: string;
    enabled_skills: string[];
    enabled_experience_indices: number[];
    sections: Record<string, boolean>;
    generated_text: string | null;
  }) {
    setSaving(true);
    try {
      const editingVersion =
        view.kind === "builder" ? view.version : undefined;

      if (editingVersion) {
        await fetch("/api/resume-versions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingVersion.id, email, ...data }),
        });
      } else {
        await fetch("/api/resume-versions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, ...data }),
        });
      }

      await fetchVersions();
      setView({ kind: "list" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(version: ResumeVersion) {
    await fetch("/api/resume-versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: `${version.name} (copy)`,
        target_role: version.target_role,
        target_company: version.target_company,
        template: version.template,
        content: version.content,
        enabled_skills: version.enabled_skills,
        enabled_experience_indices: version.enabled_experience_indices,
        sections: version.sections,
        generated_text: version.generated_text,
        match_score: version.match_score,
      }),
    });
    await fetchVersions();
  }

  async function handleArchive(version: ResumeVersion) {
    await fetch("/api/resume-versions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: version.id,
        email,
        status: version.status === "archived" ? "draft" : "archived",
      }),
    });
    await fetchVersions();
  }

  async function handleDelete(version: ResumeVersion) {
    await fetch("/api/resume-versions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: version.id, email }),
    });
    await fetchVersions();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (view.kind === "builder") {
    return (
      <ResumeBuilder
        profile={profile}
        plan={plan}
        version={view.version}
        onSave={handleSave}
        onBack={() => setView({ kind: "list" })}
        saving={saving}
      />
    );
  }

  if (view.kind === "comparison") {
    return (
      <ResumeComparison
        versionA={view.a}
        versionB={view.b}
        onBack={() => setView({ kind: "list" })}
      />
    );
  }

  return (
    <ResumeVersionList
      versions={versions}
      onSelect={(v) => setView({ kind: "builder", version: v })}
      onDuplicate={handleDuplicate}
      onArchive={handleArchive}
      onDelete={handleDelete}
      onCompare={(a, b) => setView({ kind: "comparison", a, b })}
      onCreate={() => setView({ kind: "builder" })}
    />
  );
}
