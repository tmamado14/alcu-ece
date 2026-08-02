// One topic's report: the learner's answered questions there plus their stats.
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, handle, ok } from "@/lib/api";
import { getTopicReport } from "@/services/reports";

const Params = z.object({ topicId: z.string().min(1) });

export const GET = handle(
  async (_req: Request, { params }: { params: Promise<{ topicId: string }> }) => {
    const user = await requireUser();
    const { topicId } = Params.parse(await params);
    const report = await getTopicReport(user.id, topicId);
    if (!report) return fail("Topic not found", 404);
    return ok(report);
  }
);
