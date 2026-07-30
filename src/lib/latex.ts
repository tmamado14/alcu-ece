// Math delimiter normalization.
//
// The platform's renderer (components/Latex.tsx) understands exactly two
// delimiters: $...$ for inline math and $$...$$ for display math. LLMs are
// fond of the other LaTeX pair — \( ... \) and \[ ... \] — and emit it even
// when the prompt forbids it, which lands raw backslashes on the page.
//
// So the prompts ask for $-delimiters AND everything passes through here:
// once on the way into the database (so stored content is clean) and once at
// render time (so solutions written before this existed still display).

// Existing $-delimited math, matched so we never rewrite inside it.
const DOLLAR_MATH = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g;

// \[ ... \] and \( ... \). The lookbehind rejects an escaped backslash, so
// the `\\[` that ends a row inside a matrix or array is left alone.
const BRACKET_DISPLAY = /(?<!\\)\\\[([\s\S]*?)(?<!\\)\\\]/g;
const PAREN_INLINE = /(?<!\\)\\\(([\s\S]*?)(?<!\\)\\\)/g;

/**
 * Rewrites \( ... \) to $ ... $ and \[ ... \] to $$ ... $$, leaving any math
 * already written with $-delimiters untouched.
 */
export function normalizeMathDelimiters(source: string): string {
  if (!source) return source;
  if (!source.includes("\\(") && !source.includes("\\[")) return source;

  const out: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  DOLLAR_MATH.lastIndex = 0;
  while ((m = DOLLAR_MATH.exec(source)) !== null) {
    out.push(convert(source.slice(last, m.index)));
    out.push(m[0]); // already-valid math passes through verbatim
    last = m.index + m[0].length;
  }
  out.push(convert(source.slice(last)));
  return out.join("");
}

function convert(text: string): string {
  return text
    .replace(BRACKET_DISPLAY, (_, body: string) => `$$${body.trim()}$$`)
    // Inline math must stay on one line: the renderer's inline pattern
    // deliberately refuses to span newlines.
    .replace(PAREN_INLINE, (_, body: string) => `$${collapse(body)}$`);
}

function collapse(body: string): string {
  return body.replace(/\s+/g, " ").trim();
}
