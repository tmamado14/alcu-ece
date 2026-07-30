# CLAUDE.md — working notes for this repo

ECE Mastery: an adaptive, gamified practice platform for Electronics Engineering board-exam
subjects. Next.js 15 (App Router) + TypeScript + Tailwind 4 + Prisma + PostgreSQL + KaTeX + Zod +
Vitest. Human-facing docs live in `README.md`; this file is the orientation for a new session.

## Current state (as of 2026-07-30)

- **Live** at https://alcu-ece-brhq.vercel.app (Vercel Hobby).
- **Database:** Neon Postgres, region `ap-southeast-1` (Singapore), project endpoint
  `ep-orange-sunset-azp0oebs`. Two branches: `production` (deployed app) and `dev` (local work).
- **Local `.env`** points at the **`dev`** branch and is fully seeded and working.
- **Production database has tables but is probably NOT seeded** — see "Next steps".

### Verified working

- `dev` branch: migration applied, 2 subjects / 139 topics / **800 problems** / 1704 choices /
  2001 tags / 11 badges / 7 quests / 51 achievements.
- 14-check smoke test against Postgres passed: login, subject listing, DE topic map (74 subtopics),
  adaptive practice, subject-scoped practice, answer submission, invite issue/redeem/reuse-refusal,
  new-account isolation, report page.
- Production probes: migrations ran (bogus login returns 401, not a 500), `SESSION_SECRET` is valid
  (a garbage session cookie returns 401 rather than throwing), `InviteCode` table exists, and the
  login page does **not** leak demo credentials.
- `admin/admin123` and `learner/learner123` are both rejected in production — correct.

## Next steps

1. **Seed production.** Vercel's build runs `prisma migrate deploy` but never the seed, so the
   production database likely has no subjects, problems, or admin user. Confirm by trying to log in
   as `admin` with the `SEED_ADMIN_PASSWORD` set in Vercel. If that fails, seed it (see below).
2. **Set the Vercel function region to Singapore (`sin1`)** — Settings → Functions → Function
   Region, then redeploy. The default is Washington DC, which sends every query across the Pacific
   and back to a Singapore database.
3. **Issue invites** from Admin → Invites and share the copied links.

### Seeding production (run from a laptop, once)

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

## Conventions

- Comments explain *why*, not *what*, and are used sparingly — match the surrounding density.
- Zod schemas validate every write path; `src/lib/schemas.ts` normalises `\( \)` / `\[ \]` math
  delimiters to `$…$` before anything reaches the database.
- Tests cover `src/lib` only (pure functions). Service and route behaviour is checked with
  throwaway end-to-end scripts against a running dev server, then deleted.
- Test data created during verification gets cleaned up afterwards — do not leave probe accounts in
  a real database.
