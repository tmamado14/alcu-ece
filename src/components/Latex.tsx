"use client";

// Renders problem text containing $inline$ and $$display$$ LaTeX plus
// minimal markdown (**bold**, line breaks).

import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";
import { normalizeMathDelimiters } from "@/lib/latex";

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: false });
  } catch {
    return tex;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function latexToHtml(input: string): string {
  // \( \) and \[ \] from older stored content are rewritten to $ and $$ first
  const source = normalizeMathDelimiters(input);
  // split into display math, inline math, and plain segments
  const parts: string[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    if (m.index > last) parts.push(renderPlain(source.slice(last, m.index)));
    if (m[1] !== undefined) parts.push(renderMath(m[1], true));
    else parts.push(renderMath(m[2], false));
    last = m.index + m[0].length;
  }
  if (last < source.length) parts.push(renderPlain(source.slice(last)));
  return parts.join("");
}

function renderPlain(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\n\n/g, "<br/><br/>").replace(/\n/g, "<br/>");
  return html;
}

export default function Latex({ children, className }: { children: string; className?: string }) {
  const html = useMemo(() => latexToHtml(children), [children]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
