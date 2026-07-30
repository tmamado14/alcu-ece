# Prompt for Claude Design — ECE Mastery landing page

> Copy everything below the line and paste it into Claude Design.

---

Design a marketing landing page for **ECE Mastery**, an adaptive, gamified problem-practice
platform for Electronics Engineering students. It replaces the current placeholder landing page
of a working Next.js 15 app, so the page must feel like the front door of the product that
already exists — not a generic SaaS template.

## Audience

Electronics Engineering undergrads and board-exam (licensure) reviewees who grind practice
problems. They're used to Khan Academy / Alcumus / AoPS-style practice tools and to game-style
progression (levels, trophies, streaks). Tone: focused, confident, a little playful — study-desk
serious, not startup-hype. No stock-photo corporate energy, no "revolutionize your learning."

## What the product actually does (use this for real copy — do not invent features)

- **One problem at a time, two tries.** Miss the first try and you get one more shot, then a full
  step-by-step worked solution (with real LaTeX math). Hints are revealed one at a time on request.
- **Adaptive engine.** Every learner–topic pair carries an Elo-style rating starting at 1000.
  Problem difficulty 1–10 maps to ratings 900–1500. Problems are picked near your current rating
  and biased toward unseen problems, weak skill tags, and questions you previously missed.
  A confidence score damps the update step as evidence accumulates.
- **Mastery bars, not percentages.** Each topic moves through five states with a fixed color
  language used app-wide: **not started** (slate) → **learning** (orange) → **passed** (green,
  rating 1100) → **mastered** (sky blue, rating 1300), plus **needs review** (red) when a topic
  decays. Progress bars show the pass and mastery thresholds as tick marks.
- **Five answer formats:** multiple choice, numerical with tolerance (accepts fractions, `pi`
  forms, scientific notation, units), short text, algebraic expression (`2/(s+3)`), true/false.
- **Gamification.** XP scales with difficulty and try number (13–40 per problem, bonuses of +100
  for passing a topic and +250 for mastering one). Levels follow a 100·n^1.5 curve. **51
  PlayStation-trophy-style achievements** in bronze/silver/gold/platinum tiers (several hidden,
  each with custom badge artwork), 11 subject badges, and 7 daily/weekly quests
  (e.g. "Transient Trainer — solve 5 Time Response problems today").
- **Reports.** A dashboard with accuracy by topic, accuracy by difficulty band, most-missed skill
  tags, day streak, topic ratings, and recommended next topics; plus an Alcumus-style subject
  report listing every attempted problem with expandable solutions.
- **Curriculum.** Launch subject is **Feedback and Control Systems**: 8 topic groups
  (Introduction, Mathematical Modeling, Time Response Analysis, Stability, Root Locus, Frequency
  Response, Controllers and Compensation, State-Space) covering 32 subtopics with prerequisite
  chains. The platform is subject-agnostic — Signals and Systems, Communications, and Electronics
  can be added from the admin panel.

## Page structure

1. **Hero** — headline, one-sentence subhead, primary CTA "Get started" and secondary
   "See how it works". Include a visual: the best single image of this product is a *problem card*
   — a control-systems question with rendered math (e.g. "A second-order system has characteristic
   equation s² + 4s + 25 = 0. Find the damping ratio ζ."), an answer input, difficulty and topic
   chips, and a "+28 XP" pop with a topic rating ticking 1042 → 1061.
2. **How it works** — three steps: *Answer* → *Learn from the solution* → *Watch mastery move.*
   Show the two-try flow explicitly; it's the core loop.
3. **The adaptive engine** — explain the rating in plain language, with a small diagram of the
   rating band tracking a learner over a session. Don't hand-wave it as "AI"; it's a transparent,
   explainable Elo system and that honesty is a selling point.
4. **Mastery map** — a topic-group grid or tree for Feedback and Control Systems showing the five
   status colors in action, with the pass/mastery threshold ticks.
5. **Progression** — XP, levels, quests, and a trophy shelf of achievement badges in the four
   tiers. Make this section feel like a rewards screen, not a feature list.
6. **Reporting** — a compact dashboard preview: accuracy by topic bars, weak-skill chips, day
   streak.
7. **Closing CTA** + minimal footer.

## Visual direction — match the existing design system exactly

Tailwind CSS v4 with these tokens (light "study desk" theme, no dark mode today):

- Canvas `#f4f6fb`, surface `#ffffff`, sunken `#f8fafc`
- Ink `#101828`, ink-muted `#475467`, ink-faint `#667085`
- Hairlines: line `#e4e7ef`, line-strong `#cdd3e0`
- Brand indigo: 50 `#eef2ff`, 100 `#e0e7ff`, 200 `#c7d2fe`, 300 `#a5b4fc`, 500 `#6366f1`,
  600 `#4f46e5` (primary action), 700 `#4338ca`, 800 `#3730a3`
- Status colors are reserved and must keep their meaning: orange = learning, green = passed,
  sky = mastered, red = needs review, slate = not started. Never use them decoratively.
- Font: Inter. Monospace (`ui-monospace` / JetBrains Mono) for ratings, numeric answers, and math.
- Radii: 0.5rem controls, 0.875rem cards. Shadows are soft and low:
  `0 1px 3px rgb(16 24 40 / 0.06)` at rest, a larger `0 12px 32px -8px rgb(16 24 40 / 0.18)` on
  hover/pop. Existing components: `.card`, `.btn-primary` (indigo fill), `.btn-secondary`
  (outlined), pill chips, `.progress-track` / `.progress-fill`, and callouts in info/success/
  warning/danger.
- Existing motion vocabulary to reuse: `fade-up` on section entry (6px, 250ms), bars filling from
  0 over 800ms, and an `xp-pop` (a +XP number floating up and fading, 1.6s). All animation must be
  gated behind `prefers-reduced-motion`.

The landing page may be *richer* than the app's interior — a subtle indigo gradient wash, layered
product cards, a light grid or Bode-curve/pole-zero motif in the background — but it must land in
the same family, not a different brand. Keep it recognizably the same product a user sees after
they log in.

## Requirements

- Single self-contained page: semantic HTML + Tailwind v4 classes, responsive from 360px up.
- WCAG AA contrast throughout; visible keyboard focus rings (2px indigo, 2px offset); real
  headings and landmarks; decorative icons `aria-hidden`.
- Wide or math-heavy elements scroll inside their own container — the page body never scrolls
  horizontally.
- Illustrate with clean CSS/SVG mockups of the product's own UI. No stock photography, no
  screenshots of other tools, no fake customer logos, and no testimonials or user-count stats —
  the product has no users to cite yet.
- Every number and feature claim must come from the description above.

## Deliverable

The full landing page markup with a short note on any new tokens or utility classes you
introduced, so they can be folded back into the app's `globals.css`.
