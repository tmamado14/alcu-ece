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
  correct_first: "chip-success",
  correct_second: "chip-success",
  wrong: "chip-danger",
  gave_up: "chip-neutral",
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

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="fade-up">
      <h1 className="page-title">Problem history</h1>
      <p className="page-sub">Every attempt you&rsquo;ve made, with solutions one click away.</p>

      <div className="mt-5 flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-faint">Result</span>
          <select
            value={result}
            onChange={(e) => { setResult(e.target.value); setPage(1); }}
            className="input w-auto py-1.5"
          >
            <option value="">All</option>
            <option value="correct_first">Correct (1st try)</option>
            <option value="correct_second">Correct (2nd try)</option>
            <option value="wrong">Wrong</option>
            <option value="gave_up">Gave up</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-faint">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="input w-auto py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-faint">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="input w-auto py-1.5"
          />
        </label>
        <span className="ml-auto pb-1 text-ink-faint">{total} attempts</span>
      </div>

      {!items ? (
        <p className="loading-text">Loading history…</p>
      ) : items.length === 0 ? (
        <p className="card mt-5 p-8 text-center text-sm text-ink-faint">
          No attempts match these filters yet.
        </p>
      ) : (
        <div className="mt-5 space-y-2">
          {items.map((a) => (
            <div key={a.id} className="card overflow-hidden">
              <button
                onClick={() => openProblem(a)}
                aria-expanded={open === a.id}
                className="flex w-full cursor-pointer flex-wrap items-center gap-3 p-3.5 text-left text-sm transition hover:bg-sunken"
              >
                <span className={`${RESULT_STYLE[a.result] ?? "chip-neutral"} capitalize`}>
                  {a.result.replace(/_/g, " ")}
                </span>
                <span className="font-semibold text-ink">{a.topic.title}</span>
                <span className="text-xs text-ink-faint">{a.tags.join(", ")}</span>
                <span className="ml-auto text-xs text-ink-faint">
                  {a.xpAwarded > 0 && <b className="text-brand-700">+{a.xpAwarded} XP </b>}
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </button>
              {open === a.id && (
                <div className="fade-up border-t border-line bg-sunken/50 p-4 text-sm">
                  {!detail ? (
                    <p className="animate-pulse text-ink-faint">Loading problem…</p>
                  ) : (
                    <>
                      <div className="leading-relaxed text-ink"><Latex>{detail.statement}</Latex></div>
                      <div className="mt-3 space-y-1">
                        {a.answers.map((ans) => (
                          <p key={ans.tryNumber} className={ans.isCorrect ? "text-green-700" : "text-red-700"}>
                            Try {ans.tryNumber}:{" "}
                            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">{ans.submitted}</code>{" "}
                            {ans.isCorrect ? "✓" : "✗"}{" "}
                            <span className="text-xs text-ink-faint">{new Date(ans.at).toLocaleTimeString()}</span>
                          </p>
                        ))}
                      </div>
                      <p className="mt-3 font-semibold text-ink">
                        Correct answer:{" "}
                        <span className="font-mono"><Latex>{detail.correctAnswerDisplay}</Latex></span>
                      </p>
                      <div className="mt-2 rounded-(--radius-control) border border-line bg-surface p-3 leading-relaxed">
                        <Latex>{detail.solution}</Latex>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 text-sm">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary btn-sm">
              ← Prev
            </button>
            <span className="text-ink-faint">Page {page} of {Math.max(1, Math.ceil(total / 20))}</span>
            <button
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary btn-sm"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
