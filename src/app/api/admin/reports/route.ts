// Admin: reported problem issues.
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const GET = handle(async () => {
  await requireAdmin();
  const reports = await prisma.reportedProblem.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true } }, problem: { select: { id: true, statement: true } } },
  });
  return ok(
    reports.map((r) => ({
      id: r.id,
      problemId: r.problem.id,
      statement: r.problem.statement.slice(0, 120),
      message: r.message,
      status: r.status,
      reportedBy: r.user.username,
      createdAt: r.createdAt,
    }))
  );
});

const Body = z.object({ id: z.string().min(1), status: z.enum(["open", "resolved", "dismissed"]) });

export const PUT = handle(async (req: Request) => {
  await requireAdmin();
  const { id, status } = Body.parse(await req.json());
  await prisma.reportedProblem.update({ where: { id }, data: { status } });
  return ok({ ok: true });
});
