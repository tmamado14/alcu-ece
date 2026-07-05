import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { getAttemptHistory } from "@/services/reports";

export const GET = handle(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const history = await getAttemptHistory(
    user.id,
    {
      topicId: url.searchParams.get("topicId") ?? undefined,
      result: url.searchParams.get("result") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    },
    page
  );
  return ok(history);
});
