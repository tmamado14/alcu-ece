import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { giveUp } from "@/services/practice";

const Body = z.object({
  problemId: z.string().min(1),
  attemptId: z.string().optional(),
  mode: z.enum(["adaptive", "drill", "review", "quest", "exam"]).default("adaptive"),
  timeSpentSec: z.number().int().min(0).optional(),
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = Body.parse(await req.json());
  const outcome = await giveUp({ userId: user.id, ...body });
  return ok(outcome);
});
