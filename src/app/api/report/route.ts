// Subject report: aggregate stats, per-topic progress scores, and the
// learner's attempted problems in that subject (newest first).
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";

/** Map a topic rating onto a 0–100 progress score (mastery+100 ≙ 100). */
function progressScore(rating: number, masteryThreshold: number): number {
  const min = 900;
  const max = masteryThreshold + 100;
  return Math.round(Math.min(100, Math.max(0, ((rating - min) / (max - min)) * 100)));
}

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const slug = new URL(req.url).searchParams.get("subject") ?? "feedback-control-systems";
  const subject = await prisma.subject.findUnique({ where: { slug } });
  if (!subject) return fail("Subject not found", 404);

  const [topics, progress, attempts] = await Promise.all([
    prisma.topic.findMany({
      where: { subjectId: subject.id, parentTopicId: { not: null } },
      orderBy: [{ sortOrder: "asc" }],
      include: { parentTopic: { select: { title: true, sortOrder: true } } },
    }),
    prisma.learnerTopicProgress.findMany({ where: { userId: user.id } }),
    prisma.attempt.findMany({
      where: {
        userId: user.id,
        result: { not: "pending" },
        problem: { topic: { subjectId: subject.id } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { problem: { select: { id: true, statement: true, difficulty: true } } },
    }),
  ]);

  const progByTopic = new Map(progress.map((p) => [p.topicId, p]));

  const topicRows = topics
    .sort((a, b) => (a.parentTopic?.sortOrder ?? 0) - (b.parentTopic?.sortOrder ?? 0) || a.sortOrder - b.sortOrder)
    .map((t) => {
      const p = progByTopic.get(t.id);
      return {
        id: t.id,
        title: t.title,
        group: t.parentTopic?.title ?? "",
        rating: p?.rating ?? 1000,
        status: p?.status ?? "not_started",
        problemsSeen: p?.problemsSeen ?? 0,
        score: progressScore(p?.rating ?? 1000, t.masteryThreshold),
      };
    });

  const correct = attempts.filter((a) => a.result === "correct_first" || a.result === "correct_second").length;
  const incorrect = attempts.filter((a) => a.result === "wrong").length;
  const gaveUp = attempts.filter((a) => a.result === "gave_up").length;

  // headline rating: average progress score over topics the learner has touched
  const touched = topicRows.filter((t) => t.problemsSeen > 0);
  const headlineRating =
    touched.length > 0
      ? Math.round((touched.reduce((s, t) => s + t.score, 0) / touched.length) * 10) / 10
      : 0;

  return ok({
    subject: { slug: subject.slug, title: subject.title },
    user: { name: user.name, username: user.username },
    stats: {
      rating: headlineRating,
      problems: attempts.length,
      correct,
      incorrect,
      gaveUp,
      percent: attempts.length > 0 ? Math.round((correct / attempts.length) * 1000) / 10 : 0,
    },
    topics: topicRows,
    problems: attempts.map((a) => ({
      attemptId: a.id,
      problemId: a.problem.id,
      statement: a.problem.statement,
      difficulty: a.problem.difficulty,
      result: a.result,
      at: a.createdAt.toISOString(),
    })),
  });
});
