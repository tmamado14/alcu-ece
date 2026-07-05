// Reset the current user's learning progress (for testing).
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";

export const POST = handle(async () => {
  const user = await requireUser();
  await prisma.attemptAnswer.deleteMany({ where: { attempt: { userId: user.id } } });
  await prisma.attempt.deleteMany({ where: { userId: user.id } });
  await prisma.learnerTopicProgress.deleteMany({ where: { userId: user.id } });
  await prisma.xPEvent.deleteMany({ where: { userId: user.id } });
  await prisma.userBadge.deleteMany({ where: { userId: user.id } });
  await prisma.userQuest.deleteMany({ where: { userId: user.id } });
  await prisma.userAchievement.deleteMany({ where: { userId: user.id } });
  await prisma.bookmark.deleteMany({ where: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { totalXp: 0 } });
  return ok({ ok: true });
});
