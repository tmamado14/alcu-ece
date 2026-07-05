// XP economy, levels, badge rules, quest rules.

import type { AttemptResult } from "./adaptive";

// ---------- XP ----------

export type XPSource =
  | "correct_first_try"
  | "correct_second_try"
  | "wrong"
  | "gave_up"
  | "topic_passed"
  | "topic_mastered"
  | "quest_complete"
  | "daily_review"
  | "weak_topic_return"
  | "solution_read_after_wrong"
  | "comeback";

export function xpForAttempt(result: AttemptResult, difficulty: number): number {
  const base = 10 + difficulty * 3; // 13..40
  switch (result) {
    case "correct_first":
      return base;
    case "correct_second":
      return Math.round(base * 0.4);
    case "gave_up":
      return 1; // small consolation for engaging + reading solution
    case "wrong":
      return 2; // reading the solution after a miss still teaches
  }
}

export const XP_EVENTS: Record<string, number> = {
  topic_passed: 100,
  topic_mastered: 250,
  daily_review: 30,
  weak_topic_return: 25,
  comeback: 20,
};

/** Global level curve: level n requires 100 * n^1.5 cumulative XP. */
export function levelForXp(totalXp: number): { level: number; currentXp: number; nextLevelXp: number } {
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= totalXp) level++;
  const floor = cumulativeXpForLevel(level);
  const ceil = cumulativeXpForLevel(level + 1);
  return { level, currentXp: totalXp - floor, nextLevelXp: ceil - floor };
}

export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

// ---------- Badges ----------

export interface BadgeRuleContext {
  subjectSlug: string;
  totalAttempts: number;
  attemptsByTopicSlug: Map<string, number>;
  correctSecondTryCount: number;
  noGiveUpStreak: number;
  passedTopicSlugs: Set<string>;
  masteredTopicSlugs: Set<string>;
  allSubjectTopicSlugs: string[];
  comebackCount: number; // solved a problem type previously missed
  tagSolveCounts: Map<string, number>;
}

export interface BadgeDef {
  code: string;
  title: string;
  description: string;
  icon: string;
  earned: (ctx: BadgeRuleContext) => boolean;
}

export const BADGES: BadgeDef[] = [
  {
    code: "first-feedback",
    title: "First Feedback",
    description: "Answer your first Control Systems question.",
    icon: "🔁",
    earned: (c) => c.totalAttempts >= 1,
  },
  {
    code: "closed-loop-beginner",
    title: "Closed-Loop Beginner",
    description: "Pass the open-loop vs closed-loop topic.",
    icon: "➿",
    earned: (c) => c.passedTopicSlugs.has("open-vs-closed-loop"),
  },
  {
    code: "routh-rookie",
    title: "Routh Rookie",
    description: "Solve 10 Routh-Hurwitz problems.",
    icon: "📋",
    earned: (c) => (c.tagSolveCounts.get("routh-hurwitz") ?? 0) >= 10,
  },
  {
    code: "root-locus-explorer",
    title: "Root Locus Explorer",
    description: "Pass root locus rules.",
    icon: "🧭",
    earned: (c) => c.passedTopicSlugs.has("root-locus-rules"),
  },
  {
    code: "stability-sentinel",
    title: "Stability Sentinel",
    description: "Master all stability subtopics.",
    icon: "🛡️",
    earned: (c) =>
      ["poles-and-stability", "routh-hurwitz-criterion", "relative-stability"].every((s) =>
        c.masteredTopicSlugs.has(s)
      ),
  },
  {
    code: "second-try-scholar",
    title: "Second Try Scholar",
    description: "Solve 10 problems correctly on the second try.",
    icon: "🎯",
    earned: (c) => c.correctSecondTryCount >= 10,
  },
  {
    code: "comeback-gain",
    title: "Comeback Gain",
    description: "Correctly solve a problem you previously missed.",
    icon: "📈",
    earned: (c) => c.comebackCount >= 1,
  },
  {
    code: "no-skip-streak",
    title: "No Skip Streak",
    description: "Attempt 20 problems in a row without giving up.",
    icon: "🔥",
    earned: (c) => c.noGiveUpStreak >= 20,
  },
  {
    code: "bode-builder",
    title: "Bode Builder",
    description: "Pass the Bode plots topic.",
    icon: "📊",
    earned: (c) => c.passedTopicSlugs.has("bode-plots"),
  },
  {
    code: "pid-apprentice",
    title: "PID Apprentice",
    description: "Pass the P/PI/PD/PID controllers topic.",
    icon: "🎛️",
    earned: (c) => c.passedTopicSlugs.has("pid-controllers"),
  },
  {
    code: "control-systems-master",
    title: "Control Systems Master",
    description: "Master every Feedback and Control Systems topic.",
    icon: "👑",
    earned: (c) =>
      c.allSubjectTopicSlugs.length > 0 &&
      c.allSubjectTopicSlugs.every((s) => c.masteredTopicSlugs.has(s)),
  },
];

export function evaluateBadgeRules(ctx: BadgeRuleContext, alreadyEarned: Set<string>): BadgeDef[] {
  return BADGES.filter((b) => !alreadyEarned.has(b.code) && b.earned(ctx));
}

// ---------- Achievements ----------

export interface AchievementContext {
  firstTryFirstProblem: boolean; // very first attempt was correct_first
  mistakeRepaired: boolean; // re-solved a previously wrong problem
  persistenceSecondTryAfterMiss: boolean; // got one right on second try
  activeDaysStreak: number;
  routhTableSolved: boolean;
  timeResponsePassed: boolean; // "From Overshoot to Settling"
  stabilityCorrectStreak: number;
  frequencyAttempts: number;
}

export interface AchievementDef {
  code: string;
  title: string;
  description: string;
  hidden: boolean;
  icon: string;
  earned: (c: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    code: "first-try-first-win",
    title: "First Try, First Win",
    description: "Answer your very first problem correctly on the first try.",
    hidden: false, icon: "🌟",
    earned: (c) => c.firstTryFirstProblem,
  },
  {
    code: "mistake-repaired",
    title: "Mistake Repaired",
    description: "Correctly re-solve a problem you previously got wrong.",
    hidden: false, icon: "🔧",
    earned: (c) => c.mistakeRepaired,
  },
  {
    code: "persistence-pays",
    title: "Persistence Pays",
    description: "Turn a first-try miss into a second-try success.",
    hidden: false, icon: "💪",
    earned: (c) => c.persistenceSecondTryAfterMiss,
  },
  {
    code: "five-day-feedback-loop",
    title: "Five-Day Feedback Loop",
    description: "Practice on five days in a row.",
    hidden: false, icon: "📅",
    earned: (c) => c.activeDaysStreak >= 5,
  },
  {
    code: "routh-table-complete",
    title: "Routh Table Complete",
    description: "Solve a full Routh-Hurwitz stability problem.",
    hidden: true, icon: "🧮",
    earned: (c) => c.routhTableSolved,
  },
  {
    code: "overshoot-to-settling",
    title: "From Overshoot to Settling",
    description: "Pass the complete Time Response Analysis topic group.",
    hidden: true, icon: "〰️",
    earned: (c) => c.timeResponsePassed,
  },
  {
    code: "against-the-poles",
    title: "Against the Poles",
    description: "Answer 5 stability questions correctly in a row.",
    hidden: true, icon: "⚔️",
    earned: (c) => c.stabilityCorrectStreak >= 5,
  },
  {
    code: "frequency-domain-traveler",
    title: "Frequency Domain Traveler",
    description: "Attempt 15 frequency-response problems.",
    hidden: true, icon: "🌐",
    earned: (c) => c.frequencyAttempts >= 15,
  },
];

// ---------- Quests ----------

export interface QuestDef {
  code: string;
  title: string;
  description: string;
  cadence: "daily" | "weekly";
  ruleType: string;
  ruleParams: Record<string, unknown>;
  target: number;
  xpReward: number;
}

export const QUESTS: QuestDef[] = [
  {
    code: "daily-time-response-5",
    title: "Transient Trainer",
    description: "Solve 5 Time Response problems today.",
    cadence: "daily", ruleType: "solve_topic_count",
    ruleParams: { topicGroup: "time-response" }, target: 5, xpReward: 50,
  },
  {
    code: "daily-stability-3",
    title: "Stability Check",
    description: "Correctly answer 3 stability questions today.",
    cadence: "daily", ruleType: "correct_count",
    ruleParams: { topicGroup: "stability" }, target: 3, xpReward: 40,
  },
  {
    code: "daily-review-2",
    title: "Error Correction",
    description: "Re-attempt 2 previously missed questions.",
    cadence: "daily", ruleType: "review_count",
    ruleParams: {}, target: 2, xpReward: 40,
  },
  {
    code: "weekly-pass-topic",
    title: "New Ground",
    description: "Pass one new topic this week.",
    cadence: "weekly", ruleType: "pass_topic",
    ruleParams: {}, target: 1, xpReward: 120,
  },
  {
    code: "weekly-master-topic",
    title: "Total Command",
    description: "Master one topic this week.",
    cadence: "weekly", ruleType: "master_topic",
    ruleParams: {}, target: 1, xpReward: 200,
  },
  {
    code: "daily-hard-1",
    title: "Boss Pole",
    description: "Solve one hard problem (difficulty ≥ 7) today.",
    cadence: "daily", ruleType: "hard_solve",
    ruleParams: { minDifficulty: 7 }, target: 1, xpReward: 60,
  },
  {
    code: "weekly-mixed-10",
    title: "Full Sweep",
    description: "Complete a 10-problem mixed review this week.",
    cadence: "weekly", ruleType: "mixed_set",
    ruleParams: {}, target: 10, xpReward: 100,
  },
];

export function periodKeyFor(cadence: "daily" | "weekly", date = new Date()): string {
  if (cadence === "daily") return date.toISOString().slice(0, 10);
  // ISO week
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
