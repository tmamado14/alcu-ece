// On-demand generation of worked solutions via the DeepSeek API.
//
// When a learner finalizes an attempt on a problem whose `solution` is empty,
// the submit/giveup request waits for the solution to be generated and stored,
// then returns it in the outcome — so even the first learner sees it. The
// frontend shows a "generating solution" indicator during the wait.
//
// The API key is read from DEEPSEEK_API_KEY on the server and never leaves it.

import { prisma } from "@/lib/db";
import { deepseekChat, deepseekEnabled } from "@/lib/deepseek";
import { normalizeMathDelimiters } from "@/lib/latex";

// Problems currently being generated in this process: concurrent finishers
// of the same problem await the same promise instead of duplicating the call.
const inFlight = new Map<string, Promise<string>>();

/**
 * Returns the problem's solution, generating and storing it first if empty.
 * Returns "" when generation is disabled (no API key) or fails.
 */
export async function ensureSolution(problemId: string): Promise<string> {
  if (!deepseekEnabled()) return "";
  const pending = inFlight.get(problemId);
  if (pending) return pending;

  const task = generateAndStore(problemId)
    .catch((err) => {
      console.error(`[solution-gen] failed for problem ${problemId}:`, err);
      return "";
    })
    .finally(() => {
      inFlight.delete(problemId);
    });
  inFlight.set(problemId, task);
  return task;
}

async function generateAndStore(problemId: string): Promise<string> {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { topic: true, choices: { orderBy: { sortOrder: "asc" } } },
  });
  if (!problem) return "";
  if (problem.solution.trim() !== "") return problem.solution;

  const prompt = buildPrompt(problem);
  // Non-thinking: the learner is waiting on this request.
  const raw = await deepseekChat({ ...prompt, thinking: false, timeoutMs: 60_000 });
  if (!raw) throw new Error("DeepSeek returned an empty completion");
  // The prompt asks for $-delimiters; models still slip into \( \) and \[ \].
  const solution = normalizeMathDelimiters(raw);

  // Write only if the solution is still empty, in case an admin or another
  // process filled it in while we were generating.
  await prisma.problem.updateMany({
    where: { id: problemId, solution: "" },
    data: { solution },
  });
  return solution;
}

type ProblemForPrompt = {
  statement: string;
  answerType: string;
  answerData: string;
  topic: { title: string };
  choices: { label: string; text: string }[];
};

function correctAnswerText(p: ProblemForPrompt): string {
  const data = JSON.parse(p.answerData) as Record<string, unknown>;
  switch (p.answerType) {
    case "multiple_choice_single":
    case "multiple_choice_multiple": {
      const label = String(data.correct ?? "");
      const choice = p.choices.find((c) => c.label === label);
      return choice ? `${label}. ${choice.text}` : label;
    }
    case "numerical_tolerance":
      return `${data.value}${data.unit ? " " + data.unit : ""}`;
    case "true_false":
      return data.correct ? "True" : "False";
    default:
      return ((data.accepted as string[] | undefined) ?? []).join(" | ");
  }
}

function buildPrompt(p: ProblemForPrompt): { system: string; user: string } {
  const choicesBlock =
    p.choices.length > 0
      ? "\nChoices:\n" + p.choices.map((c) => `${c.label}. ${c.text}`).join("\n")
      : "";

  const system = [
    "You write worked solutions for an ECE (Electronics and Communications Engineering) board-exam practice platform.",
    "You are given a problem and its verified correct answer. Write a clear step-by-step solution that arrives at that answer.",
    "Formatting rules (the renderer is limited — it only understands the two dollar-sign delimiters below):",
    "- Inline math: wrap it in single dollar signs, like $\\omega_n^2 = 100$. It must stay on one line.",
    "- Display math: wrap it in double dollar signs, like $$\\zeta = \\frac{8}{2\\omega_n}$$.",
    "- NEVER use the \\( \\) or \\[ \\] delimiters. They are not supported and render as literal backslashes on the page. Write $x$ where you would write \\(x\\), and $$x$$ where you would write \\[x\\].",
    "- Every symbol, variable, number with a unit, and equation goes inside math delimiters — never bare in the prose.",
    "- The only other markup available is **bold** and blank lines between paragraphs. No headings, no bullet markers, no tables, no LaTeX environments (align, equation, cases).",
    "- Keep it concise: state the approach, show the key steps with equations, and end by confirming the answer.",
    "If the stated correct answer appears inconsistent with the problem, still explain the most defensible path to it and note the discrepancy in one sentence.",
    "Output only the solution text, nothing else.",
  ].join("\n");

  const user = [
    `Topic: ${p.topic.title}`,
    `Problem:\n${p.statement}`,
    choicesBlock,
    `Verified correct answer: ${correctAnswerText(p)}`,
  ].join("\n\n");

  return { system, user };
}

