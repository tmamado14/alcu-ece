// Topic progress bar with the status color language used across the app:
// gray = not started, orange = learning, green = passed, blue = mastered,
// red = needs review.

export const STATUS_COLORS: Record<string, { bar: string; text: string; label: string }> = {
  not_started: { bar: "bg-slate-300", text: "text-slate-500", label: "Not started" },
  learning: { bar: "bg-orange-500", text: "text-orange-700", label: "Learning" },
  passed: { bar: "bg-green-500", text: "text-green-700", label: "Passed" },
  mastered: { bar: "bg-blue-500", text: "text-blue-700", label: "Mastered" },
  needs_review: { bar: "bg-red-500", text: "text-red-700", label: "Needs review ⚠️" },
};

export default function TopicBar({
  status,
  rating,
  passThreshold = 1100,
  masteryThreshold = 1300,
}: {
  status: string;
  rating: number;
  passThreshold?: number;
  masteryThreshold?: number;
}) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.not_started;
  // scale: 900 → 0%, mastery+100 → 100%
  const min = 900;
  const max = masteryThreshold + 100;
  const pct = Math.min(100, Math.max(2, ((rating - min) / (max - min)) * 100));
  const passPct = ((passThreshold - min) / (max - min)) * 100;
  const masteryPct = ((masteryThreshold - min) / (max - min)) * 100;
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`bar-fill h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
      <div className="absolute top-0 h-full w-px bg-slate-400/60" style={{ left: `${passPct}%` }} title="Pass threshold" />
      <div className="absolute top-0 h-full w-px bg-slate-400/60" style={{ left: `${masteryPct}%` }} title="Mastery threshold" />
    </div>
  );
}
