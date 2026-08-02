# CLAUDE.md — working notes for this repo

ECE Mastery: an adaptive, gamified practice platform for Electronics Engineering board-exam
subjects. Next.js 15 (App Router) + TypeScript + Tailwind 4 + Prisma + PostgreSQL + KaTeX + Zod +
Vitest. Human-facing docs live in `README.md`; this file is the orientation for a new session.

## Current state (as of 2026-07-31, v0.3.0)

- **Live** at https://alcu-ece-brhq.vercel.app (Vercel Hobby).
- **Database:** Neon Postgres, region `ap-southeast-1` (Singapore). Two branches, each with its
  own endpoint — check which one `.env` holds before running anything destructive:

  | Branch | Endpoint | Used by |
  | --- | --- | --- |
  | `dev` | `ep-orange-sunset-azp0oebs` | local work; this is what `.env` normally holds |
  | `production` | `ep-soft-lab-azt8pcox` | the deployed app |

- **Local `.env`** points at the **`dev`** branch and is fully seeded and working.
- **Production is seeded and serving** — admin login works, both subjects present.
- **Vercel function region is `sin1`** (same region as the database).
- The repo is **not linked to the Vercel CLI** (no `.vercel/project.json`, `vercel` not installed),
  so production credentials cannot be pulled automatically — they have to be pasted into `.env` by
  hand and then swapped back.

### Verified working

- `dev` branch: migration applied, 2 subjects / 139 topics / **800 problems** / 1704 choices /
  2001 tags / 11 badges / 7 quests / 51 achievements.
- 14-check smoke test against Postgres passed: login, subject listing, DE topic map (74 subtopics),
  adaptive practice, subject-scoped practice, answer submission, invite issue/redeem/reuse-refusal,
  new-account isolation, report page.
- Numerical tolerances (2026-07-31, applied to **both** branches): 292 numerical questions, of
  which 206 carry an absolute tolerance and 86 a 1% relative one, and none are missing a tolerance.
- Production probes: migrations ran (bogus login returns 401, not a 500), `SESSION_SECRET` is valid
  (a garbage session cookie returns 401 rather than throwing), `InviteCode` table exists, and the
  login page does **not** leak demo credentials.
- `admin/admin123` and `learner/learner123` are both rejected in production — correct.
- Production bulk import (2026-07-30): admin login OK, `/api/subjects` 158 ms, and a 500-row CSV
  processed in **1.09 s** (~2 ms/row). Those rows all referenced an unknown subtopic, so they
  exercised auth, CSV parsing, topic lookup and the error path but inserted nothing — the insert
  path is heavier, extrapolating to roughly 10 ms/row.

## Next steps

1. **Issue invites** from Admin → Invites and share the copied links.
2. **Wrap the import loop in a transaction.** It still inserts row-by-row with no transaction and no
   dedup, so a mid-import failure leaves partial rows and re-uploading duplicates them. Much less
   likely to bite now that imports take seconds rather than minutes, but the sharp edge is real.
3. **Consider hard-delete for problems.** `DELETE /api/admin/problems/[id]` only sets
   `status: "archived"`, so a mistaken bulk upload can be hidden but not removed from the web app.

### Correcting question data already in production

There is **no re-import path**: the importer has no dedup, so uploading the exported CSV into a
database that already holds those rows doubles the bank rather than updating it, and the seed skips
subjects that already exist. Fix live data with a **throwaway script that updates matching rows**,
run against the production connection string, then delete it. What made that safe in practice:

- Have the script print the database host it connected to, and make a **dry run the default** with
  writes behind `--apply`.
- Give it a target count that differs per branch (dev had already been corrected, so it reported 0
  while production reported 86) — that is what proves which database is on the other end, not the
  contents of `.env`.
- Regenerate the seed CSVs from the database afterwards and commit them, so the git backup matches.
- Auto mode's permission classifier blocks the bulk write; the user runs the `--apply` line with a
  leading `!` and pastes the output back.

### Reseeding production (only if it ever needs rebuilding — it is already seeded)

`NODE_ENV` is not `production` locally, so the two safety guards in `prisma/seed.ts` do not trip on
their own. Both variables are required or the published `admin123` password and the shared demo
`learner` account get created on a public site:

```powershell
# 1. Temporarily put the Neon *production* strings in .env
# 2.
$env:SEED_ADMIN_PASSWORD='<real password>'; $env:SEED_DEMO_LEARNER='0'; npm run db:seed
# 3. Restore the *dev* strings in .env
```

Expect several minutes: ~4,500 rows inserted one at a time to Singapore.

## Architecture

```
src/lib/          pure logic, no DB: grading, adaptive engine, gamification rules, csv, latex, auth
src/services/     DB-backed: practice engine, gamification ledger, reports, focus, invites
src/app/api/      REST endpoints — validate with zod, then call a service
src/app/          pages (App Router)
prisma/           schema, migrations, seed script, question-bank CSVs
tests/            vitest, covers the pure logic in src/lib
```

Rule of thumb: business rules go in `src/lib` (unit-tested, no Prisma); anything touching the
database goes in `src/services`; routes stay thin.

## Curriculum and question bank

Two subjects, both defined in `prisma/seed.ts` as a `SUBJECTS` registry (slug, title, description,
CSV path, topic tree):

| Subject | CSV | Problems |
| --- | --- | --- |
| Feedback and Control Systems | `prisma/seed-questions.csv` | 430 |
| Digital Electronics | `prisma/seed-questions-digital-electronics.csv` | 370 |

- Topic slugs are globally unique (`Topic.slug` is `@unique`), so Digital Electronics slugs all
  carry a `de-` prefix. Note the collision trap: the control-systems subtopic `de-to-tf`
  ("Differential Equation to Transfer Function") predates that convention and is **not** a Digital
  Electronics topic.
- The CSV join key is the **subtopic title, matched character-for-character** against the
  curriculum in `seed.ts`. A typo there fails the seed with a line number.
- **Difficulty must be on a 1–10 scale**, because `difficultyToRating` maps it onto 900–1500. The
  original Digital Electronics CSV used a 1–5 ladder and was rescaled ×2 on import; a fresh 1–5
  file would make every question read as trivially easy and cap topic ratings early.
- **Numerical tolerance** lives in the `numerical_tolerance` CSV column: a bare number is absolute
  (`0.01`), a percent suffix is relative (`1%`), both may be given separated by `;`, and a blank
  means the default ±1% relative. Grading accepts a value inside *either* bound. The seed, the
  importer and the exporter all go through `parseTolerance` / `formatTolerance` in `src/lib/csv.ts`
  — put any change there rather than in one of the three call sites.
- Pick the tolerance form by the **answer**, not by habit: decimals want a relative tolerance so
  ordinary 3-significant-figure work passes, whole-number answers (counts, bit widths, pole counts)
  want a tight or zero absolute one, because 1% of 65536 would accept anything within ±655. A
  batch of decimal answers was too tight until 2026-07-31 for exactly this reason.
- Seeding is **additive by default**: existing subjects and all user data are left untouched, and
  only subjects missing from the database get created. `SEED_RESET=1` forces a full wipe.
- `prisma/seed-questions.csv` was regenerated from the database so it includes 215 questions that
  had only ever existed in the old `dev.db` via admin CSV import. The CSVs in git are the real
  backup of the question bank — after bulk edits in the admin UI, export and commit.

## Auth and accounts

- Local auth: scrypt password hashing + an HMAC-signed stateless session cookie
  (`userId.expiry.signature`), all in `src/lib/auth.ts`, behind `requireUser()` / `requireAdmin()`.
- `SESSION_SECRET` **throws at startup in production** if unset, under 32 chars, or left at the
  placeholder. It used to fall back to `"dev-secret"`, which is published in `.env.example` — that
  would have let anyone forge an admin cookie.
- Signup is **invite-only** (`src/services/invites.ts`). Codes use an alphabet with no vowels and
  no `0/O/1/I/L`. Redemption and user creation happen in one transaction with a conditional update,
  so two signups racing on a code's last use cannot both succeed.
- Sessions are stateless, so there is **no revocation** — a stolen or stale cookie stays valid for
  30 days. Adding a `Session` table or a `tokenVersion` on `User` is the fix if that ever matters.
- Never hand out one login to several people: they would share a single set of
  `LearnerTopicProgress` rows, corrupting each other's adaptive ratings.

## Database workflow

- Migrations, **not** `prisma db push`. Push can drop columns without warning on a live database.
- After editing `prisma/schema.prisma`: `npm run db:migrate` locally, then commit the generated
  migration. Vercel applies it on the next deploy via `vercel-build`
  (`prisma generate && prisma migrate deploy && next build`).
- `DATABASE_URL` must be Neon's **pooled** string (host contains `-pooler`) — serverless functions
  each open their own connection and would otherwise exhaust the database's slots. `DIRECT_URL` is
  the unpooled one, required by `prisma migrate`.
- Neon's free plan suspends compute after 5 minutes idle, so the first request after a quiet spell
  takes a second or two. This is not a bug.

## Gotchas hit in practice

- **Prisma `EPERM` on Windows** when regenerating the client: a running `next dev` holds
  `query_engine-windows.dll.node`. Kill node processes first.
- **`npm run lint` is not configured** — `next lint` drops into an interactive setup prompt. Use
  `npx tsc --noEmit`, `npm test`, and `npm run build` as the check suite.
- Editing `.env` in the IDE: changes may not be saved when you read the file. Verify structure
  before acting on it.
- The subject topic-map API returns groups with a **`children`** array, not `subtopics`.
- **A blank field in the admin editor is not proof the data is missing.** The numerical editor read
  only `toleranceRel` while every imported question stored `toleranceAbs`, so 292 questions looked
  like their tolerance had been stripped on upload when it was stored and being applied correctly
  the whole time. Check the row in the database before concluding data was lost.
- A throwaway script at the repo root can't be run from the scratchpad directory — `@prisma/client`
  won't resolve from outside the project. Write it to the project root and delete it afterwards.

## Conventions

- Comments explain *why*, not *what*, and are used sparingly — match the surrounding density.
- User-visible releases get an entry at the top of `RELEASES` in `src/lib/changelog.ts` (rendered at
  `/changelog`, linked from the footer). Keep `version` in step with `package.json`, and write the
  entries for learners and question authors rather than for developers.
- Zod schemas validate every write path; `src/lib/schemas.ts` normalises `\( \)` / `\[ \]` math
  delimiters to `$…$` before anything reaches the database.
- Tests cover `src/lib` only (pure functions). Service and route behaviour is checked with
  throwaway end-to-end scripts against a running dev server, then deleted.
- Test data created during verification gets cleaned up afterwards — do not leave probe accounts in
  a real database.
