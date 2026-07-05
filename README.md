# ⚡ ECE Mastery

An adaptive, gamified problem-practice platform for Electronics Engineering subjects, starting with
**Feedback and Control Systems**. Answer one problem at a time, get two tries, read full
step-by-step solutions, and watch topic mastery bars move from *learning* → *passed* → *mastered*
while earning XP, badges, and quests.

Local-first and personal-use today; architected so online accounts, teacher dashboards, and more
ECE subjects (Signals and Systems, Communications, Electronics, …) can be added later.

---

## 1. Running the app

### Prerequisites

- **Node.js 20 or newer** (check with `node --version`; download from https://nodejs.org)
- No database server needed — the app uses a local SQLite file via Prisma.

### First-time setup

Open a terminal in the project folder and run:

```bash
# 1. Create your environment file
copy .env.example .env        # Windows (cmd/PowerShell)
# cp .env.example .env        # macOS/Linux/Git Bash

# 2. Install dependencies, create the database, and load seed data — one command:
npm run setup
```

`npm run setup` does four things: `npm install` → `prisma generate` → `prisma db push`
(creates `prisma/dev.db`) → runs the seed script (curriculum + 60+ problems + accounts).

### Start the app

```bash
npm run dev
```

Then open **http://localhost:3000** and log in with one of the seeded accounts:

| Role    | Username  | Password     | Can do                                      |
| ------- | --------- | ------------ | ------------------------------------------- |
| Learner | `learner` | `learner123` | Practice, dashboard, report, history, quests, badges |
| Admin   | `admin`   | `admin123`   | Everything above **plus** the Admin panel    |

### Everyday commands

| Command           | What it does                                              |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Start the app in development mode (hot reload)            |
| `npm run build`   | Production build                                          |
| `npm start`       | Serve the production build                                |
| `npm test`        | Run the unit tests (grading, adaptive engine, gamification) |
| `npm run db:seed` | **Wipe and re-seed** the database back to a fresh state   |

### Resetting your learning progress

Two options:

- **Just your progress** (attempts, XP, badges, quests — keeps the question bank):
  log in → **Settings** → *Danger zone* → **Reset my progress**.
- **Everything back to factory state** (also removes any questions you added):
  `npm run db:seed`.

### Troubleshooting

- **"Environment variable not found: DATABASE_URL"** — you skipped step 1; create `.env` from
  `.env.example`.
- **Login fails with the seeded accounts** — the database was never seeded; run `npm run db:seed`.
- **Port 3000 already in use** — run `npm run dev -- -p 3001` and open that port instead.
- **Prisma client errors after pulling new code** — run `npx prisma generate && npx prisma db push`.

---

## 2. Admin guide: uploading questions

Log in as `admin` and open the **Admin** link in the navigation bar. There are three ways to add
questions: one at a time in the editor, bulk CSV import, or bulk JSON import.

### 2.1 Adding a single question (Admin → New problem)

1. **Topic** — pick the subtopic the question belongs to (e.g.
   *Feedback and Control Systems / Time Response Analysis / Damping Ratio*).
2. **Answer type** — one of:

   | Type                   | Learner sees            | You provide                                   |
   | ---------------------- | ----------------------- | --------------------------------------------- |
   | Multiple choice        | A/B/C/D radio buttons   | Choice texts + which label is correct         |
   | Numerical (tolerance)  | A number input          | Correct value, tolerance, optional unit       |
   | Short text             | A text input            | List of accepted answer variants              |
   | Algebraic expression   | A text input            | Accepted expression(s), e.g. `2/(s+3)`        |
   | True / False           | True/False buttons      | The correct boolean                           |

3. **Problem statement** — plain text with LaTeX: `$...$` for inline math, `$$...$$` for display
   math, `**bold**` for emphasis. Example:

   ```
   A second-order system has characteristic equation $s^2 + 4s + 25 = 0$. Find the damping ratio $\zeta$.
   ```

4. **Numerical answers** — set the correct value plus a tolerance. Relative tolerance `0.02`
   means ±2% is accepted. Learners may type fractions (`2/5`), `pi` forms (`pi/4`), scientific
   notation (`1.5e3`), and the unit you specify (e.g. `2 s` when the unit is `s`).
5. **Short text / expression answers** — enter one accepted variant per line. Matching is
   case-insensitive and whitespace-tolerant; expressions are also normalized (`2 / (S+3)` matches
   `2/(s+3)`). Include common phrasings, e.g. for "open loop": `open loop`, `open-loop`,
   `open-loop system`.
6. **Difficulty (1–10)** — drives the adaptive engine. 1–3 ≈ warm-ups, 4–6 ≈ standard exam
   items, 7–10 ≈ hard/board-level. The engine serves problems near the learner's topic rating.
7. **Hints** — one per line, revealed one at a time on request.
8. **Solution** — the full worked solution (LaTeX supported). Shown after a correct answer, two
   misses, or a give-up. Use `**Step 1.**` style for multi-step derivations.
9. **Tags** — comma-separated skill tags (e.g. `routh-hurwitz, stability`). Tags power the
   weak-skill targeting and some badges.
10. **Status** — only `active` problems are served to learners. Use `draft` while writing.
11. Click **👁 Preview as learner** to check the LaTeX rendering before saving.

### 2.2 Bulk upload via CSV (Admin → Import)

Paste CSV text or upload a `.csv` file. The first row must be the header:

```
subject, topic, subtopic, skill_tags, difficulty, cognitive_level, answer_type, question_text, option_a, option_b, option_c, option_d, correct_answer, numerical_tolerance, solution, explanation, reference
```

Rules:

- **subtopic** is matched by *slug*: lowercase with hyphens (`Damping Ratio` → `damping-ratio`).
  See Admin → Topics for the full slug list. The subtopic must already exist.
- **answer_type**: `multiple_choice_single`, `numerical_tolerance`, `text_short`,
  `algebraic_expression`, or `true_false`.
- **correct_answer** depends on the type:
  - multiple choice → the letter (`B`)
  - numerical → the number (`0.5`)
  - true/false → `true` or `false`
  - text/expression → accepted variants separated by `|` (`open loop|open-loop`)
- **numerical_tolerance** — absolute tolerance for numerical answers; leave blank for the
  default ±1% relative tolerance.
- **skill_tags** — separated by `;` (e.g. `damping-ratio;second-order`).
- **cognitive_level** — `recall`, `comprehension`, `application`, `analysis`, or `synthesis`.
- Quote any field containing commas: `"For $s^2+2s+4=0$, find zeta."`

Example rows (header + one MC + one numerical):

```csv
subject,topic,subtopic,skill_tags,difficulty,cognitive_level,answer_type,question_text,option_a,option_b,option_c,option_d,correct_answer,numerical_tolerance,solution,explanation,reference
Feedback and Control Systems,Stability,Poles and Stability,stability;poles,3,recall,multiple_choice_single,A stable LTI system has all poles located where?,Right half-plane,Left half-plane,On the imaginary axis,At the origin,B,,All LHP poles give decaying exponential modes.,,
Feedback and Control Systems,Time Response Analysis,Damping Ratio,damping-ratio,4,application,numerical_tolerance,"For $s^2+2s+4=0$, find $\zeta$.",,,,,0.5,0.01,"$\omega_n=2$, so $\zeta = 2/(2\cdot 2) = 0.5$.",,
```

After importing, the result panel reports how many problems were created and lists any row-level
errors (bad topic slug, missing fields, …) — valid rows still import.

### 2.3 Bulk upload via JSON (Admin → Import)

Paste a JSON array on the same page (it auto-detects JSON). Each object uses the internal format,
which gives you full control (hints, estimated time, choices with LaTeX):

```json
[
  {
    "topicId": "<topic id — or import via CSV if you prefer slugs>",
    "statement": "Compute the settling time for $\\zeta\\omega_n = 5$ (2% criterion).",
    "answerType": "numerical_tolerance",
    "answerData": { "value": 0.8, "toleranceRel": 0.02, "unit": "s" },
    "cognitiveLevel": "application",
    "difficulty": 4,
    "hints": ["Use $t_s = 4/(\\zeta\\omega_n)$."],
    "solution": "**Step 1.** $t_s = 4/5 = 0.8$ s.",
    "tags": ["settling-time"],
    "status": "active"
  }
]
```

`answerData` by type:

| answerType             | answerData                                                        |
| ---------------------- | ----------------------------------------------------------------- |
| `multiple_choice_single` | `{ "correct": "B" }` plus a top-level `choices` array of `{label, text}` |
| `numerical_tolerance`  | `{ "value": 0.5, "toleranceAbs": 0.01 }` and/or `"toleranceRel"`, optional `"unit"` |
| `text_short`           | `{ "accepted": ["open loop", "open-loop"] }`                      |
| `algebraic_expression` | `{ "accepted": ["2/(s+3)"] }`                                     |
| `true_false`           | `{ "correct": true }`                                             |

> Tip: the easiest way to learn the JSON shape is **Export JSON** (below) and copy an existing
> problem as a template.

### 2.4 Exporting / backing up the question bank

On the Admin page:

- **Export JSON** — full-fidelity backup (re-importable on the same page).
- **Export CSV** — spreadsheet-friendly, same columns as the CSV import.

### 2.5 Adding topics and subjects (Admin → Topics)

Questions can only attach to existing **subtopics**, so create the topic first:

1. **Add subject** (only for a brand-new subject like *Signals and Systems*): title + kebab-case
   slug.
2. **Add topic**: choose *No parent* to create a major topic group, or pick a parent to create a
   subtopic under it. Give it a kebab-case slug (this is what CSV imports match on), a difficulty
   band (1–5, used for topic ordering/recommendations), and optional comma-separated prerequisite
   slugs (e.g. `damping-ratio` requires `second-order-systems`).

### 2.6 Handling learner-reported issues

When a learner clicks 🚩 on a problem, the report appears at the top of the Admin page. From there
you can jump straight to **Edit problem**, then mark the report *resolved* or *dismissed*.
Archiving a problem (in the editor) removes it from practice while keeping attempt history intact.

---

## 3. How the platform works (for the curious)

- **Adaptive engine** (`src/lib/adaptive.ts`) — each learner-topic pair has an Elo-style rating
  (default 1000). Problem difficulty 1–10 maps to 900–1500. First-try correct raises the rating
  strongly, second-try slightly, misses lower it, give-ups slightly. A confidence score grows with
  evidence and shrinks the update step. Status thresholds: pass at 1100, mastery at 1300
  (configurable per topic). Problem selection favors rating fit, unseen problems, weak skill tags,
  previously missed problems, and occasional review of passed topics; the learner's difficulty
  preference (easy/normal/hard/challenge) shifts the target band.
- **Grading** (`src/lib/grading.ts`) — numerical answers accept decimals, fractions, `pi` forms,
  scientific notation, commas, percent signs, and unit suffixes within absolute/relative tolerance.
  Text answers match normalized accepted variants. Expressions are compared after normalization
  (whitespace, `*`, `**`→`^`, braces→parens). Symbolic equivalence via a CAS is a planned upgrade
  behind the same interface.
- **Gamification** (`src/lib/gamification.ts`) — XP scales with difficulty and try number, plus
  bonuses for passing/mastering topics and comebacks; 11 badges, 8 achievements (4 hidden), and
  7 daily/weekly quests tracked per ISO day/week.

### Project layout

```
src/
  lib/          pure logic (no DB): grading, adaptive engine, gamification rules, csv, auth
  services/     DB-backed services: practice engine, gamification ledger, reports
  app/api/      REST endpoints (validate with zod → call a service)
  app/          pages (Next.js App Router)
  components/   Latex renderer, TopicBar, Nav, ProblemEditor
prisma/         schema + seed data
tests/          vitest unit tests for all core logic
```

### Tech stack & future expansion

Next.js 15 + TypeScript + Tailwind CSS 4 + Prisma + KaTeX + Zod + Vitest. SQLite is used for
zero-setup local development; to move to PostgreSQL, change the `datasource` provider in
`prisma/schema.prisma` to `postgresql`, point `DATABASE_URL` at your server, and run
`prisma db push` — no SQLite-specific features are used. Auth is local (scrypt + signed session
cookies) behind `requireUser()`/`requireAdmin()`, so OAuth can be swapped in by replacing one
module. Class/enrollment/assignment tables already exist as placeholders for future teacher
dashboards.
