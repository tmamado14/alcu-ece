import { requireUser } from "@/lib/auth";
import { handle, ok } from "@/lib/api";
import { generateLearnerReport } from "@/services/reports";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok(await generateLearnerReport(user.id));
});
