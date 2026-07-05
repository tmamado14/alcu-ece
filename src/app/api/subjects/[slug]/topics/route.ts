// Topic map for a subject, with the learner's per-topic progress.
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";

export const GET = handle(async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const user = await requireUser();
  const { slug } = await params;
  const subject = await prisma.subject.findUnique({ where: { slug } });
  if (!subject) return fail("Subject not found", 404);

  const topics = await prisma.topic.findMany({
    where: { subjectId: subject.id },
    orderBy: { sortOrder: "asc" },
    include: {
      prerequisites: { include: { requiredTopic: { select: { slug: true, title: true } } } },
      _count: { select: { problems: { where: { status: "active" } } } },
    },
  });
  const progress = await prisma.learnerTopicProgress.findMany({ where: { userId: user.id } });
  const progByTopic = new Map(progress.map((p) => [p.topicId, p]));

  const parents = topics.filter((t) => !t.parentTopicId);
  const result = parents.map((parent) => ({
    id: parent.id,
    slug: parent.slug,
    title: parent.title,
    children: topics
      .filter((t) => t.parentTopicId === parent.id)
      .map((t) => {
        const p = progByTopic.get(t.id);
        return {
          id: t.id,
          slug: t.slug,
          title: t.title,
          difficultyBand: t.difficultyBand,
          passThreshold: t.passThreshold,
          masteryThreshold: t.masteryThreshold,
          problemCount: t._count.problems,
          prerequisites: t.prerequisites.map((pr) => pr.requiredTopic),
          rating: p?.rating ?? 1000,
          confidence: p?.confidence ?? 0,
          status: p?.status ?? "not_started",
          problemsSeen: p?.problemsSeen ?? 0,
          streak: p?.streak ?? 0,
        };
      }),
  }));

  return ok({ subject: { id: subject.id, slug: subject.slug, title: subject.title }, topics: result });
});
