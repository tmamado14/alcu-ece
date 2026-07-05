// Admin: create a subject.
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

const Body = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be kebab-case"),
  title: z.string().min(1),
  description: z.string().default(""),
});

export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const body = Body.parse(await req.json());
  const count = await prisma.subject.count();
  const subject = await prisma.subject.create({ data: { ...body, sortOrder: count + 1 } });
  return ok({ id: subject.id }, { status: 201 });
});
