// Report an issue with a question.
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

const Body = z.object({ message: z.string().min(3, "Please describe the issue").max(2000) });

export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const { message } = Body.parse(await req.json());
  await prisma.reportedProblem.create({ data: { userId: user.id, problemId: id, message } });
  return ok({ ok: true });
});
