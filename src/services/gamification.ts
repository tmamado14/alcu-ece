// Gamification service: XP ledger, badge/achievement evaluation, quest progress.

import { prisma } from "@/lib/db";
import {
  ACHIEVEMENTS,
  BADGES,
  evaluateBadgeRules,
  levelForXp,
  periodKeyFor,
  QUESTS,
  type AchievementContext,
  type BadgeRuleContext,
} from "@/lib/gamification";
import type { AttemptResult } from "@/lib/adaptive";

export async function awardXP(userId: string, amount: number, source: string, meta: Record<string, unknown> = {}) {
  if (amount <= 0) return;
  await prisma.xPEvent.create({ data: { userId, amount, source, meta: JSON.stringify(meta) } });
  await prisma.user.update({ where: { id: userId }, data: { totalXp: { increment: amount } } });
}

// ---------- Badges ----------

export async function evaluateBadges(userId: string) {
  const [attempts, progress, earned] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId, result: { not: "pending" } },
      orderBy: { createdAt: "asc" },
      include: { problem: { include: { tags: true, topic: true } } },
    }),
    prisma.learnerTopicProgress.findMany({ where: { userId }, include: { topic: true } }),
    prisma.userBadge.findMany({ where: { userId }, include: { badge: true } }),
  ]);

  const alreadyEarned = new Set(earned.map((e) => e.badge.code));

  // longest current streak of attempts without giving up (counted from the end)
  let noGiveUpStreak = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    if (attempts[i].result === "gave_up") break;
    noGiveUpStreak++;
  }

  const tagSolveCounts = new Map<string, number>();
  let comebackCount = 0;
  const missedProblemIds = new Set<string>();
  for (const a of attempts) {
    const solved = a.result === "correct_first" || a.result === "correct_second";
    if (solved) {
      for (const t of a.problem.tags) tagSolveCounts.set(t.tag, (tagSolveCounts.get(t.tag) ?? 0) + 1);
      if (missedProblemIds.has(a.problemId)) comebackCount++;
    } else {
      missedProblemIds.add(a.problemId);
    }
  }

  const attemptsByTopicSlug = new Map<string, number>();
  for (const a of attempts) {
    const slug = a.problem.topic.slug;
    attemptsByTopicSlug.set(slug, (attemptsByTopicSlug.get(slug) ?? 0) + 1);
  }

  const subjectTopics = await prisma.topic.findMany({
    where: { subject: { slug: "feedback-control-systems" }, parentTopicId: { not: null } },
  });

  const ctx: BadgeRuleContext = {
    subjectSlug: "feedback-control-systems",
    totalAttempts: attempts.length,
    attemptsByTopicSlug,
    correctSecondTryCount: attempts.filter((a) => a.result === "correct_second").length,
    noGiveUpStreak,
    passedTopicSlugs: new Set(
      progress.filter((p) => p.status === "passed" || p.status === "mastered").map((p) => p.topic.slug)
    ),
    masteredTopicSlugs: new Set(progress.filter((p) => p.status === "mastered").map((p) => p.topic.slug)),
    allSubjectTopicSlugs: subjectTopics.map((t) => t.slug),
    comebackCount,
    tagSolveCounts,
  };

  const newlyEarned = evaluateBadgeRules(ctx, alreadyEarned);
  const results: { code: string; title: string; icon: string }[] = [];
  for (const def of newlyEarned) {
    const badge = await prisma.badge.findUnique({ where: { code: def.code } });
    if (!badge) continue;
    await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
    results.push({ code: def.code, title: def.title, icon: def.icon });
  }
  return results;
}

// ---------- Achievements ----------

export async function evaluateAchievements(userId: string) {
  const [attempts, progress, earned, questsCompleted, user, subjects, leafTopics, parentTopics] =
    await Promise.all([
      prisma.attempt.findMany({
        where: { userId, result: { not: "pending" } },
        orderBy: { createdAt: "asc" },
        include: { problem: { include: { tags: true, topic: { include: { parentTopic: true } } } } },
      }),
      prisma.learnerTopicProgress.findMany({ where: { userId }, include: { topic: true } }),
      prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
      prisma.userQuest.count({ where: { userId, completedAt: { not: null } } }),
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { totalXp: true } }),
      prisma.subject.findMany({ select: { id: true } }),
      prisma.topic.findMany({ where: { parentTopicId: { not: null } }, select: { id: true, subjectId: true } }),
      prisma.topic.findMany({ where: { parentTopicId: null }, select: { id: true, subjectId: true } }),
    ]);
  const alreadyEarned = new Set(earned.map((e) => e.achievement.code));

  const solvedResults = new Set(["correct_first", "correct_second"]);

  // ---- single pass over the attempt history (chronological) ----
  let totalSolved = 0;
  let bestCorrectStreak = 0, curCorrectStreak = 0;
  let bestFirstTryStreak = 0, curFirstTryStreak = 0;
  let hardSolvedCount = 0, veryHardSolved = false, hardFirstTrySolved = false;
  let fastestFirstTrySec: number | null = null;
  let halfTimeSolveCount = 0;
  let comebackCount = 0, thirdTryComeback = false, bounceBack = false, mistakeRepaired = false;
  let nightOwlSolve = false, earlyBirdSolve = false;
  let weekendSaturdaySolve = false, weekendSundaySolve = false;
  let missRun = 0;
  const missCountByProblem = new Map<string, number>();
  const dayStats = new Map<string, { attempts: number; solved: number }>();
  const solvedAnswerTypes = new Set<string>();
  const attemptedSubjectIds = new Set<string>();
  const attemptedGroupIds = new Set<string>(); // parent topic (group) ids with >= 1 attempt

  for (const a of attempts) {
    const solved = solvedResults.has(a.result);
    const topic = a.problem.topic;

    attemptedSubjectIds.add(topic.subjectId);
    attemptedGroupIds.add(topic.parentTopic?.id ?? topic.id);

    const dayKey = a.createdAt.toISOString().slice(0, 10);
    const day = dayStats.get(dayKey) ?? { attempts: 0, solved: 0 };
    day.attempts++;
    if (solved) day.solved++;
    dayStats.set(dayKey, day);

    if (solved) {
      totalSolved++;
      solvedAnswerTypes.add(a.problem.answerType);

      curCorrectStreak++;
      bestCorrectStreak = Math.max(bestCorrectStreak, curCorrectStreak);
      if (a.result === "correct_first") {
        curFirstTryStreak++;
        bestFirstTryStreak = Math.max(bestFirstTryStreak, curFirstTryStreak);
        if (a.timeSpentSec > 0) {
          fastestFirstTrySec =
            fastestFirstTrySec === null ? a.timeSpentSec : Math.min(fastestFirstTrySec, a.timeSpentSec);
        }
        if (a.problem.difficulty >= 7) hardFirstTrySolved = true;
      } else {
        curFirstTryStreak = 0;
      }

      if (a.problem.difficulty >= 7) hardSolvedCount++;
      if (a.problem.difficulty >= 9) veryHardSolved = true;
      if (a.timeSpentSec > 0 && a.timeSpentSec * 2 <= a.problem.estimatedTime) halfTimeSolveCount++;

      const hour = a.createdAt.getHours();
      if (hour < 5) nightOwlSolve = true;
      else if (hour < 8) earlyBirdSolve = true;
      const weekday = a.createdAt.getDay();
      if (weekday === 6) weekendSaturdaySolve = true;
      if (weekday === 0) weekendSundaySolve = true;

      const priorMisses = missCountByProblem.get(a.problemId) ?? 0;
      if (priorMisses >= 1) { comebackCount++; mistakeRepaired = true; }
      if (priorMisses >= 2) thirdTryComeback = true;
      if (missRun >= 3) bounceBack = true;
      missRun = 0;
    } else {
      curCorrectStreak = 0;
      curFirstTryStreak = 0;
      missRun++;
      missCountByProblem.set(a.problemId, (missCountByProblem.get(a.problemId) ?? 0) + 1);
    }
  }

  // consecutive active days ending today
  let activeDaysStreak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (dayStats.has(key)) {
      activeDaysStreak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else break;
  }

  // ---- mastery / exploration aggregates ----
  const passedTopicCount = progress.filter((p) => p.status === "passed" || p.status === "mastered").length;
  const masteredTopicIds = new Set(progress.filter((p) => p.status === "mastered").map((p) => p.topicId));
  const masteredTopicCount = masteredTopicIds.size;

  const leavesBySubject = new Map<string, string[]>();
  for (const t of leafTopics) {
    const list = leavesBySubject.get(t.subjectId) ?? [];
    list.push(t.id);
    leavesBySubject.set(t.subjectId, list);
  }
  let subjectsMasteredCount = 0;
  let subjectsWithTopics = 0;
  for (const leaves of leavesBySubject.values()) {
    subjectsWithTopics++;
    if (leaves.every((id) => masteredTopicIds.has(id))) subjectsMasteredCount++;
  }
  const allSubjectsMastered = subjectsWithTopics > 0 && subjectsMasteredCount === subjectsWithTopics;

  const groupsBySubject = new Map<string, string[]>();
  for (const t of parentTopics) {
    const list = groupsBySubject.get(t.subjectId) ?? [];
    list.push(t.id);
    groupsBySubject.set(t.subjectId, list);
  }
  let attemptedAllTopicGroups = false;
  for (const groups of groupsBySubject.values()) {
    if (groups.length > 0 && groups.every((id) => attemptedGroupIds.has(id))) {
      attemptedAllTopicGroups = true;
      break;
    }
  }
  const subjectIdsWithTopics = new Set(leafTopics.map((t) => t.subjectId));
  const attemptedEverySubject =
    subjectIdsWithTopics.size > 0 &&
    subjects.filter((s) => subjectIdsWithTopics.has(s.id)).every((s) => attemptedSubjectIds.has(s.id));

  // ---- subject-specific stats (Feedback & Control Systems lore) ----
  const stabilityAttempts = attempts.filter(
    (a) => a.problem.topic.parentTopic?.slug === "stability" || a.problem.topic.slug === "stability"
  );
  let stabilityCorrectStreak = 0;
  for (let i = stabilityAttempts.length - 1; i >= 0; i--) {
    if (solvedResults.has(stabilityAttempts[i].result)) stabilityCorrectStreak++;
    else break;
  }

  const trTopics = await prisma.topic.findMany({
    where: { parentTopic: { slug: "time-response-analysis" } },
    select: { id: true },
  });
  const trPassed =
    trTopics.length > 0 &&
    trTopics.every((t) =>
      progress.some((p) => p.topicId === t.id && (p.status === "passed" || p.status === "mastered"))
    );

  const ctx: AchievementContext = {
    firstTryFirstProblem: attempts.length > 0 && attempts[0].result === "correct_first",
    mistakeRepaired,
    persistenceSecondTryAfterMiss: attempts.some((a) => a.result === "correct_second"),
    activeDaysStreak,
    routhTableSolved: attempts.some(
      (a) => solvedResults.has(a.result) && a.problem.tags.some((t) => t.tag === "routh-hurwitz")
    ),
    timeResponsePassed: trPassed,
    stabilityCorrectStreak,
    frequencyAttempts: attempts.filter(
      (a) => a.problem.topic.parentTopic?.slug === "frequency-response"
    ).length,
    totalAttempts: attempts.length,
    totalSolved,
    bestCorrectStreak,
    bestFirstTryStreak,
    totalActiveDays: dayStats.size,
    passedTopicCount,
    masteredTopicCount,
    subjectsMasteredCount,
    allSubjectsMastered,
    hardSolvedCount,
    veryHardSolved,
    hardFirstTrySolved,
    fastestFirstTrySec,
    halfTimeSolveCount,
    comebackCount,
    thirdTryComeback,
    bounceBack,
    attemptedAllTopicGroups,
    attemptedEverySubject,
    solvedAnswerTypes,
    questsCompleted,
    totalXp: user.totalXp,
    level: levelForXp(user.totalXp).level,
    nightOwlSolve,
    earlyBirdSolve,
    weekendSaturdaySolve,
    weekendSundaySolve,
    perfectDay: [...dayStats.values()].some((d) => d.attempts >= 5 && d.solved === d.attempts),
    earnedCodes: new Set(alreadyEarned),
  };

  // Evaluate in catalog order; the platinum meta achievement is last, so
  // earnedCodes already includes everything unlocked in this pass.
  const results: { code: string; title: string; icon: string }[] = [];
  for (const def of ACHIEVEMENTS) {
    if (alreadyEarned.has(def.code)) continue;
    if (!def.earned(ctx)) continue;
    const ach = await prisma.achievement.findUnique({ where: { code: def.code } });
    if (!ach) continue;
    await prisma.userAchievement.create({ data: { userId, achievementId: ach.id } });
    ctx.earnedCodes.add(def.code);
    results.push({ code: def.code, title: def.title, icon: def.icon });
  }
  return results;
}

function isTimeResponseSlug(slug: string): boolean {
  return [
    "first-order-systems", "second-order-systems", "damping-ratio", "natural-frequency",
    "percent-overshoot", "settling-time", "rise-time", "steady-state-error",
  ].includes(slug);
}

// ---------- Quests ----------

export interface QuestEventInfo {
  result: AttemptResult;
  topicSlug: string;
  difficulty: number;
  isReview: boolean;
  passedTopicNow?: boolean; // topic transitioned to passed on this attempt
  masteredTopicNow?: boolean; // topic transitioned to mastered on this attempt
}

/** Topic groups used by quest rules: maps parent slugs to member subtopic slugs. */
const TOPIC_GROUPS: Record<string, (slug: string) => boolean> = {
  "time-response": (s) => isTimeResponseSlug(s),
  stability: (s) => ["poles-and-stability", "routh-hurwitz-criterion", "relative-stability"].includes(s),
};

export async function updateQuestProgress(userId: string, ev: QuestEventInfo) {
  const completed: { code: string; title: string; xpReward: number }[] = [];
  const solved = ev.result === "correct_first" || ev.result === "correct_second";

  for (const q of QUESTS) {
    const periodKey = periodKeyFor(q.cadence);
    let increment = 0;

    switch (q.ruleType) {
      case "solve_topic_count": {
        const group = TOPIC_GROUPS[q.ruleParams.topicGroup as string];
        if (group?.(ev.topicSlug) && solved) increment = 1;
        break;
      }
      case "correct_count": {
        const group = TOPIC_GROUPS[q.ruleParams.topicGroup as string];
        if (group?.(ev.topicSlug) && solved) increment = 1;
        break;
      }
      case "review_count":
        if (ev.isReview) increment = 1;
        break;
      case "hard_solve":
        if (solved && ev.difficulty >= (q.ruleParams.minDifficulty as number)) increment = 1;
        break;
      case "mixed_set":
        increment = 1; // any completed attempt counts toward the mixed sweep
        break;
      case "pass_topic":
        if (ev.passedTopicNow) increment = 1;
        break;
      case "master_topic":
        if (ev.masteredTopicNow) increment = 1;
        break;
    }

    if (increment === 0) continue;
    const uq = await getOrCreateUserQuest(userId, q.code, periodKey, q.target);
    if (uq.completedAt) continue;
    const newProgress = uq.progress + increment;
    if (newProgress >= q.target) {
      await prisma.userQuest.update({ where: { id: uq.id }, data: { progress: q.target } });
      await completeQuest(userId, uq.id, q, completed);
    } else {
      await prisma.userQuest.update({ where: { id: uq.id }, data: { progress: newProgress } });
    }
  }

  return completed;
}

async function completeQuest(
  userId: string,
  userQuestId: string,
  q: { code: string; title: string; xpReward: number },
  completed: { code: string; title: string; xpReward: number }[]
) {
  await prisma.userQuest.update({ where: { id: userQuestId }, data: { completedAt: new Date() } });
  await awardXP(userId, q.xpReward, "quest_complete", { quest: q.code });
  completed.push({ code: q.code, title: q.title, xpReward: q.xpReward });
}

async function getOrCreateUserQuest(userId: string, questCode: string, periodKey: string, target: number) {
  const quest = await prisma.quest.findUniqueOrThrow({ where: { code: questCode } });
  return prisma.userQuest.upsert({
    where: { userId_questId_periodKey: { userId, questId: quest.id, periodKey } },
    create: { userId, questId: quest.id, periodKey, target },
    update: {},
  });
}

/** Current-period quest list with progress for the quests page. */
export async function getActiveQuests(userId: string) {
  const out: {
    code: string; title: string; description: string; cadence: string;
    progress: number; target: number; xpReward: number; completed: boolean;
    imagePath: string;
  }[] = [];
  for (const q of QUESTS) {
    const periodKey = periodKeyFor(q.cadence);
    const quest = await prisma.quest.findUnique({ where: { code: q.code } });
    if (!quest) continue;
    const uq = await prisma.userQuest.findUnique({
      where: { userId_questId_periodKey: { userId, questId: quest.id, periodKey } },
    });
    out.push({
      code: q.code,
      title: q.title,
      description: q.description,
      cadence: q.cadence,
      progress: Math.max(0, uq?.progress ?? 0),
      target: q.target,
      xpReward: q.xpReward,
      completed: !!uq?.completedAt,
      imagePath: q.imagePath,
    });
  }
  return out;
}
