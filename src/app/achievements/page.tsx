"use client";

import { useEffect, useState } from "react";

interface BadgeRow {
  code: string; title: string; description: string; icon: string;
  earned: boolean; earnedAt: string | null;
}
interface AchRow extends BadgeRow { hidden: boolean; tier: string; imagePath: string }

const TIER_CHIP: Record<string, string> = {
  bronze: "bg-orange-100 text-orange-800",
  silver: "bg-slate-200 text-slate-700",
  gold: "bg-amber-100 text-amber-800",
  platinum: "bg-sky-100 text-sky-800",
};

/** Badge art from imagePath, falling back to the emoji icon while images don't exist yet. */
function BadgeArt({ imagePath, icon, locked }: { imagePath: string; icon: string; locked: boolean }) {
  const [failed, setFailed] = useState(false);
  if (locked) return <div className="text-3xl" aria-hidden>🔒</div>;
  if (!imagePath || failed) return <div className="text-3xl" aria-hidden>{icon}</div>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imagePath}
      alt=""
      className="h-12 w-12 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

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

  if (error) return <p className="error-text">{error}</p>;
  if (!badges || !achievements) return <p className="loading-text">Loading…</p>;

  return (
    <div className="fade-up">
      <h1 className="page-title">Badges</h1>
      <p className="page-sub">Milestones you earn as your practice adds up.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b) => (
          <div
            key={b.code}
            className={`card p-5 ${b.earned ? "border-amber-300 bg-amber-50/70" : "opacity-60"}`}
          >
            <div className="text-3xl" aria-hidden>{b.earned ? b.icon : "🔒"}</div>
            <h3 className="mt-2 font-semibold text-ink">{b.title}</h3>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{b.description}</p>
            {b.earnedAt && (
              <p className="mt-2 text-xs font-medium text-amber-800">
                Earned {new Date(b.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>

      <h1 className="page-title mt-12">Achievements</h1>
      <p className="page-sub">One-off feats — some stay hidden until you pull them off.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => (
          <div
            key={a.code}
            className={`card p-5 ${a.earned ? "border-brand-300 bg-brand-50/70" : "opacity-60"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <BadgeArt imagePath={a.imagePath} icon={a.icon} locked={!a.earned} />
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${TIER_CHIP[a.tier] ?? TIER_CHIP.bronze}`}>
                {a.tier}
              </span>
            </div>
            <h3 className="mt-2 font-semibold text-ink">{a.title}</h3>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{a.description}</p>
            {a.earnedAt && (
              <p className="mt-2 text-xs font-medium text-brand-700">
                Earned {new Date(a.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
        {hiddenLeft > 0 && (
          <div className="flex items-center justify-center rounded-(--radius-card) border border-dashed border-line-strong p-5 text-sm text-ink-faint">
            + {hiddenLeft} hidden achievement{hiddenLeft > 1 ? "s" : ""} to discover…
          </div>
        )}
      </div>
    </div>
  );
}
