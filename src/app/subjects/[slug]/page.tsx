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

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p className="loading-text">Loading topic map…</p>;

  return (
    <div className="fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{data.subject.title}</h1>
        <div className="flex gap-2">
          <Link href="/practice?mode=adaptive" className="btn-primary">
            🎯 Adaptive practice
          </Link>
          <Link href="/practice?mode=review" className="btn-secondary">
            🔁 Review mode
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${v.bar}`} /> {v.label}
          </span>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {data.topics.map((group) => (
          <section key={group.id} className="card p-5">
            <h2 className="section-title">{group.title}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {group.children.map((t) => {
                const c = STATUS_COLORS[t.status] ?? STATUS_COLORS.not_started;
                return (
                  <div key={t.id} className="rounded-(--radius-control) border border-line bg-sunken/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{t.title}</span>
                      <span className={`shrink-0 text-xs font-semibold ${c.text}`}>{c.label}</span>
                    </div>
                    <div className="mt-2.5">
                      <TopicBar
                        status={t.status}
                        rating={t.rating}
                        passThreshold={t.passThreshold}
                        masteryThreshold={t.masteryThreshold}
                      />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-xs text-ink-faint">
                      <span>
                        Rating {t.rating} · {t.problemsSeen} attempted
                        {t.streak > 1 ? ` · 🔥${t.streak}` : ""}
                      </span>
                      {t.problemCount > 0 ? (
                        <Link href={`/practice?topicId=${t.id}&mode=drill`} className="link text-xs">
                          Drill →
                        </Link>
                      ) : (
                        <span className="text-ink-faint/60">No problems yet</span>
                      )}
                    </div>
                    {t.prerequisites.length > 0 && (
                      <p className="mt-1.5 text-[11px] text-ink-faint">
                        Requires: {t.prerequisites.map((p) => p.title).join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
