import { describe, expect, it } from "vitest";
import {
  applyAttempt,
  computeStatus,
  DEFAULT_PROGRESS,
  difficultyToRating,
  expectedScore,
  flagNeedsReview,
  FOCUS_TARGET_BOOST,
  pickFocusTarget,
  scoreCandidate,
  selectProblem,
  updateRating,
  type CandidateProblem,
  type FocusSubtopic,
  type SelectionContext,
  type TopicProgressState,
} from "@/lib/adaptive";

const THRESH = { pass: 1100, mastery: 1300 };

describe("difficultyToRating", () => {
  it("maps 1..10 to 900..1500", () => {
    expect(difficultyToRating(1)).toBe(900);
    expect(difficultyToRating(10)).toBe(1500);
    expect(difficultyToRating(5.5)).toBe(1200);
  });
  it("clamps out-of-range difficulty", () => {
    expect(difficultyToRating(0)).toBe(900);
    expect(difficultyToRating(99)).toBe(1500);
  });
});

describe("updateRating", () => {
  it("increases significantly on first-try correct", () => {
    const { delta } = updateRating(DEFAULT_PROGRESS, "correct_first", 5);
    expect(delta).toBeGreaterThan(15);
  });
  it("increases slightly on second-try correct", () => {
    const first = updateRating(DEFAULT_PROGRESS, "correct_first", 5).delta;
    const second = updateRating(DEFAULT_PROGRESS, "correct_second", 5).delta;
    expect(second).toBeGreaterThan(0);
    expect(second).toBeLessThan(first);
  });
  it("decreases on wrong twice", () => {
    const { delta } = updateRating(DEFAULT_PROGRESS, "wrong", 5);
    expect(delta).toBeLessThan(0);
  });
  it("give-up penalty is milder than wrong", () => {
    const wrong = updateRating(DEFAULT_PROGRESS, "wrong", 5).delta;
    const gaveUp = updateRating(DEFAULT_PROGRESS, "gave_up", 5).delta;
    expect(gaveUp).toBeGreaterThan(wrong);
    expect(gaveUp).toBeLessThanOrEqual(0);
  });
  it("beating a hard problem is worth more than an easy one", () => {
    const easy = updateRating(DEFAULT_PROGRESS, "correct_first", 2).delta;
    const hard = updateRating(DEFAULT_PROGRESS, "correct_first", 9).delta;
    expect(hard).toBeGreaterThan(easy);
  });
  it("K factor shrinks as confidence grows", () => {
    const fresh = updateRating({ ...DEFAULT_PROGRESS, confidence: 0 }, "correct_first", 5).delta;
    const confident = updateRating({ ...DEFAULT_PROGRESS, confidence: 1 }, "correct_first", 5).delta;
    expect(confident).toBeLessThan(fresh);
  });
});

describe("expectedScore", () => {
  it("is 0.5 for equal ratings and monotonic", () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5);
    expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5);
    expect(expectedScore(800, 1000)).toBeLessThan(0.5);
  });
});

describe("applyAttempt / computeStatus", () => {
  it("tracks counters and streaks", () => {
    let s = { ...DEFAULT_PROGRESS };
    s = applyAttempt(s, "correct_first", 5, THRESH);
    s = applyAttempt(s, "correct_second", 5, THRESH);
    expect(s.problemsSeen).toBe(2);
    expect(s.correctFirstTry).toBe(1);
    expect(s.correctSecondTry).toBe(1);
    expect(s.streak).toBe(2);
    s = applyAttempt(s, "wrong", 5, THRESH);
    expect(s.streak).toBe(0);
    expect(s.wrong).toBe(1);
  });

  it("moves not_started → learning → passed → mastered", () => {
    let s = { ...DEFAULT_PROGRESS };
    expect(s.status).toBe("not_started");
    s = applyAttempt(s, "correct_second", 3, THRESH);
    expect(s.status).toBe("learning");
    // repeated first-try successes on decent problems should eventually master
    for (let i = 0; i < 12; i++) s = applyAttempt(s, "correct_first", 7, THRESH);
    expect(s.rating).toBeGreaterThan(THRESH.mastery);
    expect(s.status).toBe("mastered");
  });

  it("a passed topic that collapses gets flagged needs_review", () => {
    let s: TopicProgressState = { ...DEFAULT_PROGRESS, rating: 1150, confidence: 0.5, problemsSeen: 5, status: "passed" };
    for (let i = 0; i < 4; i++) s = applyAttempt(s, "wrong", 6, THRESH);
    expect(s.rating).toBeLessThan(THRESH.pass);
    expect(s.status).toBe("needs_review");
  });

  it("flagNeedsReview drops confidence and flags passed topics", () => {
    const s = flagNeedsReview({ ...DEFAULT_PROGRESS, status: "passed", confidence: 0.5 });
    expect(s.status).toBe("needs_review");
    expect(s.confidence).toBeCloseTo(0.35);
  });
});

describe("problem selection", () => {
  const ctx: SelectionContext = {
    topicRatings: new Map([["t1", 1000]]),
    weakTags: new Set(["routh-hurwitz"]),
    preference: "normal",
    reviewTopicIds: new Set(),
    rng: () => 0, // deterministic: always pick the top scorer
  };

  const mk = (over: Partial<CandidateProblem>): CandidateProblem => ({
    id: "p",
    topicId: "t1",
    difficulty: 3,
    tags: [],
    seen: false,
    ...over,
  });

  it("returns null when there are no candidates", () => {
    expect(selectProblem([], ctx)).toBeNull();
  });

  it("prefers unseen problems", () => {
    const seen = mk({ id: "seen", seen: true });
    const unseen = mk({ id: "unseen", seen: false });
    expect(scoreCandidate(unseen, ctx)).toBeGreaterThan(scoreCandidate(seen, ctx));
    expect(selectProblem([seen, unseen], ctx)!.id).toBe("unseen");
  });

  it("prefers difficulty near the learner's band", () => {
    const near = mk({ id: "near", difficulty: 3 }); // ~1033 vs rating 1000
    const far = mk({ id: "far", difficulty: 10 }); // 1500
    expect(scoreCandidate(near, ctx)).toBeGreaterThan(scoreCandidate(far, ctx));
  });

  it("difficulty preference shifts the target band", () => {
    const hardCtx = { ...ctx, preference: "challenge" as const };
    const hard = mk({ id: "hard", difficulty: 7 });
    const easy = mk({ id: "easy", difficulty: 2 });
    expect(scoreCandidate(hard, hardCtx)).toBeGreaterThan(scoreCandidate(easy, hardCtx));
  });

  it("boosts weak tags and previously missed problems", () => {
    const plain = mk({ id: "plain", seen: true });
    const weak = mk({ id: "weak", seen: true, tags: ["routh-hurwitz"] });
    const missed = mk({ id: "missed", seen: true, lastResult: "wrong" });
    expect(scoreCandidate(weak, ctx)).toBeGreaterThan(scoreCandidate(plain, ctx));
    expect(scoreCandidate(missed, ctx)).toBeGreaterThan(scoreCandidate(plain, ctx));
  });

  it("the focus boost outweighs the unseen bonus, so the target topic wins", () => {
    const focusCtx: SelectionContext = {
      ...ctx,
      topicRatings: new Map([["t1", 1000], ["target", 1000]]),
      topicBoost: new Map([["target", FOCUS_TARGET_BOOST]]),
    };
    const unseenElsewhere = mk({ id: "elsewhere", topicId: "t1", seen: false });
    const seenInTarget = mk({ id: "in-target", topicId: "target", seen: true });
    expect(scoreCandidate(seenInTarget, focusCtx)).toBeGreaterThan(
      scoreCandidate(unseenElsewhere, focusCtx)
    );
    expect(selectProblem([unseenElsewhere, seenInTarget], focusCtx)!.id).toBe("in-target");
  });
});

describe("pickFocusTarget", () => {
  const sub = (over: Partial<FocusSubtopic>): FocusSubtopic => ({
    id: "s",
    sortOrder: 0,
    status: "not_started",
    prerequisiteIds: [],
    problemCount: 5,
    ...over,
  });

  it("walks subtopics in curriculum order, not array order", () => {
    const subs = [
      sub({ id: "third", sortOrder: 3 }),
      sub({ id: "first", sortOrder: 1 }),
      sub({ id: "second", sortOrder: 2 }),
    ];
    expect(pickFocusTarget(subs)!.id).toBe("first");
  });

  it("moves on once a subtopic is mastered, but not when it is only passed", () => {
    const subs = [
      sub({ id: "a", sortOrder: 1, status: "mastered" }),
      sub({ id: "b", sortOrder: 2, status: "passed" }),
    ];
    expect(pickFocusTarget(subs)!.id).toBe("b");
  });

  it("returns to a subtopic that slipped to needs_review", () => {
    const subs = [
      sub({ id: "a", sortOrder: 1, status: "needs_review" }),
      sub({ id: "b", sortOrder: 2, status: "learning" }),
    ];
    expect(pickFocusTarget(subs)!.id).toBe("a");
  });

  it("skips a subtopic whose in-group prerequisite is not passed yet", () => {
    const subs = [
      sub({ id: "advanced", sortOrder: 1, prerequisiteIds: ["basics"] }),
      sub({ id: "basics", sortOrder: 2 }),
    ];
    expect(pickFocusTarget(subs)!.id).toBe("basics");
  });

  it("ignores prerequisites that live outside the focus group", () => {
    const subs = [sub({ id: "only", sortOrder: 1, prerequisiteIds: ["some-other-topic"] })];
    expect(pickFocusTarget(subs)!.id).toBe("only");
  });

  it("falls back to the earliest unmastered subtopic when the group is circular", () => {
    const subs = [
      sub({ id: "a", sortOrder: 1, prerequisiteIds: ["b"] }),
      sub({ id: "b", sortOrder: 2, prerequisiteIds: ["a"] }),
    ];
    expect(pickFocusTarget(subs)!.id).toBe("a");
  });

  it("ignores subtopics with no questions", () => {
    const subs = [
      sub({ id: "empty", sortOrder: 1, problemCount: 0 }),
      sub({ id: "stocked", sortOrder: 2 }),
    ];
    expect(pickFocusTarget(subs)!.id).toBe("stocked");
  });

  it("returns null once every stocked subtopic is mastered", () => {
    const subs = [
      sub({ id: "a", sortOrder: 1, status: "mastered" }),
      sub({ id: "b", sortOrder: 2, status: "mastered" }),
      sub({ id: "empty", sortOrder: 3, status: "not_started", problemCount: 0 }),
    ];
    expect(pickFocusTarget(subs)).toBeNull();
  });
});
