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
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Bulk import questions</h1>
      <p className="mt-2 text-sm text-slate-600">
        Paste CSV or JSON (or load a file). Subtopic names are matched by slug (e.g.{" "}
        <code className="rounded bg-slate-100 px-1">Damping Ratio → damping-ratio</code>). For text
        answers use <code className="rounded bg-slate-100 px-1">|</code> to separate accepted variants.
      </p>
      <details className="mt-2 text-xs text-slate-500">
        <summary className="cursor-pointer font-semibold">CSV columns</summary>
        <code className="mt-1 block rounded bg-slate-100 p-2">{CSV_HEADER}</code>
      </details>

      <input type="file" accept=".csv,.json,.txt" onChange={onFile} className="mt-4 text-sm" />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder="Paste CSV rows or a JSON array here…"
        className="mt-3 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs"
      />
      <button
        onClick={submit}
        disabled={busy || !text.trim()}
        className="mt-3 rounded bg-indigo-600 px-6 py-2 font-semibold text-white disabled:opacity-40"
      >
        {busy ? "Importing…" : "Import"}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-bold text-green-700">✓ Imported {result.created} problem(s)</p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-red-600">
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
