// Subject report: aggregate stats, per-topic progress scores, and the
// learner's attempted problems in that subject (newest first).
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { attemptTotals, progressScore } from "@/lib/report";

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  // No ?subject=: report on the first subject in curriculum order.
  const slug = new URL(req.url).searchParams.get("subject");
  const subject = slug
    ? await prisma.subject.findUnique({ where: { slug } })
    : await prisma.subject.findFirst({ orderBy: { sortOrder: "asc" } });
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

  const totals = attemptTotals(attempts.map((a) => a.result));

  // headline rating: average progress score over topics the learner has touched
  const touched = topicRows.filter((t) => t.problemsSeen > 0);
  const headlineRating =
    touched.length > 0
      ? Math.round((touched.reduce((s, t) => s + t.score, 0) / touched.length) * 10) / 10
      : 0;

  return ok({
    subject: { slug: subject.slug, title: subject.title },
    user: { name: user.name, username: user.username },
    stats: { rating: headlineRating, ...totals },
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
