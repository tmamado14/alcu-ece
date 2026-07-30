"use client";

import { useEffect, useState } from "react";

interface QuestRow {
  code: string;
  title: string;
  description: string;
  cadence: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
  imagePath?: string;
}

/** Quest badge art from imagePath, falling back to an emoji while images don't exist yet. */
function QuestArt({ imagePath, completed }: { imagePath?: string; completed: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!imagePath || failed) return <span aria-hidden>{completed ? "✅ " : "🗺️ "}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imagePath}
      alt=""
      className="mr-1.5 inline-block h-6 w-6 object-contain align-text-bottom"
      onError={() => setFailed(true)}
    />
  );
}

export default function QuestsPage() {
  const [quests, setQuests] = useState<QuestRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gamification")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        setQuests((await r.json()).quests);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!quests) return <p className="loading-text">Loading quests…</p>;

  const groups: [string, QuestRow[]][] = [
    ["Daily quests", quests.filter((q) => q.cadence === "daily")],
    ["Weekly quests", quests.filter((q) => q.cadence === "weekly")],
  ];

  return (
    <div className="fade-up">
      <h1 className="page-title">Quests</h1>
      <p className="page-sub">Progress counts automatically as you practice.</p>
      {groups.map(([title, list]) => (
        <section key={title} className="mt-8">
          <h2 className="eyebrow">{title}</h2>
          <hr className="caption-rule" />
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {list.map((q) => (
              <div
                key={q.code}
                className={`card p-5 ${q.completed ? "border-green-700 bg-green-50/60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-semibold tracking-wide text-ink uppercase">
                    <QuestArt imagePath={q.imagePath} completed={q.completed} />
                    {q.title}
                  </h3>
                  <span className="chip-brand shrink-0">+{q.xpReward} XP</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{q.description}</p>
                <div className="progress-track mt-4">
                  <div
                    className={`progress-fill ${q.completed ? "bg-green-700" : "bg-brand-500"}`}
                    style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                  />
                </div>
                <p className="tnum mt-1.5 text-right text-xs font-semibold tracking-[0.04em] text-ink-faint uppercase">
                  {q.completed ? "Complete!" : `${q.progress}/${q.target}`}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
