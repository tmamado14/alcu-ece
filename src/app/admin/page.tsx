"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface ProblemRow {
  id: string;
  statement: string;
  topic: { id: string; title: string };
  answerType: string;
  difficulty: number;
  status: string;
  tags: string[];
  attemptCount: number;
  reportCount: number;
}

interface ReportRow {
  id: string;
  problemId: string;
  statement: string;
  message: string;
  status: string;
  reportedBy: string;
  createdAt: string;
}

const STATUS_CHIP: Record<string, string> = {
  active: "chip-success",
  archived: "chip-neutral",
  draft: "chip-warning",
  reviewed: "chip-warning",
};

export default function AdminPage() {
  const [problems, setProblems] = useState<ProblemRow[] | null>(null);
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (status) qs.set("status", status);
    const [pr, rr] = await Promise.all([
      fetch(`/api/admin/problems?${qs}`),
      fetch("/api/admin/reports"),
    ]);
    if (!pr.ok) {
      setError((await pr.json()).error ?? "Failed (are you logged in as admin?)");
      return;
    }
    setProblems(await pr.json());
    if (rr.ok) setReports(await rr.json());
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function resolveReport(id: string, newStatus: string) {
    await fetch("/api/admin/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    load();
  }

  if (error) return <p className="error-text">{error}</p>;

  const openReports = (reports ?? []).filter((r) => r.status === "open");

  return (
    <div className="fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Question bank</h1>
          <p className="page-sub">Manage problems, topics, imports, and learner reports.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/problems/new" className="btn-primary btn-sm">
            + New problem
          </Link>
          <Link href="/admin/generate" className="btn-secondary btn-sm">
            ✨ AI writer
          </Link>
          <Link href="/admin/topics" className="btn-secondary btn-sm">
            Topics
          </Link>
          <Link href="/admin/import" className="btn-secondary btn-sm">
            Import
          </Link>
          <a href="/api/admin/export?format=json" className="btn-secondary btn-sm">
            Export JSON
          </a>
          <a href="/api/admin/export?format=csv" className="btn-secondary btn-sm">
            Export CSV
          </a>
        </div>
      </div>

      {openReports.length > 0 && (
        <div className="callout-warning mt-5">
          <h2 className="font-semibold">🚩 Open question reports ({openReports.length})</h2>
          <ul className="mt-2 space-y-2">
            {openReports.map((r) => (
              <li key={r.id} className="rounded-(--radius-control) border border-line bg-surface p-3">
                <p className="text-ink">&ldquo;{r.message}&rdquo; — <i className="text-ink-muted">{r.reportedBy}</i></p>
                <p className="mt-1 text-xs text-ink-faint">{r.statement}…</p>
                <div className="mt-2 flex gap-3 text-xs">
                  <Link href={`/admin/problems/${r.problemId}`} className="link text-xs">
                    Edit problem
                  </Link>
                  <button
                    onClick={() => resolveReport(r.id, "resolved")}
                    className="cursor-pointer font-semibold text-green-700 hover:underline"
                  >
                    Mark resolved
                  </button>
                  <button
                    onClick={() => resolveReport(r.id, "dismissed")}
                    className="cursor-pointer font-semibold text-ink-faint hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search statements…"
          className="input w-64 py-1.5"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-auto py-1.5">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="reviewed">Reviewed</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {!problems ? (
        <p className="loading-text">Loading problems…</p>
      ) : (
        <div className="table-wrap mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Statement</th>
                <th>Topic</th>
                <th>Type</th>
                <th>Diff</th>
                <th>Status</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id} className="transition hover:bg-brand-50/40">
                  <td className="max-w-xs">
                    <Link href={`/admin/problems/${p.id}`} className="font-medium text-brand-700 underline-offset-2 hover:underline">
                      {p.statement}…
                    </Link>
                    {p.reportCount > 0 && <span className="ml-1 text-red-600">🚩{p.reportCount}</span>}
                  </td>
                  <td>{p.topic.title}</td>
                  <td className="text-xs">{p.answerType.replace(/_/g, " ")}</td>
                  <td>{p.difficulty}</td>
                  <td>
                    <span className={STATUS_CHIP[p.status] ?? "chip-neutral"}>{p.status}</span>
                  </td>
                  <td>{p.attemptCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {problems.length === 0 && <p className="p-8 text-center text-ink-faint">No problems match.</p>}
        </div>
      )}
    </div>
  );
}
