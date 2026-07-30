"use client";

// The learner's active focus: what they chose to master next, how far along the
// goal is, and which subtopic practice is pointed at right now. Shared by the
// dashboard and the topic map.

import Link from "next/link";
import { STATUS_COLORS } from "@/components/TopicBar";

export interface FocusSubtopicView {
  id: string;
  slug: string;
  title: string;
  status: string;
  rating: number;
  problemCount: number;
  isTarget: boolean;
}

export interface Focus {
  topic: { id: string; slug: string; title: string; isGroup: boolean };
  groupTitle: string | null;
  subtopics: FocusSubtopicView[];
  masteredCount: number;
  passedCount: number;
  total: number;
  target: { id: string; slug: string; title: string } | null;
  complete: boolean;
  setAt: string | null;
}

export default function FocusPanel({
  focus,
  onClear,
  busy = false,
}: {
  focus: Focus;
  onClear: () => void;
  busy?: boolean;
}) {
  const pct = focus.total > 0 ? Math.round((focus.masteredCount / focus.total) * 100) : 0;

  return (
    <div className="card border-brand-500 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">🎯 Focus — mastering next</p>
          <h2 className="section-title mt-1">
            {focus.groupTitle && (
              <span className="font-normal text-ink-faint">{focus.groupTitle} / </span>
            )}
            {focus.topic.title}
          </h2>
        </div>
        <div className="flex gap-2">
          <Link href="/practice?mode=adaptive" className="btn-primary btn-sm">
            Practice focus →
          </Link>
          <button onClick={onClear} disabled={busy} className="btn-secondary btn-sm">
            {busy ? "…" : "Clear"}
          </button>
        </div>
      </div>

      {focus.complete ? (
        <p className="callout-success mt-4 font-semibold">
          🎓 Goal complete — every subtopic here is mastered. Pick a new focus when you&rsquo;re ready.
        </p>
      ) : (
        focus.target && (
          <p className="mt-3 text-sm text-ink-muted">
            Working on <span className="font-semibold text-ink">{focus.target.title}</span> — practice
            stays here until it&rsquo;s mastered, then moves to the next subtopic in order.
          </p>
        )
      )}

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-xs text-ink-faint">
          <span className="tracking-[0.06em] uppercase">Mastered</span>
          <span className="tnum">
            {focus.masteredCount}/{focus.total} subtopics · {focus.passedCount} passed
          </span>
        </div>
        <div className="progress-track mt-1.5 h-3">
          <div className="progress-fill bg-cyan-700" style={{ width: `${Math.max(2, pct)}%` }} />
        </div>
      </div>

      {focus.subtopics.length > 1 && (
        <ul className="mt-4 divide-y divide-line text-sm">
          {focus.subtopics.map((s) => {
            const c = STATUS_COLORS[s.status] ?? STATUS_COLORS.not_started;
            return (
              <li key={s.id} className="flex items-center justify-between gap-2 py-1.5">
                <span className={`truncate pr-2 ${s.isTarget ? "font-semibold text-ink" : "text-ink-muted"}`}>
                  {s.isTarget && <span aria-label="current target">▸ </span>}
                  {s.title}
                </span>
                <span className={`shrink-0 text-xs font-semibold ${c.text}`}>
                  {s.problemCount === 0 ? "No questions" : c.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
