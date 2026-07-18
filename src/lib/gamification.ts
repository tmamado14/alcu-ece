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

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

/** All answer types a learner can encounter; used by the variety achievement. */
export const ALL_ANSWER_TYPES = [
  "multiple_choice_single",
  "numerical_tolerance",
  "text_short",
  "algebraic_expression",
  "true_false",
] as const;

export interface AchievementContext {
  // -- legacy / subject-specific stats --
  firstTryFirstProblem: boolean; // very first attempt was correct_first
  mistakeRepaired: boolean; // re-solved a previously wrong problem
  persistenceSecondTryAfterMiss: boolean; // got one right on second try
  activeDaysStreak: number; // consecutive practice days ending today
  routhTableSolved: boolean;
  timeResponsePassed: boolean; // "From Overshoot to Settling"
  stabilityCorrectStreak: number;
  frequencyAttempts: number;
  // -- volume --
  totalAttempts: number; // finalized attempts, any result
  totalSolved: number; // correct_first + correct_second
  // -- streaks --
  bestCorrectStreak: number; // longest run of solved attempts
  bestFirstTryStreak: number; // longest run of correct_first attempts
  totalActiveDays: number; // distinct practice days, ever
  // -- mastery --
  passedTopicCount: number; // topics passed or mastered
  masteredTopicCount: number;
  subjectsMasteredCount: number; // subjects with every leaf topic mastered
  allSubjectsMastered: boolean;
  // -- difficulty --
  hardSolvedCount: number; // solved with difficulty >= 7
  veryHardSolved: boolean; // solved with difficulty >= 9
  hardFirstTrySolved: boolean; // difficulty >= 7 solved on the first try
  // -- speed --
  fastestFirstTrySec: number | null; // fastest correct_first with recorded time
  halfTimeSolveCount: number; // solved in <= half the estimated time
  // -- comebacks --
  comebackCount: number; // solved a problem previously missed
  thirdTryComeback: boolean; // solved after missing the same problem twice
  bounceBack: boolean; // solved immediately after 3+ consecutive misses
  // -- exploration --
  attemptedAllTopicGroups: boolean; // every topic group of a subject attempted
  attemptedEverySubject: boolean;
  solvedAnswerTypes: Set<string>;
  // -- quests --
  questsCompleted: number;
  // -- xp --
  totalXp: number;
  level: number;
  // -- fun / time-of-day --
  nightOwlSolve: boolean; // solved between 00:00 and 04:59
  earlyBirdSolve: boolean; // solved between 05:00 and 07:59
  weekendSaturdaySolve: boolean;
  weekendSundaySolve: boolean;
  perfectDay: boolean; // a day with 5+ attempts, all solved
  // -- meta --
  earnedCodes: Set<string>; // achievement codes already earned (incl. this pass)
}

export interface AchievementDef {
  code: string;
  title: string;
  description: string;
  tier: AchievementTier;
  hidden: boolean;
  icon: string;
  imagePath: string; // badge art, /badges/achievements/<code>.png
  earned: (c: AchievementContext) => boolean;
}

function ach(
  code: string,
  title: string,
  description: string,
  tier: AchievementTier,
  icon: string,
  earned: (c: AchievementContext) => boolean,
  hidden = false
): AchievementDef {
  return { code, title, description, tier, hidden, icon, imagePath: `/badges/achievements/${code}.png`, earned };
}

/**
 * Achievement catalog, PS-trophy style. Order matters only for the platinum
 * meta achievement, which must stay last so `earnedCodes` already reflects
 * everything unlocked earlier in the same evaluation pass.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- Getting started (bronze) ----
  ach("first-try-first-win", "First Try, First Win", "Answer your very first problem correctly on the first try.", "bronze", "🌟",
    (c) => c.firstTryFirstProblem),
  ach("step-input", "Step Input", "Solve your first problem.", "bronze", "▶️",
    (c) => c.totalSolved >= 1),
  ach("mistake-repaired", "Mistake Repaired", "Correctly re-solve a problem you previously got wrong.", "bronze", "🔧",
    (c) => c.mistakeRepaired),
  ach("persistence-pays", "Persistence Pays", "Turn a first-try miss into a second-try success.", "bronze", "💪",
    (c) => c.persistenceSecondTryAfterMiss),

  // ---- Volume milestones ----
  ach("gain-of-ten", "Gain of Ten", "Solve 10 problems.", "bronze", "🔟",
    (c) => c.totalSolved >= 10),
  ach("rising-response", "Rising Response", "Solve 50 problems.", "silver", "📈",
    (c) => c.totalSolved >= 50),
  ach("century-of-signals", "Century of Signals", "Solve 100 problems.", "silver", "💯",
    (c) => c.totalSolved >= 100),
  ach("signal-marathon", "Signal Marathon", "Solve 250 problems.", "gold", "🏃",
    (c) => c.totalSolved >= 250),
  ach("the-500-club", "The 500 Club", "Solve 500 problems.", "gold", "🗼",
    (c) => c.totalSolved >= 500),
  ach("grinder-in-the-loop", "Grinder in the Loop", "Finish 100 attempts — right or wrong, every rep counts.", "bronze", "⚙️",
    (c) => c.totalAttempts >= 100),

  // ---- Correct-answer streaks ----
  ach("locked-on", "Locked On", "Solve 5 problems in a row.", "bronze", "🎯",
    (c) => c.bestCorrectStreak >= 5),
  ach("critically-damped", "Critically Damped", "Solve 10 problems in a row without a miss.", "silver", "🧊",
    (c) => c.bestCorrectStreak >= 10),
  ach("zero-steady-state-error", "Zero Steady-State Error", "Solve 25 problems in a row without a miss.", "gold", "🎼",
    (c) => c.bestCorrectStreak >= 25),
  ach("pure-precision", "Pure Precision", "Solve 10 problems in a row on the first try.", "gold", "💎",
    (c) => c.bestFirstTryStreak >= 10),

  // ---- Daily practice streaks ----
  ach("warming-up", "Warming Up", "Practice on 3 days in a row.", "bronze", "🔥",
    (c) => c.activeDaysStreak >= 3),
  ach("five-day-feedback-loop", "Five-Day Feedback Loop", "Practice on five days in a row.", "silver", "📅",
    (c) => c.activeDaysStreak >= 5),
  ach("fortnight-of-feedback", "Fortnight of Feedback", "Practice on 14 days in a row.", "gold", "🗓️",
    (c) => c.activeDaysStreak >= 14),
  ach("marginally-unstoppable", "Marginally Unstoppable", "Practice on 30 days in a row.", "gold", "♾️",
    (c) => c.activeDaysStreak >= 30),
  ach("regular-oscillator", "Regular Oscillator", "Practice on 30 different days in total.", "silver", "🌊",
    (c) => c.totalActiveDays >= 30),

  // ---- Mastery ----
  ach("threshold-crossed", "Threshold Crossed", "Pass your first topic.", "bronze", "🚪",
    (c) => c.passedTopicCount >= 1),
  ach("mastered-the-loop", "Mastered the Loop", "Master your first topic.", "silver", "🏵️",
    (c) => c.masteredTopicCount >= 1),
  ach("pole-placement-pro", "Pole Placement Pro", "Master 5 topics.", "silver", "📍",
    (c) => c.masteredTopicCount >= 5),
  ach("dominant-pole", "Dominant Pole", "Master 10 topics.", "gold", "🗿",
    (c) => c.masteredTopicCount >= 10),
  ach("full-state-mastery", "Full-State Mastery", "Master every topic in a subject.", "gold", "👑",
    (c) => c.subjectsMasteredCount >= 1),
  ach("grand-unified-engineer", "Grand Unified Engineer", "Master every topic in every subject.", "gold", "🌌",
    (c) => c.allSubjectsMastered, true),

  // ---- Difficulty ----
  ach("into-the-deep-end", "Into the Deep End", "Solve a hard problem (difficulty 7+).", "bronze", "🤿",
    (c) => c.hardSolvedCount >= 1),
  ach("no-second-guessing", "No Second-Guessing", "Solve a hard problem (difficulty 7+) on the first try.", "silver", "🥇",
    (c) => c.hardFirstTrySolved),
  ach("heavy-duty", "Heavy Duty", "Solve 25 hard problems (difficulty 7+).", "gold", "🏋️",
    (c) => c.hardSolvedCount >= 25),
  ach("edge-of-instability", "Edge of Instability", "Solve an expert problem (difficulty 9+).", "gold", "⚡",
    (c) => c.veryHardSolved),

  // ---- Speed ----
  ach("fast-transient", "Fast Transient", "Solve a problem first-try in under 30 seconds.", "bronze", "⏱️",
    (c) => c.fastestFirstTrySec !== null && c.fastestFirstTrySec <= 30),
  ach("underdamped-and-proud", "Underdamped and Proud", "Solve 10 problems in half their estimated time or less.", "silver", "🚀",
    (c) => c.halfTimeSolveCount >= 10),

  // ---- Comebacks ----
  ach("recovery-response", "Recovery Response", "Bounce back: solve a problem right after 3 misses in a row.", "bronze", "🩹",
    (c) => c.bounceBack),
  ach("third-times-the-charm", "Third Time's the Charm", "Solve a problem you had already missed twice.", "bronze", "🍀",
    (c) => c.thirdTryComeback),
  ach("robust-to-disturbance", "Robust to Disturbance", "Solve 5 problems you had previously missed.", "silver", "🛡️",
    (c) => c.comebackCount >= 5),

  // ---- Exploration ----
  ach("curriculum-cartographer", "Curriculum Cartographer", "Attempt a problem in every subject.", "bronze", "🗺️",
    (c) => c.attemptedEverySubject),
  ach("systems-surveyor", "Systems Surveyor", "Attempt a problem in every topic group of a subject.", "silver", "🧭",
    (c) => c.attemptedAllTopicGroups),
  ach("every-answer-counts", "Every Answer Counts", "Solve at least one problem of each answer format.", "silver", "🎲",
    (c) => ALL_ANSWER_TYPES.every((t) => c.solvedAnswerTypes.has(t))),

  // ---- Quests ----
  ach("quest-accepted", "Quest Accepted", "Complete your first quest.", "bronze", "🪧",
    (c) => c.questsCompleted >= 1),
  ach("seasoned-adventurer", "Seasoned Adventurer", "Complete 10 quests.", "silver", "⚔️",
    (c) => c.questsCompleted >= 10),
  ach("questline-legend", "Questline Legend", "Complete 50 quests.", "gold", "🐉",
    (c) => c.questsCompleted >= 50),

  // ---- Perfect sessions ----
  ach("flawless-frequency", "Flawless Frequency", "Solve 5 or more problems in one day without a single miss.", "silver", "✨",
    (c) => c.perfectDay),

  // ---- XP and levels ----
  ach("charged-up", "Charged Up", "Earn 1,000 total XP.", "silver", "🔋",
    (c) => c.totalXp >= 1000),
  ach("double-digits", "Double Digits", "Reach level 10.", "gold", "🔢",
    (c) => c.level >= 10),

  // ---- Fun / time-of-day (hidden surprises) ----
  ach("night-shift-engineer", "Night Shift Engineer", "Solve a problem between midnight and 5 AM.", "bronze", "🦉",
    (c) => c.nightOwlSolve, true),
  ach("morning-bode-call", "Morning Bode Call", "Solve a problem before 8 AM.", "bronze", "🐦",
    (c) => c.earlyBirdSolve, true),
  ach("weekend-duty-cycle", "Weekend Duty Cycle", "Solve problems on both a Saturday and a Sunday.", "bronze", "🔁",
    (c) => c.weekendSaturdaySolve && c.weekendSundaySolve),

  // ---- Subject lore (hidden, Feedback & Control Systems) ----
  ach("routh-table-complete", "Routh Table Complete", "Solve a full Routh-Hurwitz stability problem.", "bronze", "🧮",
    (c) => c.routhTableSolved, true),
  ach("overshoot-to-settling", "From Overshoot to Settling", "Pass the complete Time Response Analysis topic group.", "silver", "〰️",
    (c) => c.timeResponsePassed, true),
  ach("against-the-poles", "Against the Poles", "Answer 5 stability questions correctly in a row.", "silver", "⚔️",
    (c) => c.stabilityCorrectStreak >= 5, true),
  ach("frequency-domain-traveler", "Frequency Domain Traveler", "Attempt 15 frequency-response problems.", "silver", "🌐",
    (c) => c.frequencyAttempts >= 15, true),

  // ---- Platinum (must stay last) ----
  ach("closed-loop-perfection", "Closed-Loop Perfection", "Earn every other achievement. The loop is complete.", "platinum", "🏆",
    (c) => ACHIEVEMENTS.every((a) => a.tier === "platinum" || c.earnedCodes.has(a.code))),
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
  imagePath: string; // badge art, /badges/quests/<code>.png
}

const RAW_QUESTS: Omit<QuestDef, "imagePath">[] = [
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

export const QUESTS: QuestDef[] = RAW_QUESTS.map((q) => ({
  ...q,
  imagePath: `/badges/quests/${q.code}.png`,
}));

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
