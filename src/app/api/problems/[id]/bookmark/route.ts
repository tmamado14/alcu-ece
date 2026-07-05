// Toggle a bookmark or needs_review flag on a problem.
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

const Body = z.object({ kind: z.enum(["bookmark", "needs_review"]).default("bookmark") });

export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await params;
  const { kind } = Body.parse(await req.json().catch(() => ({})));
  const existing = await prisma.bookmark.findUnique({
    where: { userId_problemId_kind: { userId: user.id, problemId: id, kind } },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return ok({ active: false });
  }
  await prisma.bookmark.create({ data: { userId: user.id, problemId: id, kind } });
  return ok({ active: true });
});
