// Admin: list all topics (flat, for pickers) and create topics/prerequisites.
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const GET = handle(async () => {
  await requireAdmin();
  const topics = await prisma.topic.findMany({
    orderBy: [{ subjectId: "asc" }, { sortOrder: "asc" }],
    include: { subject: true, parentTopic: true },
  });
  return ok(
    topics.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      subject: t.subject.title,
      parent: t.parentTopic?.title ?? null,
      isLeaf: !!t.parentTopicId,
      difficultyBand: t.difficultyBand,
      passThreshold: t.passThreshold,
      masteryThreshold: t.masteryThreshold,
    }))
  );
});

const Body = z.object({
  subjectSlug: z.string().min(1),
  parentSlug: z.string().nullish(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be kebab-case"),
  title: z.string().min(1),
  difficultyBand: z.number().int().min(1).max(5).default(1),
  passThreshold: z.number().int().default(1100),
  masteryThreshold: z.number().int().default(1300),
  prerequisiteSlugs: z.array(z.string()).default([]),
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const body = Body.parse(await req.json());
  const subject = await prisma.subject.findUniqueOrThrow({ where: { slug: body.subjectSlug } });
  const parent = body.parentSlug
    ? await prisma.topic.findUniqueOrThrow({ where: { slug: body.parentSlug } })
    : null;
  const topic = await prisma.topic.create({
    data: {
      subjectId: subject.id,
      parentTopicId: parent?.id,
      slug: body.slug,
      title: body.title,
      difficultyBand: body.difficultyBand,
      passThreshold: body.passThreshold,
      masteryThreshold: body.masteryThreshold,
    },
  });
  for (const preSlug of body.prerequisiteSlugs) {
    const pre = await prisma.topic.findUniqueOrThrow({ where: { slug: preSlug } });
    await prisma.topicPrerequisite.create({ data: { topicId: topic.id, requiredTopicId: pre.id } });
  }
  return ok({ id: topic.id }, { status: 201 });
});
