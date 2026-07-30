// Admin: download a CSV template for bulk question upload.
//
// The header matches what POST /api/admin/import expects, and the example
// rows use subtopics that exist in the seeded databank, so the file imports
// cleanly as-is. Question writers replace the examples with their own rows.
// `solution` and `explanation` may be left blank — a worked solution is
// generated automatically the first time a learner finishes the question.

import { requireAdmin } from "@/lib/auth";
import { handle } from "@/lib/api";
import { toCsv } from "@/lib/csv";

const HEADER = [
  "subject", "topic", "subtopic", "skill_tags", "difficulty", "cognitive_level",
  "answer_type", "question_text", "option_a", "option_b", "option_c", "option_d",
  "correct_answer", "numerical_tolerance", "solution", "explanation", "reference",
];

const EXAMPLES: string[][] = [
  [
    "Feedback and Control Systems", "Time Response Analysis",
    "Transient Analysis of Second Order Systems",
    "damping;second-order", "4", "comprehension",
    "multiple_choice_single",
    "A second-order system has a damping ratio $\\zeta = 0.5$. Its step response is:",
    "Underdamped", "Critically damped", "Overdamped", "Undamped",
    "A", "", "", "", "Nise, Control Systems Engineering",
  ],
  [
    "Feedback and Control Systems", "Time Response Analysis",
    "Transient Parameters of Second Order Underdamped Systems",
    "settling-time;second-order", "6", "application",
    "numerical_tolerance",
    "A second-order system has $\\zeta = 0.6$ and $\\omega_n = 5$ rad/s. Using the 2% criterion, find the settling time in seconds.",
    "", "", "", "",
    "1.333", "0.05", "", "", "",
  ],
  [
    "Feedback and Control Systems", "Stability Analysis", "Stability in Terms of Pole Locations",
    "stability;poles", "3", "recall",
    "true_false",
    "A system whose poles all lie in the left half of the $s$-plane is stable.",
    "", "", "", "",
    "true", "", "", "", "",
  ],
  [
    "Feedback and Control Systems", "Steady-State Error", "Final Value Theorem",
    "laplace;theorems", "4", "recall",
    "text_short",
    "What theorem is used to find the steady-state value of a signal directly from its Laplace transform?",
    "", "", "", "",
    "final value theorem|final-value theorem", "", "", "", "",
  ],
];

export const GET = handle(async () => {
  await requireAdmin();
  const csv = toCsv([HEADER, ...EXAMPLES]) + "\r\n";
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="question-template.csv"',
    },
  });
});
