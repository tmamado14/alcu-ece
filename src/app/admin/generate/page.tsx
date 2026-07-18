"use client";

// Admin: AI question writer. Pick a subtopic, answer type, count, and
// difficulty range; DeepSeek (thinking mode) writes the questions with
// solutions and they are inserted into the databank.

import { useEffect, useState } from "react";
import Link from "next/link";

interface TopicRow {
  id: string;
  title: string;
  parent: string | null;
  isLeaf: boolean;
}

interface GenResult {
  created: { id: string; statement: string; difficulty: number }[];
  errors: string[];
}

const ANSWER_TYPES = [
  { value: "multiple_choice_single", label: "Multiple choice (A–D)" },
  { value: "numerical_tolerance", label: "Numerical (with tolerance)" },
  { value: "true_false", label: "True / False" },
  { value: "text_short", label: "Short text answer" },
];

export default function GeneratePage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [topicId, setTopicId] = useState("");
  const [answerType, setAnswerType] = useState("multiple_choice_single");
  const [count, setCount] = useState(5);
  const [diffMin, setDiffMin] = useState(3);
  const [diffMax, setDiffMax] = useState(6);
  const [notes, setNotes] = useState("");
  const [asDraft, setAsDraft] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenResult | null>(null);

  useEffect(() => {
    fetch("/api/admin/topics")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load topics"))))
      .then((rows: TopicRow[]) => {
        const leaves = rows.filter((t) => t.isLeaf);
        setTopics(leaves);
        if (leaves.length > 0) setTopicId(leaves[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function generate() {
    if (!topicId || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          answerType,
          count,
          difficultyMin: diffMin,
          difficultyMax: diffMax,
          notes,
          status: asDraft ? "draft" : "active",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Generation failed");
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-up mx-auto max-w-3xl">
      <h1 className="page-title">AI question writer</h1>
      <p className="page-sub">
        DeepSeek (thinking mode) writes original questions — with worked solutions — for the
        subtopic you pick, and adds them straight to the databank. Generation takes roughly
        10–30 seconds per question; keep this tab open.
      </p>

      <div className="card mt-6 grid gap-4 p-5">
        <label className="block text-sm">
          <span className="label">Subtopic</span>
          <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="input">
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.parent ? `${t.parent} → ` : ""}
                {t.title}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="label">Question type</span>
            <select value={answerType} onChange={(e) => setAnswerType(e.target.value)} className="input">
              {ANSWER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="label">How many (1–10)</span>
            <input
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="input"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="label">Difficulty from (1–10)</span>
            <input
              type="number"
              min={1}
              max={10}
              value={diffMin}
              onChange={(e) => setDiffMin(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="input"
            />
          </label>
          <label className="block text-sm">
            <span className="label">Difficulty to (1–10)</span>
            <input
              type="number"
              min={1}
              max={10}
              value={diffMax}
              onChange={(e) => setDiffMax(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="input"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="label">Extra instructions (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Focus on unity-feedback systems; use realistic component values…"
            className="input"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={asDraft}
            onChange={(e) => setAsDraft(e.target.checked)}
            className="accent-brand-600"
          />
          Add as <strong className="text-ink">draft</strong> so I can review before learners see them
        </label>

        <button onClick={generate} disabled={busy || !topicId} className="btn-primary">
          {busy ? "Generating… (this can take a few minutes)" : "Generate questions"}
        </button>
        {busy && (
          <div className="flex items-center gap-3 text-sm text-ink-faint">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            DeepSeek is thinking through and solving each question before writing it…
          </div>
        )}
      </div>

      {error && <p className="callout-danger mt-4">{error}</p>}

      {result && (
        <div className="card mt-6 p-5 text-sm">
          <p className="font-semibold text-green-700">
            ✓ Added {result.created.length} question(s) to the databank
            {asDraft ? " as drafts" : ""}
          </p>
          <ul className="mt-3 space-y-2">
            {result.created.map((c) => (
              <li key={c.id} className="rounded-(--radius-control) border border-line bg-sunken p-2.5">
                <span className="chip-neutral mr-2">diff {c.difficulty}</span>
                {c.statement.slice(0, 160)}
                {c.statement.length > 160 ? "…" : ""}{" "}
                <Link href={`/admin/problems/${c.id}`} className="link">
                  edit
                </Link>
              </li>
            ))}
          </ul>
          {result.errors.length > 0 && (
            <>
              <p className="mt-4 font-semibold text-red-700">Skipped (failed validation):</p>
              <ul className="mt-1 list-inside list-disc text-red-700">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
