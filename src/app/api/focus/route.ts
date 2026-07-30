// Learner focus: the topic group or subtopic to master next.
//
// GET    → current focus with goal progress (null when none is set)
// POST   → { topicId } sets it; { topicId: null } clears it
// DELETE → clears it

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { clearFocus, getFocus, setFocus } from "@/services/focus";

const Body = z.object({ topicId: z.string().min(1).nullable() });

export const GET = handle(async () => {
  const user = await requireUser();
  return ok({ focus: await getFocus(user.id) });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const { topicId } = Body.parse(await req.json());
  if (topicId === null) {
    await clearFocus(user.id);
    return ok({ focus: null });
  }
  return ok({ focus: await setFocus(user.id, topicId) });
});

export const DELETE = handle(async () => {
  const user = await requireUser();
  await clearFocus(user.id);
  return ok({ focus: null });
});
