import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { cookies } from "next/headers";

const Body = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const POST = handle(async (req: Request) => {
  const body = Body.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { username: body.username } });
  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    return fail("Invalid username or password", 401);
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return ok({ id: user.id, name: user.name, role: user.role });
});
