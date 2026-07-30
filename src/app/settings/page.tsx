"use client";

import { useEffect, useState } from "react";

interface Me {
  username: string;
  name: string;
  email: string | null;
  role: string;
  totalXp: number;
  level: { level: number };
  createdAt: string;
}

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401) window.location.href = "/login";
          throw new Error("Failed to load profile");
        }
        setMe(await r.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  async function resetProgress() {
    if (!confirm("Reset ALL progress (attempts, XP, badges, quests)? This cannot be undone.")) return;
    setResetting(true);
    const res = await fetch("/api/auth/reset-progress", { method: "POST" });
    setResetting(false);
    if (res.ok) {
      setResetDone(true);
      setTimeout(() => window.location.reload(), 800);
    }
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!me) return <p className="loading-text">Loading profile…</p>;

  return (
    <div className="fade-up mx-auto max-w-lg">
      <h1 className="page-title">Profile &amp; settings</h1>
      <div className="card mt-6 p-6">
        <h2 className="eyebrow">Account</h2>
        <hr className="caption-rule" />
        <dl className="mt-3 divide-y divide-line text-sm">
          {[
            ["Name", me.name],
            ["Username", me.username],
            ["Email", me.email ?? "—"],
            ["Role", me.role],
            ["Level", `${me.level.level} (${me.totalXp} XP)`],
            ["Member since", new Date(me.createdAt).toLocaleDateString()],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5">
              <dt className="text-xs font-semibold tracking-[0.06em] text-ink-faint uppercase">{k}</dt>
              <dd className="text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card mt-8 border-red-700 p-6">
        <h2 className="font-heading text-xl font-semibold tracking-wide text-red-800 uppercase">Danger zone</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">
          Reset all learning progress for this account (useful for testing the adaptive engine).
        </p>
        <button onClick={resetProgress} disabled={resetting} className="btn-danger mt-4">
          {resetDone ? "Progress reset ✓" : resetting ? "Resetting…" : "Reset my progress"}
        </button>
      </div>
    </div>
  );
}
