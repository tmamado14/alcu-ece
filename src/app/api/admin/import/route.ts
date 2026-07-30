// Admin: bulk import problems from CSV or JSON.
//
// CSV columns:
// subject, topic, subtopic, skill_tags, difficulty, cognitive_level, answer_type,
// question_text, option_a, option_b, option_c, option_d, correct_answer,
// numerical_tolerance, solution, explanation, reference
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { parseCsv } from "@/lib/csv";
import { ProblemBody, type ProblemInput } from "@/lib/schemas";

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const contentType = req.headers.get("content-type") ?? "";
  const body = await req.text();

  let inputs: (ProblemInput & { subject?: string; topicSlug?: string })[] = [];
  const errors: string[] = [];

  if (contentType.includes("json") || body.trim().startsWith("[") || body.trim().startsWith("{")) {
    const parsed = JSON.parse(body);
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    for (let i = 0; i < rows.length; i++) {
      const check = ProblemBody.safeParse(rows[i]);
      if (check.success) inputs.push(check.data);
      else errors.push(`JSON row ${i + 1}: ${check.error.errors.map((e) => e.message).join(", ")}`);
    }
  } else {
    const rows = parseCsv(body);
    if (rows.length < 2) return fail("CSV needs a header row and at least one data row");
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name: string, row: string[]) => {
      const idx = header.indexOf(name);
      return idx >= 0 ? (row[idx] ?? "").trim() : "";
    };
    // Topic slugs are globally unique, so an unscoped lookup can attach a row to
    // a same-titled topic in the wrong subject. Both are cached: a bulk import
    // repeats the same handful of subjects and subtopics across hundreds of rows.
    const subjectCache = new Map<string, string | null>();
    const topicCache = new Map<string, string | null>();

    async function findSubjectId(name: string): Promise<string | null> {
      const key = name.toLowerCase();
      const hit = subjectCache.get(key);
      if (hit !== undefined) return hit;
      const subject = await prisma.subject.findFirst({
        where: { OR: [{ slug: slugify(name) }, { title: name }] },
        select: { id: true },
      });
      subjectCache.set(key, subject?.id ?? null);
      return subject?.id ?? null;
    }

    async function findTopicId(subtopic: string, subjectId: string | null): Promise<string | null> {
      const key = `${subjectId ?? "*"}::${subtopic.toLowerCase()}`;
      const hit = topicCache.get(key);
      if (hit !== undefined) return hit;
      // Accept either the topic's slug-ified name or its exact title, since
      // curriculum titles are long enough that their slugs are not what an
      // author would naturally type.
      const topic = await prisma.topic.findFirst({
        where: {
          OR: [{ slug: slugify(subtopic) }, { title: subtopic }],
          ...(subjectId ? { subjectId } : {}),
        },
        select: { id: true },
      });
      topicCache.set(key, topic?.id ?? null);
      return topic?.id ?? null;
    }

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.every((c) => c.trim() === "")) continue;
      try {
        const answerType = col("answer_type", row) || "multiple_choice_single";
        const correct = col("correct_answer", row);
        const subtopic = col("subtopic", row) || col("topic", row);

        // A blank subject column stays permitted so older CSVs still import; it
        // just falls back to the unscoped match.
        const subjectName = col("subject", row);
        let subjectId: string | null = null;
        if (subjectName) {
          subjectId = await findSubjectId(subjectName);
          if (!subjectId) {
            errors.push(`Row ${r + 1}: unknown subject "${subjectName}"`);
            continue;
          }
        }

        const topicId = await findTopicId(subtopic, subjectId);
        if (!topicId) {
          errors.push(
            `Row ${r + 1}: unknown topic/subtopic "${subtopic}"` +
              (subjectName ? ` in subject "${subjectName}"` : "")
          );
          continue;
        }

        let answerData: Record<string, unknown>;
        let choices: { label: string; text: string }[] | undefined;
        if (answerType.startsWith("multiple_choice")) {
          const letters = correct.toUpperCase().split(/[;|,\s]+/).filter(Boolean);
          answerData = { correct: correct.toUpperCase() };
          choices = (["a", "b", "c", "d"] as const)
            .map((l) => ({ label: l.toUpperCase(), text: col(`option_${l}`, row) }))
            .filter((c) => c.text !== "");
          if (choices.length < 2) {
            errors.push(`Row ${r + 1}: multiple choice needs at least two non-empty options`);
            continue;
          }
          // Without this the row imports as an unanswerable question: no choice
          // is flagged correct, so a learner can never get it right.
          const missing = letters.filter((l) => !choices!.some((c) => c.label === l));
          if (letters.length === 0 || missing.length > 0) {
            errors.push(
              `Row ${r + 1}: correct_answer "${correct}" does not match a non-empty option ` +
                `(options present: ${choices.map((c) => c.label).join(", ")})`
            );
            continue;
          }
        } else if (answerType === "numerical_tolerance" || answerType === "numerical_exact") {
          const tol = parseFloat(col("numerical_tolerance", row));
          answerData = {
            value: parseFloat(correct),
            ...(isNaN(tol) ? { toleranceRel: 0.01 } : { toleranceAbs: tol }),
          };
        } else if (answerType === "true_false") {
          answerData = { correct: correct.trim().toLowerCase() === "true" };
        } else {
          answerData = { accepted: correct.split("|").map((s) => s.trim()).filter(Boolean) };
        }

        const input: ProblemInput = ProblemBody.parse({
          topicId,
          statement: col("question_text", row),
          answerType: answerType === "numerical_exact" ? "numerical_tolerance" : answerType,
          answerData,
          choices,
          cognitiveLevel: (col("cognitive_level", row) || "application") as ProblemInput["cognitiveLevel"],
          difficulty: parseInt(col("difficulty", row), 10) || 5,
          solution: col("solution", row),
          explanation: col("explanation", row),
          reference: col("reference", row),
          tags: col("skill_tags", row).split(/[;|]/).map((t) => t.trim()).filter(Boolean),
          status: "active",
        });
        inputs.push(input);
      } catch (e) {
        errors.push(`Row ${r + 1}: ${e instanceof Error ? e.message : "parse error"}`);
      }
    }
  }

  let created = 0;
  for (const input of inputs) {
    await prisma.problem.create({
      data: {
        topicId: input.topicId,
        statement: input.statement,
        answerType: input.answerType,
        answerData: JSON.stringify(input.answerData),
        cognitiveLevel: input.cognitiveLevel,
        difficulty: input.difficulty,
        estimatedTime: input.estimatedTime,
        hints: JSON.stringify(input.hints),
        solution: input.solution,
        explanation: input.explanation,
        reference: input.reference,
        status: input.status,
        authorId: admin.id,
        choices: input.choices
          ? {
              create: input.choices.map((c, i) => ({
                label: c.label,
                text: c.text,
                isCorrect: c.label === (input.answerData as { correct?: string }).correct,
                sortOrder: i,
              })),
            }
          : undefined,
        tags: { create: input.tags.map((tag) => ({ tag })) },
      },
    });
    created++;
  }

  return ok({ created, errors });
});
