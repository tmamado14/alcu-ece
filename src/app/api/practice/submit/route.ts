import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { submitAnswer } from "@/services/practice";

const Body = z.object({
  problemId: z.string().min(1),
  attemptId: z.string().optional(),
  answer: z.string().min(1, "Answer must not be empty"),
  mode: z.enum(["adaptive", "drill", "review", "quest", "exam"]).default("adaptive"),
  timeSpentSec: z.number().int().min(0).max(60 * 60 * 4).optional(),
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = Body.parse(await req.json());
  const outcome = await submitAnswer({ userId: user.id, ...body });
  return ok(outcome);
});
