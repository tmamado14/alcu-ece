// Original, transparent adaptive engine.
// Ratings are Elo-like: learner topic rating vs. problem difficulty rating.
// Problem difficulty 1..10 maps to a rating scale of 900..1500.

export type AttemptResult = "correct_first" | "correct_second" | "wrong" | "gave_up";
export type TopicStatus = "not_started" | "learning" | "passed" | "mastered" | "needs_review";

export interface TopicProgressState {
  rating: number;
  confidence: number; // 0..1
  problemsSeen: number;
  correctFirstTry: number;
  correctSecondTry: number;
  wrong: number;
  gaveUp: number;
  streak: number;
  status: TopicStatus;
}

export const DEFAULT_PROGRESS: TopicProgressState = {
  rating: 1000,
  confidence: 0,
  problemsSeen: 0,
  correctFirstTry: 0,
  correctSecondTry: 0,
  wrong: 0,
  gaveUp: 0,
  streak: 0,
  status: "not_started",
};

/** Map problem difficulty (1..10) to the rating scale. */
export function difficultyToRating(difficulty: number): number {
  const d = Math.min(10, Math.max(1, difficulty));
  return 900 + (d - 1) * (600 / 9); // 900..1500
}

/** Elo expected score of the learner against a problem. */
export function expectedScore(learnerRating: number, problemRating: number): number {
  return 1 / (1 + Math.pow(10, (problemRating - learnerRating) / 400));
}

/**
 * Rating update. K shrinks as confidence grows so early answers move the
 * bar quickly and later answers refine it.
 */
export function updateRating(
  state: TopicProgressState,
  result: AttemptResult,
  problemDifficulty: number
): { newRating: number; delta: number } {
  const problemRating = difficultyToRating(problemDifficulty);
  const exp = expectedScore(state.rating, problemRating);
  const K = 60 - 35 * state.confidence; // 60 → 25 as confidence grows

  // Actual score by outcome. Second-try success is worth partial credit;
  // giving up is penalized less than answering wrong twice.
  const actual =
    result === "correct_first" ? 1 :
    result === "correct_second" ? 0.6 :
    result === "gave_up" ? 0.25 :
    0;

  const delta = Math.round(K * (actual - exp));
  return { newRating: Math.round(state.rating + delta), delta };
}

/** Confidence grows with each attempt, faster for decisive outcomes. */
export function updateConfidence(state: TopicProgressState, result: AttemptResult): number {
  const gain = result === "correct_first" || result === "wrong" ? 0.12 : 0.08;
  return Math.min(1, +(state.confidence + gain).toFixed(3));
}

export function applyAttempt(
  state: TopicProgressState,
  result: AttemptResult,
  problemDifficulty: number,
  thresholds: { pass: number; mastery: number }
): TopicProgressState {
  const { newRating } = updateRating(state, result, problemDifficulty);
  const confidence = updateConfidence(state, result);
  const next: TopicProgressState = {
    ...state,
    rating: newRating,
    confidence,
    problemsSeen: state.problemsSeen + 1,
    correctFirstTry: state.correctFirstTry + (result === "correct_first" ? 1 : 0),
    correctSecondTry: state.correctSecondTry + (result === "correct_second" ? 1 : 0),
    wrong: state.wrong + (result === "wrong" ? 1 : 0),
    gaveUp: state.gaveUp + (result === "gave_up" ? 1 : 0),
    streak: result === "correct_first" || result === "correct_second" ? state.streak + 1 : 0,
  };
  next.status = computeStatus(next, thresholds);
  return next;
}

export function computeStatus(
  state: TopicProgressState,
  thresholds: { pass: number; mastery: number }
): TopicStatus {
  if (state.problemsSeen === 0) return "not_started";
  if (state.rating >= thresholds.mastery && state.confidence >= 0.6 && state.streak >= 2) return "mastered";
  if (state.rating >= thresholds.pass && state.confidence >= 0.3) return "passed";
  // a previously passed/mastered topic that has fallen below pass gets flagged
  if ((state.status === "passed" || state.status === "mastered" || state.status === "needs_review") &&
      state.rating < thresholds.pass) {
    return "needs_review";
  }
  return "learning";
}

/** Mark a topic needs_review when a spaced-review problem from it is missed. */
export function flagNeedsReview(state: TopicProgressState): TopicProgressState {
  return {
    ...state,
    confidence: Math.max(0, +(state.confidence - 0.15).toFixed(3)),
    status: state.status === "passed" || state.status === "mastered" ? "needs_review" : state.status,
  };
}

// ---------- Problem selection ----------

export type DifficultyPreference = "easy" | "normal" | "hard" | "challenge";
export type PracticeMode = "adaptive" | "drill" | "review" | "quest" | "exam";

export interface CandidateProblem {
  id: string;
  topicId: string;
  difficulty: number;
  tags: string[];
  seen: boolean;
  lastResult?: AttemptResult;
}

export interface SelectionContext {
  topicRatings: Map<string, number>; // topicId -> learner rating
  weakTags: Set<string>; // tags missed recently
  preference: DifficultyPreference;
  reviewTopicIds: Set<string>; // passed topics eligible for spaced review
  /** Extra score per topic, e.g. the current focus target. topicId -> points. */
  topicBoost?: Map<string, number>;
  rng?: () => number;
}

const PREF_OFFSET: Record<DifficultyPreference, number> = {
  easy: -100,
  normal: 0,
  hard: 100,
  challenge: 200,
};

/**
 * Score each candidate; pick weighted-randomly among the top scorers so
 * practice does not feel deterministic. Higher score = better fit.
 */
export function scoreCandidate(p: CandidateProblem, ctx: SelectionContext): number {
  const learnerRating = ctx.topicRatings.get(p.topicId) ?? 1000;
  const target = learnerRating + PREF_OFFSET[ctx.preference];
  const problemRating = difficultyToRating(p.difficulty);

  // closeness to the learner's target band (0..100)
  const gap = Math.abs(problemRating - target);
  let score = Math.max(0, 100 - gap / 4);

  if (!p.seen) score += 30; // prefer unseen problems
  if (p.lastResult === "wrong" || p.lastResult === "gave_up") score += 20; // revisit misses
  if (p.tags.some((t) => ctx.weakTags.has(t))) score += 15; // target weak skills
  if (ctx.reviewTopicIds.has(p.topicId)) score += 10; // occasional spaced review
  score += ctx.topicBoost?.get(p.topicId) ?? 0; // focus target

  return score;
}

// ---------- Focus (learning goal) ----------

/** Score added to problems from the focus group's current target subtopic. */
export const FOCUS_TARGET_BOOST = 60;

export interface FocusSubtopic {
  id: string;
  sortOrder: number;
  status: TopicStatus;
  /** Ids of this subtopic's prerequisites (may point outside the focus group). */
  prerequisiteIds: string[];
  problemCount: number;
}

/**
 * The one subtopic a focused learner should be working on now: the earliest in
 * curriculum order that is not yet mastered and whose prerequisites *inside the
 * same focus group* are already passed. Prerequisites outside the group are
 * ignored — the learner explicitly chose this goal, so we do not block it on
 * unrelated topics.
 *
 * Falls back to the earliest unmastered subtopic when nothing is unblocked, so
 * a focus can never dead-end. Returns null once every subtopic that has
 * problems is mastered — that is the signal the goal is complete.
 */
export function pickFocusTarget(subtopics: FocusSubtopic[]): FocusSubtopic | null {
  const ordered = subtopics
    .filter((s) => s.problemCount > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const unmastered = ordered.filter((s) => s.status !== "mastered");
  if (unmastered.length === 0) return null;

  const inGroup = new Set(ordered.map((s) => s.id));
  const cleared = new Set(
    ordered.filter((s) => s.status === "passed" || s.status === "mastered").map((s) => s.id)
  );
  const unblocked = unmastered.find((s) =>
    s.prerequisiteIds.every((id) => !inGroup.has(id) || cleared.has(id))
  );
  return unblocked ?? unmastered[0];
}

export function selectProblem(candidates: CandidateProblem[], ctx: SelectionContext): CandidateProblem | null {
  if (candidates.length === 0) return null;
  const rng = ctx.rng ?? Math.random;
  const scored = candidates
    .map((p) => ({ p, score: scoreCandidate(p, ctx) }))
    .sort((a, b) => b.score - a.score);
  const pool = scored.slice(0, Math.min(5, scored.length));
  const total = pool.reduce((s, x) => s + x.score + 1, 0);
  let r = rng() * total;
  for (const x of pool) {
    r -= x.score + 1;
    if (r <= 0) return x.p;
  }
  return pool[0].p;
}
