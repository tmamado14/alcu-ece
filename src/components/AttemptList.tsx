"use client";

// The report's list of answered questions: one expandable card per attempt,
// showing the outcome, when it happened, and the worked solution on demand.
// Shared by the subject-wide list and the per-topic drill-down.

import { useState } from "react";
import Latex from "@/components/Latex";

export interface AttemptCard {
  attemptId: string;
  problemId: string;
  statement: string;
  difficulty: number;
  result: string;
  at: string;
}

interface ProblemDetail {
  statement: string;
  solution: string;
  correctAnswerDisplay: string;
}

const RESULT_FACE: Record<string, { icon: string; label: string }> = {
  correct_first: { icon: "😄", label: "Correct (first try)" },
  correct_second: { icon: "🙂", label: "Correct (second try)" },
  wrong: { icon: "🙁", label: "Incorrect" },
  gave_up: { icon: "🏳️", label: "Gave up" },
};

export default function AttemptList({ attempts }: { attempts: AttemptCard[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProblemDetail | null>(null);

  async function toggle(attemptId: string, problemId: string) {
    if (open === attemptId) {
      setOpen(null);
      setDetail(null);
      return;
    }
    setOpen(attemptId);
    setDetail(null);
    const res = await fetch(`/api/problems/${problemId}`);
    if (res.ok) setDetail(await res.json());
  }

  return (
    <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto pr-2">
      {attempts.map((p) => {
        const face = RESULT_FACE[p.result] ?? RESULT_FACE.wrong;
        return (
          <div key={p.attemptId} className="border border-line bg-sunken/60">
            <button
              onClick={() => toggle(p.attemptId, p.problemId)}
              aria-expanded={open === p.attemptId}
              className="w-full cursor-pointer p-3 text-left transition hover:bg-sunken"
            >
              <p className="flex items-center gap-2 text-xs text-ink-faint">
                <span title={face.label} className="text-base" aria-label={face.label}>{face.icon}</span>
                <span>{new Date(p.at).toLocaleString()}</span>
                <span className="tnum ml-auto">diff {p.difficulty}/10</span>
              </p>
              <div className="mt-1 text-[15px] leading-relaxed text-ink">
                <Latex>{p.statement}</Latex>
              </div>
            </button>
            {open === p.attemptId && (
              <div className="fade-up border-t border-line p-3 text-sm">
                {!detail ? (
                  <p className="animate-pulse text-ink-faint">Loading solution…</p>
                ) : (
                  <>
                    <p className="font-semibold text-ink">
                      Answer: <span className="font-mono"><Latex>{detail.correctAnswerDisplay}</Latex></span>
                    </p>
                    <div className="mt-2 border border-line bg-surface p-3 leading-relaxed">
                      <Latex>{detail.solution}</Latex>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
