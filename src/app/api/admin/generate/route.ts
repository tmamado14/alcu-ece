// Admin: generate new questions with DeepSeek (thinking mode) and insert
// them into the databank. The admin picks a subtopic, answer type, count,
// and difficulty range; the model writes the questions complete with
// solutions; each item is validated before it is stored.

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { deepseekChat, deepseekEnabled } from "@/lib/deepseek";
import { ProblemBody } from "@/lib/schemas";

export const maxDuration = 300;

const Body = z.object({
  topicId: z.string().min(1),
  answerType: z.enum(["multiple_choice_single", "numerical_tolerance", "true_false", "text_short"]),
  count: z.number().int().min(1).max(10),
  difficultyMin: z.number().int().min(1).max(10),
  difficultyMax: z.number().int().min(1).max(10),
  notes: z.string().max(2000).default(""),
  status: z.enum(["draft", "active"]).default("active"),
});

const ANSWER_DATA_SPEC: Record<string, string> = {
  multiple_choice_single:
    '"choices": [{"label": "A", "text": "..."}, ... exactly four choices A-D], "answer_data": {"correct": "<label of the correct choice>"}',
  numerical_tolerance:
    '"answer_data": {"value": <number>, "toleranceAbs": <number, absolute tolerance sized so normal rounding still passes>, "unit": "<unit or omit>"}',
  true_false: '"answer_data": {"correct": <true or false>}',
  text_short:
    '"answer_data": {"accepted": ["<answer>", "<common spelling/phrasing variants>"]}',
};

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  if (!deepseekEnabled()) return fail("DEEPSEEK_API_KEY is not configured on the server", 503);
  const body = Body.parse(await req.json());
  if (body.difficultyMin > body.difficultyMax) return fail("difficultyMin > difficultyMax");

  const topic = await prisma.topic.findUnique({
    where: { id: body.topicId },
    include: { subject: true, parentTopic: true },
  });
  if (!topic) return fail("Topic not found", 404);
  if (!topic.parentTopicId) return fail("Pick a subtopic (leaf topic), not a top-level topic");

  // Existing statements in this subtopic, so the model doesn't write duplicates.
  const existing = await prisma.problem.findMany({
    where: { topicId: topic.id, status: { not: "archived" } },
    select: { statement: true },
    take: 60,
  });

  const system = [
    "You write original exam questions for an ECE (Electronics and Communications Engineering) board-exam practice platform.",
    'Respond with a single JSON object: {"questions": [...]} — no prose, no markdown code fences. Each element of "questions" is one question object with these fields:',
    `{"statement": "...", ${ANSWER_DATA_SPEC[body.answerType]}, "difficulty": <int>, "cognitive_level": "recall|comprehension|application|analysis|synthesis", "estimated_time": <seconds>, "tags": ["..."], "hints": ["one or two hints"], "solution": "worked solution", "explanation": "one-paragraph takeaway", "reference": "textbook or standard, or empty string"}`,
    "Rules:",
    "- Every question must be self-contained, unambiguous, and have exactly one defensible answer.",
    "- Solve each question yourself and make sure answer_data matches your own solution before including it.",
    "- Write math as $...$ (inline) or $$...$$ (display) LaTeX. In statements, solutions, hints, and explanations the only other markup allowed is **bold**; no headings, bullets, or tables.",
    '- LaTeX backslashes must be escaped for JSON: write "\\\\zeta" in the JSON string so it parses to \\zeta.',
    "- Difficulty is a 1-10 scale where 1 is trivial recall and 10 is the hardest board-exam level.",
    "- Do not duplicate or trivially rephrase the existing questions listed by the user.",
  ].join("\n");

  const user = [
    `Subject: ${topic.subject.title}`,
    `Topic: ${topic.parentTopic?.title ?? ""} → Subtopic: ${topic.title}`,
    `Write exactly ${body.count} question(s) of type ${body.answerType}.`,
    `Difficulty range: ${body.difficultyMin} to ${body.difficultyMax} (spread across the range if more than one question).`,
    body.notes ? `Additional instructions from the admin: ${body.notes}` : "",
    existing.length > 0
      ? `Existing questions in this subtopic (do NOT duplicate):\n${existing
          .map((e, i) => `${i + 1}. ${e.statement.slice(0, 200)}`)
          .join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const raw = await deepseekChat({
    system,
    user,
    thinking: true, // quality matters here; the admin can wait
    jsonOutput: true,
    maxTokens: 8192,
    timeoutMs: 280_000,
  });

  const items = extractQuestions(raw);
  if (!items) {
    console.error("[generate] unparseable model output:", raw.slice(0, 1000));
    return fail("Model did not return valid JSON; try again (details in server log)", 502);
  }

  const created: { id: string; statement: string; difficulty: number }[] = [];
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    try {
      const input = ProblemBody.parse({
        topicId: topic.id,
        statement: item.statement,
        answerType: body.answerType,
        answerData: item.answer_data,
        choices: item.choices,
        cognitiveLevel: item.cognitive_level ?? "application",
        difficulty: clampInt(item.difficulty, body.difficultyMin, body.difficultyMax),
        estimatedTime: clampInt(item.estimated_time ?? 120, 10, 3600),
        hints: item.hints ?? [],
        solution: item.solution ?? "",
        explanation: item.explanation ?? "",
        reference: item.reference ?? "",
        tags: item.tags ?? [],
        status: body.status,
      });
      if (body.answerType === "multiple_choice_single" && (input.choices?.length ?? 0) < 2) {
        throw new Error("multiple choice question needs at least 2 choices");
      }
      const problem = await prisma.problem.create({
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
                create: input.choices.map((c, idx) => ({
                  label: c.label,
                  text: c.text,
                  isCorrect: c.label === (input.answerData as { correct?: string }).correct,
                  sortOrder: idx,
                })),
              }
            : undefined,
          tags: { create: input.tags.map((tag) => ({ tag })) },
        },
      });
      created.push({ id: problem.id, statement: problem.statement, difficulty: problem.difficulty });
    } catch (e) {
      errors.push(`Question ${i + 1}: ${e instanceof Error ? e.message : "invalid"}`);
    }
  }

  return ok({ created, errors });
});

function clampInt(v: unknown, min: number, max: number): number {
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/**
 * Pull the questions array out of the completion. Tolerates a bare array,
 * a {"questions": [...]} object, markdown code fences, stray prose, and
 * un-escaped LaTeX backslashes (the most common model slip: "\zeta" is not
 * a valid JSON escape and would otherwise fail the whole parse).
 */
function extractQuestions(text: string): unknown[] | null {
  const candidates = [text, repairJsonEscapes(text)];
  for (const t of candidates) {
    for (const slice of jsonSlices(t)) {
      try {
        const parsed = JSON.parse(slice) as unknown;
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") {
          const q = (parsed as { questions?: unknown }).questions;
          if (Array.isArray(q)) return q;
        }
      } catch {
        // try the next candidate
      }
    }
  }
  return null;
}

function jsonSlices(text: string): string[] {
  const slices = [text.trim()];
  const oStart = text.indexOf("{");
  const oEnd = text.lastIndexOf("}");
  if (oStart !== -1 && oEnd > oStart) slices.push(text.slice(oStart, oEnd + 1));
  const aStart = text.indexOf("[");
  const aEnd = text.lastIndexOf("]");
  if (aStart !== -1 && aEnd > aStart) slices.push(text.slice(aStart, aEnd + 1));
  return slices;
}

/** Escape backslashes that don't start a valid JSON escape sequence. */
function repairJsonEscapes(text: string): string {
  return text.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
}
