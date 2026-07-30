import { describe, expect, it } from "vitest";
import {
  BADGES,
  cumulativeXpForLevel,
  evaluateBadgeRules,
  levelForXp,
  periodKeyFor,
  xpForAttempt,
  type BadgeRuleContext,
} from "@/lib/gamification";

describe("xpForAttempt", () => {
  it("scales with difficulty and rewards first-try most", () => {
    expect(xpForAttempt("correct_first", 5)).toBe(25);
    expect(xpForAttempt("correct_first", 10)).toBe(40);
    expect(xpForAttempt("correct_second", 5)).toBe(10);
    expect(xpForAttempt("correct_second", 5)).toBeLessThan(xpForAttempt("correct_first", 5));
  });
  it("gives token XP for engaging with misses (solution reading)", () => {
    expect(xpForAttempt("wrong", 5)).toBe(2);
    expect(xpForAttempt("gave_up", 5)).toBe(1);
  });
});

describe("levels", () => {
  it("level curve is monotonic and starts at level 1", () => {
    expect(levelForXp(0).level).toBe(1);
    expect(cumulativeXpForLevel(2)).toBe(100);
    const l5 = levelForXp(cumulativeXpForLevel(5));
    expect(l5.level).toBe(5);
    expect(levelForXp(cumulativeXpForLevel(5) - 1).level).toBe(4);
  });
  it("reports progress toward the next level", () => {
    const info = levelForXp(150);
    expect(info.level).toBe(2);
    expect(info.currentXp).toBe(50);
    expect(info.nextLevelXp).toBeGreaterThan(0);
  });
});

function ctx(over: Partial<BadgeRuleContext> = {}): BadgeRuleContext {
  return {
    subjectSlug: "feedback-control-systems",
    totalAttempts: 0,
    attemptsByTopicSlug: new Map(),
    correctSecondTryCount: 0,
    noGiveUpStreak: 0,
    passedTopicSlugs: new Set(),
    masteredTopicSlugs: new Set(),
    allSubjectTopicSlugs: ["open-vs-closed-loop", "bode-plots"],
    comebackCount: 0,
    tagSolveCounts: new Map(),
    ...over,
  };
}

describe("badge rules", () => {
  it("first-feedback triggers on the first attempt", () => {
    const earned = evaluateBadgeRules(ctx({ totalAttempts: 1 }), new Set());
    expect(earned.map((b) => b.code)).toContain("first-feedback");
  });
  it("does not re-award already earned badges", () => {
    const earned = evaluateBadgeRules(ctx({ totalAttempts: 5 }), new Set(["first-feedback"]));
    expect(earned.map((b) => b.code)).not.toContain("first-feedback");
  });
  it("routh-rookie needs 10 routh-hurwitz solves", () => {
    const nine = evaluateBadgeRules(ctx({ totalAttempts: 9, tagSolveCounts: new Map([["routh-hurwitz", 9]]) }), new Set());
    expect(nine.map((b) => b.code)).not.toContain("routh-rookie");
    const ten = evaluateBadgeRules(ctx({ totalAttempts: 10, tagSolveCounts: new Map([["routh-hurwitz", 10]]) }), new Set());
    expect(ten.map((b) => b.code)).toContain("routh-rookie");
  });
  it("second-try-scholar and no-skip-streak thresholds", () => {
    const earned = evaluateBadgeRules(
      ctx({ totalAttempts: 30, correctSecondTryCount: 10, noGiveUpStreak: 20 }),
      new Set()
    );
    const codes = earned.map((b) => b.code);
    expect(codes).toContain("second-try-scholar");
    expect(codes).toContain("no-skip-streak");
  });
  it("stability-sentinel requires every stability subtopic mastered", () => {
    const partial = evaluateBadgeRules(
      ctx({ totalAttempts: 1, masteredTopicSlugs: new Set(["poles-and-stability"]) }),
      new Set()
    );
    expect(partial.map((b) => b.code)).not.toContain("stability-sentinel");
    const full = evaluateBadgeRules(
      ctx({
        totalAttempts: 1,
        masteredTopicSlugs: new Set([
          "stability-concept", "poles-and-stability", "routh-hurwitz-criterion",
          "conditional-stability", "relative-stability",
        ]),
      }),
      new Set()
    );
    expect(full.map((b) => b.code)).toContain("stability-sentinel");
  });
  it("control-systems-master requires every subject topic mastered", () => {
    const c = ctx({
      totalAttempts: 1,
      allSubjectTopicSlugs: ["a", "b"],
      masteredTopicSlugs: new Set(["a", "b"]),
    });
    expect(evaluateBadgeRules(c, new Set()).map((b) => b.code)).toContain("control-systems-master");
  });
  it("every badge has a unique code", () => {
    const codes = BADGES.map((b) => b.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("periodKeyFor", () => {
  it("daily key is the ISO date", () => {
    expect(periodKeyFor("daily", new Date("2026-07-05T10:00:00Z"))).toBe("2026-07-05");
  });
  it("weekly key is the ISO week", () => {
    expect(periodKeyFor("weekly", new Date("2026-01-01T10:00:00Z"))).toMatch(/^\d{4}-W\d{2}$/);
    // same week → same key, different week → different key
    expect(periodKeyFor("weekly", new Date("2026-07-06T10:00:00Z"))).toBe(
      periodKeyFor("weekly", new Date("2026-07-12T10:00:00Z"))
    );
    expect(periodKeyFor("weekly", new Date("2026-07-06T10:00:00Z"))).not.toBe(
      periodKeyFor("weekly", new Date("2026-07-13T10:00:00Z"))
    );
  });
});
