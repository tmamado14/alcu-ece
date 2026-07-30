"use client";

import { useCallback, useEffect, useState } from "react";

interface Invite {
  id: string;
  code: string;
  label: string;
  maxUses: number;
  uses: number;
  expiresAt: string | null;
  revoked: boolean;
  usable: boolean;
  createdAt: string;
  redeemedBy: { username: string; name: string }[];
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState<number | "">(30);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/invites");
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to load (admin only)");
      return;
    }
    setInvites(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        maxUses,
        expiresInDays: expiresInDays === "" ? null : expiresInDays,
      }),
    });
    if (!res.ok) {
      setMsg((await res.json()).error ?? "Failed");
      return;
    }
    const invite: Invite = await res.json();
    setLabel("");
    setMsg(`Invite ${invite.code} created ✓`);
    load();
  }

  async function toggleRevoked(invite: Invite) {
    const res = await fetch("/api/admin/invites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: invite.id, revoked: !invite.revoked }),
    });
    if (!res.ok) {
      setMsg((await res.json()).error ?? "Failed");
      return;
    }
    load();
  }

  async function copyLink(code: string) {
    const url = `${window.location.origin}/signup?code=${encodeURIComponent(code)}`;
    await navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="fade-up">
      <h1 className="page-title">Invite codes</h1>
      <p className="page-sub">
        Signup is invite-only. Issue a code, then send the signup link to whoever should get an
        account — each person gets their own progress, ratings, and badges.
      </p>
      {msg && <p className="callout-info mt-3">{msg}</p>}

      <form onSubmit={create} className="card mt-6 p-5 text-sm">
        <h2 className="section-title">Issue a code</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-4 sm:items-end">
          <label className="block sm:col-span-2">
            <span className="label">Label (for your reference)</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. ECE 3A study group"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Max uses</span>
            <input
              type="number"
              min={1}
              max={200}
              value={maxUses}
              onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 1)}
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Expires in (days)</span>
            <input
              type="number"
              min={1}
              max={365}
              value={expiresInDays}
              onChange={(e) => {
                const v = e.target.value;
                setExpiresInDays(v === "" ? "" : parseInt(v, 10) || 1);
              }}
              placeholder="never"
              className="input"
            />
          </label>
        </div>
        <button className="btn-primary mt-4">Create invite</button>
      </form>

      {!invites ? (
        <p className="loading-text">Loading invites…</p>
      ) : invites.length === 0 ? (
        <p className="callout-info mt-6 text-sm">
          No invites yet. Issue one above to let someone create an account.
        </p>
      ) : (
        <div className="table-wrap mt-6">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Label</th>
                <th>Uses</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Redeemed by</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invites.map((i) => (
                <tr key={i.id}>
                  <td className="font-mono text-xs tracking-wider">{i.code}</td>
                  <td className="text-ink-muted">{i.label || "—"}</td>
                  <td>{i.uses} / {i.maxUses}</td>
                  <td className="text-ink-faint">
                    {i.expiresAt ? new Date(i.expiresAt).toLocaleDateString() : "never"}
                  </td>
                  <td>
                    {i.revoked ? (
                      <span className="chip-danger">revoked</span>
                    ) : i.usable ? (
                      <span className="chip-success">usable</span>
                    ) : (
                      <span className="chip-neutral">used up</span>
                    )}
                  </td>
                  <td className="text-xs text-ink-muted">
                    {i.redeemedBy.length > 0
                      ? i.redeemedBy.map((u) => u.username).join(", ")
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <button onClick={() => copyLink(i.code)} className="link text-xs">
                      {copied === i.code ? "Copied ✓" : "Copy link"}
                    </button>
                    <button onClick={() => toggleRevoked(i)} className="link ml-3 text-xs">
                      {i.revoked ? "Restore" : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
