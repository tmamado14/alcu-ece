// Admin: export the question bank as JSON (?format=json) or CSV (?format=csv).
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle } from "@/lib/api";
import { toCsv } from "@/lib/csv";

export const GET = handle(async (req: Request) => {
  await requireAdmin();
  const format = new URL(req.url).searchParams.get("format") ?? "json";
  const problems = await prisma.problem.findMany({
    where: { status: { not: "archived" } },
    include: { topic: { include: { subject: true, parentTopic: true } }, choices: true, tags: true },
  });

  if (format === "csv") {
    const header = [
      "subject", "topic", "subtopic", "skill_tags", "difficulty", "cognitive_level", "answer_type",
      "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer",
      "numerical_tolerance", "solution", "explanation", "reference",
    ];
    const rows = problems.map((p) => {
      const data = JSON.parse(p.answerData) as Record<string, unknown>;
      const choice = (label: string) => p.choices.find((c) => c.label === label)?.text ?? "";
      const correct =
        p.answerType.startsWith("multiple_choice") ? String(data.correct ?? "") :
        p.answerType === "numerical_tolerance" ? String(data.value ?? "") :
        p.answerType === "true_false" ? String(data.correct ?? "") :
        ((data.accepted as string[]) ?? []).join("|");
      return [
        p.topic.subject.title,
        p.topic.parentTopic?.title ?? p.topic.title,
        p.topic.parentTopic ? p.topic.title : "",
        p.tags.map((t) => t.tag).join(";"),
        p.difficulty,
        p.cognitiveLevel,
        p.answerType,
        p.statement,
        choice("A"), choice("B"), choice("C"), choice("D"),
        correct,
        p.answerType === "numerical_tolerance" ? String((data.toleranceAbs as number) ?? "") : "",
        p.solution,
        p.explanation,
        p.reference,
      ];
    });
    return new Response(toCsv([header, ...rows]), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=ece-mastery-questions.csv",
      },
    });
  }

  const json = problems.map((p) => ({
    topicSlug: p.topic.slug,
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
  }));
  return new Response(JSON.stringify(json, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=ece-mastery-questions.json",
    },
  });
});
