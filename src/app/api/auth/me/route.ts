import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { levelForXp } from "@/lib/gamification";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    totalXp: user.totalXp,
    level: levelForXp(user.totalXp),
    settings: JSON.parse(user.settings),
    createdAt: user.createdAt,
  });
});
