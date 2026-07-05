"use client";

import { useEffect, useState } from "react";

interface BadgeRow {
  code: string; title: string; description: string; icon: string;
  earned: boolean; earnedAt: string | null;
}
interface AchRow extends BadgeRow { hidden: boolean }

export default function AchievementsPage() {
  const [badges, setBadges] = useState<BadgeRow[] | null>(null);
  const [achievements, setAchievements] = useState<AchRow[] | null>(null);
  const [hiddenLeft, setHiddenLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gamification")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        const data = await r.json();
        setBadges(data.badges);
        setAchievements(data.achievements);
        setHiddenLeft(data.hiddenAchievementsRemaining);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="mt-8 text-red-600">{error}</p>;
  if (!badges || !achievements) return <p className="mt-8 animate-pulse text-slate-400">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Badges</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b) => (
          <div
            key={b.code}
            className={`rounded-xl border p-4 ${
              b.earned ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white opacity-60"
            }`}
          >
            <div className="text-3xl">{b.earned ? b.icon : "🔒"}</div>
            <h3 className="mt-1 font-bold">{b.title}</h3>
            <p className="text-sm text-slate-600">{b.description}</p>
            {b.earnedAt && (
              <p className="mt-1 text-xs text-amber-700">Earned {new Date(b.earnedAt).toLocaleDateString()}</p>
            )}
          </div>
        ))}
      </div>

      <h1 className="mt-10 text-2xl font-bold">Achievements</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => (
          <div
            key={a.code}
            className={`rounded-xl border p-4 ${
              a.earned ? "border-purple-300 bg-purple-50" : "border-slate-200 bg-white opacity-60"
            }`}
          >
            <div className="text-3xl">{a.earned ? a.icon : "🔒"}</div>
            <h3 className="mt-1 font-bold">{a.title}</h3>
            <p className="text-sm text-slate-600">{a.description}</p>
            {a.earnedAt && (
              <p className="mt-1 text-xs text-purple-700">Earned {new Date(a.earnedAt).toLocaleDateString()}</p>
            )}
          </div>
        ))}
        {hiddenLeft > 0 && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-400">
            + {hiddenLeft} hidden achievement{hiddenLeft > 1 ? "s" : ""} to discover…
          </div>
        )}
      </div>
    </div>
  );
}
