// Admin: read, update, archive a problem.
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { ProblemBody } from "@/lib/schemas";

export const GET = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const p = await prisma.problem.findUnique({
    where: { id },
    include: { topic: true, choices: { orderBy: { sortOrder: "asc" } }, tags: true },
  });
  if (!p) return fail("Problem not found", 404);
  return ok({
    id: p.id,
    topicId: p.topicId,
    statement: p.statement,
    answerType: p.answerType,
    answerData: JSON.parse(p.answerData),
    choices: p.choices.map((c) => ({ label: c.label, text: c.text })),
    cognitiveLevel: p.cognitiveLevel,
    difficulty: p.difficulty,
    estimatedTime: p.estimatedTime,
    hints: JSON.parse(p.hints),
    solution: p.solution,
    explanation: p.explanation,
    reference: p.reference,
    tags: p.tags.map((t) => t.tag),
    status: p.status,
  });
});

export const PUT = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const body = ProblemBody.parse(await req.json());
  await prisma.problemChoice.deleteMany({ where: { problemId: id } });
  await prisma.problemTag.deleteMany({ where: { problemId: id } });
  await prisma.problem.update({
    where: { id },
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
  return ok({ ok: true });
});

export const DELETE = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  // archive rather than hard-delete so attempt history stays intact
  await prisma.problem.update({ where: { id }, data: { status: "archived" } });
  return ok({ ok: true });
});
