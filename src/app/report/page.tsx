"use client";

// Learner report page: subject-wide stats, per-topic progress scores, and the
// feed of answered questions. Clicking a topic drills into that topic's own
// stats and questions — this module reports, it never starts practice.

import { useCallback, useEffect, useState } from "react";
import AttemptList, { type AttemptCard } from "@/components/AttemptList";
import { statusLabel } from "@/lib/report";

interface ReportData {
  subject: { slug: string; title: string };
  user: { name: string; username: string };
  stats: { rating: number; problems: number; correct: number; incorrect: number; gaveUp: number; percent: number };
  topics: { id: string; title: string; group: string; rating: number; status: string; problemsSeen: number; score: number }[];
  problems: AttemptCard[];
}

interface TopicReport {
  topic: { id: string; title: string; group: string; slug: string };
  stats: { problems: number; correct: number; incorrect: number; gaveUp: number; percent: number };
  progress: {
    rating: number;
    score: number;
    status: string;
    confidence: number;
    problemsSeen: number;
    correctFirstTry: number;
    correctSecondTry: number;
    wrong: number;
    gaveUp: number;
    streak: number;
    lastPracticedAt: string | null;
  } | null;
  problems: AttemptCard[];
}

interface SubjectOption { slug: string; title: string }

const BAR_COLOR: Record<string, string> = {
  not_started: "bg-gray-500",
  learning: "bg-orange-700",
  passed: "bg-green-700",
  mastered: "bg-cyan-700",
  needs_review: "bg-red-700",
};

export default function ReportPage() {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  // Empty until /api/subjects answers; the first subject becomes the default.
  const [slug, setSlug] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [topic, setTopic] = useState<TopicReport | null>(null);

  useEffect(() => {
    fetch("/api/subjects").then(async (r) => {
      if (r.ok) {
        const list: SubjectOption[] = await r.json();
        setSubjects(list);
        setSlug((cur) => cur || list[0]?.slug || "");
      } else if (r.status === 401) window.location.href = "/login";
    });
  }, []);

  const load = useCallback(async () => {
    if (!slug) return;
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

  // Switching subjects invalidates whichever topic was open.
  useEffect(() => {
    setTopicId(null);
  }, [slug]);

  useEffect(() => {
    if (!topicId) {
      setTopic(null);
      return;
    }
    let stale = false;
    setTopic(null);
    fetch(`/api/report/topic/${topicId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load topic");
        const d: TopicReport = await r.json();
        if (!stale) setTopic(d);
      })
      .catch((e) => !stale && setError(e.message));
    return () => {
      stale = true;
    };
  }, [topicId]);

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p className="loading-text">Loading report…</p>;

  const { stats } = data;
  let lastGroup = "";

  return (
    <div className="fade-up">
      {/* header */}
      <div className="card border-t-4 border-t-brand-500 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-title">Report for {data.user.username}</h1>
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className="input mt-3 w-auto py-1.5">
              {subjects.map((s) => (
                <option key={s.slug} value={s.slug}>{s.title}</option>
              ))}
            </select>
          </div>
          <p className="text-right">
            <span className="eyebrow">Rating</span>
            <span className="stat-num block">{stats.rating.toFixed(1)}</span>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* left: topic progress */}
        <div className="card p-6">
          <h2 className="section-title">Progress in {data.subject.title}</h2>
          <p className="mt-1 text-xs text-ink-faint">Select a topic to see the questions you answered in it.</p>
          <div className="mt-4">
            <div className="grid grid-cols-[1fr_1.2fr] border-b border-line pb-2 text-xs font-semibold tracking-[0.08em] text-ink-muted uppercase">
              <span>Topics</span>
              <span>Progress</span>
            </div>
            {data.topics.map((t) => {
              const groupHeader = t.group !== lastGroup ? t.group : null;
              lastGroup = t.group;
              return (
                <div key={t.id}>
                  {groupHeader && <p className="eyebrow mt-4">{groupHeader}</p>}
                  <div
                    className={`grid grid-cols-[1fr_1.2fr] items-center gap-2 border-b border-line py-1.5 ${
                      topicId === t.id ? "bg-brand-50" : ""
                    }`}
                  >
                    <button
                      onClick={() => setTopicId(topicId === t.id ? null : t.id)}
                      aria-pressed={topicId === t.id}
                      className="cursor-pointer truncate text-left text-sm font-medium text-brand-700 underline-offset-2 hover:underline"
                      title={`${t.title} — rating ${t.rating}, ${t.problemsSeen} attempted`}
                    >
                      {t.title}
                    </button>
                    <div className="relative h-6 w-full overflow-hidden bg-ink/8">
                      {/* pass / mastery guide lines (dashed) */}
                      <div className="absolute inset-y-0 border-l border-dashed border-orange-700" style={{ left: "40%" }} />
                      <div className="absolute inset-y-0 border-l border-dashed border-green-700" style={{ left: "66%" }} />
                      <div className="absolute inset-y-0 border-l border-dashed border-cyan-700" style={{ left: "80%" }} />
                      <div
                        className={`bar-fill flex h-full items-center justify-end pr-1.5 ${BAR_COLOR[t.status] ?? BAR_COLOR.not_started}`}
                        style={{ width: `${Math.max(t.score, 7)}%` }}
                      >
                        <span className="tnum font-mono text-xs font-semibold text-canvas">{t.score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* right: answered questions — subject-wide, or one topic when selected */}
        <div className="card p-6">
          {topicId ? (
            <TopicDetail report={topic} onBack={() => setTopicId(null)} />
          ) : (
            <>
              <h2 className="section-title">Problems in {data.subject.title}</h2>
              {data.problems.length === 0 ? (
                <p className="mt-4 text-sm text-ink-faint">
                  No attempts in this subject yet.{" "}
                  <a href="/practice" className="link">Start practicing →</a>
                </p>
              ) : (
                <AttemptList attempts={data.problems} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TopicDetail({ report, onBack }: { report: TopicReport | null; onBack: () => void }) {
  if (!report) return <p className="loading-text">Loading topic…</p>;
  const { stats, progress } = report;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {report.topic.group && <p className="eyebrow">{report.topic.group}</p>}
          <h2 className="section-title">{report.topic.title}</h2>
        </div>
        <button onClick={onBack} className="btn-secondary btn-sm">
          ← All questions
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="chip-neutral">Problems: {stats.problems}</span>
        <span className="chip-success">Correct: {stats.correct}</span>
        <span className="chip-danger">Incorrect: {stats.incorrect}</span>
        <span className="chip-neutral">Gave up: {stats.gaveUp}</span>
        <span className="chip-brand">Percent: {stats.percent.toFixed(1)}</span>
      </div>

      {progress && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border border-line bg-sunken/60 p-4 text-sm sm:grid-cols-3">
          <Stat label="Status" value={statusLabel(progress.status)} />
          <Stat label="Rating" value={`${progress.rating}`} />
          <Stat label="Progress score" value={`${progress.score}/100`} />
          <Stat label="Problems seen" value={`${progress.problemsSeen}`} />
          <Stat label="First-try correct" value={`${progress.correctFirstTry}`} />
          <Stat label="Second-try correct" value={`${progress.correctSecondTry}`} />
          <Stat label="Current streak" value={progress.streak > 0 ? `🔥 ${progress.streak}` : "—"} />
          <Stat label="Confidence" value={`${Math.round(progress.confidence * 100)}%`} />
          <Stat
            label="Last practiced"
            value={progress.lastPracticedAt ? new Date(progress.lastPracticedAt).toLocaleDateString() : "—"}
          />
        </dl>
      )}

      {report.problems.length === 0 ? (
        <p className="mt-4 text-sm text-ink-faint">
          No questions answered in this topic yet.{" "}
          <a href={`/practice?topicId=${report.topic.id}&mode=drill`} className="link">
            Drill this topic →
          </a>
        </p>
      ) : (
        <AttemptList key={report.topic.id} attempts={report.problems} />
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] tracking-[0.06em] text-ink-faint uppercase">{label}</dt>
      <dd className="tnum font-semibold text-ink">{value}</dd>
    </div>
  );
}
