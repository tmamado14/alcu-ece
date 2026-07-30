// Landing page — built on the "Industry" design system (see landing.css):
// a wireframe blueprint look. The signed-in app now runs on the same system
// (globals.css), so `.il` only carries this page's own furniture.

import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import LandingMotion from "@/components/LandingMotion";
import "./landing.css";

/** Feedback and Control Systems topic groups, as the mastery map shows them. */
const MASTERY_MAP: [string, keyof typeof STATUS, number, number][] = [
  // title, status, rating, bar fill %
  ["Laplace Transforms", "mastered", 1352, 76.4],
  ["Introduction", "mastered", 1342, 73.7],
  ["Modelling of Dynamic Systems", "mastered", 1311, 68.5],
  ["Block Diagram & Signal Flow Graph", "passed", 1204, 51.0],
  ["Time Response Analysis", "passed", 1168, 44.7],
  ["Stability Analysis", "learning", 1054, 25.7],
  ["Steady-State Error", "review", 1096, 32.7],
  ["Root Locus", "learning", 1021, 20.2],
  ["Frequency Response Analysis", "none", 1000, 0],
  ["Controllers & Compensators", "none", 1000, 0],
];

const STATUS = {
  none: "Not started",
  learning: "Learning",
  passed: "Passed",
  mastered: "Mastered",
  review: "Needs review",
} as const;

const SPEC_ROWS: [string, string, string][] = [
  ["Topic groups", "10", "Laplace transforms through compensators"],
  ["Subtopics, prerequisite-chained", "43", "Each with its own rating"],
  ["Answer formats", "5", "Choice, numerical, text, algebraic, true/false"],
  ["Achievements", "51", "Bronze to platinum, several hidden"],
];

const ACCURACY_BY_TOPIC: [string, number][] = [
  ["Laplace Transforms", 88],
  ["Time Response", 74],
  ["Stability", 61],
  ["Root Locus", 47],
];

const ACCURACY_BY_BAND: [string, number][] = [
  ["1–3", 91],
  ["4–6", 72],
  ["7–8", 54],
  ["9–10", 38],
];

/** The four registration marks every framed object in this system wears. */
function Corners() {
  return (
    <>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
    </>
  );
}

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <div className="il -my-8">
      <LandingMotion />

      {/* ── 01 · Hero ─────────────────────────────────────────── */}
      <section className="hero-grid" aria-labelledby="hero-h">
        <div>
          <h1 className="display" id="hero-h">
            <span className="line">One problem</span> <span className="line">at a time.</span>
          </h1>
          <p className="sub">
            Adaptive practice for electronics engineering: two tries, a full worked solution, and a
            mastery bar that moves only when you have earned it.
          </p>
          <div className="row">
            {user ? (
              <>
                <Link href="/practice" className="btn btn-primary">
                  Continue practicing
                </Link>
                <Link href="/dashboard" className="btn btn-secondary">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-primary">
                  Get started
                </Link>
                <a href="#how" className="btn btn-ghost">
                  See how it works
                </a>
              </>
            )}
          </div>
        </div>

        <div
          className="frame pcard"
          data-xp-host
          role="img"
          aria-label="Product preview: a Feedback and Control Systems problem card. Topic Time Response Analysis, difficulty 6. Question: a second-order system has characteristic equation s squared plus 4 s plus 25 equals zero; find the damping ratio zeta. The answer 0.4 is entered, awarding 28 XP and moving the topic rating from 1042 to 1061."
        >
          <Corners />
          <div className="pcard-top">
            <span className="tag tag-accent">Time Response Analysis</span>
            <span className="tag tag-outline">Difficulty 6</span>
            <span className="tag tag-outline">Numerical</span>
          </div>
          <p className="pcard-q">A second-order system has characteristic equation</p>
          <p className="pcard-stem">
            <span className="math">
              s<sup>2</sup> + 4s + 25 = 0
            </span>
          </p>
          <p className="pcard-q">
            Find the damping ratio <span className="math">ζ</span>.
          </p>
          {/* a picture of the answer row, not the real one — the whole card is
              role="img", so nothing inside it is focusable or interactive */}
          <div className="answer-row" aria-hidden>
            <span className="input">0.4</span>
            <span className="btn btn-primary">Submit</span>
          </div>
          <div className="pcard-foot">
            <span className="try micro">
              Tries{" "}
              <span className="try" aria-hidden>
                <i data-used="" />
                <i />
              </span>
            </span>
            <span className="rating mono">
              1042 <span aria-hidden>→</span> <span className="up" data-rating="">1061</span>
            </span>
            <span className="xp mono" data-xp="">
              +28 XP
            </span>
          </div>
        </div>
      </section>

      {/* ── The spec sheet ────────────────────────────────────── */}
      <section className="sheet fade-up" aria-label="ECE Mastery — launch curriculum data">
        <div className="plate">
          <Corners />
          <header className="title-block">
            <span className="tb-title">ECE Mastery — launch curriculum data</span>
            <span className="tb-cell">Feedback &amp; Control</span>
            <span className="tb-cell">v1</span>
            <span className="tb-cell">Sheet 01 of 07</span>
          </header>
          <div className="scroll-x">
            <table className="table spec">
              <colgroup>
                <col className="c-num" />
                <col className="c-prop" />
                <col className="c-val" />
                <col className="c-rem" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">No.</th>
                  <th scope="col">Property</th>
                  <th scope="col">Value</th>
                  <th scope="col">Remark</th>
                </tr>
              </thead>
              <tbody>
                {SPEC_ROWS.map(([prop, value, remark], i) => (
                  <tr key={prop}>
                    <td className="s-num">{String(i + 1).padStart(2, "0")}</td>
                    <td className="s-prop">{prop}</td>
                    <td className="s-val">{value}</td>
                    <td className="s-rem">{remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="sheet-note">
            Ratings run 900–1500 against difficulty 1–10; every learner–topic pair starts at 1000.
            The platform is subject-agnostic — Signals and Systems, Communications and Electronics
            are added from the admin panel.
          </p>
        </div>
      </section>

      {/* ── 02 · How it works ─────────────────────────────────── */}
      <section className="features fade-up" id="how">
        <span className="kicker">02 · How it works</span>
        <hr className="caption-rule" />
        <h2 className="sec-title">Answer. Learn. Watch mastery move.</h2>
        <p className="sec-sub">
          One problem on screen at a time — no question lists, no timers, no cramming for a
          percentage.
        </p>
        <div className="cells">
          <div className="cell-frame">
            <Corners />
            <h3>01 — Answer</h3>
            <p>
              Type it, don&rsquo;t pick it. Numerical answers accept fractions,{" "}
              <span className="mono">pi</span> forms, scientific notation and units; algebraic
              answers accept <span className="mono">2/(s+3)</span>. Stuck? Reveal hints one at a
              time.
            </p>
            <p className="micro" style={{ marginTop: "var(--half)" }}>
              First try{" "}
              <span className="try" aria-hidden>
                <i data-used="" />
                <i />
              </span>
            </p>
          </div>
          <div className="cell-frame">
            <Corners />
            <h3>02 — Learn from the solution</h3>
            <p>
              Miss the first try and you get one more shot. Miss the second and the full
              step-by-step worked solution opens — real math, every line, not a final answer.
            </p>
            <p className="micro" style={{ marginTop: "var(--half)" }}>
              Second try{" "}
              <span className="try" aria-hidden>
                <i data-used="" />
                <i data-used="" />
              </span>{" "}
              → solution
            </p>
          </div>
          <div className="cell-frame">
            <Corners />
            <h3>03 — Watch mastery move</h3>
            <p>
              The attempt updates your rating for that topic, nudges the bar toward the pass and
              mastery ticks, and pays XP scaled to difficulty and which try you got it on.
            </p>
            <p className="micro" style={{ marginTop: "var(--half)" }}>
              <span className="mono">+13 to +40 XP</span> per problem
            </p>
          </div>
        </div>
      </section>

      {/* ── 03 · The adaptive engine ──────────────────────────── */}
      <section className="split fade-up" id="engine">
        <div className="split-copy">
          <span className="kicker">03 · The adaptive engine</span>
          <hr className="caption-rule" />
          <h2 className="split-title">A rating, not a black box</h2>
          <p className="note">
            Every learner–topic pair carries an Elo-style rating that starts at{" "}
            <span className="mono">1000</span>. Problem difficulty 1–10 maps onto{" "}
            <span className="mono">900–1500</span>, and the next problem is drawn from the band
            around where you currently sit.
          </p>
          <p className="note">
            Inside that band the engine biases toward problems you have not seen, skill tags you are
            weak on, and questions you previously missed. A confidence score damps the update step
            as evidence accumulates — early attempts move you a lot, later ones fine-tune.
          </p>
          <p className="note">
            It is not &ldquo;AI&rdquo;. It is arithmetic you could check by hand, which is exactly
            why the number is worth trusting.
          </p>
        </div>
        <figure className="frame">
          <Corners />
          <div className="scroll-x">
            <svg
              viewBox="0 0 640 264"
              width="640"
              height="264"
              style={{ maxWidth: "100%", height: "auto", display: "block" }}
              role="img"
              aria-label="Diagram: over twelve problems in one session, the selection band tracks a learner's topic rating as it climbs from 1000 to 1118, dipping after two missed problems."
            >
              <g stroke="var(--color-divider)" strokeWidth="1">
                <line x1="40" y1="30" x2="600" y2="30" />
                <line x1="40" y1="96" x2="600" y2="96" />
                <line x1="40" y1="163" x2="600" y2="163" />
                <line x1="40" y1="230" x2="600" y2="230" />
              </g>
              <g
                fontSize="11"
                fontFamily="var(--font-mono-il)"
                fill="color-mix(in srgb, var(--color-text) 70%, transparent)"
              >
                <text x="0" y="34">1250</text>
                <text x="0" y="100">1150</text>
                <text x="0" y="167">1050</text>
                <text x="0" y="234">950</text>
                <text x="40" y="256">Problem 1</text>
                <text x="546" y="256">12</text>
              </g>
              <path
                d="M40 157 L90 147 L140 138 L190 149 L240 137 L290 125 L340 117 L390 123 L440 111 L490 101 L540 90 L590 78 L590 158 L540 170 L490 181 L440 191 L390 203 L340 197 L290 205 L240 217 L190 229 L140 218 L90 227 L40 237 Z"
                fill="color-mix(in srgb, var(--color-accent) 14%, transparent)"
                stroke="none"
              />
              <polyline
                points="40,197 90,187 140,178 190,189 240,177 290,165 340,157 390,163 440,151 490,141 540,130 590,118"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
              />
              <g stroke="var(--color-accent-700)" strokeWidth="1.5" fill="var(--color-bg)">
                <circle cx="40" cy="197" r="3.5" fill="var(--color-accent-700)" />
                <circle cx="90" cy="187" r="3.5" fill="var(--color-accent-700)" />
                <circle cx="140" cy="178" r="3.5" fill="var(--color-accent-700)" />
                <circle cx="190" cy="189" r="3.5" />
                <circle cx="240" cy="177" r="3.5" fill="var(--color-accent-700)" />
                <circle cx="290" cy="165" r="3.5" fill="var(--color-accent-700)" />
                <circle cx="340" cy="157" r="3.5" fill="var(--color-accent-700)" />
                <circle cx="390" cy="163" r="3.5" />
                <circle cx="440" cy="151" r="3.5" fill="var(--color-accent-700)" />
                <circle cx="490" cy="141" r="3.5" fill="var(--color-accent-700)" />
                <circle cx="540" cy="130" r="3.5" fill="var(--color-accent-700)" />
                <circle cx="590" cy="118" r="3.5" fill="var(--color-accent-700)" />
              </g>
            </svg>
          </div>
          <figcaption className="micro" style={{ marginTop: "var(--half)" }}>
            Shaded — the difficulty band problems are drawn from · Filled dot — solved · Hollow —
            missed, worked solution shown
          </figcaption>
        </figure>
      </section>

      {/* ── 04 · Mastery map ──────────────────────────────────── */}
      <section className="sec fade-up" id="mastery">
        <div className="sec-head">
          <span className="kicker">04 · Mastery map</span>
          <hr className="caption-rule" />
          <h2 className="sec-title">Bars, not percentages</h2>
          <p className="sec-sub">
            Feedback and Control Systems — eight topic groups, thirty-four prerequisite-chained
            subtopics. Each group sits in one of five states, and the bar carries the pass and
            mastery thresholds as ticks so you always know how far the next one is.
          </p>
          <p
            className="sec-sub"
            style={{ marginTop: "var(--half)", display: "flex", flexWrap: "wrap", gap: "8px" }}
          >
            <span className="status s-none">Not started</span>
            <span className="status s-learning">Learning</span>
            <span className="status s-passed">Passed · 1100</span>
            <span className="status s-mastered">Mastered · 1300</span>
            <span className="status s-review">Needs review</span>
          </p>
        </div>
        <div className="grid-mastery">
          {MASTERY_MAP.map(([title, status, rating, fill]) => (
            <div className="frame" key={title}>
              <Corners />
              <h3 className="h3">{title}</h3>
              <p className="micro" style={{ marginTop: "var(--half)" }}>
                <span className={`status s-${status}`}>{STATUS[status]}</span>{" "}
                <span className="mono">{rating}</span>
              </p>
              <div className={`track s-${status}`}>
                <span className="fill" data-fill={`${fill}%`} />
                <span className="tick" style={{ left: "33.3%" }} />
                <span className="tick" style={{ left: "66.7%" }} />
              </div>
            </div>
          ))}
        </div>
        <p className="micro" style={{ marginTop: "var(--leading)" }}>
          Prerequisites chain the map — Root Locus follows Poles and Stability.
        </p>
      </section>

      {/* ── 05 · Progression ──────────────────────────────────── */}
      <section className="sec fade-up" id="progression">
        <div className="sec-head">
          <span className="kicker">05 · Progression</span>
          <hr className="caption-rule" />
          <h2 className="sec-title">The shelf you are filling</h2>
          <p className="sec-sub">
            XP scales with difficulty and with which try you got it on. Passing a topic pays a
            bonus; mastering one pays more.
          </p>
        </div>

        <div className="grid-auto">
          <div className="frame">
            <Corners />
            <span className="micro">Level</span>
            <p className="stat-num">12</p>
            <div className="track s-accent">
              <span className="fill" data-fill="61%" />
            </div>
            <p className="micro" style={{ marginTop: "var(--half)" }}>
              <span className="mono">312</span> / <span className="mono">509</span> XP to 13 · curve{" "}
              <span className="mono">100·n^1.5</span>
            </p>
          </div>
          <div className="frame">
            <Corners />
            <span className="micro">XP per problem</span>
            <p className="stat-num">13–40</p>
            <p className="body" style={{ marginTop: "var(--half)" }}>
              Scaled by difficulty and try number. <span className="mono">+100</span> when a topic
              passes, <span className="mono">+250</span> when it is mastered.
            </p>
          </div>
          <div className="frame">
            <Corners />
            <span className="micro">Quest · daily</span>
            <h3 className="h3" style={{ marginTop: "var(--half)" }}>
              Transient Trainer
            </h3>
            <p className="body">Solve 5 Time Response problems today.</p>
            <div className="track s-accent">
              <span className="fill" data-fill="60%" />
            </div>
            <p className="micro" style={{ marginTop: "var(--half)" }}>
              <span className="mono">3 / 5</span> · 7 daily and weekly quests in rotation
            </p>
          </div>
        </div>

        <h3 className="h3" style={{ marginTop: "calc(2 * var(--leading))" }}>
          Trophy shelf
        </h3>
        <p className="body" style={{ maxWidth: "64ch" }}>
          51 achievements in four tiers — several hidden until they fire — each with its own badge
          artwork, plus 11 subject badges.
        </p>
        <div className="scroll-x" style={{ marginTop: "var(--leading)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
              gap: "clamp(24px, 3vw, 44px)",
              minWidth: "620px",
            }}
          >
            {(
              [
                ["Bronze", "color-mix(in srgb, var(--color-text) 55%, transparent)",
                  "M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2Z"],
                ["Silver", "color-mix(in srgb, var(--color-text) 75%, transparent)",
                  "M12 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"],
                ["Gold", "var(--color-accent)",
                  "m12 2 2.9 6.26 6.85.7-5.1 4.62 1.45 6.72L12 16.9l-6.1 3.4 1.45-6.72L2.25 8.96l6.85-.7Z"],
                ["Platinum", "var(--color-accent-900)",
                  "M12 2 3 7v10l9 5 9-5V7Z m0 5 5 2.8v5.6L12 18l-5-2.6V9.8Z"],
              ] as const
            ).map(([tier, color, d]) => (
              <div className="frame tier" key={tier} style={{ color }}>
                <Corners />
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={d} />
                </svg>
                <p className="micro" style={{ marginTop: "var(--half)", color: "var(--color-text)" }}>
                  {tier}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 06 · Reporting ────────────────────────────────────── */}
      <section className="sec fade-up" id="reports">
        <div className="sec-head">
          <span className="kicker">06 · Reporting</span>
          <hr className="caption-rule" />
          <h2 className="sec-title">Everything the engine knows, shown to you</h2>
          <p className="sec-sub">
            A dashboard of accuracy by topic and by difficulty band, most-missed skill tags, day
            streak, topic ratings and recommended next topics — plus a subject report listing every
            problem you have attempted, each with its worked solution one click away.
          </p>
        </div>
        <div
          className="grid-auto"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          <div className="frame">
            <Corners />
            <span className="micro">Accuracy by topic</span>
            <div className="bars">
              {ACCURACY_BY_TOPIC.map(([label, pct]) => (
                <div key={label}>
                  <p className="micro" style={{ color: "var(--color-text)" }}>
                    {label} <span className="mono">{pct}%</span>
                  </p>
                  <div className="track s-accent">
                    <span className="fill" data-fill={`${pct}%`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="frame">
            <Corners />
            <span className="micro">Accuracy by difficulty band</span>
            <div className="bars">
              {ACCURACY_BY_BAND.map(([label, pct]) => (
                <div key={label}>
                  <p className="micro" style={{ color: "var(--color-text)" }}>
                    {label} <span className="mono">{pct}%</span>
                  </p>
                  <div className="track s-accent">
                    <span className="fill" data-fill={`${pct}%`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="stack">
            <div className="frame">
              <Corners />
              <span className="micro">Day streak</span>
              <p className="stat-num">17</p>
            </div>
            <div className="frame">
              <Corners />
              <span className="micro">Most-missed skill tags</span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "var(--leading)",
                }}
              >
                <span className="tag tag-outline">Bode magnitude</span>
                <span className="tag tag-outline">Phase margin</span>
                <span className="tag tag-outline">Routh array</span>
                <span className="tag tag-outline">Breakaway points</span>
              </div>
              <p className="micro" style={{ marginTop: "var(--leading)" }}>
                Recommended next: Stability, Frequency Response
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 07 · Get started ──────────────────────────────────── */}
      <section className="close fade-up" id="start">
        <span className="kicker">07 · Get started</span>
        <hr className="caption-rule" />
        <h2>Open the first problem</h2>
        <p className="sub">
          Feedback and Control Systems is live — eight topic groups, thirty-four subtopics, every
          rating starting at 1000. Signals and Systems, Communications and Electronics come next.
        </p>
        <div className="row">
          {user ? (
            <Link href="/practice" className="btn btn-primary">
              Continue practicing
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-primary">
                Log in and start
              </Link>
              <Link href="/subjects" className="btn btn-secondary">
                Browse the topic map
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
