"use client";

import { useState } from "react";

const CSV_HEADER =
  "subject, topic, subtopic, skill_tags, difficulty, cognitive_level, answer_type, question_text, option_a, option_b, option_c, option_d, correct_answer, numerical_tolerance, solution, explanation, reference";

export default function ImportPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const isJson = text.trim().startsWith("[") || text.trim().startsWith("{");
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": isJson ? "application/json" : "text/csv" },
        body: text,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Import failed");
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setText);
  }

  return (
    <div className="fade-up mx-auto max-w-3xl">
      <h1 className="page-title">Bulk import questions</h1>
      <p className="page-sub">
        Paste CSV or JSON (or load a file). A subtopic is matched by its exact title (e.g.{" "}
        <code className="border border-line bg-sunken px-1 font-mono text-xs">Routh-Hurwitz Criterion</code>) or by its
        slug. For text answers use{" "}
        <code className="border border-line bg-sunken px-1 font-mono text-xs">|</code> to separate accepted variants.
      </p>
      <details className="card mt-4 p-4 text-xs text-ink-muted">
        <summary className="cursor-pointer font-semibold text-ink">CSV columns</summary>
        <code className="mt-2 block rounded-(--radius-control) bg-sunken p-2 font-mono">{CSV_HEADER}</code>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <code className="border border-line bg-sunken px-1 font-mono">solution</code> and{" "}
            <code className="border border-line bg-sunken px-1 font-mono">explanation</code> may be left blank — a
            worked solution is generated automatically the first time a learner finishes the
            question.
          </li>
          <li>
            <code className="border border-line bg-sunken px-1 font-mono">answer_type</code>:{" "}
            multiple_choice_single, numerical_tolerance, true_false, or text_short.
          </li>
          <li>
            Math goes in <code className="border border-line bg-sunken px-1 font-mono">$…$</code> (inline) or{" "}
            <code className="border border-line bg-sunken px-1 font-mono">$$…$$</code> (display) LaTeX.
          </li>
          <li>
            <code className="border border-line bg-sunken px-1 font-mono">difficulty</code> is 1–10;{" "}
            <code className="border border-line bg-sunken px-1 font-mono">skill_tags</code> are separated by{" "}
            <code className="border border-line bg-sunken px-1 font-mono">;</code>.
          </li>
        </ul>
      </details>

      <a href="/api/admin/import/template" download className="btn-secondary mt-5">
        ⬇ Download CSV template
      </a>
      <p className="mt-2 text-xs text-ink-faint">
        Hand this file to question writers — it has one example row per answer type. They fill in
        rows (Excel or Google Sheets, save/export as CSV), you upload the file below.
      </p>

      <input type="file" accept=".csv,.json,.txt" onChange={onFile} className="mt-5 block text-sm text-ink-muted" />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder="Paste CSV rows or a JSON array here…"
        className="input mt-3 p-3 font-mono text-xs"
      />
      <button onClick={submit} disabled={busy || !text.trim()} className="btn-primary mt-4">
        {busy ? "Importing…" : "Import"}
      </button>

      {error && <p className="callout-danger mt-4">{error}</p>}
      {result && (
        <div className="card mt-4 p-4 text-sm">
          <p className="font-semibold text-green-700">✓ Imported {result.created} problem(s)</p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-red-700">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
