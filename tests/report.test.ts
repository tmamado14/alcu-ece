import { describe, expect, it } from "vitest";
import { attemptTotals, progressScore, statusLabel } from "@/lib/report";

describe("progressScore", () => {
  it("puts an untouched topic at the 1000-rating baseline", () => {
    expect(progressScore(1000, 1300)).toBe(20);
  });

  it("is 0 at the bottom of the scale and 100 at mastery+100", () => {
    expect(progressScore(900, 1300)).toBe(0);
    expect(progressScore(1400, 1300)).toBe(100);
  });

  it("clamps outside the band instead of going negative or past 100", () => {
    expect(progressScore(500, 1300)).toBe(0);
    expect(progressScore(9999, 1300)).toBe(100);
  });

  it("survives a degenerate threshold without dividing by zero", () => {
    expect(progressScore(1000, 800)).toBe(100);
    expect(progressScore(700, 800)).toBe(0);
  });
});

describe("attemptTotals", () => {
  it("counts both tries as correct and reports the percentage", () => {
    const t = attemptTotals(["correct_first", "correct_second", "wrong", "gave_up"]);
    expect(t).toEqual({ problems: 4, correct: 2, incorrect: 1, gaveUp: 1, percent: 50 });
  });

  it("ignores pending attempts — an unfinished question is not an outcome", () => {
    const t = attemptTotals(["correct_first", "pending", "pending"]);
    expect(t.problems).toBe(1);
    expect(t.percent).toBe(100);
  });

  it("reports zeroes rather than NaN for a topic with no attempts", () => {
    expect(attemptTotals([])).toEqual({ problems: 0, correct: 0, incorrect: 0, gaveUp: 0, percent: 0 });
  });

  it("rounds the percentage to one decimal", () => {
    expect(attemptTotals(["correct_first", "wrong", "wrong"]).percent).toBe(33.3);
  });
});

describe("statusLabel", () => {
  it("names each learner-facing status", () => {
    expect(statusLabel("learning")).toBe("In progress");
    expect(statusLabel("needs_review")).toBe("Needs review");
    expect(statusLabel("mastered")).toBe("Mastered");
  });

  it("passes through an unknown status rather than blanking it", () => {
    expect(statusLabel("something_new")).toBe("something_new");
  });
});
