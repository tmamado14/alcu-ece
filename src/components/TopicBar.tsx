// Topic progress bar with the status color language used across the app:
// slate = not started, orange = learning, green = passed, blue = mastered,
// red = needs review.

// Meaning-bearing only, never decorative — and set at the deeper steps the
// Industry ground needs to stay AA at small sizes.
export const STATUS_COLORS: Record<string, { bar: string; text: string; label: string }> = {
  not_started: { bar: "bg-gray-500", text: "text-gray-600", label: "Not started" },
  learning: { bar: "bg-orange-700", text: "text-orange-800", label: "Learning" },
  passed: { bar: "bg-green-700", text: "text-green-800", label: "Passed" },
  mastered: { bar: "bg-cyan-700", text: "text-cyan-800", label: "Mastered" },
  needs_review: { bar: "bg-red-700", text: "text-red-800", label: "Needs review ⚠️" },
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
    <div className="progress-track relative h-2.5">
      <div className={`progress-fill ${c.bar}`} style={{ width: `${pct}%` }} />
      {/* the pass and mastery thresholds, drawn as ticks overhanging the track */}
      <div
        className="absolute -top-[3px] -bottom-[3px] w-px bg-ink/50"
        style={{ left: `${passPct}%` }}
        title="Pass threshold"
      />
      <div
        className="absolute -top-[3px] -bottom-[3px] w-px bg-ink/50"
        style={{ left: `${masteryPct}%` }}
        title="Mastery threshold"
      />
    </div>
  );
}
