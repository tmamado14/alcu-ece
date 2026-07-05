import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { selectNextProblem } from "@/services/practice";

const Body = z.object({
  subjectSlug: z.string().default("feedback-control-systems"),
  topicId: z.string().nullish(),
  mode: z.enum(["adaptive", "drill", "review", "quest", "exam"]).default("adaptive"),
  preference: z.enum(["easy", "normal", "hard", "challenge"]).default("normal"),
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = Body.parse(await req.json());
  const subject = await prisma.subject.findUnique({ where: { slug: body.subjectSlug } });
  if (!subject) return fail("Subject not found", 404);

  const problem = await selectNextProblem(
    user.id,
    subject.id,
    body.topicId ?? null,
    body.mode,
    body.preference
  );
  if (!problem) return ok({ problem: null, message: "No problems available for this selection." });
  return ok({ problem });
});
