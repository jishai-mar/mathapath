/**
 * Reichman Mechina Booklet Exercise Templates
 * 
 * These templates define the EXACT style, patterns, and formats from the official
 * Reichman Mechina exam preparation booklet. All generated exercises MUST follow
 * these patterns precisely.
 */

export interface BookletExerciseTemplate {
  patterns: string[];
  examples: { question: string; answer: string }[];
  numberRanges: {
    easy: string;
    medium: string;
    hard: string;
  };
  forbiddenElements: string[];
  allowedOperations: string[];
}

/**
 * BOOKLET TOPIC CONFIGURATION
 * Maps database topic names to booklet-style exercise patterns
 */
export const BOOKLET_EXERCISE_TEMPLATES: Record<string, BookletExerciseTemplate> = {
  // ==========================================
  // FIRST-DEGREE EQUATIONS (ONE VARIABLE)
  // ==========================================
  "First-Degree Equations": {
    patterns: [
      "ax + b = c − dx",           // 7x + 40 = 58 − 2x
      "a(x + b) + c(x + d) = e",   // 7(x + 2) + 4(x + 6) = 137
      "ax − b(x + c) = d",         // 9x − 5(x + 2) = 18
      "(ax − b)/c = dx + e",       // Fractions with x
      "ax/b + cx/d = e",           // Multiple fraction terms
    ],
    examples: [
      { question: "Solve for x: 7x + 40 = 58 − 2x", answer: "2" },
      { question: "Solve for x: x + 6 = 46 − 7x", answer: "5" },
      { question: "Solve for x: 7(x + 2) + 4(x + 6) = 137", answer: "9" },
      { question: "Solve for x: 9x − 5(x + 2) = 18", answer: "7" },
      { question: "Solve for x: 4(x − 3) − 2(x + 5) = 6", answer: "14" },
    ],
    numberRanges: {
      easy: "Coefficients 1-10, answers are positive integers 1-20",
      medium: "Coefficients 1-50, answers may be fractions or negative",
      hard: "Coefficients up to 100, nested parentheses, fraction answers",
    },
    forbiddenElements: ["word problems", "systems of equations", "parameters"],
    allowedOperations: ["addition", "subtraction", "multiplication", "division", "distribution"],
  },

  // ==========================================
  // FIRST-DEGREE EQUATIONS (TWO VARIABLES)
  // ==========================================
  "Linear Equations": {
    patterns: [
      "{ ax + by = c, dx + ey = f }",     // System of 2 equations
      "{ ax − by = c, dx + ey = f }",     // Mixed signs
      "{ ax = b − cy, dx + ey = f }",     // Rearranged form
    ],
    examples: [
      { question: "Solve: { 2x + 3y = 12, x − y = 1 }", answer: "x = 3, y = 2" },
      { question: "Solve: { 3x + 2y = 7, x − y = 1 }", answer: "x = 9/5, y = 4/5" },
      { question: "Solve: { 5x − 2y = 11, 3x + 4y = 7 }", answer: "x = 3, y = 2" },
    ],
    numberRanges: {
      easy: "Small coefficients 1-5, integer solutions",
      medium: "Coefficients 1-10, may have fraction solutions",
      hard: "Coefficients up to 20, require elimination strategy",
    },
    forbiddenElements: ["three variables", "word problems", "graphing"],
    allowedOperations: ["substitution", "elimination", "rearrangement"],
  },

  // ==========================================
  // QUADRATIC EQUATIONS
  // ==========================================
  "Quadratic Equations": {
    patterns: [
      "ax² − b = 0",                      // 2x² − 72 = 0
      "ax² + bx = 0",                     // Factor out x
      "x² + ax + b = 0",                  // Standard factoring
      "(x − a)² = (bx + c)(x − d) + e",   // Expand and solve
      "ax² + bx − c = 0",                 // Use formula
    ],
    examples: [
      { question: "Solve for x: 2x² − 72 = 0", answer: "±6" },
      { question: "Solve for x: 18x² − 50 = 0", answer: "±5/3" },
      { question: "Solve for x: x² + 5x − 150 = 0", answer: "10, −15" },
      { question: "Solve for x: (x − 7)² = (3x + 4)(x − 6) + 1", answer: "use expansion" },
      { question: "Solve for x: 3x² − 7x + 2 = 0", answer: "2, 1/3" },
    ],
    numberRanges: {
      easy: "Perfect squares, integer roots",
      medium: "Factoring with integers, may use formula",
      hard: "Requires formula, may have irrational roots",
    },
    forbiddenElements: ["complex numbers", "word problems in easy/medium"],
    allowedOperations: ["factoring", "quadratic formula", "completing square", "expansion"],
  },

  // ==========================================
  // BIQUADRATIC AND HIGHER DEGREE
  // ==========================================
  "Higher-Degree Equations": {
    patterns: [
      "x⁴ − ax² + b = 0",                 // Substitute u = x²
      "x⁴ − a = 0",                       // Fourth roots
      "(x² − a)² − b = 0",                // Nested square
      "x³ − ax² − bx + c = 0",            // Cubic with rational root
    ],
    examples: [
      { question: "Solve for x: x⁴ − 13x² + 36 = 0", answer: "±2, ±3" },
      { question: "Solve for x: x⁴ − 81 = 0", answer: "±3" },
      { question: "Solve for x: x⁴ − 5x² + 4 = 0", answer: "±1, ±2" },
    ],
    numberRanges: {
      easy: "Perfect fourth powers",
      medium: "Biquadratic with integer substitution",
      hard: "Requires careful substitution, multiple roots",
    },
    forbiddenElements: ["complex roots required", "irrational coefficients"],
    allowedOperations: ["substitution u = x²", "factoring", "root extraction"],
  },

  // ==========================================
  // EQUATIONS WITH FRACTIONS
  // ==========================================
  "Fractions & Algebraic Expressions": {
    patterns: [
      "(ax + b)/(cx + d) = e/f",          // Cross multiply
      "a/x + b/x = c",                    // Common denominator
      "(x + a)/(x − b) = c",              // Single fraction
      "a/(x + b) + c/(x + d) = e",        // Add rational expressions
    ],
    examples: [
      { question: "Solve for x: (2x + 1)/(x − 3) = 5/2", answer: "−17" },
      { question: "Solve for x: 3/x + 2/x = 5", answer: "1" },
      { question: "Solve for x: (x + 4)/(x − 2) = 3", answer: "5" },
    ],
    numberRanges: {
      easy: "Simple fractions, single variable denominator",
      medium: "Linear expressions in denominators",
      hard: "Multiple terms, complex LCD",
    },
    forbiddenElements: ["partial fractions decomposition"],
    allowedOperations: ["cross multiplication", "LCD", "domain restrictions"],
  },

  // ==========================================
  // EQUATIONS WITH RADICALS
  // ==========================================
  "Radical Equations": {
    patterns: [
      "√(ax + b) = c",                    // Direct squaring
      "√(ax + b) = √(cx + d)",            // Equal radicals
      "√(ax + b) + c = x",                // Radical with linear
      "√(x + a) − √(x − b) = c",          // Two radicals
    ],
    examples: [
      { question: "Solve for x: √(2x + 3) = 5", answer: "11" },
      { question: "Solve for x: √(x + 5) = √(2x − 1)", answer: "6" },
      { question: "Solve for x: √(x + 7) = x − 5", answer: "9" },
    ],
    numberRanges: {
      easy: "Single radical, perfect square result",
      medium: "May have extraneous solution",
      hard: "Multiple radicals, requires verification",
    },
    forbiddenElements: ["cube roots", "nth roots > 2"],
    allowedOperations: ["squaring", "isolation", "verification"],
  },

  // ==========================================
  // EXPONENTS
  // ==========================================
  "Exponents & Exponential Equations": {
    patterns: [
      "$a^x = b$ (where b is power of a)",
      "$a^x \\cdot a^y = a^z$",
      "$(a^m)^n = c$",
      "Simplify: $a^m \\cdot b^n / c^p$",
      "$a^{x+c} = \\frac{1}{a^n}$ (negative exponent)",
    ],
    examples: [
      { question: "Solve for x: $2^x = 32$", answer: "5" },
      { question: "Solve for x: $3^{x+1} = 81$", answer: "3" },
      { question: "Simplify: $(2^3)^4 \\cdot 2^2 / 2^5$", answer: "$2^9$ or 512" },
      { question: "Solve for x: $4^x = 8$", answer: "3/2" },
      { question: "Solve for x: $5^{x+2} = \\frac{1}{25}$", answer: "-4" },
    ],
    numberRanges: {
      easy: "Same base, small exponents",
      medium: "Convertible bases ($4 = 2^2$, $8 = 2^3$)",
      hard: "Requires logarithm insight or complex rules",
    },
    forbiddenElements: ["logarithms in solution (for easy)", "irrational exponents"],
    allowedOperations: ["exponent rules", "base conversion", "simplification"],
  },

  // ==========================================
  // LOGARITHMS
  // ==========================================
  "Logarithms & Logarithmic Equations": {
    patterns: [
      "$\\log_a(x) = b$",
      "$\\log_a(x) + \\log_a(y) = c$",
      "$\\log_a(x) - \\log_a(y) = c$",
      "$\\log_a(x^n) = c$",
      "$\\log(x) = a$ (base 10)",
    ],
    examples: [
      { question: "Evaluate: $\\log_2(64)$", answer: "6" },
      { question: "Solve for x: $\\log_3(x) = 4$", answer: "81" },
      { question: "Simplify: $\\log_2(8) + \\log_2(4)$", answer: "5" },
      { question: "Solve for x: $\\log(x) + \\log(x - 3) = 1$", answer: "5" },
    ],
    numberRanges: {
      easy: "Perfect powers, direct evaluation",
      medium: "Log rules application",
      hard: "Equations with multiple log terms",
    },
    forbiddenElements: ["natural log ln (use $\\log_e$ notation)", "complex domain analysis"],
    allowedOperations: ["log rules", "exponentiation", "domain checking"],
  },

  // ==========================================
  // INEQUALITIES
  // ==========================================
  "Inequalities": {
    patterns: [
      "ax + b < c",                       // Linear
      "ax + b ≤ cx + d",                  // Two-sided linear
      "ax² + bx + c > 0",                 // Quadratic
      "(x − a)(x − b) ≤ 0",               // Factored quadratic
      "(ax + b)/(cx + d) > 0",            // Rational
    ],
    examples: [
      { question: "Solve: 2x + 5 < 13", answer: "x < 4" },
      { question: "Solve: x² − 5x + 6 > 0", answer: "x < 2 or x > 3" },
      { question: "Solve: (x − 2)(x + 3) ≤ 0", answer: "−3 ≤ x ≤ 2" },
      { question: "Solve: (x + 1)/(x − 2) > 0", answer: "x < −1 or x > 2" },
    ],
    numberRanges: {
      easy: "Linear, positive coefficients",
      medium: "Quadratic or simple rational",
      hard: "Complex rational, compound inequalities",
    },
    forbiddenElements: ["absolute value inequalities (advanced)", "systems of inequalities"],
    allowedOperations: ["sign analysis", "factoring", "interval testing"],
  },

  // ==========================================
  // LIMITS (COMPUTATIONAL)
  // ==========================================
  "Limits": {
    patterns: [
      "lim(x→a) f(x) direct substitution",
      "lim(x→a) (x² − a²)/(x − a)",       // Factor and cancel
      "lim(x→∞) polynomial/polynomial",    // Leading terms
      "lim(x→0) (√(x+a) − √a)/x",         // Conjugate
    ],
    examples: [
      { question: "Evaluate: lim(x→2) (x² − 4)/(x − 2)", answer: "4" },
      { question: "Evaluate: lim(x→∞) (3x² + 2x)/(x² − 1)", answer: "3" },
      { question: "Evaluate: lim(x→0) (x² + 3x)/x", answer: "3" },
      { question: "Evaluate: lim(x→4) (√x − 2)/(x − 4)", answer: "1/4" },
    ],
    numberRanges: {
      easy: "Direct substitution works",
      medium: "Factoring or conjugate needed",
      hard: "Complex indeterminate forms",
    },
    forbiddenElements: ["L'Hôpital's rule explicit mention", "epsilon-delta proofs"],
    allowedOperations: ["factoring", "conjugate multiplication", "leading term analysis"],
  },

  // ==========================================
  // DERIVATIVES (BASIC)
  // ==========================================
  "Derivatives & Applications": {
    patterns: [
      "Find f'(x) for f(x) = axⁿ",         // Power rule
      "Find f'(x) for f(x) = polynomial",  // Sum rule
      "Find f'(x) for f(x) = √x",          // Fractional power
      "Find f'(a) for specific point",     // Evaluate derivative
    ],
    examples: [
      { question: "Find f'(x) if f(x) = x³ + 6x² + x", answer: "3x² + 12x + 1" },
      { question: "Find f'(x) if f(x) = 5x⁴ − 2x² + 7", answer: "20x³ − 4x" },
      { question: "Find f'(x) if f(x) = √x", answer: "1/(2√x)" },
      { question: "Find f'(2) if f(x) = x² − 3x + 1", answer: "1" },
    ],
    numberRanges: {
      easy: "Single power terms, small exponents",
      medium: "Polynomials, fractional powers",
      hard: "Complex expressions, specific point evaluation",
    },
    forbiddenElements: ["chain rule in easy", "implicit differentiation in easy/medium"],
    allowedOperations: ["power rule", "sum/difference rule", "constant multiple"],
  },

  // ==========================================
  // LINEAR FUNCTIONS
  // ==========================================
  "Linear Functions & Lines": {
    patterns: [
      "Find equation through (a,b) with slope m",
      "Find slope between (x₁,y₁) and (x₂,y₂)",
      "Find intersection of y = mx + b and y = nx + c",
      "Find parallel/perpendicular line through point",
    ],
    examples: [
      { question: "Find the equation of the line through (2, 3) with slope 4", answer: "y = 4x − 5" },
      { question: "Find the slope of the line through (1, 2) and (4, 8)", answer: "2" },
      { question: "Find the intersection: y = 2x + 1 and y = −x + 7", answer: "(2, 5)" },
    ],
    numberRanges: {
      easy: "Integer slopes, simple intercepts",
      medium: "Fraction slopes, parallel/perpendicular",
      hard: "Multiple conditions, distance/midpoint",
    },
    forbiddenElements: ["parametric equations", "polar form"],
    allowedOperations: ["point-slope form", "slope formula", "substitution"],
  },

  // ==========================================
  // QUADRATIC FUNCTIONS (PARABOLAS)
  // ==========================================
  "Quadratic Functions & Parabolas": {
    patterns: [
      "Find vertex of y = ax² + bx + c",
      "Find x-intercepts of parabola",
      "Convert standard to vertex form",
      "Find axis of symmetry",
    ],
    examples: [
      { question: "Find the vertex of y = x² − 6x + 5", answer: "(3, −4)" },
      { question: "Find the x-intercepts of y = x² − 5x + 6", answer: "x = 2, x = 3" },
      { question: "Write in vertex form: y = x² + 4x + 7", answer: "y = (x + 2)² + 3" },
    ],
    numberRanges: {
      easy: "Vertex at integer point",
      medium: "Completing the square needed",
      hard: "Multiple questions about same parabola",
    },
    forbiddenElements: ["optimization word problems in easy"],
    allowedOperations: ["vertex formula", "completing square", "factoring"],
  },
};

/**
 * FORBIDDEN CONTENT - NEVER GENERATE
 * These topics/elements are NOT in the Reichman Mechina booklet
 */
export const FORBIDDEN_CONTENT = {
  topics: [
    "Trigonometry (sin, cos, tan, cot, sec, csc)",
    "Trigonometric equations",
    "Inverse trigonometric functions",
    "Radian measure with π",
    "Unit circle",
    "Epsilon-delta proofs",
    "Formal limit definitions",
    "L'Hôpital's rule (explicit)",
    "Integration",
    "Matrices",
    "Complex numbers (i)",
    "Vectors",
    "Sequences and series",
    "Probability",
    "Statistics",
  ],
  
  notationElements: [
    "θ (theta) as variable",
    "α (alpha), β (beta) as variables",
    "π in answers (except area formulas)",
    "sin, cos, tan in any form",
    "arcsin, arccos, arctan",
    "[0, 2π) interval notation",
    "Degrees symbol °",
    "∞ in answers (only in limit notation)",
    "ε (epsilon), δ (delta) for proofs",
    "∑ (summation)",
    "∫ (integral)",
    "∂ (partial derivative)",
  ],
  
  questionTypes: [
    "Word problems (story problems)",
    "Real-world applications",
    "Proof-based questions",
    "Multiple choice",
    "True/False",
    "Graphing by hand",
    "Calculator-dependent problems",
  ],
};

/**
 * Get exercise template for a topic
 */
export function getBookletTemplate(topicName: string): BookletExerciseTemplate | undefined {
  // Try exact match first
  if (BOOKLET_EXERCISE_TEMPLATES[topicName]) {
    return BOOKLET_EXERCISE_TEMPLATES[topicName];
  }
  
  // Try partial match
  const normalizedName = topicName.toLowerCase();
  for (const [key, template] of Object.entries(BOOKLET_EXERCISE_TEMPLATES)) {
    if (key.toLowerCase().includes(normalizedName) || 
        normalizedName.includes(key.toLowerCase())) {
      return template;
    }
  }
  
  return undefined;
}

/**
 * Check if a topic is allowed in the booklet
 */
export function isBookletTopic(topicName: string): boolean {
  const forbidden = FORBIDDEN_CONTENT.topics.some(
    t => topicName.toLowerCase().includes(t.toLowerCase().split(' ')[0])
  );
  return !forbidden;
}
