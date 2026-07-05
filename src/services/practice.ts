// Practice engine: problem selection, answer submission, attempt lifecycle.

import { prisma } from "@/lib/db";
import {
  applyAttempt,
  DEFAULT_PROGRESS,
  selectProblem,
  type AttemptResult,
  type CandidateProblem,
  type DifficultyPreference,
  type PracticeMode,
  type TopicProgressState,
  type TopicStatus,
} from "@/lib/adaptive";
import { gradeAnswer, type AnswerData, type AnswerType } from "@/lib/grading";
import { xpForAttempt } from "@/lib/gamification";
import { awardXP, evaluateBadges, evaluateAchievements, updateQuestProgress } from "./gamification";

const PENDING = "pending";

export interface NextProblemPayload {
  id: string;
  statement: string;
  imageUrl: string | null;
  answerType: string;
  difficulty: number;
  estimatedTime: number;
  cognitiveLevel: string;
  topic: { id: string; title: string; slug: string };
  choices: { label: string; text: string }[];
  hints: string[];
  tags: string[];
  bookmarked: boolean;
}

function toProgressState(p: {
  rating: number; confidence: number; problemsSeen: number; correctFirstTry: number;
  correctSecondTry: number; wrong: number; gaveUp: number; streak: number; status: string;
}): TopicProgressState {
  return { ...p, status: p.status as TopicStatus };
}

export async function selectNextProblem(
  userId: string,
  subjectId: string,
  topicId: string | null,
  mode: PracticeMode,
  preference: DifficultyPreference
): Promise<NextProblemPayload | null> {
  const topics = await prisma.topic.findMany({
    where: { subjectId, parentTopicId: { not: null } },
    select: { id: true },
  });
  const leafTopicIds = topicId
    ? await resolveTopicIds(topicId)
    : topics.map((t) => t.id);

  const progress = await prisma.learnerTopicProgress.findMany({ where: { userId } });
  const topicRatings = new Map(progress.map((p) => [p.topicId, p.rating]));
  const reviewTopicIds = new Set(
    progress.filter((p) => p.status === "passed" || p.status === "needs_review").map((p) => p.topicId)
  );

  const where =
    mode === "review"
      ? {
          status: "active",
          OR: [
            { attempts: { some: { userId, result: { in: ["wrong", "gave_up"] } } } },
            { bookmarks: { some: { userId, kind: "needs_review" } } },
          ],
        }
      : { topicId: { in: leafTopicIds }, status: "active" };

  const problems = await prisma.problem.findMany({
    where,
    include: {
      tags: true,
      attempts: { where: { userId }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // recent weak tags: tags on problems missed in last 30 attempts
  const recentMisses = await prisma.attempt.findMany({
    where: { userId, result: { in: ["wrong", "gave_up"] } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { problem: { include: { tags: true } } },
  });
  const weakTags = new Set(recentMisses.flatMap((a) => a.problem.tags.map((t) => t.tag)));

  const candidates: CandidateProblem[] = problems.map((p) => ({
    id: p.id,
    topicId: p.topicId,
    difficulty: p.difficulty,
    tags: p.tags.map((t) => t.tag),
    seen: p.attempts.length > 0,
    lastResult: p.attempts[0]?.result === PENDING ? undefined : (p.attempts[0]?.result as AttemptResult | undefined),
  }));

  // In drill/adaptive modes prefer unseen; if everything seen, allow repeats of misses.
  const pool =
    mode === "review"
      ? candidates
      : candidates.filter((c) => !c.seen || c.lastResult === "wrong" || c.lastResult === "gave_up");
  const finalPool = pool.length > 0 ? pool : candidates;

  const chosen = selectProblem(finalPool, {
    topicRatings,
    weakTags,
    preference,
    reviewTopicIds,
  });
  if (!chosen) return null;

  const full = await prisma.problem.findUniqueOrThrow({
    where: { id: chosen.id },
    include: {
      topic: true,
      choices: { orderBy: { sortOrder: "asc" } },
      tags: true,
      bookmarks: { where: { userId, kind: "bookmark" } },
    },
  });

  return {
    id: full.id,
    statement: full.statement,
    imageUrl: full.imageUrl,
    answerType: full.answerType,
    difficulty: full.difficulty,
    estimatedTime: full.estimatedTime,
    cognitiveLevel: full.cognitiveLevel,
    topic: { id: full.topic.id, title: full.topic.title, slug: full.topic.slug },
    choices: full.choices.map((c) => ({ label: c.label, text: c.text })),
    hints: JSON.parse(full.hints) as string[],
    tags: full.tags.map((t) => t.tag),
    bookmarked: full.bookmarks.length > 0,
  };
}

/** A parent topic id resolves to all of its leaf children; a leaf resolves to itself. */
async function resolveTopicIds(topicId: string): Promise<string[]> {
  const children = await prisma.topic.findMany({ where: { parentTopicId: topicId }, select: { id: true } });
  return children.length > 0 ? children.map((c) => c.id) : [topicId];
}

export interface SubmitOutcome {
  correct: boolean;
  finalized: boolean;
  result?: AttemptResult;
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

export async function submitAnswer(opts: {
  userId: string;
  problemId: string;
  attemptId?: string;
  answer: string;
  mode: PracticeMode;
  timeSpentSec?: number;
}): Promise<SubmitOutcome> {
  const problem = await prisma.problem.findUniqueOrThrow({
    where: { id: opts.problemId },
    include: { topic: true, tags: true },
  });
  const answerData = JSON.parse(problem.answerData) as AnswerData;
  const correct = gradeAnswer(problem.answerType as AnswerType, answerData, opts.answer);

  let attempt = opts.attemptId
    ? await prisma.attempt.findUnique({ where: { id: opts.attemptId }, include: { answers: true } })
    : null;
  if (attempt && (attempt.userId !== opts.userId || attempt.problemId !== opts.problemId)) {
    throw new Error("Attempt does not match user/problem");
  }

  const tryNumber = attempt ? attempt.answers.length + 1 : 1;
  if (tryNumber > 2) throw new Error("No tries remaining");

  if (!attempt) {
    attempt = await prisma.attempt.create({
      data: { userId: opts.userId, problemId: opts.problemId, mode: opts.mode, result: PENDING },
      include: { answers: true },
    });
  }

  await prisma.attemptAnswer.create({
    data: { attemptId: attempt.id, tryNumber, submitted: opts.answer, isCorrect: correct },
  });

  // First try wrong → not finalized; learner gets a second try.
  if (!correct && tryNumber === 1) {
    return {
      correct: false,
      finalized: false,
      attemptId: attempt.id,
      xpAwarded: 0,
      ratingDelta: 0,
      newBadges: [],
      newAchievements: [],
      completedQuests: [],
    };
  }

  const result: AttemptResult = correct
    ? tryNumber === 1 ? "correct_first" : "correct_second"
    : "wrong";

  return finalizeAttempt(opts.userId, attempt.id, problem, result, opts.timeSpentSec ?? 0);
}

export async function giveUp(opts: {
  userId: string;
  problemId: string;
  attemptId?: string;
  mode: PracticeMode;
  timeSpentSec?: number;
}): Promise<SubmitOutcome> {
  const problem = await prisma.problem.findUniqueOrThrow({
    where: { id: opts.problemId },
    include: { topic: true, tags: true },
  });
  let attemptId = opts.attemptId;
  if (!attemptId) {
    const attempt = await prisma.attempt.create({
      data: { userId: opts.userId, problemId: opts.problemId, mode: opts.mode, result: PENDING },
    });
    attemptId = attempt.id;
  }
  return finalizeAttempt(opts.userId, attemptId, problem, "gave_up", opts.timeSpentSec ?? 0);
}

type ProblemWithTopic = {
  id: string;
  difficulty: number;
  topicId: string;
  solution: string;
  explanation: string;
  answerType: string;
  answerData: string;
  topic: { passThreshold: number; masteryThreshold: number; slug: string; title: string };
  tags: { tag: string }[];
};

async function finalizeAttempt(
  userId: string,
  attemptId: string,
  problem: ProblemWithTopic,
  result: AttemptResult,
  timeSpentSec: number
): Promise<SubmitOutcome> {
  // 1) update learner-topic progress
  const existing = await prisma.learnerTopicProgress.findUnique({
    where: { userId_topicId: { userId, topicId: problem.topicId } },
  });
  const prevState = existing ? toProgressState(existing) : { ...DEFAULT_PROGRESS };
  const prevStatus = prevState.status;
  const nextState = applyAttempt(prevState, result, problem.difficulty, {
    pass: problem.topic.passThreshold,
    mastery: problem.topic.masteryThreshold,
  });
  const ratingDelta = nextState.rating - prevState.rating;

  await prisma.learnerTopicProgress.upsert({
    where: { userId_topicId: { userId, topicId: problem.topicId } },
    create: { userId, topicId: problem.topicId, ...nextState, lastPracticedAt: new Date() },
    update: { ...nextState, lastPracticedAt: new Date() },
  });

  // 2) XP for the attempt
  let xp = xpForAttempt(result, problem.difficulty);
  const xpSource =
    result === "correct_first" ? "correct_first_try" :
    result === "correct_second" ? "correct_second_try" :
    result === "gave_up" ? "gave_up" : "wrong";
  await awardXP(userId, xp, xpSource, { problemId: problem.id });

  // 3) topic transition bonuses
  if (prevStatus !== "passed" && prevStatus !== "mastered" && nextState.status === "passed") {
    await awardXP(userId, 100, "topic_passed", { topicId: problem.topicId });
    xp += 100;
  }
  if (prevStatus !== "mastered" && nextState.status === "mastered") {
    await awardXP(userId, 250, "topic_mastered", { topicId: problem.topicId });
    xp += 250;
  }
  if (prevStatus === "needs_review" && (result === "correct_first" || result === "correct_second")) {
    await awardXP(userId, 25, "weak_topic_return", { topicId: problem.topicId });
    xp += 25;
  }

  // 4) comeback: solved a problem previously missed
  const priorMiss = await prisma.attempt.findFirst({
    where: { userId, problemId: problem.id, id: { not: attemptId }, result: { in: ["wrong", "gave_up"] } },
  });
  const isComeback = !!priorMiss && (result === "correct_first" || result === "correct_second");
  if (isComeback) {
    await awardXP(userId, 20, "comeback", { problemId: problem.id });
    xp += 20;
  }

  // 5) finalize attempt row
  await prisma.attempt.update({
    where: { id: attemptId },
    data: { result, xpAwarded: xp, ratingDelta, timeSpentSec },
  });

  // 6) quests, badges, achievements
  const completedQuests = await updateQuestProgress(userId, {
    result,
    topicSlug: problem.topic.slug,
    difficulty: problem.difficulty,
    isReview: !!priorMiss,
    passedTopicNow:
      prevStatus !== "passed" && prevStatus !== "mastered" && nextState.status === "passed",
    masteredTopicNow: prevStatus !== "mastered" && nextState.status === "mastered",
  });
  const newBadges = await evaluateBadges(userId);
  const newAchievements = await evaluateAchievements(userId);

  const answerData = JSON.parse(problem.answerData) as AnswerData;

  return {
    correct: result === "correct_first" || result === "correct_second",
    finalized: true,
    result,
    attemptId,
    xpAwarded: xp,
    ratingDelta,
    newRating: nextState.rating,
    topicStatus: nextState.status,
    solution: problem.solution,
    explanation: problem.explanation,
    correctAnswerDisplay: displayAnswer(problem.answerType as AnswerType, answerData),
    newBadges,
    newAchievements,
    completedQuests,
  };
}

export function displayAnswer(answerType: AnswerType, data: AnswerData): string {
  switch (answerType) {
    case "multiple_choice_single":
    case "multiple_choice_multiple":
      return (data as { correct: string }).correct;
    case "numerical_tolerance": {
      const d = data as { value: number; unit?: string };
      return `${d.value}${d.unit ? " " + d.unit : ""}`;
    }
    case "true_false":
      return (data as { correct: boolean }).correct ? "True" : "False";
    case "text_short":
    case "algebraic_expression":
      return (data as { accepted: string[] }).accepted[0] ?? "";
    default:
      return "";
  }
}
