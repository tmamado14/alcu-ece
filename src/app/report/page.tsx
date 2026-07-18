"use client";

// Learner report page: subject-wide stats, per-topic progress scores,
// and the full feed of attempted problems with expandable solutions.

import { useCallback, useEffect, useState } from "react";
import Latex from "@/components/Latex";

interface ReportData {
  subject: { slug: string; title: string };
  user: { name: string; username: string };
  stats: { rating: number; problems: number; correct: number; incorrect: number; gaveUp: number; percent: number };
  topics: { id: string; title: string; group: string; rating: number; status: string; problemsSeen: number; score: number }[];
  problems: { attemptId: string; problemId: string; statement: string; difficulty: number; result: string; at: string }[];
}

interface SubjectOption { slug: string; title: string }

interface ProblemDetail {
  statement: string;
  solution: string;
  correctAnswerDisplay: string;
}

const RESULT_FACE: Record<string, { icon: string; label: string }> = {
  correct_first: { icon: "😄", label: "Correct (first try)" },
  correct_second: { icon: "🙂", label: "Correct (second try)" },
  wrong: { icon: "🙁", label: "Incorrect" },
  gave_up: { icon: "🏳️", label: "Gave up" },
};

const BAR_COLOR: Record<string, string> = {
  not_started: "bg-slate-300",
  learning: "bg-orange-500",
  passed: "bg-green-600",
  mastered: "bg-sky-500",
  needs_review: "bg-red-500",
};

export default function ReportPage() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [slug, setSlug] = useState("feedback-control-systems");
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProblemDetail | null>(null);

  useEffect(() => {
    fetch("/api/subjects").then(async (r) => {
      if (r.ok) setSubjects(await r.json());
      else if (r.status === 401) window.location.href = "/login";
    });
  }, []);

  const load = useCallback(async () => {
    setData(null);
    const res = await fetch(`/api/report?subject=${encodeURIComponent(slug)}`);
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to load report");
      return;
    }
    setData(await res.json());
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleProblem(attemptId: string, problemId: string) {
    if (open === attemptId) {
      setOpen(null);
      setDetail(null);
      return;
    }
    setOpen(attemptId);
    setDetail(null);
    const res = await fetch(`/api/problems/${problemId}`);
    if (res.ok) setDetail(await res.json());
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p className="loading-text">Loading report…</p>;

  const { stats } = data;
  let lastGroup = "";

  return (
    <div className="fade-up">
      {/* header */}
      <div className="card border-t-4 border-t-brand-600 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-title">Report for {data.user.username}</h1>
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className="input mt-3 w-auto py-1.5">
              {subjects.map((s) => (
                <option key={s.slug} value={s.slug}>{s.title}</option>
              ))}
            </select>
          </div>
          <p className="text-lg font-semibold text-ink-muted">
            Rating: <span className="text-3xl font-bold tracking-tight text-ink">{stats.rating.toFixed(1)}</span>
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="chip-neutral">Problems: {stats.problems}</span>
          <span className="chip-success">Correct: {stats.correct}</span>
          <span className="chip-danger">Incorrect: {stats.incorrect}</span>
          <span className="chip-neutral">Gave up: {stats.gaveUp}</span>
          <span className="chip-brand">Percent: {stats.percent.toFixed(1)}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* left: topic progress */}
        <div className="card p-6">
          <h2 className="section-title">Progress in {data.subject.title}</h2>
          <div className="mt-4">
            <div className="grid grid-cols-[1fr_1.2fr] border-b border-line pb-2 text-xs font-semibold tracking-wider text-ink-faint uppercase">
              <span>Topics</span>
              <span>Progress</span>
            </div>
            {data.topics.map((t) => {
              const groupHeader = t.group !== lastGroup ? t.group : null;
              lastGroup = t.group;
              return (
                <div key={t.id}>
                  {groupHeader && <p className="eyebrow mt-4">{groupHeader}</p>}
                  <div className="grid grid-cols-[1fr_1.2fr] items-center gap-2 border-b border-line py-1.5">
                    <a
                      href={`/practice?topicId=${t.id}&mode=drill`}
                      className="truncate text-sm font-medium text-brand-700 underline-offset-2 hover:underline"
                      title={`${t.title} — rating ${t.rating}, ${t.problemsSeen} attempted`}
                    >
                      {t.title}
                    </a>
                    <div className="relative h-6 w-full overflow-hidden rounded bg-slate-100">
                      {/* pass / mastery guide lines (dashed) */}
                      <div className="absolute inset-y-0 border-l border-dashed border-orange-400" style={{ left: "40%" }} />
                      <div className="absolute inset-y-0 border-l border-dashed border-green-500" style={{ left: "66%" }} />
                      <div className="absolute inset-y-0 border-l border-dashed border-sky-500" style={{ left: "80%" }} />
                      <div
                        className={`bar-fill flex h-full items-center justify-end rounded pr-1.5 ${BAR_COLOR[t.status] ?? BAR_COLOR.not_started}`}
                        style={{ width: `${Math.max(t.score, 7)}%` }}
                      >
                        <span className="text-xs font-bold text-white">{t.score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* right: attempted problems */}
        <div className="card p-6">
          <h2 className="section-title">Problems in {data.subject.title}</h2>
          {data.problems.length === 0 ? (
            <p className="mt-4 text-sm text-ink-faint">
              No attempts in this subject yet.{" "}
              <a href="/practice" className="link">Start practicing →</a>
            </p>
          ) : (
            <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto pr-2">
              {data.problems.map((p) => {
                const face = RESULT_FACE[p.result] ?? RESULT_FACE.wrong;
                return (
                  <div key={p.attemptId} className="overflow-hidden rounded-(--radius-control) border border-line bg-sunken/60">
                    <button
                      onClick={() => toggleProblem(p.attemptId, p.problemId)}
                      aria-expanded={open === p.attemptId}
                      className="w-full cursor-pointer p-3 text-left transition hover:bg-sunken"
                    >
                      <p className="flex items-center gap-2 text-xs text-ink-faint">
                        <span title={face.label} className="text-base" aria-label={face.label}>{face.icon}</span>
                        <span>{new Date(p.at).toLocaleString()}</span>
                        <span className="ml-auto">diff {p.difficulty}/10</span>
                      </p>
                      <div className="mt-1 text-[15px] leading-relaxed text-ink">
                        <Latex>{p.statement}</Latex>
                      </div>
                    </button>
                    {open === p.attemptId && (
                      <div className="fade-up border-t border-line p-3 text-sm">
                        {!detail ? (
                          <p className="animate-pulse text-ink-faint">Loading solution…</p>
                        ) : (
                          <>
                            <p className="font-semibold text-ink">
                              Answer: <span className="font-mono"><Latex>{detail.correctAnswerDisplay}</Latex></span>
                            </p>
                            <div className="mt-2 rounded-(--radius-control) border border-line bg-surface p-3 leading-relaxed">
                              <Latex>{detail.solution}</Latex>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
