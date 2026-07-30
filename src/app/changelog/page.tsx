import type { Metadata } from "next";
import { RELEASES, kindChip, kindLabel } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Patch notes — ECE Mastery",
  description: "What changed in each release of ECE Mastery",
};

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function ChangelogPage() {
  return (
    <div className="fade-up mx-auto max-w-3xl">
      <h1 className="page-title">Patch notes</h1>
      <p className="page-sub">What changed in each release, newest first.</p>

      {RELEASES.map((release, i) => (
        <section key={release.version} className="mt-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-heading text-xl font-semibold tracking-wide text-ink uppercase">
              Version {release.version}
            </h2>
            {i === 0 && <span className="chip-brand">Current</span>}
            <span className="tnum ml-auto text-xs tracking-[0.06em] text-ink-faint uppercase">
              {formatDate(release.date)}
            </span>
          </div>
          <hr className="caption-rule" />
          {release.summary && <p className="mb-4 text-sm text-ink-muted">{release.summary}</p>}
          <ul className="space-y-3">
            {release.changes.map((c, j) => (
              <li key={j} className="plate flex flex-col gap-1.5 p-4 sm:flex-row sm:gap-3">
                <span className={`${kindChip(c.kind)} h-fit shrink-0 self-start`}>
                  {kindLabel(c.kind)}
                </span>
                <p className="text-sm leading-relaxed text-ink">{c.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
