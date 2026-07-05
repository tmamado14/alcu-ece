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

  if (error) return <p className="mt-8 text-red-600">{error}</p>;
  if (!me) return <p className="mt-8 animate-pulse text-slate-400">Loading profile…</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Profile & settings</h1>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <dl className="space-y-3 text-sm">
          {[
            ["Name", me.name],
            ["Username", me.username],
            ["Email", me.email ?? "—"],
            ["Role", me.role],
            ["Level", `${me.level.level} (${me.totalXp} XP)`],
            ["Member since", new Date(me.createdAt).toLocaleDateString()],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="font-semibold text-slate-500">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-bold text-red-800">Danger zone</h2>
        <p className="mt-1 text-sm text-red-700">
          Reset all learning progress for this account (useful for testing the adaptive engine).
        </p>
        <button
          onClick={resetProgress}
          disabled={resetting}
          className="mt-3 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {resetDone ? "Progress reset ✓" : resetting ? "Resetting…" : "Reset my progress"}
        </button>
      </div>
    </div>
  );
}
