"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SubjectRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  topicCount: number;
  passedCount: number;
  masteredCount: number;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subjects")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        setSubjects(await r.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!subjects) return <p className="loading-text">Loading subjects…</p>;

  return (
    <div className="fade-up">
      <h1 className="page-title">Subjects</h1>
      <p className="page-sub">Pick a subject to see its topic map and start drilling.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {subjects.map((s) => (
          <Link key={s.id} href={`/subjects/${s.slug}`} className="card card-hover block p-6">
            <h2 className="text-lg font-semibold text-ink">{s.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">{s.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="chip-neutral">{s.topicCount} topics</span>
              <span className="chip-success">{s.passedCount} passed</span>
              <span className="chip-brand">{s.masteredCount} mastered</span>
            </div>
            <div className="progress-track mt-3">
              <div
                className="progress-fill bg-green-600"
                style={{ width: `${s.topicCount ? (s.passedCount / s.topicCount) * 100 : 0}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-faint">
        More ECE subjects (Signals and Systems, Communications, Electronics, …) can be added from the
        admin panel — the platform is subject-agnostic.
      </p>
    </div>
  );
}
