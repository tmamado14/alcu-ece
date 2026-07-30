"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import FocusPanel, { type Focus } from "@/components/FocusPanel";
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
  const [focus, setFocus] = useState<Focus | null>(null);
  const [focusBusy, setFocusBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/subjects/${slug}/topics`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        setData(await r.json());
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    fetch("/api/focus")
      .then((r) => (r.ok ? r.json() : { focus: null }))
      .then((d) => setFocus(d.focus))
      .catch(() => setFocus(null));
  }, []);

  const changeFocus = useCallback(async (topicId: string | null) => {
    setFocusBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not update focus");
      setFocus((await res.json()).focus);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update focus");
    } finally {
      setFocusBusy(false);
    }
  }, []);

  if (error && !data) return <p className="error-text">{error}</p>;
  if (!data) return <p className="loading-text">Loading topic map…</p>;

  const focusedId = focus?.topic.id ?? null;

  return (
    <div className="fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{data.subject.title}</h1>
        <div className="flex gap-2">
          <Link href={`/practice?mode=adaptive&subject=${data.subject.slug}`} className="btn-primary">
            🎯 Adaptive practice
          </Link>
          <Link href="/practice?mode=review" className="btn-secondary">
            🔁 Review mode
          </Link>
        </div>
      </div>

      {error && <p className="callout-danger mt-4 text-sm">{error}</p>}

      {focus ? (
        <div className="mt-6">
          <FocusPanel focus={focus} onClear={() => changeFocus(null)} busy={focusBusy} />
        </div>
      ) : (
        <p className="callout-info mt-6 text-sm">
          🎯 No focus set. Choose a topic group or a single subtopic below to master first — adaptive
          practice will then draw only from it, in prerequisite order.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs tracking-[0.04em] text-ink-muted uppercase">
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 ${v.bar}`} /> {v.label}
          </span>
        ))}
      </div>

      <div className="mt-8 space-y-8">
        {data.topics.map((group) => {
          const groupProblems = group.children.reduce((n, c) => n + c.problemCount, 0);
          return (
            <section key={group.id} className={`card p-5 ${focusedId === group.id ? "border-brand-500" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="section-title">{group.title}</h2>
                {groupProblems > 0 && (
                  <FocusButton
                    active={focusedId === group.id}
                    busy={focusBusy}
                    label="Focus whole group"
                    onClick={() => changeFocus(focusedId === group.id ? null : group.id)}
                  />
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {group.children.map((t) => {
                  const c = STATUS_COLORS[t.status] ?? STATUS_COLORS.not_started;
                  const isFocused = focusedId === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`border bg-sunken/60 p-4 ${isFocused ? "border-brand-500" : "border-line"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">{t.title}</span>
                        <span
                          className={`shrink-0 border border-current px-1.5 py-px text-[11px] font-semibold tracking-[0.06em] uppercase ${c.text}`}
                        >
                          {c.label}
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <TopicBar
                          status={t.status}
                          rating={t.rating}
                          passThreshold={t.passThreshold}
                          masteryThreshold={t.masteryThreshold}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-ink-faint">
                        <span className="tnum">
                          Rating {t.rating} · {t.problemsSeen} attempted
                          {t.streak > 1 ? ` · 🔥${t.streak}` : ""}
                        </span>
                        {t.problemCount > 0 ? (
                          <span className="flex shrink-0 items-center gap-2">
                            <FocusButton
                              active={isFocused}
                              busy={focusBusy}
                              label="Focus"
                              onClick={() => changeFocus(isFocused ? null : t.id)}
                            />
                            <Link href={`/practice?topicId=${t.id}&mode=drill`} className="link text-xs">
                              Drill →
                            </Link>
                          </span>
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
          );
        })}
      </div>
    </div>
  );
}

function FocusButton({
  active,
  busy,
  label,
  onClick,
}: {
  active: boolean;
  busy: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      title={active ? "Clear this focus" : "Master this next"}
      className={`shrink-0 cursor-pointer border px-2 py-px text-[11px] font-semibold tracking-[0.06em] uppercase transition disabled:opacity-50 ${
        active
          ? "border-brand-500 bg-brand-50 text-brand-800"
          : "border-line-strong text-ink-muted hover:bg-sunken"
      }`}
    >
      {active ? "🎯 Focused" : label}
    </button>
  );
}
