import { z } from "zod";
import { normalizeMathDelimiters } from "@/lib/latex";

/**
 * Text that may carry math. Every write path — the admin editor, CSV import,
 * and the AI question writer — parses through this schema, so \( \) and \[ \]
 * are rewritten to the $-delimiters the renderer understands before anything
 * reaches the databank.
 */
const mathText = z.string().transform(normalizeMathDelimiters);

export const ProblemBody = z.object({
  topicId: z.string().min(1),
  statement: z.string().min(5).transform(normalizeMathDelimiters),
  answerType: z.enum([
    "multiple_choice_single", "multiple_choice_multiple", "numerical_tolerance",
    "text_short", "algebraic_expression", "true_false",
  ]),
  answerData: z.record(z.unknown()),
  choices: z.array(z.object({ label: z.string(), text: mathText })).optional(),
  cognitiveLevel: z
    .enum(["recall", "comprehension", "application", "analysis", "synthesis", "evaluation"])
    .default("application"),
  difficulty: z.number().int().min(1).max(10).default(5),
  estimatedTime: z.number().int().min(10).default(120),
  hints: z.array(mathText).default([]),
  solution: mathText.default(""),
  explanation: mathText.default(""),
  reference: z.string().default(""),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "reviewed", "active", "archived"]).default("draft"),
});

export type ProblemInput = z.infer<typeof ProblemBody>;
