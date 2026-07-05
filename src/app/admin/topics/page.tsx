"use client";

import { useCallback, useEffect, useState } from "react";

interface TopicRow {
  id: string;
  slug: string;
  title: string;
  subject: string;
  parent: string | null;
  isLeaf: boolean;
  difficultyBand: number;
  passThreshold: number;
  masteryThreshold: number;
}

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<TopicRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // new topic form
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [parentSlug, setParentSlug] = useState("");
  const [band, setBand] = useState(1);
  const [prereqs, setPrereqs] = useState("");

  // new subject form
  const [subjTitle, setSubjTitle] = useState("");
  const [subjSlug, setSubjSlug] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/topics");
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to load (admin only)");
      return;
    }
    setTopics(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectSlug: "feedback-control-systems",
        parentSlug: parentSlug || null,
        slug,
        title,
        difficultyBand: band,
        prerequisiteSlugs: prereqs.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    if (!res.ok) {
      setMsg((await res.json()).error ?? "Failed");
      return;
    }
    setTitle(""); setSlug(""); setPrereqs("");
    setMsg("Topic created ✓");
    load();
  }

  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: subjSlug, title: subjTitle }),
    });
    if (!res.ok) {
      setMsg((await res.json()).error ?? "Failed");
      return;
    }
    setSubjTitle(""); setSubjSlug("");
    setMsg("Subject created ✓ (add topics to it via the API or extend this form)");
  }

  if (error) return <p className="mt-8 text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Topic editor</h1>
      {msg && <p className="mt-2 rounded bg-indigo-50 px-3 py-2 text-sm text-indigo-800">{msg}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={addTopic} className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h2 className="font-bold">Add topic (Feedback & Control Systems)</h2>
          <div className="mt-3 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded border border-slate-300 px-3 py-2" />
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-kebab-case" className="w-full rounded border border-slate-300 px-3 py-2 font-mono" />
            <select value={parentSlug} onChange={(e) => setParentSlug(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-2">
              <option value="">No parent (major topic)</option>
              {(topics ?? []).filter((t) => !t.isLeaf).map((t) => (
                <option key={t.id} value={t.slug}>{t.title}</option>
              ))}
            </select>
            <label className="block">
              Difficulty band (1–5)
              <input type="number" min={1} max={5} value={band} onChange={(e) => setBand(parseInt(e.target.value, 10) || 1)} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
            </label>
            <input value={prereqs} onChange={(e) => setPrereqs(e.target.value)} placeholder="Prerequisite slugs, comma-separated" className="w-full rounded border border-slate-300 px-3 py-2 font-mono" />
            <button className="rounded bg-indigo-600 px-4 py-2 font-semibold text-white">Create topic</button>
          </div>
        </form>

        <form onSubmit={addSubject} className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h2 className="font-bold">Add subject</h2>
          <p className="mt-1 text-xs text-slate-500">e.g. Signals and Systems, Communications, Electromagnetics…</p>
          <div className="mt-3 space-y-3">
            <input value={subjTitle} onChange={(e) => setSubjTitle(e.target.value)} placeholder="Title" className="w-full rounded border border-slate-300 px-3 py-2" />
            <input value={subjSlug} onChange={(e) => setSubjSlug(e.target.value)} placeholder="slug-kebab-case" className="w-full rounded border border-slate-300 px-3 py-2 font-mono" />
            <button className="rounded bg-indigo-600 px-4 py-2 font-semibold text-white">Create subject</button>
          </div>
        </form>
      </div>

      {!topics ? (
        <p className="mt-8 animate-pulse text-slate-400">Loading topics…</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Parent</th>
                <th className="px-3 py-2">Band</th>
                <th className="px-3 py-2">Pass / Mastery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topics.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-1.5">{t.parent ? "└ " : ""}{t.title}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{t.slug}</td>
                  <td className="px-3 py-1.5 text-slate-500">{t.parent ?? "—"}</td>
                  <td className="px-3 py-1.5">{t.difficultyBand}</td>
                  <td className="px-3 py-1.5">{t.passThreshold} / {t.masteryThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
