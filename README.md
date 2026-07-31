# ⚡ ECE Mastery

An adaptive, gamified problem-practice platform for Electronics Engineering subjects. It ships with
**Feedback and Control Systems** and **Digital Electronics**. Answer one problem at a time, get two
tries, read full step-by-step solutions, and watch topic mastery bars move from *learning* →
*passed* → *mastered* while earning XP, badges, and quests.

Runs locally for solo study, or online for a group — see
[section 4](#4-deploying-online-vercel--neon) for the free Vercel + Neon deployment. Signup is
invite-only, and every account keeps its own progress, ratings, and badges. Architected so teacher
dashboards and more ECE subjects (Signals and Systems, Communications, Electromagnetics, …) can be
added later.

---

## 1. Running the app

### Prerequisites

- **Node.js 20 or newer** (check with `node --version`; download from https://nodejs.org)
- **A Postgres database.** The quickest option is a free [Neon](https://neon.com) project — create
  one, add a branch called `dev`, and use its connection strings below. See
  [section 4](#4-deploying-online-vercel--neon) for the full picture.

### First-time setup

Open a terminal in the project folder and run:

```bash
# 1. Create your environment file
copy .env.example .env        # Windows (cmd/PowerShell)
# cp .env.example .env        # macOS/Linux/Git Bash

# 2. Edit .env: paste your Neon *dev* branch strings into DATABASE_URL (the
#    pooled one) and DIRECT_URL (the direct one).

# 3. Install dependencies, create the tables, and load seed data — one command:
npm run setup
```

`npm run setup` does four things: `npm install` → `prisma generate` → `prisma migrate deploy`
(creates the tables) → runs the seed script (2 subjects, 22 topic groups, 117 subtopics, 585
problems, and the demo accounts).

Each subject's curriculum is defined in `prisma/seed.ts` and its question bank in a CSV beside it:

| Subject | Questions |
| --- | --- |
| Feedback and Control Systems | `prisma/seed-questions.csv` |
| Digital Electronics | `prisma/seed-questions-digital-electronics.csv` |

Rerunning the seed on an existing database is safe: subjects already in the database are left alone
(along with all attempts, XP, and earned badges), and any subject newly added to `seed.ts` is
created. Use `SEED_RESET=1 npm run db:seed` for a full wipe and reseed.

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
| `npm run db:seed` | Load seed data; adds new subjects, keeps existing user data |
| `npm run db:migrate` | Create a migration after editing `prisma/schema.prisma` |

### Choosing what to master first (Focus)

By default, adaptive practice roams the whole subject. To work through one part of the
curriculum instead, set a **focus**:

1. Open **Subjects** and pick a subject.
2. Press **Focus whole group** on a topic group (all of its subtopics), or **Focus** on a single
   subtopic.

While a focus is set:

- **Adaptive practice draws only from it.** Within a group, practice sticks to one target subtopic
  at a time, taken in curriculum order, and moves on once that subtopic is *mastered* (not merely
  passed). A subtopic that slips back to *needs review* becomes the target again.
- Prerequisites **inside** the focused group are respected; prerequisites outside it are ignored,
  since the goal was chosen deliberately.
- The dashboard and topic map show goal progress (subtopics mastered) and the current target.
- **Drill links and Review mode ignore the focus**, so you can always step outside it.

Press **Clear** on the focus panel to go back to whole-subject practice. A focus is a preference,
not progress: resetting your progress leaves it in place.

### Resetting your learning progress

Two options:

- **Just your progress** (attempts, XP, badges, quests — keeps the question bank):
  log in → **Settings** → *Danger zone* → **Reset my progress**.
- **Everything back to factory state** (also removes any questions you added):
  `SEED_RESET=1 npm run db:seed`. Without `SEED_RESET=1` the seed is additive and preserves
  accounts and progress.

### Troubleshooting

- **"Environment variable not found: DATABASE_URL"** — you skipped step 1; create `.env` from
  `.env.example`.
- **Login fails with the seeded accounts** — the database was never seeded; run `npm run db:seed`.
- **"Environment variable not found: DIRECT_URL"** — add the unpooled Neon string to `.env`;
  `prisma migrate` needs it even though the app itself does not.
- **Port 3000 already in use** — run `npm run dev -- -p 3001` and open that port instead.
- **Prisma client errors after pulling new code** — run `npx prisma generate && npm run db:deploy`.

---

## 2. Admin guide: uploading questions

Log in as `admin` and open the **Admin** link in the navigation bar. There are three ways to add
questions: one at a time in the editor, bulk CSV import, or bulk JSON import.

### 2.1 Adding a single question (Admin → New problem)

1. **Topic** — pick the subtopic the question belongs to (e.g.
   *Feedback and Control Systems / Time Response Analysis / Transient Analysis of Second Order
   Systems*).
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

- **subtopic** is matched by its exact title (`Routh-Hurwitz Criterion`) or by its slug
  (`routh-hurwitz-criterion`). See Admin → Topics for the full list. The subtopic must
  already exist.
- **answer_type**: `multiple_choice_single`, `numerical_tolerance`, `text_short`,
  `algebraic_expression`, or `true_false`.
- **correct_answer** depends on the type:
  - multiple choice → the letter (`B`)
  - numerical → the number (`0.5`)
  - true/false → `true` or `false`
  - text/expression → accepted variants separated by `|` (`open loop|open-loop`)
- **numerical_tolerance** — tolerance for numerical answers. A bare number is an *absolute*
  tolerance (`0.01`); a percent suffix is a *relative* one (`1%` = ±1% of the answer). Give both
  separated by `;` (`0.01;1%`) to accept a value inside either bound. Leave blank for the default
  ±1% relative tolerance. Prefer a relative tolerance for computed decimals so ordinary
  3-significant-figure work passes, and an absolute one for whole-number answers (counts, bit
  widths), where a percentage would wrongly accept neighbouring integers.
- **skill_tags** — separated by `;` (e.g. `damping-ratio;second-order`).
- **cognitive_level** — `recall`, `comprehension`, `application`, `analysis`, `synthesis`,
  or `evaluation`.
- Quote any field containing commas: `"For $s^2+2s+4=0$, find zeta."`

Example rows (header + one MC + one numerical):

```csv
subject,topic,subtopic,skill_tags,difficulty,cognitive_level,answer_type,question_text,option_a,option_b,option_c,option_d,correct_answer,numerical_tolerance,solution,explanation,reference
Feedback and Control Systems,Stability Analysis,Stability in Terms of Pole Locations,stability;poles,3,recall,multiple_choice_single,A stable LTI system has all poles located where?,Right half-plane,Left half-plane,On the imaginary axis,At the origin,B,,All LHP poles give decaying exponential modes.,,
Feedback and Control Systems,Time Response Analysis,Transient Analysis of Second Order Systems,damping-ratio,4,application,numerical_tolerance,"For $s^2+2s+4=0$, find $\zeta$.",,,,,0.5,0.01,"$\omega_n=2$, so $\zeta = 2/(2\cdot 2) = 0.5$.",,
```

After importing, the result panel reports how many problems were created and lists any row-level
errors (unknown subtopic, missing fields, …) — valid rows still import.

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
2. **Add topic**: pick the **subject** it belongs to, then choose *No parent* to create a major
   topic group, or pick a parent to create a subtopic under it. Give it a kebab-case slug (this is what CSV imports match on), a difficulty
   band (1–5, used for topic ordering/recommendations), and optional comma-separated prerequisite
   slugs (e.g. `damping-ratio` requires `second-order-systems`).

### 2.6 Handling learner-reported issues

When a learner clicks 🚩 on a problem, the report appears at the top of the Admin page. From there
you can jump straight to **Edit problem**, then mark the report *resolved* or *dismissed*.
Archiving a problem (in the editor) removes it from practice while keeping attempt history intact.

### 2.7 Inviting other people (Admin → Invites)

Signup is **invite-only** — there is no open registration. To give someone an account:

1. Go to **Admin → Invites** and press **Create invite**. Optionally set a label (for your own
   reference), how many people may use the code, and an expiry in days.
2. Press **Copy link** on the new row and send it to them. The link is
   `/signup?code=ABCD-EFGH-JKMN`, which pre-fills the code; they can also type it at `/signup`.
3. They choose their own username and password and land on their dashboard.

Each account has **its own** attempts, topic ratings, XP, streak, badges, and quests — nothing is
shared. Codes can be revoked at any time; revoking does not affect accounts already created with
that code. A code with several uses is handy for a study group: one link for everyone.

> **Important:** do not hand out the seeded `learner` account. Two people sharing one login share a
> single set of progress records, which corrupts both learners' adaptive ratings.

---

## 3. How the platform works (for the curious)

- **Adaptive engine** (`src/lib/adaptive.ts`) — each learner-topic pair has an Elo-style rating
  (default 1000). Problem difficulty 1–10 maps to 900–1500. First-try correct raises the rating
  strongly, second-try slightly, misses lower it, give-ups slightly. A confidence score grows with
  evidence and shrinks the update step. Status thresholds: pass at 1100, mastery at 1300
  (configurable per topic). Problem selection favors rating fit, unseen problems, weak skill tags,
  previously missed problems, and occasional review of passed topics; the learner's difficulty
  preference (easy/normal/hard/challenge) shifts the target band.
- **Focus** (`src/services/focus.ts`, `pickFocusTarget` in `src/lib/adaptive.ts`) — an optional
  learning goal pinned to a topic group or subtopic. It filters the candidate pool to that
  subtree and adds a score boost to the one target subtopic, so a group is worked through in
  order instead of all at once. Stored on the user row (`focusTopicId`).
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

Next.js 15 + TypeScript + Tailwind CSS 4 + Prisma + PostgreSQL + KaTeX + Zod + Vitest. Auth is
local (scrypt + signed session cookies) behind `requireUser()`/`requireAdmin()`, so OAuth can be
swapped in by replacing one module. Class/enrollment/assignment tables already exist as
placeholders for future teacher dashboards.

---

## 4. Deploying online (Vercel + Neon)

The app runs on **Vercel** (free Hobby plan) with **Neon** serverless Postgres (free plan). Total
cost: nothing, for a study group's worth of traffic.

> Vercel's Hobby plan is for personal, non-commercial use. A free study tool for classmates is
> fine; charging for access or running ads on it is not, and needs a Pro plan.

### 4.1 Create the database

1. Sign up at [neon.com](https://neon.com) and create a project.
2. Create a second **branch** named `dev` (Branches → New branch, parent = your default branch,
   auto-delete Never, "Branch data and schema"). The deployed app uses the default branch — Neon
   names it `production` — and your laptop uses `dev`, so local experiments never touch your
   colleagues' data.
3. For each branch, open **Connect** and copy two strings:
   - the **pooled** one (host contains `-pooler`) → `DATABASE_URL`
   - the **direct/unpooled** one → `DIRECT_URL`

### 4.2 Point your laptop at the dev branch

Put the `dev` branch strings in your local `.env`, then create the tables and load the questions:

```bash
npm run db:deploy   # applies prisma/migrations to the dev branch
npm run db:seed     # loads both subjects and the gamification catalog
npm run dev
```

### 4.3 Deploy to Vercel

1. Sign up at [vercel.com](https://vercel.com) with your GitHub account and **import** the
   `alcu-ece` repository. Framework preset: Next.js (auto-detected). Do not deploy yet.
2. Add these **Environment Variables** (all environments):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **production** branch, **pooled** string |
   | `DIRECT_URL` | Neon **production** branch, **direct** string |
   | `SESSION_SECRET` | a long random string — see below |
   | `SEED_ADMIN_PASSWORD` | the admin password you want (min 8 chars) |
   | `DEEPSEEK_API_KEY` | optional, only for AI solution generation |

   Generate the session secret with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   The app **refuses to start** in production if `SESSION_SECRET` is missing, shorter than 32
   characters, or left at the placeholder — a guessable secret would let anyone forge an admin
   session cookie.
3. Press **Deploy**. Vercel runs `npm run vercel-build`, which applies migrations
   (`prisma migrate deploy`) before building, so the schema is always in step with the code.

### 4.4 Load the questions into production, once

From your laptop, with the **production** branch strings temporarily in `.env`:

```bash
SEED_ADMIN_PASSWORD='your-real-password' npm run db:seed
```

This creates the admin account and both question banks. The demo `learner` account is **not**
created when `NODE_ENV=production`; set `SEED_DEMO_LEARNER=1` if you want it anyway.

Rerunning the seed later is safe: it only adds subjects that aren't in the database yet and
refreshes the badge/quest/achievement catalog. Attempts, XP, and accounts are never touched.

### 4.5 Invite your colleagues

Log in as `admin`, go to **Admin → Invites**, create a code, and send each person the copied link.
See [2.7](#27-inviting-other-people-admin--invites). Never share the admin login — admins can edit
and delete the question bank.

### 4.6 Things worth knowing

- **First request is slow.** Neon's free plan suspends the database after 5 minutes idle, so the
  first hit after a quiet spell waits a second or two while it wakes. Subsequent requests are fast.
- **Free-plan headroom.** Neon free gives 0.5 GB storage and 100 CU-hours/month; this database is a
  few MB and idles at zero cost, so a study group will not come close.
- **Backups.** The question bank is the irreplaceable part, and it lives in `prisma/*.csv` in git.
  After bulk edits in the admin UI, use **Admin → Export CSV** and commit the result.
- **Migrations.** After changing `prisma/schema.prisma`, run `npm run db:migrate` locally to
  generate a migration, then commit it. Vercel applies it on the next deploy. Never run
  `prisma db push` against production — it can drop columns without warning.
