"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import TopicBar, { STATUS_COLORS } from "@/components/TopicBar";

interface TopicNode {
  id: string;
  slug: string;
  title: string;
  difficultyBand: number;
  passThreshold: number;
  masteryThreshold: number;
  problemCount: number;
  prerequisites: { slug: string; title: string }[];
  rating: number;
  confidence: number;
  status: string;
  problemsSeen: number;
  streak: number;
}

interface TopicMap {
  subject: { id: string; slug: string; title: string };
  topics: { id: string; slug: string; title: string; children: TopicNode[] }[];
}

export default function TopicMapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<TopicMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/subjects/${slug}/topics`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        setData(await r.json());
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <p className="mt-8 text-red-600">{error}</p>;
  if (!data) return <p className="mt-8 animate-pulse text-slate-400">Loading topic map…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{data.subject.title}</h1>
        <div className="flex gap-2">
          <Link
            href="/practice?mode=adaptive"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            🎯 Adaptive practice
          </Link>
          <Link
            href="/practice?mode=review"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            🔁 Review mode
          </Link>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${v.bar}`} /> {v.label}
          </span>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {data.topics.map((group) => (
          <div key={group.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-800">{group.title}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {group.children.map((t) => {
                const c = STATUS_COLORS[t.status] ?? STATUS_COLORS.not_started;
                return (
                  <div key={t.id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{t.title}</span>
                      <span className={`text-xs font-semibold ${c.text}`}>{c.label}</span>
                    </div>
                    <div className="mt-2">
                      <TopicBar
                        status={t.status}
                        rating={t.rating}
                        passThreshold={t.passThreshold}
                        masteryThreshold={t.masteryThreshold}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Rating {t.rating} · {t.problemsSeen} attempted
                        {t.streak > 1 ? ` · 🔥${t.streak}` : ""}
                      </span>
                      {t.problemCount > 0 ? (
                        <Link
                          href={`/practice?topicId=${t.id}&mode=drill`}
                          className="font-semibold text-indigo-600 hover:underline"
                        >
                          Drill →
                        </Link>
                      ) : (
                        <span className="text-slate-300">No problems yet</span>
                      )}
                    </div>
                    {t.prerequisites.length > 0 && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        Requires: {t.prerequisites.map((p) => p.title).join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
