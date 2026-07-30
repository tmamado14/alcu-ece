"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  // Shareable link form: /signup?code=ABCD-EFGH-JKMN
  const [code, setCode] = useState(params.get("code") ?? "");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("The two passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, username, name, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Sign up failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="card fade-up mx-auto mt-16 max-w-sm p-8">
      <h1 className="page-title">Create your account</h1>
      <p className="page-sub">
        ECE Mastery is invite-only. Enter the code you were given to get your own progress,
        ratings, and badges.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="code" className="label">Invite code</label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="input font-mono tracking-wider"
            placeholder="ABCD-EFGH-JKMN"
            autoFocus={!params.get("code")}
          />
        </div>
        <div>
          <label htmlFor="name" className="label">Your name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="username" className="label">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            autoComplete="username"
          />
          <p className="mt-1 text-xs text-ink-faint">Letters, numbers, dot, dash, underscore.</p>
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-ink-faint">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            autoComplete="new-password"
          />
        </div>
        {error && <p className="callout-danger">{error}</p>}
        <button disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-muted">
        Already have an account? <Link href="/login" className="link">Log in</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="loading-text">Loading…</p>}>
      <SignupInner />
    </Suspense>
  );
}
