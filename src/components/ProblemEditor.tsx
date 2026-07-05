"use client";

// Admin problem editor with live LaTeX preview.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Latex from "@/components/Latex";

interface TopicOption {
  id: string;
  title: string;
  subject: string;
  parent: string | null;
  isLeaf: boolean;
}

export interface EditorValue {
  topicId: string;
  statement: string;
  answerType: string;
  answerData: Record<string, unknown>;
  choices: { label: string; text: string }[];
  cognitiveLevel: string;
  difficulty: number;
  estimatedTime: number;
  hints: string[];
  solution: string;
  explanation: string;
  reference: string;
  tags: string[];
  status: string;
}

const EMPTY: EditorValue = {
  topicId: "",
  statement: "",
  answerType: "multiple_choice_single",
  answerData: { correct: "A" },
  choices: [
    { label: "A", text: "" },
    { label: "B", text: "" },
    { label: "C", text: "" },
    { label: "D", text: "" },
  ],
  cognitiveLevel: "application",
  difficulty: 5,
  estimatedTime: 120,
  hints: [],
  solution: "",
  explanation: "",
  reference: "",
  tags: [],
  status: "draft",
};

export default function ProblemEditor({ problemId }: { problemId?: string }) {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [v, setV] = useState<EditorValue>(EMPTY);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!problemId);

  useEffect(() => {
    fetch("/api/admin/topics").then(async (r) => {
      if (r.ok) setTopics(((await r.json()) as TopicOption[]).filter((t) => t.isLeaf));
    });
    if (problemId) {
      fetch(`/api/admin/problems/${problemId}`).then(async (r) => {
        if (r.ok) {
          const p = await r.json();
          setV({ ...EMPTY, ...p, choices: p.choices?.length ? p.choices : EMPTY.choices });
          setLoaded(true);
        } else setError("Failed to load problem");
      });
    }
  }, [problemId]);

  function set<K extends keyof EditorValue>(key: K, value: EditorValue[K]) {
    setV((old) => ({ ...old, [key]: value }));
  }

  function setAnswerType(t: string) {
    const defaults: Record<string, Record<string, unknown>> = {
      multiple_choice_single: { correct: "A" },
      numerical_tolerance: { value: 0, toleranceRel: 0.01 },
      text_short: { accepted: [] },
      algebraic_expression: { accepted: [] },
      true_false: { correct: true },
    };
    setV((old) => ({ ...old, answerType: t, answerData: defaults[t] ?? {} }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const body = {
      ...v,
      choices: v.answerType.startsWith("multiple_choice")
        ? v.choices.filter((c) => c.text.trim() !== "")
        : undefined,
    };
    const res = await fetch(problemId ? `/api/admin/problems/${problemId}` : "/api/admin/problems", {
      method: problemId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Save failed");
      return;
    }
    router.push("/admin");
  }

  if (!loaded) return <p className="mt-8 animate-pulse text-slate-400">Loading…</p>;

  const answerData = v.answerData as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{problemId ? "Edit problem" : "New problem"}</h1>
        <button onClick={() => setPreview((p) => !p)} className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold">
          {preview ? "✏️ Edit" : "👁 Preview as learner"}
        </button>
      </div>

      {preview ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            Difficulty {v.difficulty}/10
          </span>
          <div className="mt-4 leading-relaxed"><Latex>{v.statement || "*empty statement*"}</Latex></div>
          {v.answerType.startsWith("multiple_choice") && (
            <div className="mt-4 space-y-2">
              {v.choices.filter((c) => c.text).map((c) => (
                <div key={c.label} className={`rounded-lg border p-3 ${
                  c.label === answerData.correct ? "border-green-400 bg-green-50" : "border-slate-200"
                }`}>
                  <b>{c.label}.</b> <Latex>{c.text}</Latex>
                </div>
              ))}
            </div>
          )}
          {v.solution && (
            <div className="mt-4 rounded bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">SOLUTION</p>
              <div className="mt-1 leading-relaxed"><Latex>{v.solution}</Latex></div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-semibold">Topic</span>
              <select value={v.topicId} onChange={(e) => set("topicId", e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-2">
                <option value="">— select topic —</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.subject} / {t.parent} / {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-semibold">Answer type</span>
              <select value={v.answerType} onChange={(e) => setAnswerType(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-2">
                <option value="multiple_choice_single">Multiple choice (single)</option>
                <option value="numerical_tolerance">Numerical (tolerance)</option>
                <option value="text_short">Short text</option>
                <option value="algebraic_expression">Algebraic expression</option>
                <option value="true_false">True / False</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="font-semibold">Problem statement (LaTeX via $…$ and $$…$$)</span>
            <textarea value={v.statement} onChange={(e) => set("statement", e.target.value)} rows={4} className="mt-1 w-full rounded border border-slate-300 p-2 font-mono" />
          </label>

          {v.answerType.startsWith("multiple_choice") && (
            <div className="space-y-2">
              <span className="font-semibold">Choices (mark correct)</span>
              {v.choices.map((c, i) => (
                <div key={c.label} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={answerData.correct === c.label}
                    onChange={() => set("answerData", { correct: c.label })}
                  />
                  <b>{c.label}</b>
                  <input
                    value={c.text}
                    onChange={(e) => {
                      const next = [...v.choices];
                      next[i] = { ...c, text: e.target.value };
                      set("choices", next);
                    }}
                    className="flex-1 rounded border border-slate-300 px-2 py-1.5"
                  />
                </div>
              ))}
            </div>
          )}

          {v.answerType === "numerical_tolerance" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="font-semibold">Correct value</span>
                <input
                  type="number" step="any"
                  value={String(answerData.value ?? "")}
                  onChange={(e) => set("answerData", { ...answerData, value: parseFloat(e.target.value) })}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
                />
              </label>
              <label className="block">
                <span className="font-semibold">Relative tol (e.g. 0.02)</span>
                <input
                  type="number" step="any"
                  value={String(answerData.toleranceRel ?? "")}
                  onChange={(e) => set("answerData", { ...answerData, toleranceRel: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
                />
              </label>
              <label className="block">
                <span className="font-semibold">Unit (optional)</span>
                <input
                  value={String(answerData.unit ?? "")}
                  onChange={(e) => set("answerData", { ...answerData, unit: e.target.value || undefined })}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
                />
              </label>
            </div>
          )}

          {(v.answerType === "text_short" || v.answerType === "algebraic_expression") && (
            <label className="block">
              <span className="font-semibold">Accepted answers (one per line)</span>
              <textarea
                value={((answerData.accepted as string[]) ?? []).join("\n")}
                onChange={(e) => set("answerData", { accepted: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                rows={3}
                className="mt-1 w-full rounded border border-slate-300 p-2 font-mono"
              />
            </label>
          )}

          {v.answerType === "true_false" && (
            <label className="block">
              <span className="font-semibold">Correct answer</span>
              <select
                value={String(answerData.correct)}
                onChange={(e) => set("answerData", { correct: e.target.value === "true" })}
                className="mt-1 rounded border border-slate-300 px-2 py-1.5"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-4">
            <label className="block">
              <span className="font-semibold">Difficulty (1–10)</span>
              <input type="number" min={1} max={10} value={v.difficulty} onChange={(e) => set("difficulty", parseInt(e.target.value, 10) || 5)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="font-semibold">Cognitive level</span>
              <select value={v.cognitiveLevel} onChange={(e) => set("cognitiveLevel", e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5">
                {["recall", "comprehension", "application", "analysis", "synthesis"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-semibold">Est. time (s)</span>
              <input type="number" value={v.estimatedTime} onChange={(e) => set("estimatedTime", parseInt(e.target.value, 10) || 120)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="font-semibold">Status</span>
              <select value={v.status} onChange={(e) => set("status", e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5">
                {["draft", "reviewed", "active", "archived"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="font-semibold">Hints (one per line)</span>
            <textarea value={v.hints.join("\n")} onChange={(e) => set("hints", e.target.value.split("\n").filter((s) => s.trim()))} rows={2} className="mt-1 w-full rounded border border-slate-300 p-2" />
          </label>

          <label className="block">
            <span className="font-semibold">Full solution (LaTeX + **bold** supported)</span>
            <textarea value={v.solution} onChange={(e) => set("solution", e.target.value)} rows={5} className="mt-1 w-full rounded border border-slate-300 p-2 font-mono" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-semibold">Tags (comma-separated)</span>
              <input value={v.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="block">
              <span className="font-semibold">Reference</span>
              <input value={v.reference} onChange={(e) => set("reference", e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
            </label>
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving || !v.topicId || !v.statement} className="rounded bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
              {saving ? "Saving…" : "Save problem"}
            </button>
            {problemId && (
              <button
                onClick={async () => {
                  if (!confirm("Archive this problem? It will stop appearing in practice.")) return;
                  await fetch(`/api/admin/problems/${problemId}`, { method: "DELETE" });
                  router.push("/admin");
                }}
                className="rounded border border-red-300 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
              >
                Archive
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
