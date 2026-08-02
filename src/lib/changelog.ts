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
    version: "0.3.1",
    date: "2026-08-02",
    summary: "Adaptive practice now draws from the whole subject, and the report lets you look into a topic.",
    changes: [
      {
        kind: "fixed",
        text:
          "Adaptive practice kept handing out questions from the first few topics of a subject — in Feedback and " +
          "Control Systems that meant the Laplace transform topics, over and over, no matter how much of the rest " +
          "of the syllabus was untouched. When several questions suited you equally well, the app was quietly " +
          "picking whichever one happened to be first in the question bank instead of choosing between them. " +
          "Practice now spreads across every topic in the subject.",
      },
      {
        kind: "fixed",
        text:
          "A question you opened but left without answering was treated as already done and never offered again. " +
          "Those questions are back in circulation.",
      },
      {
        kind: "fixed",
        text:
          "Review sessions started from a subject could pull questions from your other subject as well. A review " +
          "now stays inside the subject you chose, while still ranging across its topics.",
      },
      {
        kind: "added",
        text:
          "Clicking a topic in your report now opens that topic: the questions you have answered under it, how " +
          "many you got right, and your rating, streak and progress for it. Previously the same click dropped you " +
          "straight into a practice session — starting practice is now a separate, deliberate button.",
      },
      {
        kind: "changed",
        text:
          "Practice sessions show which subtopic the current question belongs to, and say so up front when a " +
          "session covers a whole group of subtopics rather than a single one, so it is clear where your points " +
          "are going.",
      },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-07-31",
    summary: "Numerical answers accept ordinary rounding, and question authors can see the tolerance again.",
    changes: [
      {
        kind: "fixed",
        text:
          "86 numerical questions with decimal answers demanded more decimal places than the printed solution " +
          "showed — an answer of 0.1353 had to be typed to four places to be marked correct. These now accept " +
          "anything within 1% of the exact value, so normal three-significant-figure work passes. Whole-number " +
          "answers such as counts and bit widths are unchanged and still require the exact figure.",
      },
      {
        kind: "fixed",
        text:
          "The problem editor showed an empty tolerance box for every imported numerical question. The tolerance " +
          "was stored and applied correctly all along, but it was an absolute tolerance and the editor could only " +
          "display a relative one. Both are now shown and editable.",
      },
      {
        kind: "changed",
        text:
          "The numerical_tolerance column in question CSVs now accepts a percentage (1%) for a relative tolerance " +
          "alongside a plain number for an absolute one, and exports keep whichever form a question uses. " +
          "Previously a relative tolerance was dropped on export.",
      },
    ],
  },
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
