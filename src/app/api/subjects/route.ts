import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const GET = handle(async () => {
  const user = await requireUser();
  const subjects = await prisma.subject.findMany({
    orderBy: { sortOrder: "asc" },
    include: { topics: { where: { parentTopicId: { not: null } }, select: { id: true } } },
  });
  const progress = await prisma.learnerTopicProgress.findMany({ where: { userId: user.id } });
  const byTopic = new Map(progress.map((p) => [p.topicId, p.status]));

  return ok(
    subjects.map((s) => {
      const topicIds = s.topics.map((t) => t.id);
      const passed = topicIds.filter((id) => ["passed", "mastered"].includes(byTopic.get(id) ?? "")).length;
      const mastered = topicIds.filter((id) => byTopic.get(id) === "mastered").length;
      return {
        id: s.id,
        slug: s.slug,
        title: s.title,
        description: s.description,
        topicCount: topicIds.length,
        passedCount: passed,
        masteredCount: mastered,
      };
    })
  );
});
