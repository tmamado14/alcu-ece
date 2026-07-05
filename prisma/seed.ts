// Seed: Feedback and Control Systems curriculum + original question bank.
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// ---------- Curriculum ----------

interface TopicSeed {
  slug: string;
  title: string;
  band: number;
  children: { slug: string; title: string; band: number; prereqs?: string[] }[];
}

const TOPICS: TopicSeed[] = [
  {
    slug: "introduction", title: "Introduction to Control Systems", band: 1,
    children: [
      { slug: "open-vs-closed-loop", title: "Open-loop vs Closed-loop Systems", band: 1 },
      { slug: "block-diagrams", title: "Block Diagrams", band: 1, prereqs: ["open-vs-closed-loop"] },
      { slug: "feedback-concepts", title: "Feedback Concepts", band: 1, prereqs: ["open-vs-closed-loop"] },
    ],
  },
  {
    slug: "mathematical-modeling", title: "Mathematical Modeling", band: 2,
    children: [
      { slug: "transfer-functions", title: "Transfer Functions", band: 2, prereqs: ["block-diagrams"] },
      { slug: "de-to-tf", title: "Differential Equation to Transfer Function", band: 2, prereqs: ["transfer-functions"] },
      { slug: "mechanical-systems", title: "Mechanical Systems", band: 3, prereqs: ["de-to-tf"] },
      { slug: "electrical-systems", title: "Electrical Systems", band: 3, prereqs: ["de-to-tf"] },
      { slug: "signal-flow-graphs", title: "Signal-Flow Graphs", band: 3, prereqs: ["block-diagrams"] },
    ],
  },
  {
    slug: "time-response-analysis", title: "Time Response Analysis", band: 3,
    children: [
      { slug: "first-order-systems", title: "First-Order Systems", band: 2, prereqs: ["transfer-functions"] },
      { slug: "second-order-systems", title: "Second-Order Systems", band: 3, prereqs: ["first-order-systems"] },
      { slug: "damping-ratio", title: "Damping Ratio", band: 3, prereqs: ["second-order-systems"] },
      { slug: "natural-frequency", title: "Natural Frequency", band: 3, prereqs: ["second-order-systems"] },
      { slug: "percent-overshoot", title: "Percent Overshoot", band: 3, prereqs: ["damping-ratio"] },
      { slug: "settling-time", title: "Settling Time", band: 3, prereqs: ["damping-ratio"] },
      { slug: "rise-time", title: "Rise Time", band: 3, prereqs: ["second-order-systems"] },
      { slug: "steady-state-error", title: "Steady-State Error", band: 4, prereqs: ["second-order-systems"] },
    ],
  },
  {
    slug: "stability", title: "Stability", band: 3,
    children: [
      { slug: "poles-and-stability", title: "Poles and Stability", band: 3, prereqs: ["transfer-functions"] },
      { slug: "routh-hurwitz-criterion", title: "Routh-Hurwitz Criterion", band: 4, prereqs: ["poles-and-stability"] },
      { slug: "relative-stability", title: "Relative Stability", band: 4, prereqs: ["routh-hurwitz-criterion"] },
    ],
  },
  {
    slug: "root-locus", title: "Root Locus", band: 4,
    children: [
      { slug: "root-locus-rules", title: "Root Locus Rules", band: 4, prereqs: ["poles-and-stability"] },
      { slug: "angle-magnitude-conditions", title: "Angle and Magnitude Conditions", band: 4, prereqs: ["root-locus-rules"] },
      { slug: "gain-calculation", title: "Gain Calculation", band: 5, prereqs: ["angle-magnitude-conditions"] },
    ],
  },
  {
    slug: "frequency-response", title: "Frequency Response", band: 4,
    children: [
      { slug: "bode-plots", title: "Bode Plots", band: 4, prereqs: ["transfer-functions"] },
      { slug: "gain-margin", title: "Gain Margin", band: 4, prereqs: ["bode-plots"] },
      { slug: "phase-margin", title: "Phase Margin", band: 4, prereqs: ["bode-plots"] },
      { slug: "nyquist-criterion", title: "Nyquist Criterion", band: 5, prereqs: ["bode-plots"] },
    ],
  },
  {
    slug: "controllers-compensation", title: "Controllers and Compensation", band: 4,
    children: [
      { slug: "pid-controllers", title: "P, PI, PD, PID Controllers", band: 3, prereqs: ["steady-state-error"] },
      { slug: "lead-compensation", title: "Lead Compensation", band: 4, prereqs: ["pid-controllers"] },
      { slug: "lag-compensation", title: "Lag Compensation", band: 4, prereqs: ["pid-controllers"] },
      { slug: "lead-lag-compensation", title: "Lead-Lag Compensation", band: 5, prereqs: ["lead-compensation", "lag-compensation"] },
    ],
  },
  {
    slug: "state-space", title: "State-Space Analysis", band: 5,
    children: [
      { slug: "state-variables", title: "State Variables", band: 4, prereqs: ["de-to-tf"] },
      { slug: "state-transition-matrix", title: "State Transition Matrix", band: 5, prereqs: ["state-variables"] },
      { slug: "controllability", title: "Controllability", band: 5, prereqs: ["state-variables"] },
      { slug: "observability", title: "Observability", band: 5, prereqs: ["state-variables"] },
    ],
  },
];

// ---------- Question bank ----------

interface ProblemSeed {
  topic: string; // subtopic slug
  type: "multiple_choice_single" | "numerical_tolerance" | "text_short" | "algebraic_expression" | "true_false";
  level: "recall" | "comprehension" | "application" | "analysis" | "synthesis";
  diff: number;
  time?: number;
  statement: string;
  choices?: { label: string; text: string }[];
  answer: Record<string, unknown>;
  tags: string[];
  hints?: string[];
  solution: string;
  explanation?: string;
  reference?: string;
}

const P: ProblemSeed[] = [
  // ---- Introduction ----
  {
    topic: "open-vs-closed-loop", type: "multiple_choice_single", level: "comprehension", diff: 2,
    statement: "Which of the following is a key advantage of a closed-loop control system over an open-loop system?",
    choices: [
      { label: "A", text: "It is always cheaper to build" },
      { label: "B", text: "It reduces the effect of external disturbances and parameter variations on the output" },
      { label: "C", text: "It never becomes unstable" },
      { label: "D", text: "It requires no actuator" },
    ],
    answer: { correct: "B" },
    tags: ["feedback", "open-loop", "closed-loop"],
    hints: ["Think about what the feedback path lets the system 'see'."],
    solution: "A closed-loop system continuously compares the measured output with the reference input and corrects deviations. This makes the output far less sensitive to disturbances and plant parameter drift. Closed-loop systems are usually more expensive (sensor + comparator) and can become unstable if poorly designed, so options A and C are wrong.",
  },
  {
    topic: "open-vs-closed-loop", type: "true_false", level: "recall", diff: 1,
    statement: "True or False: An open-loop control system measures its output and uses that measurement to adjust its input.",
    answer: { correct: false },
    tags: ["open-loop"],
    solution: "False. By definition an open-loop system does not measure its output; the control action is independent of the output. Feedback (measuring the output) is precisely what makes a system closed-loop.",
  },
  {
    topic: "open-vs-closed-loop", type: "text_short", level: "recall", diff: 2,
    statement: "A washing machine that runs a fixed 30-minute cycle regardless of how clean the clothes actually are is an example of what type of control system? (two words)",
    answer: { accepted: ["open loop", "open-loop", "open loop system", "open-loop system", "open loop control", "open-loop control"] },
    tags: ["open-loop", "examples"],
    solution: "The machine never senses the actual cleanliness (the output), so the control action is independent of the output. That is an open-loop system.",
  },
  {
    topic: "feedback-concepts", type: "text_short", level: "recall", diff: 1,
    statement: "In a feedback control system, what is the name of the signal produced by subtracting the feedback signal from the reference input?",
    answer: { accepted: ["error", "error signal", "the error signal", "actuating error", "actuating signal", "e(t)"] },
    tags: ["feedback", "error-signal"],
    solution: "The summing junction computes e(t) = r(t) − b(t), the (actuating) error signal. The controller acts on this error to drive the plant so the output tracks the reference.",
  },
  {
    topic: "feedback-concepts", type: "numerical_tolerance", level: "application", diff: 3, time: 180,
    statement: "A unity-negative-feedback system has forward gain $G = 10$ and feedback gain $H = 0.5$. Compute the closed-loop gain $\\dfrac{G}{1+GH}$. Give your answer to 3 significant figures.",
    answer: { value: 1.667, toleranceRel: 0.02 },
    tags: ["closed-loop-gain", "feedback"],
    hints: ["Closed-loop gain = G / (1 + GH)."],
    solution: "**Step 1.** Write the closed-loop gain formula for negative feedback: $T = \\dfrac{G}{1+GH}$.\n\n**Step 2.** Substitute $G = 10$, $H = 0.5$: $T = \\dfrac{10}{1 + (10)(0.5)} = \\dfrac{10}{6}$.\n\n**Step 3.** Evaluate: $T \\approx 1.667$.\n\nNote how the loop trades raw gain (10) for a smaller but much more disturbance-robust gain (1.667).",
  },
  {
    topic: "block-diagrams", type: "algebraic_expression", level: "application", diff: 2,
    statement: "Two blocks $G_1(s)$ and $G_2(s)$ are connected in cascade (series). Write the equivalent single transfer function in terms of G1 and G2 (e.g. type it like `G1*G2`).",
    answer: { accepted: ["G1*G2", "G2*G1", "G1G2", "G2G1"] },
    tags: ["block-diagrams", "series"],
    solution: "For cascaded blocks the output of the first feeds the second, so the overall transfer function is the product: $G_{eq}(s) = G_1(s)\\,G_2(s)$. (Multiplication is commutative for scalar transfer functions.)",
  },
  {
    topic: "block-diagrams", type: "multiple_choice_single", level: "comprehension", diff: 3,
    statement: "A forward path $G(s)$ is enclosed by a negative feedback path $H(s)$. The equivalent closed-loop transfer function is:",
    choices: [
      { label: "A", text: "$\\dfrac{G(s)}{1 + G(s)H(s)}$" },
      { label: "B", text: "$\\dfrac{G(s)}{1 - G(s)H(s)}$" },
      { label: "C", text: "$\\dfrac{G(s)H(s)}{1 + G(s)}$" },
      { label: "D", text: "$G(s)H(s)$" },
    ],
    answer: { correct: "A" },
    tags: ["block-diagrams", "closed-loop-gain"],
    hints: ["Negative feedback puts a plus sign in the denominator."],
    solution: "For negative feedback: $\\dfrac{Y}{R} = \\dfrac{G}{1+GH}$. Option B is the positive-feedback form. Remember: *negative* feedback → *plus* in the denominator.",
  },

  // ---- Mathematical Modeling ----
  {
    topic: "transfer-functions", type: "multiple_choice_single", level: "recall", diff: 2,
    statement: "The transfer function of a linear time-invariant system is defined as:",
    choices: [
      { label: "A", text: "The ratio of output to input in the time domain" },
      { label: "B", text: "The Laplace transform of the output divided by the Laplace transform of the input, assuming zero initial conditions" },
      { label: "C", text: "The Fourier transform of the impulse response squared" },
      { label: "D", text: "The steady-state gain of the system" },
    ],
    answer: { correct: "B" },
    tags: ["transfer-function", "definitions"],
    solution: "By definition $G(s) = \\dfrac{Y(s)}{U(s)}$ with all initial conditions set to zero. It equals the Laplace transform of the impulse response.",
  },
  {
    topic: "de-to-tf", type: "algebraic_expression", level: "application", diff: 3, time: 240,
    statement: "A system is described by $\\dfrac{dy}{dt} + 3y = 2u(t)$. Find the transfer function $\\dfrac{Y(s)}{U(s)}$. Type it like `2/(s+3)`.",
    answer: { accepted: ["2/(s+3)"] },
    tags: ["transfer-function", "laplace"],
    hints: ["Take the Laplace transform of both sides with zero initial conditions.", "d/dt becomes multiplication by s."],
    solution: "**Step 1.** Laplace-transform each term with zero initial conditions: $sY(s) + 3Y(s) = 2U(s)$.\n\n**Step 2.** Factor: $(s+3)Y(s) = 2U(s)$.\n\n**Step 3.** Solve for the ratio: $\\dfrac{Y(s)}{U(s)} = \\dfrac{2}{s+3}$.\n\nThis is a first-order system with pole at $s=-3$ and DC gain $2/3$.",
  },
  {
    topic: "electrical-systems", type: "numerical_tolerance", level: "application", diff: 3, time: 180,
    statement: "An RC low-pass filter has $R = 1\\,\\text{k}\\Omega$ and $C = 1\\,\\mu\\text{F}$. What is its time constant in milliseconds?",
    answer: { value: 1, toleranceRel: 0.01, unit: "ms" },
    tags: ["rc-circuit", "time-constant"],
    hints: ["τ = RC."],
    solution: "$\\tau = RC = (10^3\\,\\Omega)(10^{-6}\\,\\text{F}) = 10^{-3}\\,\\text{s} = 1\\,\\text{ms}$. The transfer function is $\\dfrac{1}{RCs+1} = \\dfrac{1}{0.001s+1}$.",
  },
  {
    topic: "mechanical-systems", type: "algebraic_expression", level: "analysis", diff: 5, time: 300,
    statement: "A mass-spring-damper system has mass $M = 1\\,\\text{kg}$, damping $B = 4\\,\\text{N·s/m}$, and spring constant $K = 8\\,\\text{N/m}$, driven by force $f(t)$. Find $\\dfrac{X(s)}{F(s)}$. Type it like `1/(s^2+4s+8)`.",
    answer: { accepted: ["1/(s^2+4s+8)"] },
    tags: ["mechanical", "second-order", "transfer-function"],
    hints: ["Newton's second law: M x'' + B x' + K x = f(t).", "Transform and solve for X(s)/F(s)."],
    solution: "**Step 1.** Newton's second law: $M\\ddot{x} + B\\dot{x} + Kx = f(t)$, i.e. $\\ddot{x} + 4\\dot{x} + 8x = f(t)$.\n\n**Step 2.** Laplace transform (zero ICs): $(s^2 + 4s + 8)X(s) = F(s)$.\n\n**Step 3.** $\\dfrac{X(s)}{F(s)} = \\dfrac{1}{s^2+4s+8}$.\n\nComparing with $s^2 + 2\\zeta\\omega_n s + \\omega_n^2$: $\\omega_n = 2\\sqrt{2}$ rad/s and $\\zeta = \\dfrac{4}{2\\omega_n} \\approx 0.707$ — a well-damped response.",
  },
  {
    topic: "signal-flow-graphs", type: "multiple_choice_single", level: "recall", diff: 4,
    statement: "Mason's gain formula is used to:",
    choices: [
      { label: "A", text: "Compute the overall transfer function of a signal-flow graph directly from its forward paths and loops" },
      { label: "B", text: "Determine the stability of a system from its coefficients" },
      { label: "C", text: "Convert a transfer function to state-space form" },
      { label: "D", text: "Compute the frequency response at a given frequency" },
    ],
    answer: { correct: "A" },
    tags: ["signal-flow", "mason"],
    solution: "Mason's gain formula $T = \\dfrac{\\sum_k P_k \\Delta_k}{\\Delta}$ gives the input-output transmittance of a signal-flow graph from the forward-path gains $P_k$, the graph determinant $\\Delta$, and cofactors $\\Delta_k$ — no block-diagram reduction needed.",
  },
  {
    topic: "electrical-systems", type: "multiple_choice_single", level: "application", diff: 5,
    statement: "For a series RLC circuit with the output taken across the capacitor, the transfer function $\\dfrac{V_C(s)}{V_{in}(s)}$ is:",
    choices: [
      { label: "A", text: "$\\dfrac{1}{LCs^2 + RCs + 1}$" },
      { label: "B", text: "$\\dfrac{RCs}{LCs^2 + RCs + 1}$" },
      { label: "C", text: "$\\dfrac{LCs^2}{LCs^2 + RCs + 1}$" },
      { label: "D", text: "$\\dfrac{1}{RCs + 1}$" },
    ],
    answer: { correct: "A" },
    tags: ["rlc", "transfer-function"],
    hints: ["Use the voltage divider with impedances Ls, R, and 1/(Cs)."],
    solution: "Voltage divider: $\\dfrac{V_C}{V_{in}} = \\dfrac{1/(Cs)}{Ls + R + 1/(Cs)}$. Multiply numerator and denominator by $Cs$: $\\dfrac{1}{LCs^2 + RCs + 1}$. Options B and C correspond to taking the output across R and L respectively.",
  },
  {
    topic: "transfer-functions", type: "numerical_tolerance", level: "comprehension", diff: 2,
    statement: "How many poles does $G(s) = \\dfrac{s+1}{s^2 + 5s + 6}$ have?",
    answer: { value: 2, toleranceAbs: 0 },
    tags: ["poles-zeros"],
    solution: "The denominator $s^2+5s+6 = (s+2)(s+3)$ is second order, so there are **2 poles**, at $s=-2$ and $s=-3$ (and one zero at $s=-1$).",
  },
  {
    topic: "transfer-functions", type: "multiple_choice_single", level: "comprehension", diff: 2,
    statement: "The zero of $G(s) = \\dfrac{s+3}{s+5}$ is located at:",
    choices: [
      { label: "A", text: "$s = -5$" },
      { label: "B", text: "$s = -3$" },
      { label: "C", text: "$s = 3$" },
      { label: "D", text: "$s = 5$" },
    ],
    answer: { correct: "B" },
    tags: ["poles-zeros"],
    solution: "Zeros are roots of the numerator: $s + 3 = 0 \\Rightarrow s = -3$. The pole is at $s=-5$.",
  },

  // ---- Time Response ----
  {
    topic: "first-order-systems", type: "numerical_tolerance", level: "application", diff: 3, time: 180,
    statement: "A first-order system has time constant $T = 0.5$ s. Using the 2% criterion ($t_s \\approx 4T$), find its settling time in seconds.",
    answer: { value: 2, toleranceRel: 0.01, unit: "s" },
    tags: ["first-order", "settling-time"],
    solution: "**Step 1.** For a first-order system the 2% settling time is $t_s \\approx 4T$.\n\n**Step 2.** $t_s = 4(0.5) = 2$ s.\n\nAfter four time constants the exponential $e^{-t/T}$ has decayed to $e^{-4} \\approx 1.8\\%$, inside the 2% band.",
  },
  {
    topic: "first-order-systems", type: "multiple_choice_single", level: "recall", diff: 2,
    statement: "In the step response of a first-order system, the output reaches what percentage of its final value after one time constant?",
    choices: [
      { label: "A", text: "50%" },
      { label: "B", text: "63.2%" },
      { label: "C", text: "86.5%" },
      { label: "D", text: "98.2%" },
    ],
    answer: { correct: "B" },
    tags: ["first-order", "step-response"],
    solution: "The step response is $y(t) = 1 - e^{-t/T}$. At $t = T$: $y = 1 - e^{-1} \\approx 0.632$, i.e. **63.2%**. (86.5% at 2T, 98.2% at 4T.)",
  },
  {
    topic: "first-order-systems", type: "numerical_tolerance", level: "comprehension", diff: 2,
    statement: "A system's unit-step response is $y(t) = 1 - e^{-t/2}$. What is its time constant in seconds?",
    answer: { value: 2, toleranceRel: 0.01, unit: "s" },
    tags: ["first-order", "time-constant"],
    solution: "Compare $y(t)=1-e^{-t/T}$ with $1-e^{-t/2}$: the time constant is $T = 2$ s.",
  },
  {
    topic: "damping-ratio", type: "numerical_tolerance", level: "application", diff: 4, time: 240,
    statement: "A second-order system has characteristic equation $s^2 + 4s + 25 = 0$. Find the damping ratio $\\zeta$.",
    answer: { value: 0.4, toleranceRel: 0.02 },
    tags: ["damping-ratio", "second-order"],
    hints: ["Match against s² + 2ζωₙs + ωₙ² = 0.", "First find ωₙ from the constant term."],
    solution: "**Step 1.** Standard form: $s^2 + 2\\zeta\\omega_n s + \\omega_n^2 = 0$.\n\n**Step 2.** Constant term: $\\omega_n^2 = 25 \\Rightarrow \\omega_n = 5$ rad/s.\n\n**Step 3.** Middle term: $2\\zeta\\omega_n = 4 \\Rightarrow \\zeta = \\dfrac{4}{2(5)} = 0.4$.\n\nSince $0 < \\zeta < 1$, the system is underdamped and will overshoot.",
  },
  {
    topic: "percent-overshoot", type: "numerical_tolerance", level: "application", diff: 5, time: 300,
    statement: "A second-order underdamped system has $\\zeta = 0.5$. Compute the percent overshoot $\\%OS = 100\\,e^{-\\zeta\\pi/\\sqrt{1-\\zeta^2}}$. Give your answer in percent.",
    answer: { value: 16.3, toleranceRel: 0.02, unit: "%" },
    tags: ["percent-overshoot", "second-order"],
    hints: ["Compute the exponent −ζπ/√(1−ζ²) first."],
    solution: "**Step 1.** Exponent: $\\dfrac{-\\zeta\\pi}{\\sqrt{1-\\zeta^2}} = \\dfrac{-0.5\\pi}{\\sqrt{1-0.25}} = \\dfrac{-1.5708}{0.8660} = -1.8138$.\n\n**Step 2.** $\\%OS = 100\\,e^{-1.8138} \\approx 100(0.163) = 16.3\\%$.\n\nRule of thumb: ζ = 0.5 → ≈16%, ζ = 0.7 → ≈5%.",
  },
  {
    topic: "damping-ratio", type: "multiple_choice_single", level: "comprehension", diff: 3,
    statement: "For an underdamped second-order system ($0 < \\zeta < 1$), increasing the damping ratio while keeping $\\omega_n$ constant will:",
    choices: [
      { label: "A", text: "Increase the percent overshoot" },
      { label: "B", text: "Decrease the percent overshoot" },
      { label: "C", text: "Have no effect on overshoot" },
      { label: "D", text: "Make the system unstable" },
    ],
    answer: { correct: "B" },
    tags: ["damping-ratio", "percent-overshoot"],
    solution: "$\\%OS = 100e^{-\\zeta\\pi/\\sqrt{1-\\zeta^2}}$ decreases monotonically as $\\zeta$ increases: more damping, less overshoot. At $\\zeta \\ge 1$ the overshoot disappears entirely.",
  },
  {
    topic: "settling-time", type: "numerical_tolerance", level: "application", diff: 4, time: 240,
    statement: "A second-order system has $\\omega_n = 10$ rad/s and $\\zeta = 0.6$. Estimate the 2% settling time $t_s = \\dfrac{4}{\\zeta\\omega_n}$ in seconds.",
    answer: { value: 0.667, toleranceRel: 0.02, unit: "s" },
    tags: ["settling-time", "second-order"],
    solution: "$t_s = \\dfrac{4}{\\zeta\\omega_n} = \\dfrac{4}{0.6 \\times 10} = \\dfrac{4}{6} \\approx 0.667$ s. The product $\\zeta\\omega_n$ is the magnitude of the real part of the poles — it sets the decay envelope $e^{-\\zeta\\omega_n t}$.",
  },
  {
    topic: "rise-time", type: "numerical_tolerance", level: "application", diff: 5, time: 300,
    statement: "An underdamped system has $\\omega_n = 5$ rad/s and $\\zeta = 0.6$. Compute the peak time $t_p = \\dfrac{\\pi}{\\omega_n\\sqrt{1-\\zeta^2}}$ in seconds.",
    answer: { value: 0.785, toleranceRel: 0.02, unit: "s" },
    tags: ["peak-time", "second-order"],
    hints: ["First compute the damped frequency ω_d = ωₙ√(1−ζ²)."],
    solution: "**Step 1.** Damped natural frequency: $\\omega_d = \\omega_n\\sqrt{1-\\zeta^2} = 5\\sqrt{1-0.36} = 5(0.8) = 4$ rad/s.\n\n**Step 2.** $t_p = \\dfrac{\\pi}{\\omega_d} = \\dfrac{\\pi}{4} \\approx 0.785$ s.\n\nThe peak of the step response occurs half a damped-oscillation period after the input step.",
  },
  {
    topic: "second-order-systems", type: "multiple_choice_single", level: "recall", diff: 2,
    statement: "A second-order system is underdamped when its damping ratio satisfies:",
    choices: [
      { label: "A", text: "$\\zeta = 0$" },
      { label: "B", text: "$0 < \\zeta < 1$" },
      { label: "C", text: "$\\zeta = 1$" },
      { label: "D", text: "$\\zeta > 1$" },
    ],
    answer: { correct: "B" },
    tags: ["damping-ratio", "classification"],
    solution: "$0<\\zeta<1$: underdamped (oscillatory decay); $\\zeta=0$: undamped; $\\zeta=1$: critically damped; $\\zeta>1$: overdamped. Underdamped poles are complex conjugates in the left half-plane.",
  },
  {
    topic: "second-order-systems", type: "numerical_tolerance", level: "recall", diff: 2,
    statement: "What value of damping ratio $\\zeta$ makes a second-order system critically damped?",
    answer: { value: 1, toleranceAbs: 0 },
    tags: ["damping-ratio", "classification"],
    solution: "Critical damping occurs at $\\zeta = 1$: both poles are real and coincident at $s = -\\omega_n$, giving the fastest non-oscillatory response.",
  },
  {
    topic: "second-order-systems", type: "text_short", level: "recall", diff: 2,
    statement: "What is the damping classification of a second-order system with $\\zeta = 1.5$? (one word)",
    answer: { accepted: ["overdamped", "over-damped", "over damped"] },
    tags: ["damping-ratio", "classification"],
    solution: "With $\\zeta > 1$ both poles are real, negative, and distinct — the response is **overdamped**: no oscillation, slower than critical damping.",
  },
  {
    topic: "natural-frequency", type: "numerical_tolerance", level: "application", diff: 3,
    statement: "A system has characteristic equation $s^2 + 6s + 36 = 0$. Find the undamped natural frequency $\\omega_n$ in rad/s.",
    answer: { value: 6, toleranceRel: 0.01, unit: "rad/s" },
    tags: ["natural-frequency", "second-order"],
    solution: "From standard form $s^2 + 2\\zeta\\omega_n s + \\omega_n^2$: $\\omega_n^2 = 36 \\Rightarrow \\omega_n = 6$ rad/s (and $\\zeta = 6/(2\\cdot6) = 0.5$).",
  },
  {
    topic: "steady-state-error", type: "multiple_choice_single", level: "comprehension", diff: 5,
    statement: "A unity-feedback system whose open-loop transfer function contains exactly one integrator (a Type 1 system) is given a unit step input. Its steady-state error is:",
    choices: [
      { label: "A", text: "Infinite" },
      { label: "B", text: "A nonzero constant" },
      { label: "C", text: "Zero" },
      { label: "D", text: "Equal to 1" },
    ],
    answer: { correct: "C" },
    tags: ["steady-state-error", "system-type"],
    solution: "For a Type 1 system the position constant $K_p = \\lim_{s\\to0} G(s) = \\infty$, so $e_{ss} = \\dfrac{1}{1+K_p} = 0$. The integrator keeps pushing until step error vanishes. (A Type 1 system has a *constant* error for a ramp instead.)",
  },
  {
    topic: "steady-state-error", type: "numerical_tolerance", level: "analysis", diff: 6, time: 300,
    statement: "A unity-feedback system has $G(s) = \\dfrac{20}{(s+2)(s+5)}$. Find the steady-state error for a unit step input. Give a decimal.",
    answer: { value: 0.333, toleranceRel: 0.02 },
    tags: ["steady-state-error", "position-constant"],
    hints: ["Compute K_p = lim_{s→0} G(s) first.", "e_ss = 1/(1+K_p) for a step."],
    solution: "**Step 1.** Position constant: $K_p = \\lim_{s\\to0} G(s) = \\dfrac{20}{(2)(5)} = 2$.\n\n**Step 2.** Steady-state error for a unit step: $e_{ss} = \\dfrac{1}{1+K_p} = \\dfrac{1}{3} \\approx 0.333$.\n\nA Type 0 system always leaves a finite step error; adding an integrator (making it Type 1) would drive it to zero.",
  },

  // ---- Stability ----
  {
    topic: "poles-and-stability", type: "multiple_choice_single", level: "recall", diff: 2,
    statement: "A linear time-invariant system is BIBO stable if and only if:",
    choices: [
      { label: "A", text: "All poles of its transfer function lie in the left half of the s-plane" },
      { label: "B", text: "All zeros lie in the left half-plane" },
      { label: "C", text: "It has more zeros than poles" },
      { label: "D", text: "Its DC gain is less than 1" },
    ],
    answer: { correct: "A" },
    tags: ["stability", "poles"],
    solution: "Each left-half-plane pole contributes a decaying exponential mode. Any pole in the right half-plane grows without bound; repeated poles on the jω-axis also diverge. Zeros do not determine stability.",
  },
  {
    topic: "poles-and-stability", type: "true_false", level: "comprehension", diff: 3,
    statement: "True or False: A system with a single non-repeated pole pair on the imaginary axis (and all other poles in the left half-plane) is marginally stable.",
    answer: { correct: true },
    tags: ["stability", "marginal-stability"],
    solution: "True. Simple jω-axis poles give a bounded sustained oscillation — the system is marginally stable. Only *repeated* imaginary-axis poles produce an unbounded response (t·sin ωt terms).",
  },
  {
    topic: "routh-hurwitz-criterion", type: "numerical_tolerance", level: "analysis", diff: 6, time: 420,
    statement: "The characteristic equation of a closed-loop system is $s^3 + 3s^2 + 3s + K = 0$. Using the Routh-Hurwitz criterion, find the maximum value of $K$ for which the system remains stable.",
    answer: { value: 9, toleranceRel: 0.01 },
    tags: ["routh-hurwitz", "stability", "gain-range"],
    hints: ["Build the Routh array from the coefficients 1, 3, 3, K.", "The s¹ row must stay positive."],
    solution: "**Step 1.** Routh array:\n\n$$\\begin{array}{c|cc} s^3 & 1 & 3 \\\\ s^2 & 3 & K \\\\ s^1 & \\dfrac{9-K}{3} & 0 \\\\ s^0 & K & \\end{array}$$\n\n**Step 2.** Stability needs every first-column entry positive: $\\dfrac{9-K}{3} > 0 \\Rightarrow K < 9$, and $K > 0$.\n\n**Step 3.** Stable range $0 < K < 9$; the maximum is $K = 9$ (at exactly 9 the system oscillates at $\\omega = \\sqrt{3}$ rad/s).",
  },
  {
    topic: "routh-hurwitz-criterion", type: "multiple_choice_single", level: "comprehension", diff: 4,
    statement: "In the Routh-Hurwitz criterion, the number of sign changes in the first column of the Routh array equals:",
    choices: [
      { label: "A", text: "The number of zeros in the right half-plane" },
      { label: "B", text: "The number of poles in the right half-plane" },
      { label: "C", text: "The system type" },
      { label: "D", text: "The order of the system" },
    ],
    answer: { correct: "B" },
    tags: ["routh-hurwitz"],
    solution: "Each sign change in the first column corresponds to one root of the characteristic equation in the right half-plane — i.e., one unstable closed-loop pole.",
  },
  {
    topic: "routh-hurwitz-criterion", type: "numerical_tolerance", level: "analysis", diff: 6, time: 420,
    statement: "For the characteristic equation $s^3 + 5s^2 + 6s + K = 0$, find the maximum $K$ for stability using the Routh-Hurwitz criterion.",
    answer: { value: 30, toleranceRel: 0.01 },
    tags: ["routh-hurwitz", "gain-range"],
    hints: ["The s¹ entry is (5·6 − K)/5."],
    solution: "**Step 1.** Routh array rows: $s^3: [1, 6]$, $s^2: [5, K]$.\n\n**Step 2.** $s^1$ entry: $\\dfrac{5(6) - K}{5} = \\dfrac{30-K}{5}$, which must be positive → $K < 30$. Also $s^0 = K > 0$.\n\n**Step 3.** Stable for $0 < K < 30$; maximum $K = 30$.",
  },
  {
    topic: "relative-stability", type: "multiple_choice_single", level: "comprehension", diff: 4,
    statement: "Relative stability of a system in the s-plane is best indicated by:",
    choices: [
      { label: "A", text: "How far its dominant poles lie to the left of the imaginary axis" },
      { label: "B", text: "The number of zeros of the system" },
      { label: "C", text: "The magnitude of its DC gain" },
      { label: "D", text: "The order of its characteristic equation" },
    ],
    answer: { correct: "A" },
    tags: ["relative-stability"],
    solution: "Absolute stability only asks 'stable or not'; *relative* stability asks 'how stable'. Poles further left decay faster and give a larger stability margin. (In the frequency domain, gain and phase margins play the same role.)",
  },
  {
    topic: "relative-stability", type: "text_short", level: "recall", diff: 2,
    statement: "Which tabular stability criterion determines stability from the coefficients of the characteristic polynomial without solving for the roots? (surname or hyphenated pair of surnames)",
    answer: { accepted: ["routh-hurwitz", "routh hurwitz", "routh", "routh-hurwitz criterion", "routh criterion"] },
    tags: ["routh-hurwitz", "definitions"],
    solution: "The **Routh-Hurwitz criterion** arranges the polynomial coefficients into the Routh array and reads stability from the signs of the first column — no root-finding required.",
  },

  // ---- Root Locus ----
  {
    topic: "root-locus-rules", type: "numerical_tolerance", level: "comprehension", diff: 3,
    statement: "The open-loop transfer function is $G(s)H(s) = \\dfrac{K(s+2)}{s(s+4)(s+6)}$. How many branches does its root locus have?",
    answer: { value: 3, toleranceAbs: 0 },
    tags: ["root-locus", "branches"],
    solution: "The number of branches equals the number of open-loop poles: here 3 (at $s = 0, -4, -6$). Each branch starts at a pole ($K=0$) and ends at a zero or at infinity ($K\\to\\infty$).",
  },
  {
    topic: "root-locus-rules", type: "multiple_choice_single", level: "comprehension", diff: 4,
    statement: "A point on the real axis lies on the root locus (for $K > 0$) if:",
    choices: [
      { label: "A", text: "The total number of real-axis poles and zeros to its right is odd" },
      { label: "B", text: "The total number of real-axis poles and zeros to its right is even" },
      { label: "C", text: "It lies between two zeros" },
      { label: "D", text: "It lies to the left of all poles" },
    ],
    answer: { correct: "A" },
    tags: ["root-locus", "real-axis"],
    solution: "Real-axis segments belong to the locus when an **odd** count of real poles + zeros lies to the right — that is what makes the angle condition sum to 180°.",
  },
  {
    topic: "root-locus-rules", type: "numerical_tolerance", level: "analysis", diff: 6, time: 360,
    statement: "For $G(s)H(s) = \\dfrac{K(s+2)}{s(s+4)(s+6)}$, compute the real-axis intercept (centroid) of the asymptotes, $\\sigma_a = \\dfrac{\\sum p_i - \\sum z_i}{n - m}$.",
    answer: { value: -4, toleranceRel: 0.01 },
    tags: ["root-locus", "asymptotes"],
    hints: ["Poles: 0, −4, −6. Zero: −2.", "n − m = 3 − 1 = 2."],
    solution: "**Step 1.** Sum of poles: $0 + (-4) + (-6) = -10$. Sum of zeros: $-2$.\n\n**Step 2.** $\\sigma_a = \\dfrac{-10 - (-2)}{3 - 1} = \\dfrac{-8}{2} = -4$.\n\nThe two infinite branches approach asymptotes at ±90° passing through $s = -4$.",
  },
  {
    topic: "angle-magnitude-conditions", type: "multiple_choice_single", level: "recall", diff: 4,
    statement: "The angle condition for a point $s_0$ to lie on the root locus (K > 0) is that the angle of $G(s_0)H(s_0)$ equals:",
    choices: [
      { label: "A", text: "0°" },
      { label: "B", text: "An odd multiple of 180°" },
      { label: "C", text: "An even multiple of 180°" },
      { label: "D", text: "90°" },
    ],
    answer: { correct: "B" },
    tags: ["root-locus", "angle-condition"],
    solution: "The characteristic equation $1 + KG(s)H(s) = 0$ requires $KG(s)H(s) = -1$, i.e. magnitude 1 and angle $(2k+1)180°$ — an odd multiple of 180°.",
  },
  {
    topic: "gain-calculation", type: "numerical_tolerance", level: "analysis", diff: 6, time: 360,
    statement: "For $G(s)H(s) = \\dfrac{K}{s(s+4)}$, use the magnitude condition to find the gain $K$ that places a closed-loop pole at $s = -2$ (the breakaway point).",
    answer: { value: 4, toleranceRel: 0.01 },
    tags: ["root-locus", "magnitude-condition", "gain"],
    hints: ["Magnitude condition: K = |s||s+4| evaluated at s = −2."],
    solution: "**Step 1.** Magnitude condition: $K = \\dfrac{1}{|G(s)H(s)/K|} = |s|\\,|s+4|$ at $s=-2$.\n\n**Step 2.** $K = |-2| \\cdot |-2+4| = 2 \\times 2 = 4$.\n\nAt $K=4$ the two branches meet at $s=-2$ (critically damped closed loop); larger K sends them vertical (complex poles).",
  },

  // ---- Frequency Response ----
  {
    topic: "bode-plots", type: "numerical_tolerance", level: "recall", diff: 2,
    statement: "A system has gain magnitude $|G(j\\omega)| = 10$ at some frequency. Express this gain in decibels.",
    answer: { value: 20, toleranceRel: 0.01, unit: "dB" },
    tags: ["bode", "decibels"],
    solution: "$20\\log_{10}(10) = 20$ dB. (Magnitude in dB is always $20\\log_{10}|G|$ for amplitude ratios.)",
  },
  {
    topic: "bode-plots", type: "multiple_choice_single", level: "comprehension", diff: 3,
    statement: "On a Bode magnitude plot, a single real pole contributes what slope at frequencies well above its corner frequency?",
    choices: [
      { label: "A", text: "−20 dB/decade" },
      { label: "B", text: "−40 dB/decade" },
      { label: "C", text: "+20 dB/decade" },
      { label: "D", text: "0 dB/decade" },
    ],
    answer: { correct: "A" },
    tags: ["bode", "slope"],
    solution: "Above its corner, a factor $\\dfrac{1}{1+s/\\omega_c}$ falls at **−20 dB/decade** and asymptotically contributes −90° of phase. Each additional pole adds another −20 dB/dec.",
  },
  {
    topic: "bode-plots", type: "numerical_tolerance", level: "comprehension", diff: 3,
    statement: "What is the corner (break) frequency, in rad/s, of the factor $\\left(1 + \\dfrac{s}{10}\\right)$ in a Bode plot?",
    answer: { value: 10, toleranceRel: 0.01, unit: "rad/s" },
    tags: ["bode", "corner-frequency"],
    solution: "A factor $(1 + s/\\omega_c)$ breaks at $\\omega_c$. Here $\\omega_c = 10$ rad/s: below it the asymptote is flat, above it rises at +20 dB/dec (it is a zero).",
  },
  {
    topic: "gain-margin", type: "numerical_tolerance", level: "application", diff: 5, time: 300,
    statement: "At the phase-crossover frequency (where phase = −180°), a system's open-loop gain magnitude is $|G| = 0.5$. Compute the gain margin in dB.",
    answer: { value: 6.02, toleranceRel: 0.02, unit: "dB" },
    tags: ["gain-margin", "stability-margins"],
    hints: ["GM = 1/|G| at phase crossover, then convert to dB."],
    solution: "**Step 1.** $GM = \\dfrac{1}{|G(j\\omega_{pc})|} = \\dfrac{1}{0.5} = 2$.\n\n**Step 2.** In dB: $20\\log_{10}(2) \\approx 6.02$ dB.\n\nInterpretation: the loop gain could be doubled before the system reaches the verge of instability.",
  },
  {
    topic: "phase-margin", type: "multiple_choice_single", level: "recall", diff: 4,
    statement: "Phase margin is measured at the frequency where:",
    choices: [
      { label: "A", text: "The open-loop phase equals −180°" },
      { label: "B", text: "The open-loop gain magnitude equals 1 (0 dB)" },
      { label: "C", text: "The closed-loop gain peaks" },
      { label: "D", text: "The phase equals −90°" },
    ],
    answer: { correct: "B" },
    tags: ["phase-margin", "stability-margins"],
    solution: "Phase margin $= 180° + \\angle G(j\\omega_{gc})$ evaluated at the **gain-crossover** frequency, where $|G| = 1$. (Gain margin, conversely, is read at the phase-crossover frequency.)",
  },
  {
    topic: "nyquist-criterion", type: "multiple_choice_single", level: "analysis", diff: 7,
    statement: "In the Nyquist stability criterion $N = Z - P$, where $N$ counts clockwise encirclements of $-1 + j0$, $Z$ is the number of closed-loop poles in the RHP, and $P$ is the number of open-loop poles in the RHP. For closed-loop stability we require:",
    choices: [
      { label: "A", text: "$Z = 0$, i.e. $N = -P$ (P counterclockwise encirclements)" },
      { label: "B", text: "$N = P$" },
      { label: "C", text: "$N = 0$ always" },
      { label: "D", text: "$Z = P$" },
    ],
    answer: { correct: "A" },
    tags: ["nyquist", "stability"],
    solution: "Closed-loop stability means no RHP closed-loop poles: $Z = 0$, hence $N = -P$ — the plot must encircle $-1$ counterclockwise exactly $P$ times. If the open loop is already stable ($P=0$), the plot must not encircle $-1$ at all.",
  },
  {
    topic: "bode-plots", type: "text_short", level: "recall", diff: 2,
    statement: "What is the name of the pair of logarithmic-frequency plots showing gain in dB and phase in degrees versus frequency? (two words)",
    answer: { accepted: ["bode plot", "bode plots", "bode diagram", "bode diagrams", "the bode plot"] },
    tags: ["bode", "definitions"],
    solution: "The **Bode plot**: a log-magnitude (dB) plot and a phase plot, both against log frequency. Its straight-line asymptotes make manual sketching practical.",
  },

  // ---- Controllers ----
  {
    topic: "pid-controllers", type: "multiple_choice_single", level: "comprehension", diff: 3,
    statement: "Which controller action eliminates steady-state error for a step reference on a Type 0 plant?",
    choices: [
      { label: "A", text: "Proportional (P)" },
      { label: "B", text: "Integral (I)" },
      { label: "C", text: "Derivative (D)" },
      { label: "D", text: "A pure gain less than 1" },
    ],
    answer: { correct: "B" },
    tags: ["pid", "integral-action", "steady-state-error"],
    solution: "Integral action accumulates error over time and keeps adjusting the output until the error is exactly zero — it raises the system type by one. P alone leaves an offset; D acts only on the error's rate of change.",
  },
  {
    topic: "pid-controllers", type: "multiple_choice_single", level: "comprehension", diff: 3,
    statement: "The main benefit of derivative (D) action in a PID controller is to:",
    choices: [
      { label: "A", text: "Eliminate steady-state error" },
      { label: "B", text: "Add damping and improve the transient response by anticipating error trends" },
      { label: "C", text: "Increase the DC gain" },
      { label: "D", text: "Filter out sensor noise" },
    ],
    answer: { correct: "B" },
    tags: ["pid", "derivative-action"],
    solution: "D action responds to the *slope* of the error, applying a braking effect before the error grows — effectively adding damping and reducing overshoot. It actually *amplifies* high-frequency noise (why practical D terms are filtered), and contributes nothing at DC.",
  },
  {
    topic: "pid-controllers", type: "text_short", level: "comprehension", diff: 2,
    statement: "A controller computes $u(t) = K_p e(t) + K_i \\int_0^t e(\\tau)\\,d\\tau$. What type of controller is this? (abbreviation)",
    answer: { accepted: ["pi", "pi controller", "proportional integral", "proportional-integral", "proportional plus integral"] },
    tags: ["pid", "classification"],
    solution: "It has a proportional term and an integral term but no derivative term: a **PI controller** — the most common industrial configuration.",
  },
  {
    topic: "pid-controllers", type: "text_short", level: "recall", diff: 2,
    statement: "Which PID term responds to the rate of change of the error? (one word)",
    answer: { accepted: ["derivative", "d", "derivative term", "the derivative term", "derivative action"] },
    tags: ["pid", "derivative-action"],
    solution: "The **derivative** term $K_d \\dfrac{de}{dt}$ reacts to how fast the error is changing, providing anticipatory, damping action.",
  },
  {
    topic: "lead-compensation", type: "multiple_choice_single", level: "comprehension", diff: 5,
    statement: "A lead compensator $G_c(s) = K\\dfrac{s+z}{s+p}$ with $z < p$ primarily improves:",
    choices: [
      { label: "A", text: "Steady-state accuracy, by boosting low-frequency gain" },
      { label: "B", text: "Transient response and stability margins, by adding phase lead near crossover" },
      { label: "C", text: "Noise rejection at high frequency" },
      { label: "D", text: "Nothing; it only scales the gain" },
    ],
    answer: { correct: "B" },
    tags: ["lead-compensation"],
    solution: "With the zero below the pole ($z<p$), the network contributes positive phase in mid-frequencies. Placed near the gain crossover it raises the phase margin — faster, better-damped response. (Its behavior approximates PD control.)",
  },
  {
    topic: "lag-compensation", type: "true_false", level: "comprehension", diff: 4,
    statement: "True or False: A lag compensator is used mainly to improve steady-state accuracy while leaving the transient response largely unchanged.",
    answer: { correct: true },
    tags: ["lag-compensation"],
    solution: "True. A lag network ($z > p$, both small) boosts low-frequency gain — raising error constants and shrinking steady-state error — while its pole-zero pair is placed far below crossover so phase margin and transients are barely affected. (It approximates PI control.)",
  },
  {
    topic: "lead-lag-compensation", type: "multiple_choice_single", level: "comprehension", diff: 5,
    statement: "A lead-lag compensator is chosen when the design must:",
    choices: [
      { label: "A", text: "Improve both the transient response and the steady-state accuracy" },
      { label: "B", text: "Only reduce the system order" },
      { label: "C", text: "Convert the plant to Type 0" },
      { label: "D", text: "Remove all zeros from the plant" },
    ],
    answer: { correct: "A" },
    tags: ["lead-lag-compensation"],
    solution: "The lead section supplies phase margin (transient/stability), while the lag section lifts low-frequency gain (steady-state accuracy). Combined, they address both specs — analogous to a full PID.",
  },

  // ---- State Space ----
  {
    topic: "state-variables", type: "numerical_tolerance", level: "recall", diff: 2,
    statement: "A state-space model has a $3 \\times 3$ system matrix $A$. How many state variables does the model have?",
    answer: { value: 3, toleranceAbs: 0 },
    tags: ["state-space", "state-variables"],
    solution: "The dimension of $A$ equals the number of state variables: an $n \\times n$ matrix means $n = 3$ states (equivalently, a third-order system).",
  },
  {
    topic: "state-variables", type: "numerical_tolerance", level: "analysis", diff: 6, time: 360,
    statement: "For $A = \\begin{bmatrix} 0 & 1 \\\\ -2 & -3 \\end{bmatrix}$, the eigenvalues satisfy $\\det(sI - A) = 0$. Compute the **sum** of the eigenvalues.",
    answer: { value: -3, toleranceRel: 0.01 },
    tags: ["state-space", "eigenvalues"],
    hints: ["det(sI−A) = s² + 3s + 2.", "Or just use the trace of A."],
    solution: "**Step 1.** $\\det(sI-A) = s(s+3) - (1)(-2) = s^2 + 3s + 2 = (s+1)(s+2)$.\n\n**Step 2.** Eigenvalues: $-1$ and $-2$; sum $= -3$.\n\n**Shortcut.** The sum of eigenvalues always equals $\\operatorname{tr}(A) = 0 + (-3) = -3$. These eigenvalues are exactly the system poles.",
  },
  {
    topic: "controllability", type: "multiple_choice_single", level: "recall", diff: 5,
    statement: "An $n$-state system $(A, B)$ is completely controllable if and only if the controllability matrix $\\mathcal{C} = [B \\;\\; AB \\;\\; A^2B \\;\\cdots\\; A^{n-1}B]$:",
    choices: [
      { label: "A", text: "Has rank $n$" },
      { label: "B", text: "Is symmetric" },
      { label: "C", text: "Has all positive entries" },
      { label: "D", text: "Has determinant equal to zero" },
    ],
    answer: { correct: "A" },
    tags: ["state-space", "controllability"],
    solution: "Kalman's rank test: full rank $n$ means the input can steer the state anywhere in the state space in finite time. Rank deficiency means some mode cannot be influenced by the input.",
  },
  {
    topic: "controllability", type: "text_short", level: "recall", diff: 3,
    statement: "What property of a state-space system guarantees that its state can be driven from any initial state to any final state in finite time by some input? (one word)",
    answer: { accepted: ["controllability", "controllable", "complete controllability", "state controllability"] },
    tags: ["state-space", "controllability", "definitions"],
    solution: "**Controllability.** Its dual — deducing the internal state from the measured output — is *observability*.",
  },
  {
    topic: "state-transition-matrix", type: "multiple_choice_single", level: "comprehension", diff: 4,
    statement: "The state transition matrix $\\Phi(t) = e^{At}$ of $\\dot{x} = Ax$ satisfies which property at $t = 0$?",
    choices: [
      { label: "A", text: "$\\Phi(0) = I$ (identity matrix)" },
      { label: "B", text: "$\\Phi(0) = A$" },
      { label: "C", text: "$\\Phi(0) = 0$" },
      { label: "D", text: "$\\Phi(0) = A^{-1}$" },
    ],
    answer: { correct: "A" },
    tags: ["state-space", "state-transition-matrix"],
    solution: "$x(t) = \\Phi(t)x(0)$ must return $x(0)$ at $t=0$, so $\\Phi(0) = I$. Other key properties: $\\dot{\\Phi}(t) = A\\Phi(t)$ and $\\Phi(t_1+t_2) = \\Phi(t_1)\\Phi(t_2)$.",
  },
  {
    topic: "observability", type: "multiple_choice_single", level: "recall", diff: 5,
    statement: "A system $(A, C)$ is completely observable if and only if the observability matrix $\\mathcal{O} = \\begin{bmatrix} C \\\\ CA \\\\ \\vdots \\\\ CA^{n-1} \\end{bmatrix}$ has:",
    choices: [
      { label: "A", text: "Rank $n$" },
      { label: "B", text: "All zero rows" },
      { label: "C", text: "Determinant 1" },
      { label: "D", text: "More columns than rows" },
    ],
    answer: { correct: "A" },
    tags: ["state-space", "observability"],
    solution: "Full rank $n$ means every internal state leaves a distinguishable footprint on the output, so the initial state can be reconstructed from output measurements. It is the exact dual of the controllability test.",
  },
  {
    topic: "observability", type: "true_false", level: "comprehension", diff: 4,
    statement: "True or False: Observability concerns whether the internal state of a system can be inferred from knowledge of its outputs over time.",
    answer: { correct: true },
    tags: ["state-space", "observability"],
    solution: "True — that is the definition. A state estimator (observer, e.g. a Luenberger observer or Kalman filter) can only reconstruct states that are observable.",
  },
];

// ---------- Gamification catalog (mirrors src/lib/gamification.ts) ----------

const BADGE_ROWS = [
  { code: "first-feedback", title: "First Feedback", description: "Answer your first Control Systems question.", icon: "🔁" },
  { code: "closed-loop-beginner", title: "Closed-Loop Beginner", description: "Pass the open-loop vs closed-loop topic.", icon: "➿" },
  { code: "routh-rookie", title: "Routh Rookie", description: "Solve 10 Routh-Hurwitz problems.", icon: "📋" },
  { code: "root-locus-explorer", title: "Root Locus Explorer", description: "Pass root locus rules.", icon: "🧭" },
  { code: "stability-sentinel", title: "Stability Sentinel", description: "Master all stability subtopics.", icon: "🛡️" },
  { code: "second-try-scholar", title: "Second Try Scholar", description: "Solve 10 problems correctly on the second try.", icon: "🎯" },
  { code: "comeback-gain", title: "Comeback Gain", description: "Correctly solve a problem you previously missed.", icon: "📈" },
  { code: "no-skip-streak", title: "No Skip Streak", description: "Attempt 20 problems in a row without giving up.", icon: "🔥" },
  { code: "bode-builder", title: "Bode Builder", description: "Pass the Bode plots topic.", icon: "📊" },
  { code: "pid-apprentice", title: "PID Apprentice", description: "Pass the P/PI/PD/PID controllers topic.", icon: "🎛️" },
  { code: "control-systems-master", title: "Control Systems Master", description: "Master every Feedback and Control Systems topic.", icon: "👑" },
];

const ACHIEVEMENT_ROWS = [
  { code: "first-try-first-win", title: "First Try, First Win", description: "Answer your very first problem correctly on the first try.", hidden: false, icon: "🌟" },
  { code: "mistake-repaired", title: "Mistake Repaired", description: "Correctly re-solve a problem you previously got wrong.", hidden: false, icon: "🔧" },
  { code: "persistence-pays", title: "Persistence Pays", description: "Turn a first-try miss into a second-try success.", hidden: false, icon: "💪" },
  { code: "five-day-feedback-loop", title: "Five-Day Feedback Loop", description: "Practice on five days in a row.", hidden: false, icon: "📅" },
  { code: "routh-table-complete", title: "Routh Table Complete", description: "Solve a full Routh-Hurwitz stability problem.", hidden: true, icon: "🧮" },
  { code: "overshoot-to-settling", title: "From Overshoot to Settling", description: "Pass the complete Time Response Analysis topic group.", hidden: true, icon: "〰️" },
  { code: "against-the-poles", title: "Against the Poles", description: "Answer 5 stability questions correctly in a row.", hidden: true, icon: "⚔️" },
  { code: "frequency-domain-traveler", title: "Frequency Domain Traveler", description: "Attempt 15 frequency-response problems.", hidden: true, icon: "🌐" },
];

const QUEST_ROWS = [
  { code: "daily-time-response-5", title: "Transient Trainer", description: "Solve 5 Time Response problems today.", cadence: "daily", ruleType: "solve_topic_count", ruleParams: '{"topicGroup":"time-response"}', xpReward: 50 },
  { code: "daily-stability-3", title: "Stability Check", description: "Correctly answer 3 stability questions today.", cadence: "daily", ruleType: "correct_count", ruleParams: '{"topicGroup":"stability"}', xpReward: 40 },
  { code: "daily-review-2", title: "Error Correction", description: "Re-attempt 2 previously missed questions.", cadence: "daily", ruleType: "review_count", ruleParams: "{}", xpReward: 40 },
  { code: "weekly-pass-topic", title: "New Ground", description: "Pass one new topic this week.", cadence: "weekly", ruleType: "pass_topic", ruleParams: "{}", xpReward: 120 },
  { code: "weekly-master-topic", title: "Total Command", description: "Master one topic this week.", cadence: "weekly", ruleType: "master_topic", ruleParams: "{}", xpReward: 200 },
  { code: "daily-hard-1", title: "Boss Pole", description: "Solve one hard problem (difficulty ≥ 7) today.", cadence: "daily", ruleType: "hard_solve", ruleParams: '{"minDifficulty":7}', xpReward: 60 },
  { code: "weekly-mixed-10", title: "Full Sweep", description: "Complete a 10-problem mixed review this week.", cadence: "weekly", ruleType: "mixed_set", ruleParams: "{}", xpReward: 100 },
];

async function main() {
  console.log("Seeding ECE Mastery…");

  // wipe (idempotent reseed)
  await prisma.attemptAnswer.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.learnerTopicProgress.deleteMany();
  await prisma.xPEvent.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.userQuest.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.reportedProblem.deleteMany();
  await prisma.problemChoice.deleteMany();
  await prisma.problemTag.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.topicPrerequisite.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.classEnrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.user.deleteMany();

  // users
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@ece-mastery.local",
      name: "Admin",
      passwordHash: hashPassword("admin123"),
      role: "admin",
    },
  });
  await prisma.user.create({
    data: {
      username: "learner",
      email: "learner@ece-mastery.local",
      name: "Tim",
      passwordHash: hashPassword("learner123"),
      role: "learner",
    },
  });

  // subject + topics
  const subject = await prisma.subject.create({
    data: {
      slug: "feedback-control-systems",
      title: "Feedback and Control Systems",
      description: "Modeling, time response, stability, root locus, frequency response, compensation, and state-space analysis.",
      sortOrder: 1,
    },
  });

  const topicIdBySlug = new Map<string, string>();
  let sort = 0;
  for (const t of TOPICS) {
    const parent = await prisma.topic.create({
      data: { subjectId: subject.id, slug: t.slug, title: t.title, difficultyBand: t.band, sortOrder: sort++ },
    });
    topicIdBySlug.set(t.slug, parent.id);
    let childSort = 0;
    for (const c of t.children) {
      const child = await prisma.topic.create({
        data: {
          subjectId: subject.id, parentTopicId: parent.id, slug: c.slug, title: c.title,
          difficultyBand: c.band, sortOrder: childSort++,
        },
      });
      topicIdBySlug.set(c.slug, child.id);
    }
  }
  // prerequisites (second pass, once all ids exist)
  for (const t of TOPICS) {
    for (const c of t.children) {
      for (const pre of c.prereqs ?? []) {
        const topicId = topicIdBySlug.get(c.slug)!;
        const requiredTopicId = topicIdBySlug.get(pre);
        if (!requiredTopicId) throw new Error(`Unknown prerequisite slug: ${pre}`);
        await prisma.topicPrerequisite.create({ data: { topicId, requiredTopicId } });
      }
    }
  }

  // problems
  let count = 0;
  for (const p of P) {
    const topicId = topicIdBySlug.get(p.topic);
    if (!topicId) throw new Error(`Unknown topic slug: ${p.topic}`);
    const problem = await prisma.problem.create({
      data: {
        topicId,
        statement: p.statement,
        answerType: p.type,
        answerData: JSON.stringify(p.answer),
        cognitiveLevel: p.level,
        difficulty: p.diff,
        estimatedTime: p.time ?? 120,
        hints: JSON.stringify(p.hints ?? []),
        solution: p.solution,
        explanation: p.explanation ?? "",
        reference: p.reference ?? "",
        authorId: admin.id,
        status: "active",
      },
    });
    if (p.choices) {
      let order = 0;
      for (const c of p.choices) {
        await prisma.problemChoice.create({
          data: {
            problemId: problem.id, label: c.label, text: c.text,
            isCorrect: c.label === (p.answer as { correct?: string }).correct, sortOrder: order++,
          },
        });
      }
    }
    for (const tag of p.tags) {
      await prisma.problemTag.create({ data: { problemId: problem.id, tag } });
    }
    count++;
  }

  // gamification catalog
  for (const b of BADGE_ROWS) await prisma.badge.create({ data: b });
  for (const a of ACHIEVEMENT_ROWS) await prisma.achievement.create({ data: a });
  for (const q of QUEST_ROWS) await prisma.quest.create({ data: q });

  console.log(`Seeded 1 subject, ${topicIdBySlug.size} topics, ${count} problems, ${BADGE_ROWS.length} badges, ${QUEST_ROWS.length} quests, ${ACHIEVEMENT_ROWS.length} achievements.`);
  console.log("Accounts: admin/admin123 (admin), learner/learner123 (learner)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
