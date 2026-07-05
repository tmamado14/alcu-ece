"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  if (error) return <p className="mt-8 text-red-600">{error}</p>;
  if (!report) return <p className="mt-8 animate-pulse text-slate-400">Loading dashboard…</p>;

  const { user, totals } = report;
  const accuracy = totals.attempts
    ? Math.round(((totals.correctFirst + totals.correctSecond) / totals.attempts) * 100)
    : 0;
  const levelPct = Math.round((user.level.currentXp / Math.max(1, user.level.nextLevelXp)) * 100);

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back, {user.name} 👋</h1>

      {/* level + stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-slate-500">LEVEL {user.level.level}</span>
            <span className="text-xs text-slate-400">
              {user.level.currentXp}/{user.level.nextLevelXp} XP to next level
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="bar-fill h-full rounded-full bg-indigo-500" style={{ width: `${levelPct}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-600">{user.totalXp} total XP</p>
        </div>
        {[
          [`${accuracy}%`, "Accuracy"],
          [`${totals.dayStreak}🔥`, "Day streak"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-extrabold">{v}</p>
            <p className="text-sm text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        {[
          [totals.attempts, "Problems attempted"],
          [totals.correctFirst, "First-try correct"],
          [report.passedCount + report.masteredCount, "Topics passed"],
          [Math.round(totals.timeSpentSec / 60), "Minutes practiced"],
        ].map(([v, l]) => (
          <div key={l as string} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-extrabold">{v}</p>
            <p className="text-sm text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      {report.needsReviewCount > 0 && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          ⚠️ {report.needsReviewCount} topic{report.needsReviewCount > 1 ? "s" : ""} need review.{" "}
          <Link href="/practice?mode=review" className="font-semibold underline">
            Start review mode →
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* recommended */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Recommended next topics</h2>
          {report.recommended.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">All topics passed — go for mastery! 🎓</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {report.recommended.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span>{t.title}</span>
                  <Link
                    href={`/practice?topicId=${t.id}&mode=drill`}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    Practice →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* recent activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Recent activity</h2>
          {report.recentActivity.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              No attempts yet.{" "}
              <Link href="/practice" className="font-semibold text-indigo-600 hover:underline">
                Start practicing →
              </Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {report.recentActivity.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span className="truncate pr-2">{a.topic}</span>
                  <span className="shrink-0 text-slate-500">
                    {RESULT_LABEL[a.result] ?? a.result} {a.xp > 0 && <b className="text-indigo-600">+{a.xp}</b>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* accuracy by topic */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Accuracy by topic</h2>
          {report.accuracyByTopic.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Attempt problems to see accuracy stats.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {report.accuracyByTopic
                .slice()
                .sort((a, b) => a.correct / a.total - b.correct / b.total)
                .slice(0, 8)
                .map((t) => (
                  <li key={t.topicId}>
                    <div className="flex justify-between">
                      <span className="truncate pr-2">{t.title}</span>
                      <span className="text-slate-500">
                        {t.correct}/{t.total} ({t.firstTry} first-try)
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${(t.correct / t.total) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* weak skills + difficulty */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Weak skills</h2>
          {report.mostMissedTags.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No misses recorded — keep it up!</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {report.mostMissedTags.map((t) => (
                <span key={t.tag} className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {t.tag} ×{t.count}
                </span>
              ))}
            </div>
          )}
          <h2 className="mt-5 font-bold">Accuracy by difficulty</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {report.accuracyByDifficulty.map((d) => (
              <li key={d.band} className="flex justify-between">
                <span>{d.band}</span>
                <span className="text-slate-500">
                  {d.correct}/{d.total} ({d.total ? Math.round((d.correct / d.total) * 100) : 0}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* topic ratings */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Topic ratings</h2>
        {report.topicProgress.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Practice a topic to start building its rating.</p>
        ) : (
          <div className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            {report.topicProgress
              .slice()
              .sort((a, b) => b.rating - a.rating)
              .map((t) => {
                const c = STATUS_COLORS[t.status] ?? STATUS_COLORS.not_started;
                return (
                  <div key={t.topicId} className="flex items-center justify-between">
                    <span className="truncate pr-2">{t.title}</span>
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
