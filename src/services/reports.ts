// Learner analytics: dashboard aggregates and attempt history.

import { prisma } from "@/lib/db";
import { levelForXp } from "@/lib/gamification";
import { attemptTotals, progressScore, type AttemptTotals } from "@/lib/report";

export async function generateLearnerReport(userId: string) {
  const [user, attempts, progress, xpEvents] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.attempt.findMany({
      where: { userId, result: { not: "pending" } },
      include: { problem: { include: { topic: { include: { parentTopic: true } }, tags: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.learnerTopicProgress.findMany({ where: { userId }, include: { topic: true } }),
    prisma.xPEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const solved = (r: string) => r === "correct_first" || r === "correct_second";

  // accuracy by topic
  const byTopic = new Map<string, { title: string; total: number; correct: number; firstTry: number }>();
  for (const a of attempts) {
    const key = a.problem.topic.id;
    const rec = byTopic.get(key) ?? { title: a.problem.topic.title, total: 0, correct: 0, firstTry: 0 };
    rec.total++;
    if (solved(a.result)) rec.correct++;
    if (a.result === "correct_first") rec.firstTry++;
    byTopic.set(key, rec);
  }

  // accuracy by difficulty band
  const byDifficulty = new Map<string, { total: number; correct: number }>();
  for (const a of attempts) {
    const band = a.problem.difficulty <= 3 ? "easy (1-3)" : a.problem.difficulty <= 6 ? "medium (4-6)" : "hard (7-10)";
    const rec = byDifficulty.get(band) ?? { total: 0, correct: 0 };
    rec.total++;
    if (solved(a.result)) rec.correct++;
    byDifficulty.set(band, rec);
  }

  // most missed tags
  const missedTags = new Map<string, number>();
  for (const a of attempts) {
    if (!solved(a.result)) {
      for (const t of a.problem.tags) missedTags.set(t.tag, (missedTags.get(t.tag) ?? 0) + 1);
    }
  }

  // day streak
  const days = new Set(attempts.map((a) => a.createdAt.toISOString().slice(0, 10)));
  let dayStreak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      dayStreak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else break;
  }

  // recommended next topics: prerequisites met (or none), status not passed, lowest difficulty band first
  const allTopics = await prisma.topic.findMany({
    where: { parentTopicId: { not: null } },
    include: { prerequisites: { include: { requiredTopic: true } } },
    orderBy: [{ difficultyBand: "asc" }, { sortOrder: "asc" }],
  });
  const statusByTopic = new Map(progress.map((p) => [p.topicId, p.status]));
  const passedIds = new Set(
    progress.filter((p) => p.status === "passed" || p.status === "mastered").map((p) => p.topicId)
  );
  const recommended = allTopics
    .filter((t) => {
      const st = statusByTopic.get(t.id);
      if (st === "passed" || st === "mastered") return false;
      return t.prerequisites.every((pr) => passedIds.has(pr.requiredTopicId));
    })
    .slice(0, 5)
    .map((t) => ({ id: t.id, title: t.title, slug: t.slug, status: statusByTopic.get(t.id) ?? "not_started" }));

  const totalTime = attempts.reduce((s, a) => s + a.timeSpentSec, 0);

  return {
    user: { name: user.name, totalXp: user.totalXp, level: levelForXp(user.totalXp) },
    totals: {
      attempts: attempts.length,
      correctFirst: attempts.filter((a) => a.result === "correct_first").length,
      correctSecond: attempts.filter((a) => a.result === "correct_second").length,
      wrong: attempts.filter((a) => a.result === "wrong").length,
      gaveUp: attempts.filter((a) => a.result === "gave_up").length,
      timeSpentSec: totalTime,
      dayStreak,
    },
    accuracyByTopic: [...byTopic.entries()].map(([id, r]) => ({ topicId: id, ...r })),
    accuracyByDifficulty: [...byDifficulty.entries()].map(([band, r]) => ({ band, ...r })),
    mostMissedTags: [...missedTags.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count })),
    topicProgress: progress.map((p) => ({
      topicId: p.topicId,
      title: p.topic.title,
      rating: p.rating,
      confidence: p.confidence,
      status: p.status,
      streak: p.streak,
    })),
    passedCount: progress.filter((p) => p.status === "passed").length,
    masteredCount: progress.filter((p) => p.status === "mastered").length,
    needsReviewCount: progress.filter((p) => p.status === "needs_review").length,
    recommended,
    recentActivity: attempts.slice(0, 10).map((a) => ({
      id: a.id,
      problemId: a.problemId,
      topic: a.problem.topic.title,
      result: a.result,
      xp: a.xpAwarded,
      at: a.createdAt.toISOString(),
    })),
    recentXp: xpEvents.map((e) => ({ amount: e.amount, source: e.source, at: e.createdAt.toISOString() })),
  };
}

export interface TopicReport {
  topic: { id: string; title: string; group: string; slug: string };
  stats: AttemptTotals;
  /** Null when the learner has never finished a question in this topic. */
  progress: {
    rating: number;
    score: number;
    status: string;
    confidence: number;
    problemsSeen: number;
    correctFirstTry: number;
    correctSecondTry: number;
    wrong: number;
    gaveUp: number;
    streak: number;
    lastPracticedAt: string | null;
  } | null;
  problems: {
    attemptId: string;
    problemId: string;
    statement: string;
    difficulty: number;
    result: string;
    at: string;
  }[];
}

/** One topic's slice of the report: what the learner answered there, and how it went. */
export async function getTopicReport(userId: string, topicId: string): Promise<TopicReport | null> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { parentTopic: { select: { title: true } } },
  });
  if (!topic) return null;

  const [progress, attempts] = await Promise.all([
    prisma.learnerTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId } },
    }),
    prisma.attempt.findMany({
      where: { userId, result: { not: "pending" }, problem: { topicId } },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { problem: { select: { id: true, statement: true, difficulty: true } } },
    }),
  ]);

  return {
    topic: {
      id: topic.id,
      title: topic.title,
      group: topic.parentTopic?.title ?? "",
      slug: topic.slug,
    },
    stats: attemptTotals(attempts.map((a) => a.result)),
    progress: progress
      ? {
          rating: progress.rating,
          score: progressScore(progress.rating, topic.masteryThreshold),
          status: progress.status,
          confidence: progress.confidence,
          problemsSeen: progress.problemsSeen,
          correctFirstTry: progress.correctFirstTry,
          correctSecondTry: progress.correctSecondTry,
          wrong: progress.wrong,
          gaveUp: progress.gaveUp,
          streak: progress.streak,
          lastPracticedAt: progress.lastPracticedAt?.toISOString() ?? null,
        }
      : null,
    problems: attempts.map((a) => ({
      attemptId: a.id,
      problemId: a.problem.id,
      statement: a.problem.statement,
      difficulty: a.problem.difficulty,
      result: a.result,
      at: a.createdAt.toISOString(),
    })),
  };
}

export interface HistoryFilters {
  topicId?: string;
  result?: string;
  tag?: string;
  from?: string;
  to?: string;
}

export async function getAttemptHistory(userId: string, filters: HistoryFilters, page = 1, pageSize = 20) {
  const where = {
    userId,
    result: filters.result ? filters.result : { not: "pending" },
    ...(filters.topicId ? { problem: { topicId: filters.topicId } } : {}),
    ...(filters.tag ? { problem: { tags: { some: { tag: filters.tag } } } } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to + "T23:59:59") } : {}),
          },
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    prisma.attempt.count({ where }),
    prisma.attempt.findMany({
      where,
      include: {
        problem: { include: { topic: true, tags: true } },
        answers: { orderBy: { tryNumber: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return {
    total,
    page,
    pageSize,
    items: items.map((a) => ({
      id: a.id,
      problemId: a.problemId,
      topic: { id: a.problem.topic.id, title: a.problem.topic.title },
      tags: a.problem.tags.map((t) => t.tag),
      result: a.result,
      xpAwarded: a.xpAwarded,
      ratingDelta: a.ratingDelta,
      createdAt: a.createdAt.toISOString(),
      answers: a.answers.map((ans) => ({
        tryNumber: ans.tryNumber,
        submitted: ans.submitted,
        isCorrect: ans.isCorrect,
        at: ans.createdAt.toISOString(),
      })),
    })),
  };
}
