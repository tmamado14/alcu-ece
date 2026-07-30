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

interface SubjectRow {
  slug: string;
  title: string;
}

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<TopicRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);

  // new topic form
  const [subjectSlug, setSubjectSlug] = useState("");
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
    fetch("/api/subjects").then(async (r) => {
      if (!r.ok) return;
      const list: SubjectRow[] = await r.json();
      setSubjects(list);
      setSubjectSlug((cur) => cur || list[0]?.slug || "");
    });
  }, [load]);

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectSlug,
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
    setMsg("Subject created ✓ — it is now selectable in the add-topic form");
    fetch("/api/subjects").then(async (r) => {
      if (r.ok) setSubjects(await r.json());
    });
  }

  if (error) return <p className="error-text">{error}</p>;

  // Topic rows carry the subject title, so parent options are matched by title.
  const subjectTitle = subjects.find((s) => s.slug === subjectSlug)?.title ?? "";

  return (
    <div className="fade-up">
      <h1 className="page-title">Topic editor</h1>
      <p className="page-sub">Create subjects and topics, and review thresholds.</p>
      {msg && <p className="callout-info mt-3">{msg}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={addTopic} className="card p-5 text-sm">
          <h2 className="section-title">Add topic</h2>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="label">Subject</span>
              <select value={subjectSlug} onChange={(e) => setSubjectSlug(e.target.value)} className="input">
                {subjects.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.title}</option>
                ))}
              </select>
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input" />
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-kebab-case" className="input font-mono" />
            <select value={parentSlug} onChange={(e) => setParentSlug(e.target.value)} className="input">
              <option value="">No parent (major topic)</option>
              {(topics ?? [])
                .filter((t) => !t.isLeaf && t.subject === subjectTitle)
                .map((t) => (
                  <option key={t.id} value={t.slug}>{t.title}</option>
                ))}
            </select>
            <label className="block">
              <span className="label">Difficulty band (1–5)</span>
              <input
                type="number"
                min={1}
                max={5}
                value={band}
                onChange={(e) => setBand(parseInt(e.target.value, 10) || 1)}
                className="input"
              />
            </label>
            <input
              value={prereqs}
              onChange={(e) => setPrereqs(e.target.value)}
              placeholder="Prerequisite slugs, comma-separated"
              className="input font-mono"
            />
            <button className="btn-primary">Create topic</button>
          </div>
        </form>

        <form onSubmit={addSubject} className="card p-5 text-sm">
          <h2 className="section-title">Add subject</h2>
          <p className="mt-1 text-xs text-ink-faint">
            e.g. Signals and Systems, Communications, Electromagnetics…
          </p>
          <div className="mt-4 space-y-3">
            <input value={subjTitle} onChange={(e) => setSubjTitle(e.target.value)} placeholder="Title" className="input" />
            <input value={subjSlug} onChange={(e) => setSubjSlug(e.target.value)} placeholder="slug-kebab-case" className="input font-mono" />
            <button className="btn-primary">Create subject</button>
          </div>
        </form>
      </div>

      {!topics ? (
        <p className="loading-text">Loading topics…</p>
      ) : (
        <div className="table-wrap mt-6">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Title</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Band</th>
                <th>Pass / Mastery</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.id}>
                  <td className="text-ink-faint">{t.subject}</td>
                  <td>{t.parent ? "└ " : ""}{t.title}</td>
                  <td className="font-mono text-xs">{t.slug}</td>
                  <td className="text-ink-faint">{t.parent ?? "—"}</td>
                  <td>{t.difficultyBand}</td>
                  <td>{t.passThreshold} / {t.masteryThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
