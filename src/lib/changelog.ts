// Release notes shown at /changelog.
//
// Newest release first. Add a new entry at the top of RELEASES when shipping,
// and keep `version` in step with package.json. Entries are written for
// learners and question authors, not for developers — describe what changed
// about using the app, not which files moved.

export type ChangeKind = "added" | "fixed" | "changed" | "security";

export interface ChangeEntry {
  kind: ChangeKind;
  text: string;
}

export interface Release {
  version: string;
  /** ISO date, rendered in the reader's locale. */
  date: string;
  /** One line on the theme of the release; omit when the entries speak for themselves. */
  summary?: string;
  changes: ChangeEntry[];
}

export const RELEASES: Release[] = [
  {
    version: "0.2.0",
    date: "2026-07-30",
    summary: "Bulk question import now rejects broken rows instead of importing them silently.",
    changes: [
      {
        kind: "fixed",
        text:
          "Bulk import no longer accepts a multiple-choice row whose correct_answer points at a blank option. " +
          "Such rows previously imported as questions with no correct choice, which no learner could ever answer " +
          "correctly. The row is now reported with the option letters that are actually present.",
      },
      {
        kind: "fixed",
        text:
          "Bulk import now matches a subtopic within the subject named on the row. Topic names are shared across " +
          "subjects, so an import could previously attach questions to a same-titled topic in the wrong subject.",
      },
      {
        kind: "added",
        text:
          "Bulk import rejects a multiple-choice row that has fewer than two non-empty options, and reports an " +
          "unrecognised subject by name.",
      },
      {
        kind: "changed",
        text:
          "Large imports are faster: subject and topic lookups are reused across rows rather than repeated for " +
          "every line of the file.",
      },
      { kind: "added", text: "This patch notes page, linked from the footer." },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-07-30",
    summary: "First public deployment.",
    changes: [
      {
        kind: "added",
        text: "Digital Electronics joins Feedback and Control Systems, with per-subject practice and reports.",
      },
      {
        kind: "security",
        text:
          "Sign-up is invite-only, and sessions are signed with a deployment secret that the app refuses to start " +
          "without in production.",
      },
      { kind: "changed", text: "Moved to a hosted PostgreSQL database so progress persists across deployments." },
      { kind: "added", text: "Subject report page breaking results down by topic." },
      { kind: "added", text: "Redesigned interface, 51 achievement tiers, and badge artwork." },
    ],
  },
];

export const CURRENT_VERSION = RELEASES[0].version;

const KIND_LABEL: Record<ChangeKind, string> = {
  added: "New",
  fixed: "Fixed",
  changed: "Changed",
  security: "Security",
};

const KIND_CHIP: Record<ChangeKind, string> = {
  added: "chip-success",
  fixed: "chip-brand",
  changed: "chip-neutral",
  security: "chip-warning",
};

export function kindLabel(kind: ChangeKind): string {
  return KIND_LABEL[kind];
}

export function kindChip(kind: ChangeKind): string {
  return KIND_CHIP[kind];
}
