// Admin: issue, list, and revoke invite codes.
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { createInvite, listInvites, setInviteRevoked } from "@/services/invites";

export const GET = handle(async () => {
  await requireAdmin();
  return ok(await listInvites());
});

const CreateBody = z.object({
  label: z.string().max(80).default(""),
  maxUses: z.number().int().min(1).max(200).default(1),
  expiresInDays: z.number().int().min(1).max(365).nullish(),
});

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const body = CreateBody.parse(await req.json());
  const invite = await createInvite({ ...body, createdById: admin.id });
  return ok(invite, { status: 201 });
});

const PatchBody = z.object({
  id: z.string().min(1),
  revoked: z.boolean(),
});

export const PATCH = handle(async (req: Request) => {
  await requireAdmin();
  const body = PatchBody.parse(await req.json());
  return ok(await setInviteRevoked(body.id, body.revoked));
});
