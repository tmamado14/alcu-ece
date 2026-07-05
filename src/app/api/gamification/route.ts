// Badges, achievements, and quests for the current user.
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { getActiveQuests } from "@/services/gamification";

export const GET = handle(async () => {
  const user = await requireUser();
  const [badges, userBadges, achievements, userAchievements, quests] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId: user.id } }),
    prisma.achievement.findMany(),
    prisma.userAchievement.findMany({ where: { userId: user.id } }),
    getActiveQuests(user.id),
  ]);
  const earnedBadgeIds = new Map(userBadges.map((b) => [b.badgeId, b.earnedAt]));
  const earnedAchIds = new Map(userAchievements.map((a) => [a.achievementId, a.earnedAt]));

  return ok({
    badges: badges.map((b) => ({
      code: b.code, title: b.title, description: b.description, icon: b.icon,
      earned: earnedBadgeIds.has(b.id),
      earnedAt: earnedBadgeIds.get(b.id) ?? null,
    })),
    achievements: achievements
      .filter((a) => !a.hidden || earnedAchIds.has(a.id))
      .map((a) => ({
        code: a.code, title: a.title, description: a.description, icon: a.icon, hidden: a.hidden,
        earned: earnedAchIds.has(a.id),
        earnedAt: earnedAchIds.get(a.id) ?? null,
      })),
    hiddenAchievementsRemaining: achievements.filter((a) => a.hidden && !earnedAchIds.has(a.id)).length,
    quests,
  });
});
