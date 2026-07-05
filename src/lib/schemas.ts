import { z } from "zod";

export const ProblemBody = z.object({
  topicId: z.string().min(1),
  statement: z.string().min(5),
  answerType: z.enum([
    "multiple_choice_single", "multiple_choice_multiple", "numerical_tolerance",
    "text_short", "algebraic_expression", "true_false",
  ]),
  answerData: z.record(z.unknown()),
  choices: z.array(z.object({ label: z.string(), text: z.string() })).optional(),
  cognitiveLevel: z.enum(["recall", "comprehension", "application", "analysis", "synthesis"]).default("application"),
  difficulty: z.number().int().min(1).max(10).default(5),
  estimatedTime: z.number().int().min(10).default(120),
  hints: z.array(z.string()).default([]),
  solution: z.string().default(""),
  explanation: z.string().default(""),
  reference: z.string().default(""),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "reviewed", "active", "archived"]).default("draft"),
});

export type ProblemInput = z.infer<typeof ProblemBody>;
