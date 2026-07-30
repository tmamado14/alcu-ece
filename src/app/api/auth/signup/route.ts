// Invite-only signup: redeem a code, create a learner, start a session.
import { z } from "zod";
import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { redeemInviteAndCreateUser, SignupError } from "@/services/invites";

const Body = z.object({
  code: z.string().min(1, "An invite code is required"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username may only contain letters, numbers, dot, dash, underscore"),
  name: z.string().trim().min(1, "Your name is required").max(60),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const POST = handle(async (req: Request) => {
  const body = Body.parse(await req.json());

  let user;
  try {
    user = await redeemInviteAndCreateUser(body);
  } catch (e) {
    if (e instanceof SignupError) return fail(e.message, e.status);
    throw e;
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(user.id), SESSION_COOKIE_OPTIONS);
  return ok({ id: user.id, name: user.name, role: user.role }, { status: 201 });
});
