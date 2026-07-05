# ⚡ ECE Mastery

An adaptive, gamified problem-practice platform for Electronics Engineering subjects, starting with
**Feedback and Control Systems**. Local-first and personal-use today; architected so online accounts,
teacher dashboards, and more subjects can be added later.

## Quick start

Requires Node.js 20+.

```bash
cp .env.example .env   # on Windows: copy .env.example .env
npm run setup          # install deps, generate Prisma client, create SQLite DB, seed data
npm run dev            # start the app at http://localhost:3000
```

Seeded accounts:

| Role    | Username  | Password     |
| ------- | --------- | ------------ |
| Learner | `learner` | `learner123` |
| Admin   | `admin`   | `admin123`   |

Other commands:

```bash
npm test        # run unit tests (grading, adaptive engine, XP/badges/quests)
npm run db:seed # re-seed (wipes and recreates all data)
npm run build   # production build
```

## What's inside

- **Practice flow** — one problem at a time, two attempts, hints, full step-by-step solutions,
  bookmark / needs-review / report-issue actions, XP pop, rating delta, next-problem loop.
- **Adaptive engine** (`src/lib/adaptive.ts`) — transparent Elo-style ratings per learner-topic pair
  (problems map difficulty 1–10 to 900–1500 rating). First-try correct moves the rating strongly,
  second-try slightly, misses down, give-ups mildly down. Confidence grows with evidence and shrinks
  the K-factor. Topic status: `not_started → learning → passed → mastered`, with `needs_review`
  when a passed topic's rating collapses. Selection scores candidates on rating fit, unseen bonus,
  weak-tag targeting, missed-problem revisits, and spaced review of passed topics, with the
  user-selected difficulty preference shifting the target band.
- **Gamification** (`src/lib/gamification.ts`) — XP economy (scaled by difficulty and try number,
  plus topic-passed/mastered/comeback bonuses), global level curve, 11 badges, 8 achievements
  (4 hidden), and 7 daily/weekly quests tracked per ISO day/week.
- **Question bank** — 60+ original Control Systems problems across 34 subtopics: multiple choice,
  numerical with tolerance (fractions, `pi`, scientific notation, unit stripping), short text with
  accepted variants, algebraic expressions with string normalization, and true/false.
- **Reports** — dashboard (level, streak, accuracy by topic/difficulty, weak skills, topic ratings,
  recommended next topics) and full attempt history with filters and re-openable solutions.
- **Admin panel** — problem CRUD with live LaTeX preview and preview-as-learner, topic/subject
  editor with prerequisites, CSV/JSON bulk import, JSON/CSV export, and reported-issue triage.

## Architecture

```
src/
  lib/          pure logic (no DB): grading, adaptive engine, gamification rules, csv, auth utils
  services/     DB-backed services: practice engine, gamification ledger, reports
  app/api/      REST endpoints (thin: validate with zod → call a service)
  app/          pages (App Router)
  components/   Latex renderer, TopicBar, Nav, ProblemEditor
prisma/         schema + seed
tests/          vitest unit tests for all core logic
```

Key service functions: `selectNextProblem`, `submitAnswer`/`giveUp` (grade → update rating → award
XP → evaluate quests/badges/achievements), `generateLearnerReport`.

### Answer grading

`src/lib/grading.ts` normalizes answers before comparison: numeric parsing supports decimals,
fractions (`3/4`), scientific notation (`1.5e3`), `pi` forms (`pi/4`, `2pi`), thousands commas,
percent signs, and optional unit suffixes, with absolute and/or relative tolerance. Expressions are
compared by normalization (whitespace, `*`, `**`→`^`, `{}`→`()`, redundant outer parens). Symbolic
equivalence (e.g. accepting `2/(s+3)` vs `2/(3+s)`) is a planned upgrade via a CAS
(math.js / nerdamer / SymPy microservice) behind the same `gradeAnswer` interface.

### Database

SQLite via Prisma for zero-setup local use. To move to PostgreSQL later, change the `datasource`
provider in `prisma/schema.prisma` to `postgresql`, point `DATABASE_URL` at your server, and run
`prisma db push` — the schema uses no SQLite-specific features. Class/enrollment/assignment tables
are already present as placeholders for future teacher features. JSON-ish fields (answer data,
hints, settings, quest params) are stored as strings for SQLite compatibility; on Postgres they can
become native `Json` columns.

### Auth

Local credentials with scrypt hashing and stateless HMAC-signed session cookies
(`src/lib/auth.ts`). Swapping in OAuth/NextAuth later only replaces this module — every route
already goes through `requireUser()` / `requireAdmin()`.

## Adding content

**Admin UI:** Admin → New problem (live LaTeX preview) or Admin → Import (paste CSV/JSON or upload
a file). CSV columns:

```
subject, topic, subtopic, skill_tags, difficulty, cognitive_level, answer_type, question_text,
option_a, option_b, option_c, option_d, correct_answer, numerical_tolerance, solution, explanation, reference
```

Subtopics match by slug (e.g. `Damping Ratio` → `damping-ratio`). For text/expression answers,
separate accepted variants with `|`. Skill tags separate with `;`.

**New subjects:** Admin → Topics → Add subject, then add topics/subtopics and import problems.
Nothing in the engine is Control-Systems-specific except the seeded badge/quest definitions.

## Roadmap (deliberately not in MVP)

Multi-user deployment (Postgres + hosted auth), teacher dashboards using the existing
Class/Enrollment/Assignment tables, symbolic answer equivalence via a CAS service, mobile app
(the API is already a clean REST surface), payments, AI-generated questions.
