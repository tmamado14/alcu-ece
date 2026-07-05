import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const POST = handle(async () => {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return ok({ ok: true });
});
