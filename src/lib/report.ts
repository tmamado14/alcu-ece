// Report arithmetic: pure, so the subject report, the topic drill-down and the
// tests all agree on what "percent" or "progress score" means.

export interface AttemptTotals {
  problems: number;
  correct: number;
  incorrect: number;
  gaveUp: number;
  /** First-try correct out of `problems`, rounded to one decimal. */
  percent: number;
}

/** Map a topic rating onto a 0–100 progress score (mastery+100 ≙ 100). */
export function progressScore(rating: number, masteryThreshold: number): number {
  const min = 900;
  const max = masteryThreshold + 100;
  if (max <= min) return rating >= max ? 100 : 0;
  return Math.round(Math.min(100, Math.max(0, ((rating - min) / (max - min)) * 100)));
}

/**
 * Headline counts over a set of finalized attempt results. "Correct" counts
 * both tries; a pending attempt is not an outcome and is ignored.
 */
export function attemptTotals(results: string[]): AttemptTotals {
  const finalized = results.filter((r) => r !== "pending");
  const correct = finalized.filter((r) => r === "correct_first" || r === "correct_second").length;
  return {
    problems: finalized.length,
    correct,
    incorrect: finalized.filter((r) => r === "wrong").length,
    gaveUp: finalized.filter((r) => r === "gave_up").length,
    percent: finalized.length > 0 ? Math.round((correct / finalized.length) * 1000) / 10 : 0,
  };
}

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  learning: "In progress",
  passed: "Passed",
  mastered: "Mastered",
  needs_review: "Needs review",
};

/** Learner-facing name for a `LearnerTopicProgress.status` value. */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
