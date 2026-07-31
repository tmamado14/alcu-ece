import { describe, expect, it } from "vitest";
import { formatTolerance, parseTolerance } from "@/lib/csv";

describe("parseTolerance", () => {
  it("reads a bare number as an absolute tolerance", () => {
    expect(parseTolerance("0.01")).toEqual({ toleranceAbs: 0.01 });
    expect(parseTolerance(" 0.5 ")).toEqual({ toleranceAbs: 0.5 });
  });

  it("reads a percent suffix as a relative tolerance", () => {
    expect(parseTolerance("1%")).toEqual({ toleranceRel: 0.01 });
    expect(parseTolerance("2.5%")).toEqual({ toleranceRel: 0.025 });
  });

  it("reads both bounds separated by a semicolon", () => {
    expect(parseTolerance("0.01;1%")).toEqual({ toleranceAbs: 0.01, toleranceRel: 0.01 });
  });

  it("falls back to 1% relative when blank or unparsable", () => {
    expect(parseTolerance("")).toEqual({ toleranceRel: 0.01 });
    expect(parseTolerance("  ")).toEqual({ toleranceRel: 0.01 });
    expect(parseTolerance("n/a")).toEqual({ toleranceRel: 0.01 });
  });

  it("keeps a zero absolute tolerance, which counting questions rely on", () => {
    expect(parseTolerance("0")).toEqual({ toleranceAbs: 0 });
  });
});

describe("formatTolerance", () => {
  it("round-trips through parseTolerance", () => {
    for (const raw of ["0.01", "0", "1%", "2.5%", "0.01;1%"]) {
      expect(parseTolerance(formatTolerance(parseTolerance(raw)))).toEqual(parseTolerance(raw));
    }
  });

  it("does not leak binary floating point into the percent form", () => {
    expect(formatTolerance({ toleranceRel: 0.02 })).toBe("2%");
    expect(formatTolerance({ toleranceRel: 0.001 })).toBe("0.1%");
  });

  it("is empty when no tolerance is set", () => {
    expect(formatTolerance({ value: 5 })).toBe("");
  });
});
