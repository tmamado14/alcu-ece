// Admin: list and create problems.
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { ProblemBody } from "@/lib/schemas";

export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const topicId = url.searchParams.get("topicId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const problems = await prisma.problem.findMany({
    where: {
      ...(topicId ? { topicId } : {}),
      ...(status ? { status } : {}),
      ...(q ? { statement: { contains: q } } : {}),
    },
    include: { topic: true, tags: true, _count: { select: { attempts: true, reports: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return ok(
    problems.map((p) => ({
      id: p.id,
      statement: p.statement.slice(0, 140),
      topic: { id: p.topic.id, title: p.topic.title },
      answerType: p.answerType,
      difficulty: p.difficulty,
      status: p.status,
      tags: p.tags.map((t) => t.tag),
      attemptCount: p._count.attempts,
      reportCount: p._count.reports,
    }))
  );
});

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const body = ProblemBody.parse(await req.json());
  const problem = await prisma.problem.create({
    data: {
      topicId: body.topicId,
      statement: body.statement,
      answerType: body.answerType,
      answerData: JSON.stringify(body.answerData),
      cognitiveLevel: body.cognitiveLevel,
      difficulty: body.difficulty,
      estimatedTime: body.estimatedTime,
      hints: JSON.stringify(body.hints),
      solution: body.solution,
      explanation: body.explanation,
      reference: body.reference,
      status: body.status,
      authorId: admin.id,
      choices: body.choices
        ? {
            create: body.choices.map((c, i) => ({
              label: c.label,
              text: c.text,
              isCorrect: c.label === (body.answerData as { correct?: string }).correct,
              sortOrder: i,
            })),
          }
        : undefined,
      tags: { create: body.tags.map((tag) => ({ tag })) },
    },
  });
  return ok({ id: problem.id }, { status: 201 });
});
