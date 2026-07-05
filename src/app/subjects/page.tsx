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

  if (error) return <p className="mt-8 text-red-600">{error}</p>;
  if (!subjects) return <p className="mt-8 animate-pulse text-slate-400">Loading subjects…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Subjects</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/subjects/${s.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow"
          >
            <h2 className="text-lg font-bold">{s.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{s.description}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-slate-500">{s.topicCount} topics</span>
              <span className="font-semibold text-green-700">{s.passedCount} passed</span>
              <span className="font-semibold text-blue-700">{s.masteredCount} mastered</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${s.topicCount ? (s.passedCount / s.topicCount) * 100 : 0}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-500">
        More ECE subjects (Signals and Systems, Communications, Electronics, …) can be added from the
        admin panel — the platform is subject-agnostic.
      </p>
    </div>
  );
}
