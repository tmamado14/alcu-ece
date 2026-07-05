// Answer grading and normalization.
// Pure functions so they are trivially unit-testable.

export type AnswerType =
  | "multiple_choice_single"
  | "multiple_choice_multiple"
  | "numerical_tolerance"
  | "text_short"
  | "algebraic_expression"
  | "true_false";

export interface NumericalAnswerData {
  value: number;
  /** Absolute tolerance. If both set, either passing counts as correct. */
  toleranceAbs?: number;
  /** Relative tolerance, e.g. 0.02 = ±2%. Default 0.01 if none given. */
  toleranceRel?: number;
  /** Unit the learner may append; stripped before parsing (e.g. "s", "rad/s", "%"). */
  unit?: string;
}

export interface TextAnswerData {
  accepted: string[]; // any of these (normalized) counts as correct
}

export interface ExpressionAnswerData {
  accepted: string[]; // normalized-expression variants
}

export interface ChoiceAnswerData {
  correct: string; // choice label, e.g. "B"
}

export interface TrueFalseAnswerData {
  correct: boolean;
}

export type AnswerData =
  | NumericalAnswerData
  | TextAnswerData
  | ExpressionAnswerData
  | ChoiceAnswerData
  | TrueFalseAnswerData;

/**
 * Parse a numeric string supporting decimals, fractions ("3/4"),
 * scientific notation ("1.5e3"), pi ("2pi", "pi/4"), percent sign,
 * and an optional expected unit suffix.
 */
export function parseNumeric(raw: string, unit?: string): number | null {
  let s = raw.trim().toLowerCase();
  if (s === "") return null;

  // strip an expected unit suffix (case-insensitive), plus common whitespace
  if (unit) {
    const u = unit.toLowerCase();
    if (s.endsWith(u)) s = s.slice(0, -u.length).trim();
  }
  // strip stray percent sign (units policy: value already expressed in %)
  s = s.replace(/%\s*$/, "").trim();
  // allow commas as thousands separators
  s = s.replace(/,/g, "");

  // pi support: "pi", "2pi", "pi/4", "3pi/2", "2*pi", "-pi"
  const piMatch = s.match(/^(-?\d*\.?\d*)\s*\*?\s*(?:pi|π)\s*(?:\/\s*(\d*\.?\d+))?$/);
  if (piMatch) {
    const coef = piMatch[1] === "" || piMatch[1] === "-" ? (piMatch[1] === "-" ? -1 : 1) : parseFloat(piMatch[1]);
    const div = piMatch[2] ? parseFloat(piMatch[2]) : 1;
    if (!isNaN(coef) && div !== 0) return (coef * Math.PI) / div;
    return null;
  }

  // fraction "a/b"
  const fracMatch = s.match(/^(-?\d*\.?\d+(?:e-?\d+)?)\s*\/\s*(-?\d*\.?\d+(?:e-?\d+)?)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
    return null;
  }

  // plain number / scientific notation
  const numMatch = s.match(/^-?\d*\.?\d+(?:e-?\d+)?$/);
  if (numMatch) {
    const v = parseFloat(s);
    return isNaN(v) ? null : v;
  }

  return null;
}

export function gradeNumerical(submitted: string, data: NumericalAnswerData): boolean {
  const v = parseNumeric(submitted, data.unit);
  if (v === null) return false;
  const target = data.value;
  const absTol = data.toleranceAbs;
  const relTol = data.toleranceRel ?? (absTol === undefined ? 0.01 : undefined);

  if (absTol !== undefined && Math.abs(v - target) <= absTol) return true;
  if (relTol !== undefined) {
    const scale = Math.max(Math.abs(target), 1e-12);
    if (Math.abs(v - target) / scale <= relTol) return true;
  }
  return false;
}

/** Normalize free-text short answers: trim, lowercase, collapse whitespace, strip punctuation edges. */
export function normalizeText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, " ")
    .replace(/[.。!?]+$/g, "")
    .replace(/[""'']/g, "'");
}

export function gradeTextShort(submitted: string, data: TextAnswerData): boolean {
  const s = normalizeText(submitted);
  return data.accepted.some((a) => normalizeText(a) === s);
}

/**
 * Normalize an algebraic expression string for comparison:
 * lowercase, remove all whitespace, remove explicit multiplication "*",
 * unify caret notation, unify parentheses style, strip outer redundancy.
 * This is deliberately a string-normalization MVP; symbolic equivalence
 * can later be delegated to a CAS service (see README roadmap).
 */
export function normalizeExpression(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/\s+/g, "");
  s = s.replace(/\*\*/g, "^"); // python-style power
  s = s.replace(/\*/g, ""); // implicit multiplication
  s = s.replace(/\\left|\\right/g, "");
  s = s.replace(/\\cdot/g, "");
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
  s = s.replace(/\{/g, "(").replace(/\}/g, ")");
  s = s.replace(/\[/g, "(").replace(/\]/g, ")");
  // remove redundant "+" at start
  s = s.replace(/^\+/, "");
  // strip fully-enclosing parentheses, e.g. "(s+2)" -> "s+2" only if balanced
  while (s.startsWith("(") && s.endsWith(")")) {
    let depth = 0;
    let encloses = true;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") depth--;
      if (depth === 0 && i < s.length - 1) {
        encloses = false;
        break;
      }
    }
    if (encloses) s = s.slice(1, -1);
    else break;
  }
  return s;
}

export function gradeExpression(submitted: string, data: ExpressionAnswerData): boolean {
  const s = normalizeExpression(submitted);
  return data.accepted.some((a) => normalizeExpression(a) === s);
}

export function gradeChoice(submitted: string, data: ChoiceAnswerData): boolean {
  return submitted.trim().toUpperCase() === data.correct.trim().toUpperCase();
}

export function gradeTrueFalse(submitted: string, data: TrueFalseAnswerData): boolean {
  const s = submitted.trim().toLowerCase();
  const val = s === "true" || s === "t" || s === "yes";
  const valF = s === "false" || s === "f" || s === "no";
  if (!val && !valF) return false;
  return val === data.correct;
}

/** Grade a submitted answer against a problem's answer type + answer data. */
export function gradeAnswer(answerType: AnswerType, answerData: AnswerData, submitted: string): boolean {
  switch (answerType) {
    case "multiple_choice_single":
    case "multiple_choice_multiple":
      return gradeChoice(submitted, answerData as ChoiceAnswerData);
    case "numerical_tolerance":
      return gradeNumerical(submitted, answerData as NumericalAnswerData);
    case "text_short":
      return gradeTextShort(submitted, answerData as TextAnswerData);
    case "algebraic_expression":
      return gradeExpression(submitted, answerData as ExpressionAnswerData);
    case "true_false":
      return gradeTrueFalse(submitted, answerData as TrueFalseAnswerData);
    default:
      return false;
  }
}
