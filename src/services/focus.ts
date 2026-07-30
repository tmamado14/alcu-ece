// Focus: the learner's chosen "master this next" goal.
//
// A focus points at either a topic group (all of its subtopics) or a single
// subtopic. While it is set, adaptive practice draws only from that subtree and
// leans on one target subtopic at a time, walking them in curriculum order.
// Explicit drills (?topicId=…) and review mode ignore the focus.

import { prisma } from "@/lib/db";
import { pickFocusTarget, type FocusSubtopic, type TopicStatus } from "@/lib/adaptive";

export interface FocusSubtopicView {
  id: string;
  slug: string;
  title: string;
  status: TopicStatus;
  rating: number;
  problemCount: number;
  isTarget: boolean;
}

export interface FocusSummary {
  topic: { id: string; slug: string; title: string; isGroup: boolean };
  /** Group title when the focus is a single subtopic, for breadcrumb display. */
  groupTitle: string | null;
  subtopics: FocusSubtopicView[];
  masteredCount: number;
  passedCount: number;
  /** Subtopics that actually have questions — the denominator for the goal. */
  total: number;
  target: { id: string; slug: string; title: string } | null;
  complete: boolean;
  setAt: string | null;
}

/** Leaf topic ids covered by a focus: a group's children, or the subtopic itself. */
export async function focusTopicIds(topicId: string): Promise<string[]> {
  const children = await prisma.topic.findMany({ where: { parentTopicId: topicId }, select: { id: true } });
  return children.length > 0 ? children.map((c) => c.id) : [topicId];
}

async function buildSummary(userId: string, topicId: string, setAt: Date | null): Promise<FocusSummary | null> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { parentTopic: { select: { title: true } } },
  });
  if (!topic) return null;

  const leafIds = await focusTopicIds(topicId);
  const leaves = await prisma.topic.findMany({
    where: { id: { in: leafIds } },
    orderBy: { sortOrder: "asc" },
    include: {
      prerequisites: { select: { requiredTopicId: true } },
      _count: { select: { problems: { where: { status: "active" } } } },
    },
  });
  const progress = await prisma.learnerTopicProgress.findMany({
    where: { userId, topicId: { in: leafIds } },
  });
  const progByTopic = new Map(progress.map((p) => [p.topicId, p]));

  const forPicker: FocusSubtopic[] = leaves.map((t) => ({
    id: t.id,
    sortOrder: t.sortOrder,
    status: (progByTopic.get(t.id)?.status ?? "not_started") as TopicStatus,
    prerequisiteIds: t.prerequisites.map((p) => p.requiredTopicId),
    problemCount: t._count.problems,
  }));
  const target = pickFocusTarget(forPicker);

  const subtopics: FocusSubtopicView[] = leaves.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    status: (progByTopic.get(t.id)?.status ?? "not_started") as TopicStatus,
    rating: progByTopic.get(t.id)?.rating ?? 1000,
    problemCount: t._count.problems,
    isTarget: t.id === target?.id,
  }));
  const withProblems = subtopics.filter((s) => s.problemCount > 0);

  return {
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      isGroup: topic.parentTopicId === null,
    },
    groupTitle: topic.parentTopic?.title ?? null,
    subtopics,
    masteredCount: withProblems.filter((s) => s.status === "mastered").length,
    passedCount: withProblems.filter((s) => s.status === "passed" || s.status === "mastered").length,
    total: withProblems.length,
    target: target
      ? (() => {
          const t = subtopics.find((s) => s.id === target.id)!;
          return { id: t.id, slug: t.slug, title: t.title };
        })()
      : null,
    complete: withProblems.length > 0 && target === null,
    setAt: setAt?.toISOString() ?? null,
  };
}

export async function getFocus(userId: string): Promise<FocusSummary | null> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { focusTopicId: true, focusSetAt: true },
  });
  if (!user.focusTopicId) return null;
  const summary = await buildSummary(userId, user.focusTopicId, user.focusSetAt);
  // The focused topic was deleted (e.g. a curriculum reorganisation): drop it
  // rather than leaving practice pinned to nothing.
  if (!summary) {
    await clearFocus(userId);
    return null;
  }
  return summary;
}

export async function setFocus(userId: string, topicId: string): Promise<FocusSummary> {
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) throw new Error("Topic not found");

  const leafIds = await focusTopicIds(topicId);
  const problems = await prisma.problem.count({
    where: { topicId: { in: leafIds }, status: "active" },
  });
  if (problems === 0) throw new Error("That topic has no questions yet, so it cannot be a focus");

  await prisma.user.update({
    where: { id: userId },
    data: { focusTopicId: topicId, focusSetAt: new Date() },
  });
  return (await getFocus(userId))!;
}

export async function clearFocus(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { focusTopicId: null, focusSetAt: null },
  });
}
