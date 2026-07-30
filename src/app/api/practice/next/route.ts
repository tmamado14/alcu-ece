import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { selectNextProblem } from "@/services/practice";

const Body = z.object({
  // Omitted: draw from every subject. A focus or an explicit topic narrows the
  // pool anyway, so this only matters for unfocused adaptive practice.
  subjectSlug: z.string().nullish(),
  topicId: z.string().nullish(),
  mode: z.enum(["adaptive", "drill", "review", "quest", "exam"]).default("adaptive"),
  preference: z.enum(["easy", "normal", "hard", "challenge"]).default("normal"),
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = Body.parse(await req.json());
  let subjectId: string | null = null;
  if (body.subjectSlug) {
    const subject = await prisma.subject.findUnique({ where: { slug: body.subjectSlug } });
    if (!subject) return fail("Subject not found", 404);
    subjectId = subject.id;
  }

  const { problem, focus } = await selectNextProblem(
    user.id,
    subjectId,
    body.topicId ?? null,
    body.mode,
    body.preference
  );
  if (!problem) {
    return ok({
      problem: null,
      focus,
      message: focus
        ? `No questions left in your focus (${focus.topic.title}). Clear the focus or pick another topic.`
        : "No problems available for this selection.",
    });
  }
  return ok({ problem, focus });
});
