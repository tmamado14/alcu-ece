"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Latex from "@/components/Latex";
import { STATUS_COLORS } from "@/components/TopicBar";

interface Problem {
  id: string;
  statement: string;
  answerType: string;
  difficulty: number;
  estimatedTime: number;
  cognitiveLevel: string;
  topic: { id: string; title: string; slug: string };
  choices: { label: string; text: string }[];
  hints: string[];
  tags: string[];
  bookmarked: boolean;
  hasSolution: boolean;
}

interface Outcome {
  correct: boolean;
  finalized: boolean;
  result?: string;
  attemptId: string;
  xpAwarded: number;
  ratingDelta: number;
  newRating?: number;
  topicStatus?: string;
  solution?: string;
  explanation?: string;
  correctAnswerDisplay?: string;
  newBadges: { code: string; title: string; icon: string }[];
  newAchievements: { code: string; title: string; icon: string }[];
  completedQuests: { code: string; title: string; xpReward: number }[];
}

type Phase = "loading" | "answering" | "second_try" | "done" | "empty";

function PracticeInner() {
  const params = useSearchParams();
  const topicId = params.get("topicId");
  const mode = (params.get("mode") ?? "adaptive") as "adaptive" | "drill" | "review";
  const [preference, setPreference] = useState(params.get("pref") ?? "normal");

  const [problem, setProblem] = useState<Problem | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [answer, setAnswer] = useState("");
  const [attemptId, setAttemptId] = useState<string | undefined>();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const startTime = useRef(Date.now());

  const loadNext = useCallback(async () => {
    setPhase("loading");
    setAnswer("");
    setAttemptId(undefined);
    setOutcome(null);
    setFeedback(null);
    setHintsShown(0);
    setError(null);
    setReportOpen(false);
    setNeedsReview(false);
    try {
      const res = await fetch("/api/practice/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, mode, preference }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load problem");
      const data = await res.json();
      if (!data.problem) {
        setProblem(null);
        setPhase("empty");
        return;
      }
      setProblem(data.problem);
      setBookmarked(data.problem.bookmarked);
      startTime.current = Date.now();
      setPhase("answering");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("empty");
    }
  }, [topicId, mode, preference]);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  async function submit() {
    if (!problem || !answer.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          attemptId,
          answer,
          mode,
          timeSpentSec: Math.min(14400, Math.round((Date.now() - startTime.current) / 1000)),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Submit failed");
      const data: Outcome = await res.json();
      setAttemptId(data.attemptId);
      if (!data.finalized) {
        setPhase("second_try");
        setFeedback("Not quite — take another look. You have one more try.");
        setAnswer("");
      } else {
        setOutcome(data);
        setPhase("done");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGiveUp() {
    if (!problem || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/practice/giveup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          attemptId,
          mode,
          timeSpentSec: Math.round((Date.now() - startTime.current) / 1000),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const data: Outcome = await res.json();
      setOutcome(data);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleFlag(kind: "bookmark" | "needs_review") {
    if (!problem) return;
    const res = await fetch(`/api/problems/${problem.id}/bookmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    if (res.ok) {
      const { active } = await res.json();
      if (kind === "bookmark") setBookmarked(active);
      else setNeedsReview(active);
    }
  }

  async function sendReport() {
    if (!problem || reportMsg.trim().length < 3) return;
    await fetch(`/api/problems/${problem.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reportMsg }),
    });
    setReportOpen(false);
    setReportMsg("");
  }

  if (phase === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-lg text-ink-faint">Selecting your next problem…</div>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="card fade-up mx-auto mt-16 max-w-md p-8 text-center">
        <p className="text-3xl" aria-hidden>🎉</p>
        <h2 className="mt-2 text-xl font-bold text-ink">
          {error ? "Something went wrong" : "Nothing to practice here"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {error ??
            (mode === "review"
              ? "No missed problems to review — nice work. Try adaptive practice instead."
              : "No problems available for this selection. Try another topic or mode.")}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <a href="/subjects" className="btn-primary">
            Choose a topic
          </a>
          {error && (
            <button onClick={loadNext} className="btn-secondary">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!problem) return null;

  const statusColor = outcome?.topicStatus ? STATUS_COLORS[outcome.topicStatus] : null;

  return (
    <div className="fade-up mx-auto max-w-3xl">
      {/* first-solve overlay: submit is waiting on the LLM writing the solution */}
      {busy && !problem.hasSolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-4 rounded-(--radius-card) bg-surface px-6 py-5 shadow-(--shadow-pop)">
            <div className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            <div>
              <p className="font-semibold text-ink">Generating worked solution…</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                You&apos;re the first to finish this question — hang tight a few seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* header */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="chip-brand">{problem.topic.title}</span>
        <span className="chip-neutral">Difficulty {problem.difficulty}/10</span>
        <span className="chip-neutral capitalize">{problem.cognitiveLevel}</span>
        <span className="chip-neutral capitalize">{mode} mode</span>
        <select
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
          className="input ml-auto w-auto px-2 py-1 text-xs"
          title="Difficulty preference"
        >
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
          <option value="challenge">Challenge</option>
        </select>
      </div>

      {/* problem card */}
      <div className="card mt-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-none text-[15px] leading-relaxed text-ink">
            <Latex>{problem.statement}</Latex>
          </div>
          <div className="flex shrink-0 flex-col gap-1 text-lg">
            <button
              onClick={() => toggleFlag("bookmark")}
              title="Bookmark"
              aria-pressed={bookmarked}
              className={`cursor-pointer transition ${bookmarked ? "opacity-100" : "opacity-30 hover:opacity-70"}`}
            >
              🔖
            </button>
            <button
              onClick={() => toggleFlag("needs_review")}
              title="I need review"
              aria-pressed={needsReview}
              className={`cursor-pointer transition ${needsReview ? "opacity-100" : "opacity-30 hover:opacity-70"}`}
            >
              📌
            </button>
            <button
              onClick={() => setReportOpen((v) => !v)}
              title="Report an issue"
              className="cursor-pointer opacity-30 transition hover:opacity-70"
            >
              🚩
            </button>
          </div>
        </div>

        {reportOpen && (
          <div className="callout-warning mt-3">
            <textarea
              value={reportMsg}
              onChange={(e) => setReportMsg(e.target.value)}
              placeholder="What's wrong with this question?"
              className="input text-sm"
              rows={2}
            />
            <button onClick={sendReport} className="btn-secondary btn-sm mt-2">
              Send report
            </button>
          </div>
        )}

        {/* answer area */}
        {phase !== "done" && (
          <div className="mt-6">
            {problem.answerType.startsWith("multiple_choice") ? (
              <div className="space-y-2">
                {problem.choices.map((c) => (
                  <label
                    key={c.label}
                    className={`flex cursor-pointer items-start gap-3 rounded-(--radius-control) border p-3.5 transition ${
                      answer === c.label
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-300"
                        : "border-line hover:border-line-strong hover:bg-sunken"
                    }`}
                  >
                    <input
                      type="radio"
                      name="choice"
                      checked={answer === c.label}
                      onChange={() => setAnswer(c.label)}
                      className="mt-1 accent-brand-600"
                    />
                    <span className="font-semibold text-ink">{c.label}.</span>
                    <span className="text-ink"><Latex>{c.text}</Latex></span>
                  </label>
                ))}
              </div>
            ) : problem.answerType === "true_false" ? (
              <div className="flex gap-3">
                {["True", "False"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAnswer(v)}
                    aria-pressed={answer === v}
                    className={`cursor-pointer rounded-(--radius-control) border px-8 py-2.5 font-semibold transition ${
                      answer === v
                        ? "border-brand-500 bg-brand-50 text-brand-800 ring-1 ring-brand-300"
                        : "border-line-strong text-ink-muted hover:bg-sunken"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            ) : (
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={
                  problem.answerType === "numerical_tolerance"
                    ? "Numeric answer (fractions, pi, and 1.5e3 accepted)"
                    : problem.answerType === "algebraic_expression"
                      ? "Expression, e.g. 2/(s+3)"
                      : "Your answer"
                }
                className="input px-4 py-3 font-mono"
                autoFocus
              />
            )}

            {feedback && phase === "second_try" && (
              <p className="callout-warning mt-3 font-medium">{feedback}</p>
            )}
            {error && <p className="mt-3 text-sm font-medium text-red-700">{error}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button onClick={submit} disabled={busy || !answer.trim()} className="btn-primary btn-lg py-2.5">
                {busy ? "Checking…" : phase === "second_try" ? "Submit (last try)" : "Submit"}
              </button>
              <button onClick={handleGiveUp} disabled={busy} className="btn-secondary py-2.5">
                Give up
              </button>
              {problem.hints.length > hintsShown && (
                <button
                  onClick={() => setHintsShown((n) => n + 1)}
                  className="link ml-auto cursor-pointer text-sm"
                >
                  💡 Hint ({problem.hints.length - hintsShown} left)
                </button>
              )}
            </div>

            {hintsShown > 0 && (
              <div className="mt-3 space-y-2">
                {problem.hints.slice(0, hintsShown).map((h, i) => (
                  <p key={i} className="callout-warning fade-up">
                    <Latex>{h}</Latex>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* outcome + solution */}
        {phase === "done" && outcome && (
          <div className="fade-up mt-6">
            <div
              className={`relative rounded-(--radius-control) border px-4 py-3 font-semibold ${
                outcome.correct
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {outcome.result === "correct_first" && "✅ Correct on the first try!"}
              {outcome.result === "correct_second" && "✅ Correct on the second try."}
              {outcome.result === "wrong" && "❌ Not quite. Study the solution below."}
              {outcome.result === "gave_up" && "🏳️ Revealed. Read the solution carefully."}
              {outcome.xpAwarded > 0 && (
                <span className="xp-pop absolute -top-2 right-4 text-lg font-extrabold text-brand-600">
                  +{outcome.xpAwarded} XP
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="chip-neutral">
                Topic rating {outcome.newRating}{" "}
                <span className={outcome.ratingDelta >= 0 ? "text-green-700" : "text-red-700"}>
                  ({outcome.ratingDelta >= 0 ? "+" : ""}
                  {outcome.ratingDelta})
                </span>
              </span>
              {statusColor && (
                <span className={`chip-neutral ${statusColor.text}`}>{statusColor.label}</span>
              )}
            </div>

            {(outcome.newBadges.length > 0 ||
              outcome.newAchievements.length > 0 ||
              outcome.completedQuests.length > 0) && (
              <div className="mt-3 space-y-2">
                {outcome.newBadges.map((b) => (
                  <p key={b.code} className="callout-warning font-semibold">
                    {b.icon} Badge earned: {b.title}
                  </p>
                ))}
                {outcome.newAchievements.map((a) => (
                  <p key={a.code} className="callout-info font-semibold">
                    {a.icon} Achievement unlocked: {a.title}
                  </p>
                ))}
                {outcome.completedQuests.map((q) => (
                  <p key={q.code} className="callout-success font-semibold">
                    🗺️ Quest complete: {q.title} (+{q.xpReward} XP)
                  </p>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-(--radius-control) border border-line bg-sunken p-5">
              <p className="eyebrow">Correct answer</p>
              <p className="mt-1 font-mono text-lg text-ink">
                <Latex>{outcome.correctAnswerDisplay ?? ""}</Latex>
              </p>
              <p className="eyebrow mt-5">Solution</p>
              <div className="mt-1 text-[15px] leading-relaxed text-ink">
                <Latex>{outcome.solution ?? ""}</Latex>
              </div>
              {outcome.explanation && (
                <div className="mt-3 text-sm leading-relaxed text-ink-muted">
                  <Latex>{outcome.explanation}</Latex>
                </div>
              )}
            </div>

            <button onClick={loadNext} className="btn-primary btn-lg mt-5 w-full">
              Next problem →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink-faint">Loading…</div>}>
      <PracticeInner />
    </Suspense>
  );
}
