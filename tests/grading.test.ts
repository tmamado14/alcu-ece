import { describe, expect, it } from "vitest";
import {
  gradeAnswer,
  gradeExpression,
  gradeNumerical,
  gradeTextShort,
  normalizeExpression,
  parseNumeric,
} from "@/lib/grading";

describe("parseNumeric", () => {
  it("parses plain numbers", () => {
    expect(parseNumeric("42")).toBe(42);
    expect(parseNumeric("-3.5")).toBe(-3.5);
    expect(parseNumeric("  0.667 ")).toBe(0.667);
  });
  it("parses scientific notation", () => {
    expect(parseNumeric("1.5e3")).toBe(1500);
    expect(parseNumeric("2E-3")).toBe(0.002);
  });
  it("parses fractions", () => {
    expect(parseNumeric("3/4")).toBe(0.75);
    expect(parseNumeric("1/3")).toBeCloseTo(0.3333, 3);
    expect(parseNumeric("-1/2")).toBe(-0.5);
  });
  it("parses pi expressions", () => {
    expect(parseNumeric("pi")).toBeCloseTo(Math.PI);
    expect(parseNumeric("2pi")).toBeCloseTo(2 * Math.PI);
    expect(parseNumeric("pi/4")).toBeCloseTo(Math.PI / 4);
    expect(parseNumeric("-pi")).toBeCloseTo(-Math.PI);
    expect(parseNumeric("3pi/2")).toBeCloseTo((3 * Math.PI) / 2);
  });
  it("strips units and percent signs", () => {
    expect(parseNumeric("2 s", "s")).toBe(2);
    expect(parseNumeric("6.02 dB", "dB")).toBeCloseTo(6.02);
    expect(parseNumeric("16.3%")).toBeCloseTo(16.3);
    expect(parseNumeric("10 rad/s", "rad/s")).toBe(10);
  });
  it("handles commas and rejects garbage", () => {
    expect(parseNumeric("1,500")).toBe(1500);
    expect(parseNumeric("abc")).toBeNull();
    expect(parseNumeric("")).toBeNull();
    expect(parseNumeric("1/0")).toBeNull();
  });
});

describe("gradeNumerical", () => {
  it("accepts within relative tolerance", () => {
    expect(gradeNumerical("1.667", { value: 1.667, toleranceRel: 0.02 })).toBe(true);
    expect(gradeNumerical("1.67", { value: 1.667, toleranceRel: 0.02 })).toBe(true);
    expect(gradeNumerical("5/3", { value: 1.667, toleranceRel: 0.02 })).toBe(true);
    expect(gradeNumerical("1.8", { value: 1.667, toleranceRel: 0.02 })).toBe(false);
  });
  it("accepts within absolute tolerance", () => {
    expect(gradeNumerical("9", { value: 9, toleranceAbs: 0 })).toBe(true);
    expect(gradeNumerical("9.1", { value: 9, toleranceAbs: 0 })).toBe(false);
    expect(gradeNumerical("9.05", { value: 9, toleranceAbs: 0.1 })).toBe(true);
  });
  it("defaults to 1% relative tolerance", () => {
    expect(gradeNumerical("100.5", { value: 100 })).toBe(true);
    expect(gradeNumerical("102", { value: 100 })).toBe(false);
  });
  it("handles zero targets", () => {
    expect(gradeNumerical("0", { value: 0, toleranceAbs: 0.001 })).toBe(true);
  });
});

describe("gradeTextShort", () => {
  const data = { accepted: ["open loop", "open-loop system"] };
  it("normalizes case, whitespace, and trailing punctuation", () => {
    expect(gradeTextShort("Open Loop", data)).toBe(true);
    expect(gradeTextShort("  open   loop.  ", data)).toBe(true);
    expect(gradeTextShort("OPEN-LOOP SYSTEM", data)).toBe(true);
    expect(gradeTextShort("closed loop", data)).toBe(false);
  });
});

describe("normalizeExpression / gradeExpression", () => {
  it("ignores whitespace and explicit multiplication", () => {
    expect(normalizeExpression("2 / ( s + 3 )")).toBe(normalizeExpression("2/(s+3)"));
    expect(normalizeExpression("G1*G2")).toBe(normalizeExpression("g1 g2".replace(" ", "")));
  });
  it("strips redundant outer parentheses", () => {
    expect(normalizeExpression("(s+2)")).toBe("s+2");
    expect(normalizeExpression("((s+2))")).toBe("s+2");
    // must NOT strip when parens don't fully enclose
    expect(normalizeExpression("(s+1)(s+2)")).toBe("(s+1)(s+2)");
  });
  it("unifies power notation and braces", () => {
    expect(normalizeExpression("1/(s**2+4s+8)")).toBe(normalizeExpression("1/(s^2+4s+8)"));
    expect(normalizeExpression("1/{s^2+4s+8}")).toBe(normalizeExpression("1/(s^2+4s+8)"));
  });
  it("grades transfer function answers", () => {
    const data = { accepted: ["2/(s+3)"] };
    expect(gradeExpression("2/(s+3)", data)).toBe(true);
    expect(gradeExpression(" 2 / (S + 3) ", data)).toBe(true);
    expect(gradeExpression("2/(s+4)", data)).toBe(false);
  });
});

describe("gradeAnswer dispatch", () => {
  it("multiple choice is case-insensitive on labels", () => {
    expect(gradeAnswer("multiple_choice_single", { correct: "B" }, "b")).toBe(true);
    expect(gradeAnswer("multiple_choice_single", { correct: "B" }, "A")).toBe(false);
  });
  it("true/false accepts synonyms", () => {
    expect(gradeAnswer("true_false", { correct: true }, "True")).toBe(true);
    expect(gradeAnswer("true_false", { correct: true }, "yes")).toBe(true);
    expect(gradeAnswer("true_false", { correct: false }, "F")).toBe(true);
    expect(gradeAnswer("true_false", { correct: true }, "maybe")).toBe(false);
  });
});
