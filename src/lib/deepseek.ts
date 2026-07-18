// Minimal DeepSeek chat-completions client (OpenAI-compatible REST).
// The API key is read from DEEPSEEK_API_KEY on the server and never leaves it.

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

export function deepseekEnabled(): boolean {
  return !!process.env.DEEPSEEK_API_KEY;
}

export async function deepseekChat(opts: {
  system: string;
  user: string;
  /** Enable thinking mode (slower, stronger reasoning). Default off. */
  thinking?: boolean;
  /** Force the model to emit syntactically valid JSON. */
  jsonOutput?: boolean;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  // deepseek-v4-flash, non-thinking by default: fast and cheap. (The legacy
  // names deepseek-chat / deepseek-reasoner retire on 2026-07-24.)
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      max_tokens: opts.maxTokens ?? 4096,
      ...(opts.jsonOutput ? { response_format: { type: "json_object" } } : {}),
      // V4 models default to thinking mode; set it explicitly either way.
      // Legacy model names don't take this parameter.
      ...(model.startsWith("deepseek-v4")
        ? { thinking: { type: opts.thinking ? "enabled" : "disabled" } }
        : {}),
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 60_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`DeepSeek API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
