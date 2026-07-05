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

  if (error) return <p className="mt-8 text-red-600">{error}</p>;

  const openReports = (reports ?? []).filter((r) => r.status === "open");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Question bank</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/problems/new" className="rounded bg-indigo-600 px-3 py-1.5 font-semibold text-white">
            + New problem
          </Link>
          <Link href="/admin/topics" className="rounded border border-slate-300 px-3 py-1.5 font-semibold">
            Topics
          </Link>
          <Link href="/admin/import" className="rounded border border-slate-300 px-3 py-1.5 font-semibold">
            Import
          </Link>
          <a href="/api/admin/export?format=json" className="rounded border border-slate-300 px-3 py-1.5 font-semibold">
            Export JSON
          </a>
          <a href="/api/admin/export?format=csv" className="rounded border border-slate-300 px-3 py-1.5 font-semibold">
            Export CSV
          </a>
        </div>
      </div>

      {openReports.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-bold text-amber-900">🚩 Open question reports ({openReports.length})</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {openReports.map((r) => (
              <li key={r.id} className="rounded bg-white p-3">
                <p className="text-slate-700">&ldquo;{r.message}&rdquo; — <i>{r.reportedBy}</i></p>
                <p className="mt-1 text-xs text-slate-400">{r.statement}…</p>
                <div className="mt-2 flex gap-2 text-xs">
                  <Link href={`/admin/problems/${r.problemId}`} className="font-semibold text-indigo-600">
                    Edit problem
                  </Link>
                  <button onClick={() => resolveReport(r.id, "resolved")} className="text-green-700">
                    Mark resolved
                  </button>
                  <button onClick={() => resolveReport(r.id, "dismissed")} className="text-slate-500">
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search statements…"
          className="w-64 rounded border border-slate-300 px-3 py-1.5"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="reviewed">Reviewed</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {!problems ? (
        <p className="mt-8 animate-pulse text-slate-400">Loading problems…</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Statement</th>
                <th className="px-3 py-2">Topic</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Diff</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {problems.map((p) => (
                <tr key={p.id} className="hover:bg-indigo-50/40">
                  <td className="max-w-xs px-3 py-2">
                    <Link href={`/admin/problems/${p.id}`} className="font-medium text-indigo-700 hover:underline">
                      {p.statement}…
                    </Link>
                    {p.reportCount > 0 && <span className="ml-1 text-red-600">🚩{p.reportCount}</span>}
                  </td>
                  <td className="px-3 py-2">{p.topic.title}</td>
                  <td className="px-3 py-2 text-xs">{p.answerType.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">{p.difficulty}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                      p.status === "active" ? "bg-green-100 text-green-700" :
                      p.status === "archived" ? "bg-slate-100 text-slate-500" : "bg-yellow-100 text-yellow-700"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-3 py-2">{p.attemptCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {problems.length === 0 && <p className="p-8 text-center text-slate-400">No problems match.</p>}
        </div>
      )}
    </div>
  );
}
