"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FocusPanel, { type Focus } from "@/components/FocusPanel";
import { STATUS_COLORS } from "@/components/TopicBar";

interface Report {
  user: { name: string; totalXp: number; level: { level: number; currentXp: number; nextLevelXp: number } };
  totals: {
    attempts: number; correctFirst: number; correctSecond: number; wrong: number;
    gaveUp: number; timeSpentSec: number; dayStreak: number;
  };
  accuracyByTopic: { topicId: string; title: string; total: number; correct: number; firstTry: number }[];
  accuracyByDifficulty: { band: string; total: number; correct: number }[];
  mostMissedTags: { tag: string; count: number }[];
  topicProgress: { topicId: string; title: string; rating: number; status: string; streak: number }[];
  passedCount: number;
  masteredCount: number;
  needsReviewCount: number;
  recommended: { id: string; title: string; slug: string; status: string }[];
  recentActivity: { id: string; problemId: string; topic: string; result: string; xp: number; at: string }[];
}

const RESULT_LABEL: Record<string, string> = {
  correct_first: "✅ 1st try",
  correct_second: "✅ 2nd try",
  wrong: "❌ Wrong",
  gave_up: "🏳️ Gave up",
};

export default function DashboardPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [focusBusy, setFocusBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401) window.location.href = "/login";
          throw new Error((await r.json()).error ?? "Failed to load");
        }
        setReport(await r.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    fetch("/api/focus")
      .then((r) => (r.ok ? r.json() : { focus: null }))
      .then((d) => setFocus(d.focus))
      .catch(() => setFocus(null));
  }, []);

  async function clearFocus() {
    setFocusBusy(true);
    const res = await fetch("/api/focus", { method: "DELETE" });
    if (res.ok) setFocus(null);
    setFocusBusy(false);
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!report) return <p className="loading-text">Loading dashboard…</p>;

  const { user, totals } = report;
  const accuracy = totals.attempts
    ? Math.round(((totals.correctFirst + totals.correctSecond) / totals.attempts) * 100)
    : 0;
  const levelPct = Math.round((user.level.currentXp / Math.max(1, user.level.nextLevelXp)) * 100);

  return (
    <div className="fade-up">
      <h1 className="page-title">Welcome back, {user.name} 👋</h1>
      <p className="page-sub">Here&rsquo;s where your practice stands today.</p>

      {/* level + stats */}
      <div className="mt-8 grid gap-6 sm:grid-cols-4">
        <div className="card p-5 sm:col-span-2">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">Level {user.level.level}</span>
            <span className="tnum text-xs text-ink-faint">
              {user.level.currentXp}/{user.level.nextLevelXp} XP to next level
            </span>
          </div>
          <div className="progress-track mt-3 h-3">
            <div className="progress-fill bg-brand-500" style={{ width: `${levelPct}%` }} />
          </div>
          <p className="tnum mt-2 text-sm text-ink-muted">{user.totalXp} total XP</p>
        </div>
        {[
          [`${accuracy}%`, "Accuracy"],
          [`${totals.dayStreak}🔥`, "Day streak"],
        ].map(([v, l]) => (
          <div key={l} className="card p-5 text-center">
            <p className="stat-num">{v}</p>
            <p className="stat-label">{l}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-4">
        {[
          [totals.attempts, "Problems attempted"],
          [totals.correctFirst, "First-try correct"],
          [report.passedCount + report.masteredCount, "Topics passed"],
          [Math.round(totals.timeSpentSec / 60), "Minutes practiced"],
        ].map(([v, l]) => (
          <div key={l as string} className="card p-5 text-center">
            <p className="stat-num">{v}</p>
            <p className="stat-label">{l}</p>
          </div>
        ))}
      </div>

      {focus ? (
        <div className="mt-6">
          <FocusPanel focus={focus} onClear={clearFocus} busy={focusBusy} />
        </div>
      ) : (
        <p className="callout-info mt-6 text-sm">
          🎯 No focus set.{" "}
          <Link href="/subjects" className="font-semibold underline underline-offset-2">
            Pick a topic to master next →
          </Link>{" "}
          and adaptive practice will work through it in order.
        </p>
      )}

      {report.needsReviewCount > 0 && (
        <div className="callout-danger mt-4">
          ⚠️ {report.needsReviewCount} topic{report.needsReviewCount > 1 ? "s" : ""} need review.{" "}
          <Link href="/practice?mode=review" className="font-semibold underline underline-offset-2">
            Start review mode →
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* recommended */}
        <div className="card p-5">
          <h2 className="section-title">Recommended next topics</h2>
          {report.recommended.length === 0 ? (
            <p className="mt-2 text-sm text-ink-faint">All topics passed — go for mastery! 🎓</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {report.recommended.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink">{t.title}</span>
                  <Link href={`/practice?topicId=${t.id}&mode=drill`} className="link">
                    Practice →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* recent activity */}
        <div className="card p-5">
          <h2 className="section-title">Recent activity</h2>
          {report.recentActivity.length === 0 ? (
            <p className="mt-2 text-sm text-ink-faint">
              No attempts yet.{" "}
              <Link href="/practice" className="link">
                Start practicing →
              </Link>
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {report.recentActivity.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-1.5">
                  <span className="truncate pr-2 text-ink">{a.topic}</span>
                  <span className="shrink-0 text-ink-faint">
                    {RESULT_LABEL[a.result] ?? a.result}{" "}
                    {a.xp > 0 && <b className="text-brand-700">+{a.xp}</b>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* accuracy by topic */}
        <div className="card p-5">
          <h2 className="section-title">Accuracy by topic</h2>
          {report.accuracyByTopic.length === 0 ? (
            <p className="mt-2 text-sm text-ink-faint">Attempt problems to see accuracy stats.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {report.accuracyByTopic
                .slice()
                .sort((a, b) => a.correct / a.total - b.correct / b.total)
                .slice(0, 8)
                .map((t) => (
                  <li key={t.topicId}>
                    <div className="flex justify-between">
                      <span className="truncate pr-2 text-ink">{t.title}</span>
                      <span className="text-ink-faint">
                        {t.correct}/{t.total} ({t.firstTry} first-try)
                      </span>
                    </div>
                    <div className="progress-track mt-1.5 h-1.5">
                      <div
                        className="progress-fill bg-green-700"
                        style={{ width: `${(t.correct / t.total) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* weak skills + difficulty */}
        <div className="card p-5">
          <h2 className="section-title">Weak skills</h2>
          {report.mostMissedTags.length === 0 ? (
            <p className="mt-2 text-sm text-ink-faint">No misses recorded — keep it up!</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {report.mostMissedTags.map((t) => (
                <span key={t.tag} className="chip-danger">
                  {t.tag} ×{t.count}
                </span>
              ))}
            </div>
          )}
          <h2 className="section-title mt-6">Accuracy by difficulty</h2>
          <ul className="mt-2 divide-y divide-line text-sm">
            {report.accuracyByDifficulty.map((d) => (
              <li key={d.band} className="flex justify-between py-1.5">
                <span className="text-ink">{d.band}</span>
                <span className="text-ink-faint">
                  {d.correct}/{d.total} ({d.total ? Math.round((d.correct / d.total) * 100) : 0}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* topic ratings */}
      <div className="card mt-5 p-5">
        <h2 className="section-title">Topic ratings</h2>
        {report.topicProgress.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">Practice a topic to start building its rating.</p>
        ) : (
          <div className="mt-3 grid gap-x-10 gap-y-1.5 text-sm sm:grid-cols-2">
            {report.topicProgress
              .slice()
              .sort((a, b) => b.rating - a.rating)
              .map((t) => {
                const c = STATUS_COLORS[t.status] ?? STATUS_COLORS.not_started;
                return (
                  <div key={t.topicId} className="flex items-center justify-between border-b border-line py-1 last:border-0">
                    <span className="truncate pr-2 text-ink">{t.title}</span>
                    <span className={`shrink-0 font-mono font-semibold ${c.text}`}>{t.rating}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
