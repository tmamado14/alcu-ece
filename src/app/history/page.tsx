"use client";

import { useCallback, useEffect, useState } from "react";
import Latex from "@/components/Latex";

interface HistoryItem {
  id: string;
  problemId: string;
  topic: { id: string; title: string };
  tags: string[];
  result: string;
  xpAwarded: number;
  ratingDelta: number;
  createdAt: string;
  answers: { tryNumber: number; submitted: string; isCorrect: boolean; at: string }[];
}

interface ProblemDetail {
  id: string;
  statement: string;
  solution: string;
  explanation: string;
  correctAnswerDisplay: string;
  choices: { label: string; text: string; isCorrect: boolean }[];
}

const RESULT_STYLE: Record<string, string> = {
  correct_first: "bg-green-100 text-green-800",
  correct_second: "bg-lime-100 text-lime-800",
  wrong: "bg-red-100 text-red-800",
  gave_up: "bg-slate-200 text-slate-600",
};

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProblemDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page) });
    if (result) qs.set("result", result);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const res = await fetch(`/api/history?${qs}`);
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to load");
      return;
    }
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
  }, [page, result, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  async function openProblem(item: HistoryItem) {
    if (open === item.id) {
      setOpen(null);
      setDetail(null);
      return;
    }
    setOpen(item.id);
    setDetail(null);
    const res = await fetch(`/api/problems/${item.problemId}`);
    if (res.ok) setDetail(await res.json());
  }

  if (error) return <p className="mt-8 text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Problem history</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col">
          <span className="text-xs text-slate-500">Result</span>
          <select value={result} onChange={(e) => { setResult(e.target.value); setPage(1); }} className="rounded border border-slate-300 px-2 py-1">
            <option value="">All</option>
            <option value="correct_first">Correct (1st try)</option>
            <option value="correct_second">Correct (2nd try)</option>
            <option value="wrong">Wrong</option>
            <option value="gave_up">Gave up</option>
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-slate-500">From</span>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="rounded border border-slate-300 px-2 py-1" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-slate-500">To</span>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="rounded border border-slate-300 px-2 py-1" />
        </label>
        <span className="ml-auto text-slate-500">{total} attempts</span>
      </div>

      {!items ? (
        <p className="mt-8 animate-pulse text-slate-400">Loading history…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No attempts match these filters yet.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((a) => (
            <div key={a.id} className="rounded-lg border border-slate-200 bg-white">
              <button onClick={() => openProblem(a)} className="flex w-full flex-wrap items-center gap-3 p-3 text-left text-sm">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${RESULT_STYLE[a.result] ?? ""}`}>
                  {a.result.replace("_", " ")}
                </span>
                <span className="font-semibold">{a.topic.title}</span>
                <span className="text-xs text-slate-400">{a.tags.join(", ")}</span>
                <span className="ml-auto text-xs text-slate-500">
                  {a.xpAwarded > 0 && <b className="text-indigo-600">+{a.xpAwarded} XP </b>}
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </button>
              {open === a.id && (
                <div className="border-t border-slate-100 p-4 text-sm">
                  {!detail ? (
                    <p className="animate-pulse text-slate-400">Loading problem…</p>
                  ) : (
                    <>
                      <div className="leading-relaxed"><Latex>{detail.statement}</Latex></div>
                      <div className="mt-3 space-y-1">
                        {a.answers.map((ans) => (
                          <p key={ans.tryNumber} className={ans.isCorrect ? "text-green-700" : "text-red-700"}>
                            Try {ans.tryNumber}: <code className="rounded bg-slate-100 px-1">{ans.submitted}</code>{" "}
                            {ans.isCorrect ? "✓" : "✗"}{" "}
                            <span className="text-xs text-slate-400">{new Date(ans.at).toLocaleTimeString()}</span>
                          </p>
                        ))}
                      </div>
                      <p className="mt-3 font-semibold">
                        Correct answer: <span className="font-mono"><Latex>{detail.correctAnswerDisplay}</Latex></span>
                      </p>
                      <div className="mt-2 rounded bg-slate-50 p-3 leading-relaxed">
                        <Latex>{detail.solution}</Latex>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 text-sm">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-30">
              ← Prev
            </button>
            <span className="text-slate-500">Page {page} of {Math.max(1, Math.ceil(total / 20))}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="rounded border border-slate-300 px-3 py-1 disabled:opacity-30">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
