# Topic Hierarchy — Feedback and Control Systems

Reference for question writers and admins. The **subtopic title** (or its slug)
is what goes in the `subtopic` column of the bulk-upload CSV — questions always
attach to a subtopic, never to a top-level topic. Matching is by slug: the
importer slugifies whatever you type ("Damping Ratio" → `damping-ratio`), so
the title as written below works.

- **Band** = curriculum difficulty band, 1 (easiest) to 5 (hardest).
- **Prereqs** = subtopics a learner should pass first (drives the adaptive engine).
- New subtopics must be created in the app (Admin → Topics) before uploading
  questions for them. Keep this file in sync with `prisma/seed.ts` and any
  topics added through the admin UI.

## 1. Introduction to Control Systems (`introduction`, band 1)

| Subtopic | Slug | Band | Prereqs |
|---|---|---|---|
| Open-loop vs Closed-loop Systems | `open-vs-closed-loop` | 1 | — |
| Block Diagrams | `block-diagrams` | 1 | open-vs-closed-loop |
| Feedback Concepts | `feedback-concepts` | 1 | open-vs-closed-loop |

## 2. Mathematical Modeling (`mathematical-modeling`, band 2)

| Subtopic | Slug | Band | Prereqs |
|---|---|---|---|
| Transfer Functions | `transfer-functions` | 2 | block-diagrams |
| Differential Equation to Transfer Function | `de-to-tf` | 2 | transfer-functions |
| Mechanical Systems | `mechanical-systems` | 3 | de-to-tf |
| Electrical Systems | `electrical-systems` | 3 | de-to-tf |
| Signal-Flow Graphs | `signal-flow-graphs` | 3 | block-diagrams |

## 3. Time Response Analysis (`time-response-analysis`, band 3)

| Subtopic | Slug | Band | Prereqs |
|---|---|---|---|
| First-Order Systems | `first-order-systems` | 2 | transfer-functions |
| Second-Order Systems | `second-order-systems` | 3 | first-order-systems |
| Damping Ratio | `damping-ratio` | 3 | second-order-systems |
| Natural Frequency | `natural-frequency` | 3 | second-order-systems |
| Percent Overshoot | `percent-overshoot` | 3 | damping-ratio |
| Settling Time | `settling-time` | 3 | damping-ratio |
| Rise Time | `rise-time` | 3 | second-order-systems |
| Steady-State Error | `steady-state-error` | 4 | second-order-systems |

## 4. Stability (`stability`, band 3)

| Subtopic | Slug | Band | Prereqs |
|---|---|---|---|
| Poles and Stability | `poles-and-stability` | 3 | transfer-functions |
| Routh-Hurwitz Criterion | `routh-hurwitz-criterion` | 4 | poles-and-stability |
| Relative Stability | `relative-stability` | 4 | routh-hurwitz-criterion |

## 5. Root Locus (`root-locus`, band 4)

| Subtopic | Slug | Band | Prereqs |
|---|---|---|---|
| Root Locus Rules | `root-locus-rules` | 4 | poles-and-stability |
| Angle and Magnitude Conditions | `angle-magnitude-conditions` | 4 | root-locus-rules |
| Gain Calculation | `gain-calculation` | 5 | angle-magnitude-conditions |

## 6. Frequency Response (`frequency-response`, band 4)

| Subtopic | Slug | Band | Prereqs |
|---|---|---|---|
| Bode Plots | `bode-plots` | 4 | transfer-functions |
| Gain Margin | `gain-margin` | 4 | bode-plots |
| Phase Margin | `phase-margin` | 4 | bode-plots |
| Nyquist Criterion | `nyquist-criterion` | 5 | bode-plots |

## 7. Controllers and Compensation (`controllers-compensation`, band 4)

| Subtopic | Slug | Band | Prereqs |
|---|---|---|---|
| P, PI, PD, PID Controllers | `pid-controllers` | 3 | steady-state-error |
| Lead Compensation | `lead-compensation` | 4 | pid-controllers |
| Lag Compensation | `lag-compensation` | 4 | pid-controllers |
| Lead-Lag Compensation | `lead-lag-compensation` | 5 | lead-compensation, lag-compensation |

## 8. State-Space Analysis (`state-space`, band 5)

| Subtopic | Slug | Band | Prereqs |
|---|---|---|---|
| State Variables | `state-variables` | 4 | de-to-tf |
| State Transition Matrix | `state-transition-matrix` | 5 | state-variables |
| Controllability | `controllability` | 5 | state-variables |
| Observability | `observability` | 5 | state-variables |
