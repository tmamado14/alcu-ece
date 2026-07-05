// Full problem view (statement + solution) — only after the learner has a
// finalized attempt on it, or for admins.
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { displayAnswer } from "@/services/practice";
import type { AnswerData, AnswerType } from "@/lib/grading";

export const GET = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const problem = await prisma.problem.findUnique({
    where: { id },
    include: { topic: true, choices: { orderBy: { sortOrder: "asc" } }, tags: true },
  });
  if (!problem) return fail("Problem not found", 404);

  const finalized = await prisma.attempt.findFirst({
    where: { userId: user.id, problemId: id, result: { not: "pending" } },
  });
  if (!finalized && user.role !== "admin") return fail("Solution locked until attempted", 403);

  const answerData = JSON.parse(problem.answerData) as AnswerData;
  return ok({
    id: problem.id,
    statement: problem.statement,
    answerType: problem.answerType,
    difficulty: problem.difficulty,
    cognitiveLevel: problem.cognitiveLevel,
    topic: { id: problem.topic.id, title: problem.topic.title },
    choices: problem.choices.map((c) => ({ label: c.label, text: c.text, isCorrect: c.isCorrect })),
    tags: problem.tags.map((t) => t.tag),
    hints: JSON.parse(problem.hints),
    solution: problem.solution,
    explanation: problem.explanation,
    correctAnswerDisplay: displayAnswer(problem.answerType as AnswerType, answerData),
  });
});
