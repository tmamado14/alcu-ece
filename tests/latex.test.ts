import { describe, expect, it } from "vitest";
import { normalizeMathDelimiters } from "../src/lib/latex";
import { ProblemBody } from "../src/lib/schemas";

describe("normalizeMathDelimiters", () => {
  it("rewrites inline \\( \\) to $ $", () => {
    expect(normalizeMathDelimiters("the denominator \\( s^2 + 8s + 100 \\).")).toBe(
      "the denominator $s^2 + 8s + 100$.",
    );
  });

  it("rewrites display \\[ \\] to $$ $$", () => {
    expect(normalizeMathDelimiters("By comparing:\n\\[\n\\omega_n^2 = 100\n\\]\n")).toBe(
      "By comparing:\n$$\\omega_n^2 = 100$$\n",
    );
  });

  it("collapses newlines inside inline math, which must stay on one line", () => {
    expect(normalizeMathDelimiters("form \\( s^2 +\n2\\zeta\\omega_n s \\) here")).toBe(
      "form $s^2 + 2\\zeta\\omega_n s$ here",
    );
  });

  it("handles the whole solution shape the model emits", () => {
    const out = normalizeMathDelimiters(
      "We are given \\( s^2 + 8s + 100 \\).\n\n\\[\n2\\zeta\\omega_n = 8\n\\]\n\nThus **10 rad/s**.",
    );
    expect(out).toBe("We are given $s^2 + 8s + 100$.\n\n$$2\\zeta\\omega_n = 8$$\n\nThus **10 rad/s**.");
  });

  it("leaves math already written with $-delimiters alone", () => {
    const src = "$\\omega_n = 10$ and $$\\zeta = 0.4$$";
    expect(normalizeMathDelimiters(src)).toBe(src);
  });

  it("does not touch \\\\[ row breaks inside an existing matrix", () => {
    const src = "$$\\begin{bmatrix} a \\\\[2pt] b \\end{bmatrix}$$";
    expect(normalizeMathDelimiters(src)).toBe(src);
  });

  it("does not touch an escaped \\\\( outside math", () => {
    const src = "a literal backslash-paren \\\\( stays put";
    expect(normalizeMathDelimiters(src)).toBe(src);
  });

  it("leaves plain text and empty input untouched", () => {
    expect(normalizeMathDelimiters("no math here at all")).toBe("no math here at all");
    expect(normalizeMathDelimiters("")).toBe("");
  });

  it("converts several occurrences in one string", () => {
    expect(normalizeMathDelimiters("\\(a\\) then \\(b\\) then \\[c\\]")).toBe("$a$ then $b$ then $$c$$");
  });
});

describe("ProblemBody math normalization", () => {
  it("cleans delimiters on every write path into the databank", () => {
    const parsed = ProblemBody.parse({
      topicId: "t1",
      statement: "Find \\( \\omega_n \\) for \\( s^2 + 8s + 100 \\).",
      answerType: "numerical_tolerance",
      answerData: { value: 10 },
      choices: [{ label: "A", text: "\\( 10 \\) rad/s" }],
      hints: ["Compare with \\( s^2 + 2\\zeta\\omega_n s + \\omega_n^2 \\)."],
      solution: "\\[\n\\omega_n = \\sqrt{100} = 10\n\\]",
      explanation: "So \\( \\omega_n = 10 \\).",
    });
    expect(parsed.statement).toBe("Find $\\omega_n$ for $s^2 + 8s + 100$.");
    expect(parsed.choices?.[0].text).toBe("$10$ rad/s");
    expect(parsed.hints[0]).toBe("Compare with $s^2 + 2\\zeta\\omega_n s + \\omega_n^2$.");
    expect(parsed.solution).toBe("$$\\omega_n = \\sqrt{100} = 10$$");
    expect(parsed.explanation).toBe("So $\\omega_n = 10$.");
  });
});
