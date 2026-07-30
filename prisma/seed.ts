// Seed: ECE curricula + question banks.
//
// Behavior:
// - Empty database (or SEED_RESET=1): full wipe + reseed of users, curricula,
//   problems, and the gamification catalog.
// - Already-seeded database: subjects that are not in the database yet are
//   added (curriculum + questions), and the gamification catalog is upserted.
//   User accounts, attempts, progress, and earned rewards are preserved, as are
//   subjects that already exist — so adding a new subject to this file and
//   rerunning the seed is safe.
//
// Each subject's question bank is a CSV under prisma/, in the same column
// format the admin CSV importer accepts. Subtopic titles in those files are the
// join key against the curriculum below, so they must match character-for-
// character.
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { parseCsv } from "../src/lib/csv";
import { ACHIEVEMENTS, BADGES, QUESTS } from "../src/lib/gamification";

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

interface SubjectSeed {
  slug: string;
  title: string;
  description: string;
  /** Question-bank CSV, relative to this directory. */
  csv: string;
  topics: TopicSeed[];
}

// Topic slugs are globally unique (Topic.slug is @unique), so each subject
// keeps its own slug prefix.
const CONTROL_TOPICS: TopicSeed[] = [
  {
    slug: "laplace-transform", title: "Laplace and Inverse Laplace Transform", band: 1,
    children: [
      { slug: "laplace-transforms", title: "Laplace Transforms", band: 1 },
      { slug: "laplace-properties", title: "Properties of Laplace Transforms", band: 2, prereqs: ["laplace-transforms"] },
      { slug: "inverse-laplace", title: "Inverse Laplace Transform", band: 2, prereqs: ["laplace-transforms"] },
    ],
  },
  {
    slug: "introduction", title: "Introduction to Control Systems", band: 1,
    children: [
      { slug: "control-system-definition", title: "Definition of a Control System", band: 1 },
      { slug: "open-vs-closed-loop", title: "Open Loop vs Closed-Loop Control System", band: 1, prereqs: ["control-system-definition"] },
      {
        slug: "de-to-tf",
        title: "Mathematical Modelling 1 (Differential Equation to Transfer Function)",
        band: 2, prereqs: ["laplace-properties"],
      },
      {
        slug: "response-to-tf",
        title: "Mathematical Modelling 2 (Impulse and Step Response to Transfer Function)",
        band: 3, prereqs: ["de-to-tf", "inverse-laplace"],
      },
      {
        slug: "transfer-functions",
        title: "Transfer Function (Poles, Zeros, Gain, Pole-Zero Map)",
        band: 2, prereqs: ["de-to-tf"],
      },
    ],
  },
  {
    slug: "dynamic-system-modelling", title: "Modelling of Dynamic Systems", band: 2,
    children: [
      { slug: "electrical-systems", title: "Electrical Networks", band: 3, prereqs: ["de-to-tf"] },
      {
        slug: "mechanical-systems",
        title: "Translational Mechanical System (Spring-Mass-Damper System)",
        band: 3, prereqs: ["de-to-tf"],
      },
    ],
  },
  {
    slug: "block-diagram-signal-flow-graph", title: "Block Diagram and Signal Flow Graph", band: 2,
    children: [
      { slug: "block-diagrams", title: "Block Diagram Definitions and Operations", band: 2, prereqs: ["transfer-functions"] },
      { slug: "block-diagram-to-tf", title: "Block Diagram to Transfer Function", band: 3, prereqs: ["block-diagrams"] },
      { slug: "signal-flow-graphs", title: "Signal Flow Graph Definitions", band: 3, prereqs: ["block-diagrams"] },
      { slug: "masons-gain-rule", title: "Mason's Gain Rule", band: 4, prereqs: ["signal-flow-graphs"] },
      { slug: "sfg-to-tf", title: "Signal Flow Graph to Transfer Function", band: 4, prereqs: ["masons-gain-rule"] },
    ],
  },
  {
    slug: "time-response-analysis", title: "Time Response Analysis", band: 3,
    children: [
      { slug: "first-order-systems", title: "Transient Analysis of First Order Systems", band: 2, prereqs: ["transfer-functions"] },
      { slug: "second-order-systems", title: "Transient Analysis of Second Order Systems", band: 3, prereqs: ["first-order-systems"] },
      {
        slug: "underdamped-parameters",
        title: "Transient Parameters of Second Order Underdamped Systems",
        band: 4, prereqs: ["second-order-systems"],
      },
    ],
  },
  {
    slug: "stability", title: "Stability Analysis", band: 3,
    children: [
      { slug: "stability-concept", title: "Concept of Stability", band: 3, prereqs: ["transfer-functions"] },
      { slug: "poles-and-stability", title: "Stability in Terms of Pole Locations", band: 3, prereqs: ["stability-concept"] },
      { slug: "routh-hurwitz-criterion", title: "Routh-Hurwitz Criterion", band: 4, prereqs: ["poles-and-stability"] },
      { slug: "conditional-stability", title: "Conditional Stability", band: 4, prereqs: ["routh-hurwitz-criterion"] },
      { slug: "relative-stability", title: "Relative Stability", band: 4, prereqs: ["routh-hurwitz-criterion"] },
    ],
  },
  {
    slug: "steady-state-error", title: "Steady-State Error", band: 4,
    children: [
      { slug: "steady-state-error-concept", title: "Concept of Steady-State Error", band: 3, prereqs: ["first-order-systems"] },
      { slug: "final-value-theorem", title: "Final Value Theorem", band: 3, prereqs: ["laplace-properties"] },
      {
        slug: "system-type-error-constants",
        title: "System Type, Standard Test Inputs, and Static Error Coefficients",
        band: 4, prereqs: ["steady-state-error-concept", "final-value-theorem"],
      },
      {
        slug: "type-0-1-2-errors",
        title: "Steady-State Errors of Type 0, 1, and 2 Systems",
        band: 4, prereqs: ["system-type-error-constants"],
      },
      {
        slug: "unity-feedback-error",
        title: "Steady-State Error of Unity Feedback Systems",
        band: 4, prereqs: ["type-0-1-2-errors"],
      },
      {
        slug: "non-unity-feedback-error",
        title: "Steady-State Error of Non-Unity Feedback Systems",
        band: 5, prereqs: ["unity-feedback-error"],
      },
      {
        slug: "error-spec-design",
        title: "Design for Steady-State Error Specifications",
        band: 5, prereqs: ["unity-feedback-error"],
      },
    ],
  },
  {
    slug: "root-locus", title: "Root Locus", band: 4,
    children: [
      { slug: "root-locus-concept", title: "Concept of the Root Locus", band: 4, prereqs: ["poles-and-stability"] },
      { slug: "angle-magnitude-conditions", title: "Magnitude and Angle Conditions", band: 4, prereqs: ["root-locus-concept"] },
      { slug: "root-locus-rules", title: "Root Locus Construction Rules", band: 5, prereqs: ["angle-magnitude-conditions"] },
    ],
  },
  {
    slug: "frequency-response", title: "Frequency Response Analysis", band: 4,
    children: [
      { slug: "frequency-response-lti", title: "Frequency Response of LTI systems", band: 4, prereqs: ["transfer-functions"] },
      {
        slug: "frequency-response-second-order",
        title: "Frequency Response of Second Order Systems",
        band: 4, prereqs: ["frequency-response-lti", "second-order-systems"],
      },
      { slug: "gain-phase-margins", title: "Gain and Phase Margins", band: 5, prereqs: ["frequency-response-lti"] },
      { slug: "bode-plots", title: "Bode Plots", band: 5, prereqs: ["frequency-response-lti"] },
    ],
  },
  {
    slug: "controllers-compensators", title: "Controllers and Compensators", band: 5,
    children: [
      { slug: "controllers-intro", title: "Introduction to Controllers", band: 3, prereqs: ["unity-feedback-error"] },
      {
        slug: "pid-terms",
        title: "Proportional (P), Integral (I), and Derivative (D) Controllers",
        band: 4, prereqs: ["controllers-intro"],
      },
      { slug: "pid-controllers", title: "PI, PD, and PID Controllers", band: 4, prereqs: ["pid-terms"] },
      { slug: "lead-compensation", title: "Lead Compensation", band: 5, prereqs: ["pid-controllers", "root-locus-rules"] },
      { slug: "lag-compensation", title: "Lag Compensation", band: 5, prereqs: ["pid-controllers", "root-locus-rules"] },
      {
        slug: "lead-lag-compensation",
        title: "Lead-Lag Compensation",
        band: 5, prereqs: ["lead-compensation", "lag-compensation"],
      },
    ],
  },
];

const DIGITAL_TOPICS: TopicSeed[] = [
  {
    slug: "de-number-systems", title: "Number Systems and Codes", band: 1,
    children: [
      { slug: "de-positional-systems", title: "Positional Number Systems (Binary, Octal, Decimal, Hexadecimal)", band: 1 },
      { slug: "de-base-conversion", title: "Base Conversion", band: 1, prereqs: ["de-positional-systems"] },
      {
        slug: "de-binary-arithmetic",
        title: "Binary Arithmetic (Addition, Subtraction, Multiplication, Division)",
        band: 2, prereqs: ["de-base-conversion"],
      },
      {
        slug: "de-signed-numbers",
        title: "Signed Number Representation (Sign-Magnitude, 1's Complement, 2's Complement)",
        band: 2, prereqs: ["de-binary-arithmetic"],
      },
      {
        slug: "de-complement-arithmetic",
        title: "Complement Arithmetic and Overflow Detection",
        band: 3, prereqs: ["de-signed-numbers"],
      },
      { slug: "de-binary-codes", title: "Binary Codes (BCD, Excess-3, Gray, ASCII)", band: 2, prereqs: ["de-base-conversion"] },
      {
        slug: "de-error-detection",
        title: "Error Detection and Correction (Parity, Hamming Code)",
        band: 3, prereqs: ["de-binary-codes"],
      },
    ],
  },
  {
    slug: "de-boolean-algebra", title: "Boolean Algebra and Logic Gates", band: 1,
    children: [
      { slug: "de-logic-levels", title: "Logic Levels, Positive and Negative Logic", band: 1 },
      {
        slug: "de-logic-gates",
        title: "Basic and Derived Logic Gates (AND, OR, NOT, NAND, NOR, XOR, XNOR)",
        band: 1, prereqs: ["de-logic-levels"],
      },
      { slug: "de-boolean-theorems", title: "Boolean Postulates and Theorems", band: 2, prereqs: ["de-logic-gates"] },
      { slug: "de-de-morgan", title: "De Morgan's Theorems", band: 2, prereqs: ["de-boolean-theorems"] },
      { slug: "de-universal-gates", title: "Universal Gates and Gate Conversions", band: 2, prereqs: ["de-de-morgan"] },
      {
        slug: "de-expressions-circuits",
        title: "Logic Expressions from Circuits and Circuits from Expressions",
        band: 2, prereqs: ["de-boolean-theorems"],
      },
    ],
  },
  {
    slug: "de-simplification", title: "Simplification of Boolean Functions", band: 2,
    children: [
      {
        slug: "de-canonical-forms",
        title: "Canonical and Standard Forms (Minterms, Maxterms, SOP, POS)",
        band: 2, prereqs: ["de-boolean-theorems"],
      },
      { slug: "de-algebraic-simplification", title: "Algebraic Simplification", band: 2, prereqs: ["de-canonical-forms"] },
      {
        slug: "de-karnaugh-maps",
        title: "Karnaugh Maps (Two, Three, and Four Variables)",
        band: 3, prereqs: ["de-canonical-forms"],
      },
      { slug: "de-dont-care", title: "Don't-Care Conditions", band: 3, prereqs: ["de-karnaugh-maps"] },
      { slug: "de-five-variable-kmap", title: "Five-Variable Karnaugh Maps", band: 4, prereqs: ["de-karnaugh-maps"] },
      {
        slug: "de-quine-mccluskey",
        title: "Quine-McCluskey (Tabulation) Method",
        band: 4, prereqs: ["de-karnaugh-maps"],
      },
      {
        slug: "de-nand-nor-implementation",
        title: "NAND-Only and NOR-Only Implementation",
        band: 3, prereqs: ["de-universal-gates", "de-algebraic-simplification"],
      },
    ],
  },
  {
    slug: "de-logic-families", title: "Logic Families", band: 3,
    children: [
      {
        slug: "de-ic-characteristics",
        title: "Characteristics of Digital ICs (Fan-In, Fan-Out, Propagation Delay, Power Dissipation, Noise Margin)",
        band: 2, prereqs: ["de-logic-levels"],
      },
      { slug: "de-ttl", title: "Transistor-Transistor Logic (TTL)", band: 3, prereqs: ["de-ic-characteristics"] },
      { slug: "de-cmos", title: "CMOS Logic", band: 3, prereqs: ["de-ic-characteristics"] },
      { slug: "de-ecl", title: "Emitter-Coupled Logic (ECL)", band: 4, prereqs: ["de-ic-characteristics"] },
      {
        slug: "de-output-configurations",
        title: "Open-Collector, Open-Drain, and Tri-State Outputs",
        band: 3, prereqs: ["de-ttl", "de-cmos"],
      },
      {
        slug: "de-family-interfacing",
        title: "Comparison and Interfacing of Logic Families",
        band: 4, prereqs: ["de-ttl", "de-cmos", "de-ecl"],
      },
    ],
  },
  {
    slug: "de-combinational", title: "Combinational Logic Circuits", band: 3,
    children: [
      {
        slug: "de-combinational-design",
        title: "Analysis and Design Procedure",
        band: 3, prereqs: ["de-karnaugh-maps"],
      },
      {
        slug: "de-adders-subtractors",
        title: "Half Adder, Full Adder, Half Subtractor, Full Subtractor",
        band: 3, prereqs: ["de-combinational-design", "de-binary-arithmetic"],
      },
      {
        slug: "de-carry-look-ahead",
        title: "Ripple-Carry and Carry-Look-Ahead Adders",
        band: 4, prereqs: ["de-adders-subtractors"],
      },
      {
        slug: "de-bcd-adder-comparator",
        title: "BCD Adder and Magnitude Comparator",
        band: 4, prereqs: ["de-adders-subtractors", "de-binary-codes"],
      },
      {
        slug: "de-decoders-encoders",
        title: "Decoders and Encoders (Including Priority Encoders)",
        band: 3, prereqs: ["de-combinational-design"],
      },
      {
        slug: "de-multiplexers",
        title: "Multiplexers and Demultiplexers",
        band: 3, prereqs: ["de-combinational-design"],
      },
      {
        slug: "de-function-implementation",
        title: "Function Implementation Using Multiplexers and Decoders",
        band: 4, prereqs: ["de-multiplexers", "de-decoders-encoders"],
      },
      {
        slug: "de-code-converters-parity",
        title: "Code Converters, Parity Generators and Checkers",
        band: 3, prereqs: ["de-combinational-design", "de-error-detection"],
      },
      {
        slug: "de-hazards",
        title: "Static and Dynamic Hazards",
        band: 5, prereqs: ["de-combinational-design", "de-karnaugh-maps"],
      },
    ],
  },
  {
    slug: "de-latches-flip-flops", title: "Latches and Flip-Flops", band: 3,
    children: [
      { slug: "de-latches", title: "SR and Gated Latches", band: 3, prereqs: ["de-logic-gates"] },
      { slug: "de-flip-flops", title: "SR, JK, D, and T Flip-Flops", band: 3, prereqs: ["de-latches"] },
      {
        slug: "de-characteristic-excitation-tables",
        title: "Characteristic Tables, Characteristic Equations, and Excitation Tables",
        band: 4, prereqs: ["de-flip-flops"],
      },
      {
        slug: "de-triggering",
        title: "Level Triggering vs Edge Triggering",
        band: 3, prereqs: ["de-flip-flops"],
      },
      {
        slug: "de-master-slave",
        title: "Master-Slave Configuration and the Race-Around Condition",
        band: 4, prereqs: ["de-triggering"],
      },
      {
        slug: "de-flip-flop-conversion",
        title: "Flip-Flop Conversions",
        band: 4, prereqs: ["de-characteristic-excitation-tables"],
      },
      {
        slug: "de-timing-parameters",
        title: "Timing Parameters (Setup Time, Hold Time, Maximum Clock Frequency)",
        band: 4, prereqs: ["de-triggering"],
      },
    ],
  },
  {
    slug: "de-registers-counters", title: "Registers and Counters", band: 4,
    children: [
      { slug: "de-shift-registers", title: "Shift Registers (SISO, SIPO, PISO, PIPO)", band: 3, prereqs: ["de-flip-flops"] },
      {
        slug: "de-universal-shift-registers",
        title: "Universal and Bidirectional Shift Registers",
        band: 4, prereqs: ["de-shift-registers"],
      },
      {
        slug: "de-ring-johnson-counters",
        title: "Ring and Johnson (Twisted-Ring) Counters",
        band: 4, prereqs: ["de-shift-registers"],
      },
      {
        slug: "de-ripple-counters",
        title: "Asynchronous (Ripple) Counters",
        band: 3, prereqs: ["de-flip-flops"],
      },
      {
        slug: "de-synchronous-counters",
        title: "Synchronous Counters",
        band: 4, prereqs: ["de-ripple-counters", "de-characteristic-excitation-tables"],
      },
      {
        slug: "de-updown-mod-n-counters",
        title: "Up/Down and Modulus-N Counter Design",
        band: 4, prereqs: ["de-synchronous-counters"],
      },
      {
        slug: "de-counter-cascading",
        title: "Cascading of Counters and Frequency Division",
        band: 4, prereqs: ["de-updown-mod-n-counters"],
      },
    ],
  },
  {
    slug: "de-synchronous-sequential", title: "Synchronous Sequential Circuits", band: 4,
    children: [
      { slug: "de-state-diagrams", title: "State Diagrams and State Tables", band: 4, prereqs: ["de-flip-flops"] },
      { slug: "de-mealy-moore", title: "Mealy and Moore Machines", band: 4, prereqs: ["de-state-diagrams"] },
      {
        slug: "de-sequential-analysis",
        title: "Analysis of Clocked Sequential Circuits",
        band: 4, prereqs: ["de-mealy-moore", "de-characteristic-excitation-tables"],
      },
      {
        slug: "de-state-reduction",
        title: "State Reduction and State Assignment",
        band: 5, prereqs: ["de-sequential-analysis"],
      },
      {
        slug: "de-sequence-detectors",
        title: "Design of Sequence Detectors",
        band: 5, prereqs: ["de-state-reduction"],
      },
      {
        slug: "de-arbitrary-sequence-counters",
        title: "Design of Arbitrary-Sequence Counters",
        band: 5, prereqs: ["de-sequential-analysis", "de-synchronous-counters"],
      },
    ],
  },
  {
    slug: "de-asynchronous-sequential", title: "Asynchronous Sequential Circuits", band: 5,
    children: [
      { slug: "de-fundamental-mode", title: "Fundamental-Mode Operation", band: 5, prereqs: ["de-sequential-analysis"] },
      {
        slug: "de-flow-tables",
        title: "Flow Tables and Primitive Flow Tables",
        band: 5, prereqs: ["de-fundamental-mode"],
      },
      {
        slug: "de-races-cycles",
        title: "Races, Critical Races, and Cycles",
        band: 5, prereqs: ["de-flow-tables"],
      },
      {
        slug: "de-async-hazards",
        title: "Hazards in Asynchronous Circuits",
        band: 5, prereqs: ["de-races-cycles", "de-hazards"],
      },
    ],
  },
  {
    slug: "de-memory-pld", title: "Memory and Programmable Logic Devices", band: 4,
    children: [
      { slug: "de-memory-organization", title: "Memory Classification and Organization", band: 3, prereqs: ["de-base-conversion"] },
      {
        slug: "de-rom-types",
        title: "ROM Types (Mask ROM, PROM, EPROM, EEPROM, Flash)",
        band: 3, prereqs: ["de-memory-organization"],
      },
      { slug: "de-ram", title: "RAM (Static vs Dynamic)", band: 3, prereqs: ["de-memory-organization"] },
      {
        slug: "de-memory-expansion",
        title: "Memory Expansion and Address Decoding",
        band: 4, prereqs: ["de-memory-organization", "de-decoders-encoders"],
      },
      {
        slug: "de-pla-pal",
        title: "Programmable Logic Arrays (PLA) and Programmable Array Logic (PAL)",
        band: 4, prereqs: ["de-canonical-forms", "de-rom-types"],
      },
      {
        slug: "de-cpld-fpga",
        title: "CPLD and FPGA Architecture Basics",
        band: 5, prereqs: ["de-pla-pal"],
      },
    ],
  },
  {
    slug: "de-data-conversion", title: "Data Conversion", band: 4,
    children: [
      { slug: "de-sampling-quantization", title: "Sampling, Quantization, and Sample-and-Hold", band: 3 },
      {
        slug: "de-dac-circuits",
        title: "Digital-to-Analog Converters (Weighted-Resistor, R-2R Ladder)",
        band: 4, prereqs: ["de-sampling-quantization"],
      },
      {
        slug: "de-dac-specs",
        title: "DAC Specifications (Resolution, Full-Scale Output, Settling Time)",
        band: 4, prereqs: ["de-dac-circuits"],
      },
      {
        slug: "de-adc-circuits",
        title: "Analog-to-Digital Converters (Flash, Counter-Type, Successive Approximation, Dual-Slope, Sigma-Delta)",
        band: 5, prereqs: ["de-dac-circuits"],
      },
      {
        slug: "de-adc-performance",
        title: "ADC Performance (Resolution, Conversion Time, Quantization Error)",
        band: 5, prereqs: ["de-adc-circuits"],
      },
    ],
  },
  {
    slug: "de-timing-pulse-circuits", title: "Digital Timing and Pulse Circuits", band: 4,
    children: [
      { slug: "de-schmitt-trigger", title: "Schmitt Trigger and Waveform Shaping", band: 3, prereqs: ["de-logic-levels"] },
      {
        slug: "de-multivibrators",
        title: "Monostable and Astable Multivibrators",
        band: 4, prereqs: ["de-schmitt-trigger"],
      },
      { slug: "de-555-timer", title: "The 555 Timer", band: 4, prereqs: ["de-multivibrators"] },
      {
        slug: "de-clock-debouncing",
        title: "Clock Generation and Contact Debouncing",
        band: 4, prereqs: ["de-555-timer", "de-latches"],
      },
    ],
  },
];

const SUBJECTS: SubjectSeed[] = [
  {
    slug: "feedback-control-systems",
    title: "Feedback and Control Systems",
    description:
      "Laplace transforms, system modelling, block diagrams and signal flow graphs, time response, " +
      "stability, steady-state error, root locus, frequency response, and controller design.",
    csv: "seed-questions.csv",
    topics: CONTROL_TOPICS,
  },
  {
    slug: "digital-electronics",
    title: "Digital Electronics",
    description:
      "Number systems and codes, Boolean algebra and minimisation, logic families, combinational and " +
      "sequential circuits, registers and counters, memory and programmable logic, data conversion, " +
      "and digital timing circuits.",
    csv: "seed-questions-digital-electronics.csv",
    topics: DIGITAL_TOPICS,
  },
];

// ---------- Question bank ----------

interface ProblemSeed {
  topic: string; // subtopic slug
  type: "multiple_choice_single" | "numerical_tolerance" | "text_short" | "algebraic_expression" | "true_false";
  level: "recall" | "comprehension" | "application" | "analysis" | "synthesis" | "evaluation";
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

/** Subtopic title exactly as written in a subject's CSV -> subtopic slug. */
function slugsBySubtopicTitle(topics: TopicSeed[]): Map<string, string> {
  return new Map(topics.flatMap((t) => t.children.map((c) => [c.title, c.slug] as [string, string])));
}

const COGNITIVE_LEVELS: ProblemSeed["level"][] = [
  "recall", "comprehension", "application", "analysis", "synthesis", "evaluation",
];

const ANSWER_TYPES: ProblemSeed["type"][] = [
  "multiple_choice_single", "numerical_tolerance", "text_short", "algebraic_expression", "true_false",
];

function parseDifficulty(raw: string): number {
  const d = parseInt(raw, 10);
  if (!Number.isFinite(d) || d < 1 || d > 10) throw new Error(`difficulty must be 1-10, got "${raw}"`);
  return d;
}

/** Rough time budget: numerical work costs more than picking a choice. */
function estimateTime(difficulty: number, type: string): number {
  const base = type === "numerical_tolerance" ? 120 : 60;
  return base + Math.floor((difficulty - 1) / 2) * 45;
}

/**
 * Same answer-data shapes the admin CSV importer builds, so a row behaves
 * identically whether it arrives through the seed or through an upload.
 */
function answerDataFor(row: Record<string, string>, type: ProblemSeed["type"]): Record<string, unknown> {
  const raw = row.correct_answer.trim();
  switch (type) {
    case "multiple_choice_single":
      if (!/^[A-D]$/.test(raw.toUpperCase())) throw new Error(`multiple-choice answer must be A-D, got "${raw}"`);
      return { correct: raw.toUpperCase() };
    case "numerical_tolerance": {
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`numeric answer expected, got "${raw}"`);
      const tol = parseFloat(row.numerical_tolerance);
      return { value, ...(isNaN(tol) ? { toleranceRel: 0.01 } : { toleranceAbs: tol }) };
    }
    case "true_false":
      return { correct: raw.toLowerCase() === "true" };
    default:
      return { accepted: raw.split("|").map((s) => s.trim()).filter(Boolean) };
  }
}

/** Read one subject's question CSV into the problem-seed shape. */
function loadProblemsFromCsv(subject: SubjectSeed): ProblemSeed[] {
  const slugBySubtopicTitle = slugsBySubtopicTitle(subject.topics);
  const text = readFileSync(join(__dirname, subject.csv), "utf8").replace(/^\uFEFF/, "");
  const [header, ...rows] = parseCsv(text);
  const idx = new Map(header.map((h, i) => [h.trim(), i]));
  const need = (name: string) => {
    const i = idx.get(name);
    if (i === undefined) throw new Error(`${subject.csv} is missing the "${name}" column`);
    return i;
  };
  // Fail fast on a header typo rather than silently seeding blank statements.
  for (const c of ["topic", "subtopic", "skill_tags", "difficulty", "cognitive_level", "answer_type",
    "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer",
    "numerical_tolerance", "solution", "explanation", "reference"]) need(c);

  const out: ProblemSeed[] = [];
  rows.forEach((cells, n) => {
    if (cells.every((c) => c.trim() === "")) return;
    const row = Object.fromEntries([...idx].map(([name, i]) => [name, cells[i] ?? ""])) as Record<string, string>;

    try {
      const slug = slugBySubtopicTitle.get(row.subtopic.trim());
      if (!slug) throw new Error(`no curriculum subtopic titled "${row.subtopic}"`);

      const type = row.answer_type.trim() as ProblemSeed["type"];
      if (!ANSWER_TYPES.includes(type)) throw new Error(`unknown answer_type "${type}"`);
      const level = row.cognitive_level.trim() as ProblemSeed["level"];
      if (!COGNITIVE_LEVELS.includes(level)) throw new Error(`unknown cognitive_level "${level}"`);

      const diff = parseDifficulty(row.difficulty);
      const choices = (["a", "b", "c", "d"] as const)
        .map((k) => ({ label: k.toUpperCase(), text: row[`option_${k}`].trim() }))
        .filter((c) => c.text !== "");

      out.push({
        topic: slug,
        type,
        level,
        diff,
        time: estimateTime(diff, type),
        statement: row.question_text.trim(),
        choices: choices.length > 0 ? choices : undefined,
        answer: answerDataFor(row, type),
        tags: row.skill_tags.split(";").map((t) => t.trim()).filter(Boolean),
        solution: row.solution.trim(),
        explanation: row.explanation.trim(),
        reference: row.reference.trim(),
      });
    } catch (e) {
      // n + 2: rows are 0-based here and the file starts with a header row.
      throw new Error(`${subject.csv} line ${n + 2}: ${e instanceof Error ? e.message : e}`);
    }
  });
  return out;
}



// ---------- Gamification catalog ----------
// The catalog lives in src/lib/gamification.ts (the unlock-rule engine) and is
// upserted by code here, so reseeding never wipes earned user progress.

async function upsertGamificationCatalog() {
  for (const b of BADGES) {
    const data = { title: b.title, description: b.description, icon: b.icon };
    await prisma.badge.upsert({ where: { code: b.code }, update: data, create: { code: b.code, ...data } });
  }
  for (const a of ACHIEVEMENTS) {
    const data = {
      title: a.title,
      description: a.description,
      hidden: a.hidden,
      icon: a.icon,
      tier: a.tier,
      imagePath: a.imagePath,
    };
    await prisma.achievement.upsert({ where: { code: a.code }, update: data, create: { code: a.code, ...data } });
  }
  for (const q of QUESTS) {
    const data = {
      title: q.title,
      description: q.description,
      cadence: q.cadence,
      ruleType: q.ruleType,
      ruleParams: JSON.stringify(q.ruleParams),
      xpReward: q.xpReward,
      imagePath: q.imagePath,
    };
    await prisma.quest.upsert({ where: { code: q.code }, update: data, create: { code: q.code, ...data } });
  }
}

/**
 * Create one subject with its topic tree, prerequisites, and question bank.
 * Assumes the subject does not exist yet; callers check first.
 */
async function seedSubject(seed: SubjectSeed, sortOrder: number, authorId: string) {
  const problems = loadProblemsFromCsv(seed);

  const subject = await prisma.subject.create({
    data: { slug: seed.slug, title: seed.title, description: seed.description, sortOrder },
  });

  const topicIdBySlug = new Map<string, string>();
  let sort = 0;
  for (const t of seed.topics) {
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
  for (const t of seed.topics) {
    for (const c of t.children) {
      for (const pre of c.prereqs ?? []) {
        const topicId = topicIdBySlug.get(c.slug)!;
        const requiredTopicId = topicIdBySlug.get(pre);
        if (!requiredTopicId) throw new Error(`${seed.slug}: unknown prerequisite slug "${pre}"`);
        await prisma.topicPrerequisite.create({ data: { topicId, requiredTopicId } });
      }
    }
  }

  // problems
  let count = 0;
  for (const p of problems) {
    const topicId = topicIdBySlug.get(p.topic);
    if (!topicId) throw new Error(`${seed.slug}: unknown topic slug "${p.topic}"`);
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
        authorId,
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

  return { topics: topicIdBySlug.size, problems: count };
}

/** The admin account new problems are attributed to. */
async function ensureAdmin() {
  const existing = await prisma.user.findFirst({ where: { role: "admin" } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      username: "admin",
      email: "admin@ece-mastery.local",
      name: "Admin",
      passwordHash: hashPassword("admin123"),
      role: "admin",
    },
  });
}

async function main() {
  console.log("Seeding ECE Mastery…");

  const seededCount = await prisma.subject.count();
  if (seededCount > 0 && process.env.SEED_RESET !== "1") {
    // Database already seeded: add any subjects that are new to this file and
    // refresh the gamification catalog. Everything else is left untouched.
    const admin = await ensureAdmin();
    let added = 0;
    for (const [i, s] of SUBJECTS.entries()) {
      if (await prisma.subject.findUnique({ where: { slug: s.slug } })) continue;
      const { topics, problems } = await seedSubject(s, i + 1, admin.id);
      console.log(`Added subject "${s.title}": ${topics} topics, ${problems} problems.`);
      added++;
    }
    await upsertGamificationCatalog();
    console.log(
      `${added} new subject(s) added. Catalog refreshed: ${BADGES.length} badges, ${QUESTS.length} quests, ` +
        `${ACHIEVEMENTS.length} achievements. User data preserved. ` +
        "Run with SEED_RESET=1 for a full wipe + reseed."
    );
    return;
  }

  // wipe (full reset: empty database or SEED_RESET=1)
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

  // subjects + topics + problems
  let topicCount = 0;
  let count = 0;
  for (const [i, s] of SUBJECTS.entries()) {
    const result = await seedSubject(s, i + 1, admin.id);
    topicCount += result.topics;
    count += result.problems;
    console.log(`  ${s.title}: ${result.topics} topics, ${result.problems} problems.`);
  }

  // gamification catalog
  await upsertGamificationCatalog();

  console.log(`Seeded ${SUBJECTS.length} subjects, ${topicCount} topics, ${count} problems, ${BADGES.length} badges, ${QUESTS.length} quests, ${ACHIEVEMENTS.length} achievements.`);
  console.log("Accounts: admin/admin123 (admin), learner/learner123 (learner)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
