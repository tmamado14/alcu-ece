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

  if (error) return <p className="mt-8 text-red-600">{error}</p>;
  if (!quests) return <p className="mt-8 animate-pulse text-slate-400">Loading quests…</p>;

  const groups: [string, QuestRow[]][] = [
    ["Daily quests", quests.filter((q) => q.cadence === "daily")],
    ["Weekly quests", quests.filter((q) => q.cadence === "weekly")],
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Quests</h1>
      <p className="mt-1 text-sm text-slate-500">Progress counts automatically as you practice.</p>
      {groups.map(([title, list]) => (
        <div key={title} className="mt-6">
          <h2 className="font-bold text-slate-700">{title}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {list.map((q) => (
              <div
                key={q.code}
                className={`rounded-xl border p-4 ${
                  q.completed ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{q.completed ? "✅ " : "🗺️ "}{q.title}</h3>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                    +{q.xpReward} XP
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{q.description}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${q.completed ? "bg-teal-500" : "bg-indigo-500"}`}
                    style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-slate-500">
                  {q.completed ? "Complete!" : `${q.progress}/${q.target}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
