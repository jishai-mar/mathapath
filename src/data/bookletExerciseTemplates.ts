/**
 * Reichman Mechina Booklet Exercise Templates
 * 
 * COMPREHENSIVE MAPPING of ALL exercise types from the official Reichman Mechina
 * exam preparation booklet. Exercises are sorted by topic and classified by difficulty.
 * 
 * Generated exercises MUST follow these exact patterns, phrasing, and notation.
 */

export interface BookletExerciseExample {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface BookletExerciseTemplate {
  patterns: string[];
  examples: BookletExerciseExample[];
  numberRanges: {
    easy: string;
    medium: string;
    hard: string;
  };
  forbiddenElements: string[];
  allowedOperations: string[];
  instructionPhrasing: string; // Exact phrasing from the booklet
}

/**
 * ===========================================
 * BOOKLET TOPICS - OFFICIAL LIST
 * ===========================================
 * Only these topics appear in the Reichman Mechina booklet:
 * 
 * 1. First-Degree Equations (One Variable)
 * 2. First-Degree Equations (Two Variables)
 * 3. Fractions (Multiply, Divide, Add, Subtract)
 * 4. First-Order Equations with Parameters
 * 5. Quadratic Equations
 * 6. Quadratic Equations with Two Variables
 * 7. Quadratic Equations with Parameters
 * 8. Biquadratic Equations
 * 9. Equations Containing Radicals
 * 10. Equations of Higher Degrees
 * 11. Inequalities (First, Second, Quotients, Higher Degrees)
 * 12. Exponents (Simplification & Comparison)
 * 13. Exponential Equations
 * 14. Logarithms
 * 15. Linear Functions
 * 16. Quadratic Functions (Parabola)
 * 17. Limits
 * 18. Derivatives of Polynomials
 * 19. Using Derivatives
 * 20. Equation of the Tangent Line
 * 21. Graphing Functions
 * 22. Using the Chain Rule
 * 23. Differentiating Rational Functions
 * 24. Graphing Rational Functions
 */

export const BOOKLET_EXERCISE_TEMPLATES: Record<string, BookletExerciseTemplate> = {
  // ==========================================
  // 1. FIRST-DEGREE EQUATIONS (ONE VARIABLE)
  // Page 2 of booklet
  // ==========================================
  "First-Degree Equations - One Variable": {
    instructionPhrasing: "Solve these equations:",
    patterns: [
      "ax + b = c − dx",                    // Basic linear
      "a(x + b) + c(x + d) = e",            // Distributive
      "ax − b(x + c) = d",                  // Subtraction with distribution
      "a[b − c(x + d)] = ex + f",           // Nested brackets
      "x/a + x/b = c",                      // Fraction coefficients
      "√x + √x = a",                        // Simple radical (basic)
    ],
    examples: [
      // EASY: Simple coefficients, positive integer answers
      { question: "Solve for $x$: $7x + 40 = 58 - 2x$", answer: "$x = 2$", difficulty: "easy" },
      { question: "Solve for $x$: $x + 6 = 46 - 7x$", answer: "$x = 5$", difficulty: "easy" },
      { question: "Solve for $x$: $7(x + 2) + 4(x + 6) = 137$", answer: "$x = 9$", difficulty: "easy" },
      { question: "Solve for $x$: $9x - 5(x + 2) = 18$", answer: "$x = 7$", difficulty: "easy" },
      { question: "Solve for $x$: $9x - (5x + 3) = 25$", answer: "$x = 7$", difficulty: "easy" },
      
      // MEDIUM: May have fractions, nested parentheses
      { question: "Solve for $x$: $7(3x + 4) - 8(2x - 7) = 5x + 84$", answer: "Any $x$ (identity)", difficulty: "medium" },
      { question: "Solve for $x$: $9(x + 6) - (x + 8) \\cdot 5 = 30 - (x - 4) \\cdot 6$", answer: "No solution", difficulty: "medium" },
      { question: "Solve for $x$: $\\frac{x}{2} + \\frac{x}{3} = 14$", answer: "$x = \\frac{84}{5}$", difficulty: "medium" },
      { question: "Solve for $x$: $\\frac{x}{3} - \\frac{x}{5} = 1$", answer: "$x = \\frac{15}{2}$", difficulty: "medium" },
      { question: "Solve for $x$: $3x - 4[9 - (x + 8)] = 2x - 54$", answer: "$x = -10$", difficulty: "medium" },
      
      // HARD: Complex nested structures, special cases
      { question: "Solve for $x$: $20 - [3x - 5(6 - x)] = 2x - 10$", answer: "$x = 6$", difficulty: "hard" },
      { question: "Solve for $x$: $8(x - 6) + 11(x + 3) = 19x - 8$", answer: "No solution", difficulty: "hard" },
      { question: "Solve for $x$: $8(x + 5) - 7(x - 2) = 15 - 6(x + 2)$", answer: "$x = -\\frac{37}{7}$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Coefficients 1-10, answers are positive integers 1-20",
      medium: "Coefficients 1-50, answers may be fractions or negative, may include special cases",
      hard: "Nested brackets up to 3 levels, answers may be 'no solution' or 'any number'",
    },
    forbiddenElements: ["word problems", "parameters", "radicals beyond simple √x"],
    allowedOperations: ["addition", "subtraction", "multiplication", "division", "distribution"],
  },

  // ==========================================
  // 2. FIRST-DEGREE EQUATIONS (TWO VARIABLES)
  // Page 3 of booklet
  // ==========================================
  "First-Degree Equations - Two Variables": {
    instructionPhrasing: "Solve these sets of equations:",
    patterns: [
      "{ ax + by = c, dx + ey = f }",
      "{ ax - by = c, dx + ey = f }",
      "{ ax + by = c, x - y = d }",
      "{ x/a + y/b = c, dx + ey = f }",
    ],
    examples: [
      // EASY: Small integer coefficients, integer solutions
      { question: "Solve: $\\begin{cases} 8x + 3y = 28 \\\\ 2x + y = 8 \\end{cases}$", answer: "$x = 2, y = 4$", difficulty: "easy" },
      { question: "Solve: $\\begin{cases} 9x + y = 40 \\\\ x + y = 8 \\end{cases}$", answer: "$x = 4, y = 4$", difficulty: "easy" },
      { question: "Solve: $\\begin{cases} 2x + 9y = 29 \\\\ x + y = 11 \\end{cases}$", answer: "$x = 10, y = 1$", difficulty: "easy" },
      { question: "Solve: $\\begin{cases} 5x + 4y = 36 \\\\ x + y = 8 \\end{cases}$", answer: "$x = 4, y = 4$", difficulty: "easy" },
      
      // MEDIUM: May require elimination, fraction answers possible
      { question: "Solve: $\\begin{cases} 3x + 2y = 22 \\\\ x - y = 6 \\end{cases}$", answer: "$x = 2, y = 8$", difficulty: "medium" },
      { question: "Solve: $\\begin{cases} 7x + 3y = 8 \\\\ 2x + y = 3 \\end{cases}$", answer: "$x = 1, y = 1$", difficulty: "medium" },
      { question: "Solve: $\\begin{cases} 5x + 3y = 36 \\\\ 2x - y = 10 \\end{cases}$", answer: "$x = 6, y = 2$", difficulty: "medium" },
      
      // HARD: Special cases (no solution, dependent equations)
      { question: "Solve: $\\begin{cases} x + 2y = 17 \\\\ 2x + 4y = 30 \\end{cases}$", answer: "No solution", difficulty: "hard" },
      { question: "Solve: $\\begin{cases} 7x + 2y + 5 = 3 \\\\ 14x + 4y = -4 \\end{cases}$", answer: "Infinitely many solutions", difficulty: "hard" },
      { question: "Solve: $\\begin{cases} \\frac{x}{2} + \\frac{y}{3} = 7 \\\\ \\frac{x}{3} + \\frac{y}{2} = 8 \\end{cases}$", answer: "$x = 6, y = 12$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Coefficients 1-10, integer solutions with values 1-20",
      medium: "Coefficients 1-20, may have fraction solutions",
      hard: "Includes special cases, fraction coefficients, solutions up to 100",
    },
    forbiddenElements: ["three variables", "word problems", "graphing", "parameters"],
    allowedOperations: ["substitution", "elimination", "rearrangement"],
  },

  // ==========================================
  // 3. FRACTIONS
  // Pages 4-6 of booklet
  // ==========================================
  "Fractions - Multiplication and Division": {
    instructionPhrasing: "Perform the following operations, and reduce the result (as much as possible):",
    patterns: [
      "(a/b) · (c/d)",
      "(polynomial)/(polynomial) · (polynomial)/(polynomial)",
      "(factored form) · (factored form)",
      "(expression) ÷ (expression)",
    ],
    examples: [
      // EASY: Simple numeric or single-variable fractions
      { question: "Simplify: $\\frac{2a^2}{3} \\cdot \\frac{7}{a}$", answer: "$\\frac{14a}{3}$", difficulty: "easy" },
      { question: "Simplify: $\\frac{4a^5}{6} \\cdot \\frac{2a + 6}{a^3}$", answer: "$\\frac{4a^2(a+3)}{3}$", difficulty: "easy" },
      { question: "Simplify: $\\frac{x^2 + xy}{y} \\cdot \\frac{y}{x}$", answer: "$x + y$", difficulty: "easy" },
      
      // MEDIUM: Factoring required before simplification
      { question: "Simplify: $\\frac{t^2 - 4t}{3t^2 - 24t + 48} \\cdot \\frac{6t^2}{t - 4}$", answer: "$\\frac{2t^2}{(t-4)}$", difficulty: "medium" },
      { question: "Simplify: $\\frac{t^2 - 4t}{t^2 + 8t + 16} \\cdot \\frac{t^2 + 3t - 4}{4t^2}$", answer: "$\\frac{(t-4)(t-1)}{4t(t+4)}$", difficulty: "medium" },
      { question: "Simplify: $\\frac{75 - 3x^2}{x^2 - 3x - 10} \\cdot \\frac{x^2 + x - 2}{2x^2 + 10x}$", answer: "$\\frac{-3(x-1)}{2x}$", difficulty: "medium" },
      
      // HARD: Complex factoring, multiple terms
      { question: "Simplify: $\\frac{m^2 - 9m + 14}{m^2 + 4m - 12} \\cdot \\frac{m^2 - 36}{m^2 - 7m}$", answer: "$\\frac{(m-6)}{m}$", difficulty: "hard" },
      { question: "Simplify: $\\frac{2x^2 - 8}{x^2 - 2x} \\cdot \\frac{x^2 - 49}{x^2 - 5x - 14}$", answer: "$\\frac{2(x+7)}{x}$", difficulty: "hard" },
      { question: "Simplify: $\\frac{2m^2 - 3m - 20}{m^2 - 8m + 16} \\cdot \\frac{-m^2 + 7m - 12}{2m^2 - m - 15}$", answer: "$\\frac{-(m-3)}{(m-4)}$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Simple monomials, single factoring step",
      medium: "Quadratic expressions requiring factoring",
      hard: "Complex polynomials with multiple factoring steps",
    },
    forbiddenElements: ["partial fractions decomposition", "complex fractions within fractions"],
    allowedOperations: ["factoring", "cancellation", "multiplication", "division"],
  },

  "Fractions - Addition and Subtraction": {
    instructionPhrasing: "Perform the following operations, and reduce the results:",
    patterns: [
      "(a/b) + (c/d)",
      "(a/b) - (c/d)",
      "a/(x+b) + c/(x+d)",
      "Complex LCD problems",
    ],
    examples: [
      // EASY: Same denominator or simple LCD
      { question: "Simplify: $\\frac{5a - 3}{6} - \\frac{3a + 1}{6}$", answer: "$\\frac{a - 2}{3}$", difficulty: "easy" },
      { question: "Simplify: $\\frac{1}{x} + \\frac{1}{y} + \\frac{1}{z}$", answer: "$\\frac{xy + xz + yz}{xyz}$", difficulty: "easy" },
      
      // MEDIUM: Different denominators, factoring needed
      { question: "Simplify: $\\frac{a + 1}{a - 1} - \\frac{a + 3}{a + 1}$", answer: "$\\frac{4}{(a-1)(a+1)}$", difficulty: "medium" },
      { question: "Simplify: $\\frac{x - 2}{x + 1} + \\frac{4 - 9x}{x^2 - 1}$", answer: "$\\frac{x - 6}{x + 1}$", difficulty: "medium" },
      { question: "Simplify: $\\frac{2}{x^2 - 7x + 12} + \\frac{x - 3}{x^2 - 4x}$", answer: "$\\frac{x-1}{x(x-4)}$", difficulty: "medium" },
      
      // HARD: Complex expressions with multiple terms
      { question: "Simplify: $\\frac{2}{m - 6} + \\frac{3}{6 - m}$", answer: "$\\frac{-1}{m - 6}$", difficulty: "hard" },
      { question: "Simplify: $\\frac{5}{a - 2} - \\frac{a}{2 - a}$", answer: "$\\frac{5 + a}{a - 2}$", difficulty: "hard" },
      { question: "Simplify: $\\frac{a^2 + 1}{a - 1} - \\frac{2(a - 1)}{a + 1}$", answer: "$\\frac{(a+1)^2}{(a-1)(a+1)}$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Simple fractions, common denominators apparent",
      medium: "Quadratic denominators requiring factoring",
      hard: "Opposite signs in denominators, complex LCD",
    },
    forbiddenElements: ["more than 3 terms in a single problem"],
    allowedOperations: ["finding LCD", "factoring", "combining like terms"],
  },

  // ==========================================
  // 4. FIRST-ORDER EQUATIONS WITH PARAMETERS
  // Pages 7-8 of booklet
  // ==========================================
  "Equations with Parameters - One Variable": {
    instructionPhrasing: "Solve these equations (find x). Write the condition for a unique solution, and find the domain:",
    patterns: [
      "mx = a + b",
      "ax = b(x + c)",
      "ax + bx = c + dx",
      "Parameter in coefficient and constant",
    ],
    examples: [
      // EASY: Single parameter, simple isolation
      { question: "Solve for $x$: $mx = a + b$", answer: "$x = \\frac{a + b}{m}, \\quad m \\neq 0$", difficulty: "easy" },
      { question: "Solve for $x$: $2x = a + 1 + 2m + a$", answer: "$x = \\frac{2a + 2m + 1}{2}$", difficulty: "easy" },
      { question: "Solve for $x$: $ax = b + 2b$", answer: "$x = \\frac{3b}{a}, \\quad a \\neq 0$", difficulty: "easy" },
      
      // MEDIUM: Parameter on both sides
      { question: "Solve for $x$: $4m + 3cx = ax + 3n + 5ax$", answer: "$x = \\frac{3n - 4m}{3c - 6a}, \\quad c \\neq 2a$", difficulty: "medium" },
      { question: "Solve for $x$: $5ax = 3a + 2 + 1 + ax + 3$", answer: "$x = \\frac{3a + 6}{4a}, \\quad a \\neq 0$", difficulty: "medium" },
      { question: "Solve for $x$: $5x = 27a^2 + 75 + 3ax$", answer: "$x = \\frac{27a^2 + 75}{5 - 3a}, \\quad a \\neq \\frac{5}{3}$", difficulty: "medium" },
      
      // HARD: Complex parameter conditions
      { question: "Solve for $x$: $m^2x = x + 1 + 36x + 12m + 36$", answer: "$x = \\frac{12m + 37}{m^2 - 37}, \\quad m \\neq \\pm\\sqrt{37}$", difficulty: "hard" },
      { question: "Solve for $x$: $ax = 4 + 3x + 1 + a + 2 + 1 + x + 5a$", answer: "$x = \\frac{6a + 8}{a - 4}, \\quad a \\neq 4$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Single parameter, direct isolation",
      medium: "Parameter on both sides, simple domain restriction",
      hard: "Quadratic parameter conditions, multiple restrictions",
    },
    forbiddenElements: ["word problems", "graphing"],
    allowedOperations: ["isolation", "factoring", "domain analysis"],
  },

  "Equations with Parameters - Two Variables": {
    instructionPhrasing: "Solve these sets of equations (find x and y). Write the condition for a unique solution, and the domain:",
    patterns: [
      "{ x + y = f(a), x - y = g(a) }",
      "{ ax + by = f(a), cx + dy = g(a) }",
      "{ x + my = f(m), x + ny = g }",
    ],
    examples: [
      { question: "Solve: $\\begin{cases} x + y = 4a \\\\ x - y = 2a \\end{cases}$", answer: "$x = 3a, y = a$", difficulty: "easy" },
      { question: "Solve: $\\begin{cases} 2x + 3y = 7a \\\\ x = y + a \\end{cases}$", answer: "$x = 2a, y = a$", difficulty: "easy" },
      { question: "Solve: $\\begin{cases} 2x + 3y = 5a \\\\ 5x - 2y = 3a + 20 \\end{cases}$", answer: "$x = a + 2, y = a - 5$", difficulty: "medium" },
      { question: "Solve: $\\begin{cases} ax + y = a^2 \\\\ y - 2x = 2 \\end{cases}$", answer: "$x = a - 1, y = a$, condition: $a \\neq 2$", difficulty: "medium" },
      { question: "Solve: $\\begin{cases} x + my = m^2 \\\\ x + 2y = 4 \\end{cases}$", answer: "$x = 2m, y = m + 2$, condition: $m \\neq 2$", difficulty: "hard" },
      { question: "Solve: $\\begin{cases} mx - 9y = m - 12 \\\\ x + my = m \\end{cases}$", answer: "$x = \\frac{m+3}{1}, y = \\frac{m+3}{m+3}$, condition: $m \\neq \\pm 3$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Symmetric systems, simple parameter relationships",
      medium: "Elimination required, single domain restriction",
      hard: "Multiple domain restrictions, complex solutions",
    },
    forbiddenElements: ["three variables", "word problems"],
    allowedOperations: ["substitution", "elimination", "domain analysis"],
  },

  // ==========================================
  // 5. QUADRATIC EQUATIONS
  // Pages 9-10 of booklet
  // ==========================================
  "Quadratic Equations": {
    instructionPhrasing: "Solve these equations: (regard domain restriction)",
    patterns: [
      "ax² - b = 0",
      "ax² + bx = 0",
      "(x - a)² = (bx + c)(x - d) + e",
      "ax² + bx + c = 0",
      "Equation with fractions leading to quadratic",
    ],
    examples: [
      // EASY: Direct solving or simple factoring
      { question: "Solve for $x$: $2x^2 - 72 = 0$", answer: "$x = \\pm 6$", difficulty: "easy" },
      { question: "Solve for $x$: $18x^2 - 50 = 0$", answer: "$x = \\pm \\frac{5}{3}$", difficulty: "easy" },
      { question: "Solve for $x$: $2x(3x - 10) = 0$", answer: "$x = 0$ or $x = \\frac{10}{3}$", difficulty: "easy" },
      { question: "Solve for $x$: $-x^2 + 9x - 8 = 0$", answer: "$x = 1$ or $x = 8$", difficulty: "easy" },
      
      // MEDIUM: Requires formula or completing the square
      { question: "Solve for $x$: $x^2 + 5x - 150 = 0$", answer: "$x = 10$ or $x = -15$", difficulty: "medium" },
      { question: "Solve for $x$: $4x^2 - 62x + 30 = 0$", answer: "$x = 15$ or $x = \\frac{1}{2}$", difficulty: "medium" },
      { question: "Solve for $x$: $5(x^2 - 6x) + 13 = -4(x - 2)$", answer: "$x = 5$ or $x = 1$", difficulty: "medium" },
      { question: "Solve for $x$: $(2x - 5)^2 - (10 - x)^2 = -3(x + 7)^2$", answer: "$x = -3$ or $x = -4$", difficulty: "medium" },
      
      // HARD: No solution, complex manipulation, or fractions
      { question: "Solve for $x$: $2x^2 + 32 = 0$", answer: "No real solution", difficulty: "hard" },
      { question: "Solve for $x$: $-4x^2 - 24 = 0$", answer: "No real solution", difficulty: "hard" },
      { question: "Solve for $x$: $x^2 + 2x + 5 = 0$", answer: "No real solution", difficulty: "hard" },
      { question: "Solve for $x$: $(2x - 6)^2 - 12(5x + 3) = 0$", answer: "$x = 0$ or $x = 21$", difficulty: "hard" },
      { question: "Solve for $x$: $\\frac{x}{x-2} = \\frac{2x - 7}{x - 4}$", answer: "$x = 6$ or $x = -1$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Perfect squares, small integer coefficients, factorable",
      medium: "Requires quadratic formula, integer or simple fraction roots",
      hard: "No real solutions, complex expansion, or fraction equations",
    },
    forbiddenElements: ["complex numbers in answers", "word problems"],
    allowedOperations: ["factoring", "quadratic formula", "completing the square", "expansion"],
  },

  // ==========================================
  // 6. QUADRATIC EQUATIONS WITH TWO VARIABLES
  // Page 11 of booklet
  // ==========================================
  "Quadratic Equations - Two Variables": {
    instructionPhrasing: "Solve these sets of equations:",
    patterns: [
      "{ y = ax² + bx, y = cx + d }",
      "{ ax² + by² = c, x + y = d }",
      "{ xy = a, x + y = b }",
      "{ y² + axy + bx = c, cx + dy = e }",
    ],
    examples: [
      { question: "Solve: $\\begin{cases} y = -x^2 + 5x \\\\ y = x + 3 \\end{cases}$", answer: "$(1, 4)$ and $(3, 6)$", difficulty: "easy" },
      { question: "Solve: $\\begin{cases} 2y^2 + 9x = 5 \\\\ x - y = -7 \\end{cases}$", answer: "$(-3, 4)$", difficulty: "medium" },
      { question: "Solve: $\\begin{cases} 3y^2 + x^2 = 12 \\\\ x = y + 2 \\end{cases}$", answer: "$(0, -2)$ and $(3, 1)$", difficulty: "medium" },
      { question: "Solve: $\\begin{cases} y^2 - 2x^2 + xy = -26 \\\\ x + y = 3 \\end{cases}$", answer: "$(3.5, -0.5)$", difficulty: "medium" },
      { question: "Solve: $\\begin{cases} xy = -80 \\\\ x + y = 11 \\end{cases}$", answer: "$(-5, 16)$ and $(16, -5)$", difficulty: "medium" },
      { question: "Solve: $\\begin{cases} xy = 60 \\\\ (x - 10)(y + 3) = 60 \\end{cases}$", answer: "$(-10, -6)$ and $(15, 4)$", difficulty: "hard" },
      { question: "Solve: $\\begin{cases} (x - 2y)^2 + (y + 5)^2 = 8x + 2 \\\\ y = x - 5 \\end{cases}$", answer: "$(8, 3)$ or $(-5, -10)$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Parabola-line intersection, integer solutions",
      medium: "Substitution into quadratic, may have 1-2 solutions",
      hard: "Product/sum systems, complex substitution",
    },
    forbiddenElements: ["three variables", "word problems"],
    allowedOperations: ["substitution", "expansion", "factoring", "quadratic formula"],
  },

  // ==========================================
  // 7. QUADRATIC EQUATIONS WITH PARAMETERS
  // Page 12 of booklet
  // ==========================================
  "Quadratic Equations - Parameters": {
    instructionPhrasing: "Solve these equations (refer to domain restrictions):",
    patterns: [
      "x² - f(m)x + g(m) = 0",
      "(a - b)x² + cx + d = 0",
      "Parametric coefficient conditions",
    ],
    examples: [
      { question: "Solve for $x$: $x^2 - 4mx + 3m^2 = 0$", answer: "$x = m$ or $x = 3m$", difficulty: "easy" },
      { question: "Solve for $x$: $x^2 - (a - 3)x - 3a = 0$", answer: "$x = -3$ or $x = a$", difficulty: "medium" },
      { question: "Solve for $x$: $x^2 + 3x - a^2 - 5a - 4 = 0$", answer: "$x = -a - 4$ or $x = 1 + a$", difficulty: "medium" },
      { question: "Solve for $x$: $(a - 2)x^2 - 3x - a - 1 = 0$", answer: "$x = \\frac{a-2}{1}$ or $x = -1$, condition: $a \\neq 2$", difficulty: "hard" },
      { question: "Solve for $x$: $mx^2 - 3mx - kx + 3k = 0$", answer: "$x = \\frac{k}{m}$ or $x = 3$, condition: $m \\neq 0$", difficulty: "hard" },
      { question: "Solve for $x$: $a(x - a) + b(x - b) = 2ab - x^2$", answer: "$x = -(a + b)$ or $x = a + b$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Single parameter, factorable",
      medium: "Parameter in discriminant, two solutions in terms of parameter",
      hard: "Parameter affects equation type, domain restrictions needed",
    },
    forbiddenElements: ["word problems", "complex number parameters"],
    allowedOperations: ["factoring", "quadratic formula", "parameter analysis"],
  },

  // ==========================================
  // 8. BIQUADRATIC EQUATIONS
  // Page 13 of booklet
  // ==========================================
  "Biquadratic Equations": {
    instructionPhrasing: "Solve these equations:",
    patterns: [
      "x⁴ - ax² + b = 0",
      "x⁴ - a = 0",
      "(x² - a)² - b(x² - a) + c = 0",
      "x⁶ - ax³ + b = 0",
    ],
    examples: [
      { question: "Solve for $x$: $x^4 - 13x^2 + 36 = 0$", answer: "$x = \\pm 2$ or $x = \\pm 3$", difficulty: "easy" },
      { question: "Solve for $x$: $x^4 - 8x^2 + 16 = 0$", answer: "$x = \\pm 2$", difficulty: "easy" },
      { question: "Solve for $x$: $x^4 - 7x^2 - 18 = 0$", answer: "$x = \\pm 3$", difficulty: "medium" },
      { question: "Solve for $x$: $3x^4 - 8x^2 + 5 = 0$", answer: "$x = \\pm 1$ or $x = \\pm \\sqrt{\\frac{5}{3}}$", difficulty: "medium" },
      { question: "Solve for $x$: $x^4 + 9x^2 + 8 = 0$", answer: "No real solution", difficulty: "medium" },
      { question: "Solve for $x$: $x^6 - 9x^3 + 8 = 0$", answer: "$x = 1$ or $x = 2$", difficulty: "hard" },
      { question: "Solve for $x$: $x^6 - 19x^3 - 216 = 0$", answer: "$x = -2$ or $x = 3$", difficulty: "hard" },
      { question: "Solve for $x$: $(x^2 - 5x)^2 - 2(x^2 - 5x) - 24 = 0$", answer: "$x = 6$ or $x = -1$ or $x = 2$ or $x = 3$", difficulty: "hard" },
      { question: "Solve for $x$: $(2x^2 - 7x)^2 + 2x^2 - 7x = 20$", answer: "$x = 4$ or $x = -\\frac{1}{2}$ or $x = \\frac{5}{2}$ or $x = 1$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Perfect square substitution, integer solutions",
      medium: "Irrational solutions possible, may have no real solution",
      hard: "Sixth degree or nested substitution required",
    },
    forbiddenElements: ["complex roots in final answer"],
    allowedOperations: ["substitution u = x²", "factoring", "quadratic formula"],
  },

  // ==========================================
  // 9. EQUATIONS CONTAINING RADICALS
  // Page 14 of booklet
  // ==========================================
  "Radical Equations": {
    instructionPhrasing: "Solve these equations:",
    patterns: [
      "√(ax + b) = c",
      "√(ax + b) = x + c",
      "√(ax + b) + √(cx + d) = e",
      "a√(bx + c) = x + d",
    ],
    examples: [
      { question: "Solve for $x$: $\\sqrt{9 - x} = 2$", answer: "$x = 5$", difficulty: "easy" },
      { question: "Solve for $x$: $\\sqrt{3x - 5} = x + 11$", answer: "$x = 8$ (verify: extraneous solutions possible)", difficulty: "easy" },
      { question: "Solve for $x$: $\\sqrt{x^2 - 23} = \\sqrt{85 - 2x^2}$", answer: "$x = \\pm 6$", difficulty: "medium" },
      { question: "Solve for $x$: $\\sqrt{3x - 2} = \\sqrt{6 - 5x}$", answer: "$x = 1$", difficulty: "medium" },
      { question: "Solve for $x$: $\\sqrt{x + 4} = 8 - x$", answer: "$x = 5$", difficulty: "medium" },
      { question: "Solve for $x$: $2\\sqrt{5x - 1} = x + 4$", answer: "$x = 2$", difficulty: "medium" },
      { question: "Solve for $x$: $\\sqrt{2x + 1} = \\sqrt{x - 3} + 2$", answer: "$x = 4$ or $x = 12$", difficulty: "hard" },
      { question: "Solve for $x$: $\\sqrt{3x + 1} - \\sqrt{4x + 5} + \\sqrt{x - 4} = 0$", answer: "$x = 5$", difficulty: "hard" },
      { question: "Solve for $x$: $\\sqrt{3x^2 + 9x - 14} - x = 2$", answer: "$x = 2$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Single radical, direct squaring",
      medium: "Two radicals or radical equals linear expression",
      hard: "Three radicals or nested operations",
    },
    forbiddenElements: ["cube roots", "nth roots where n > 2"],
    allowedOperations: ["squaring both sides", "isolation", "verification of solutions"],
  },

  // ==========================================
  // 10. EQUATIONS OF HIGHER DEGREES
  // Page 15 of booklet
  // ==========================================
  "Higher-Degree Equations": {
    instructionPhrasing: "Solve these equations:",
    patterns: [
      "x³ + ax² = 0",
      "x⁵ - ax⁴ = 0",
      "x⁴ - a = 0",
      "ax³ + bx² + cx = 0",
      "x³ + ax² + bx + c = 0 (factorable)",
    ],
    examples: [
      { question: "Solve for $x$: $x^3 + 4x^2 = 0$", answer: "$x = 0$ or $x = -4$", difficulty: "easy" },
      { question: "Solve for $x$: $x^5 - x^4 = 0$", answer: "$x = 0$ or $x = 1$", difficulty: "easy" },
      { question: "Solve for $x$: $x^4 - 81 = 0$", answer: "$x = \\pm 3$", difficulty: "easy" },
      { question: "Solve for $x$: $8x^5 + 8x = 0$", answer: "$x = 0$", difficulty: "easy" },
      { question: "Solve for $x$: $x^3 + 6x^2 + 10x = 0$", answer: "$x = 0$ (quadratic factor has no real roots)", difficulty: "medium" },
      { question: "Solve for $x$: $4x^3 + 12x^2 - 9x = 0$", answer: "$x = 0$ or $x = \\frac{-3 \\pm 3\\sqrt{2}}{2}$", difficulty: "medium" },
      { question: "Solve for $x$: $x^3 - x^2 - x - 20 = 0$", answer: "$x = 4$ (factor theorem)", difficulty: "hard" },
      { question: "Solve for $x$: $x^3 + 4x^2 + x - 12 = 0$", answer: "$x = -3$ or other roots", difficulty: "hard" },
      { question: "Solve for $x$: $3x^3 - 48x + x^2 - 8 = 0$", answer: "Factor and solve", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Common factor extraction, fourth roots",
      medium: "Cubic with one rational root, some irrational",
      hard: "Requires rational root theorem or grouping",
    },
    forbiddenElements: ["Cardano's formula", "complex roots required"],
    allowedOperations: ["factoring", "rational root theorem", "grouping"],
  },

  // ==========================================
  // 11. INEQUALITIES
  // Pages 16-19 of booklet
  // ==========================================
  "Inequalities - First Degree": {
    instructionPhrasing: "Solve these inequalities:",
    patterns: [
      "ax + b < c",
      "ax + b ≤ cx + d",
      "a(bx + c) + d(ex + f) ≥ g",
    ],
    examples: [
      { question: "Solve: $7x - 5 < 3x + 11$", answer: "$x < 4$", difficulty: "easy" },
      { question: "Solve: $16x - 26 < 14 - 4x$", answer: "$x < 2$", difficulty: "easy" },
      { question: "Solve: $-6x < 30$", answer: "$x > -5$", difficulty: "easy" },
      { question: "Solve: $5x - 15 - 2(x - 10) < 3x$", answer: "No solution", difficulty: "medium" },
      { question: "Solve: $4(2x - 10) + 3(5 - x) \\geq 0$", answer: "$x \\geq 5$", difficulty: "medium" },
      { question: "Solve: $(x - 2)^2 - (x + 2)^2 - 20 < -4$", answer: "$x > -2$", difficulty: "hard" },
      { question: "Solve: $x^2 + (x - 2)^2 < 2(2 - x)^2 + 4$", answer: "$x < 2$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Simple linear, positive result",
      medium: "Distribution, may have no solution or all real numbers",
      hard: "Squares that simplify to linear",
    },
    forbiddenElements: ["absolute value", "systems of inequalities"],
    allowedOperations: ["distribution", "combining like terms", "sign change when dividing by negative"],
  },

  "Inequalities - Second Degree": {
    instructionPhrasing: "Solve these inequalities:",
    patterns: [
      "x² > a",
      "ax² + bx + c > 0",
      "(x - a)(x - b) ≤ 0",
      "ax² + bx + c ≤ dx² + ex + f",
    ],
    examples: [
      { question: "Solve: $x^2 > 25$", answer: "$x > 5$ or $x < -5$", difficulty: "easy" },
      { question: "Solve: $x^2 - 36 < 0$", answer: "$-6 < x < 6$", difficulty: "easy" },
      { question: "Solve: $-16x^2 + 9 \\geq 0$", answer: "$-\\frac{3}{4} \\leq x \\leq \\frac{3}{4}$", difficulty: "medium" },
      { question: "Solve: $(x + 1)(x - 3) \\leq 0$", answer: "$-1 \\leq x \\leq 3$", difficulty: "medium" },
      { question: "Solve: $x^2 - 6x - 7 \\geq 0$", answer: "$x \\leq -1$ or $x \\geq 7$", difficulty: "medium" },
      { question: "Solve: $x^2 - 7x + 10 \\leq 0$", answer: "$2 \\leq x \\leq 5$", difficulty: "medium" },
      { question: "Solve: $x^2 - 8x + 16 \\leq 0$", answer: "$x = 4$ only", difficulty: "hard" },
      { question: "Solve: $-x^2 + 5x > 9$", answer: "No solution", difficulty: "hard" },
      { question: "Solve: $x^2 - 6x + 10 > 0$", answer: "All real $x$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Simple quadratic, integer critical points",
      medium: "Factoring or formula needed",
      hard: "Perfect square or no real roots (always/never true)",
    },
    forbiddenElements: ["cubic or higher degree in this section"],
    allowedOperations: ["factoring", "sign chart", "discriminant analysis"],
  },

  "Inequalities - Quotients": {
    instructionPhrasing: "Solve these inequalities:",
    patterns: [
      "(ax + b)/(cx + d) > 0",
      "a/(x - b) > c",
      "(x² + ax + b)/(x² + cx + d) > 0",
    ],
    examples: [
      { question: "Solve: $\\frac{x + 4}{x - 1} > 0$", answer: "$x > 1$ or $x < -4$", difficulty: "easy" },
      { question: "Solve: $\\frac{2x - 1}{x + 3} > 0$", answer: "$x > \\frac{1}{2}$ or $x < -3$", difficulty: "easy" },
      { question: "Solve: $\\frac{1}{x - 2} > 3$", answer: "$2 < x < \\frac{7}{3}$", difficulty: "medium" },
      { question: "Solve: $\\frac{x - 2}{x + 3} > 1$", answer: "$x < -3$", difficulty: "medium" },
      { question: "Solve: $\\frac{1}{x^2 - 5x + 6} > 0$", answer: "$x < 2$ or $x > 3$", difficulty: "medium" },
      { question: "Solve: $\\frac{x^2 - 16}{x^2 + 2x + 1} > 0$", answer: "$x > 4$ or $x < -4$ (and $x \\neq -1$)", difficulty: "hard" },
      { question: "Solve: $\\frac{-x^2 + 7x - 6}{x^2 - 3x + 7} > 0$", answer: "$1 < x < 6$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Linear numerator and denominator",
      medium: "Rearrangement needed, or quadratic factor",
      hard: "Both numerator and denominator quadratic",
    },
    forbiddenElements: ["three or more factors in numerator/denominator"],
    allowedOperations: ["sign chart", "critical points", "domain restrictions"],
  },

  "Inequalities - Higher Degrees": {
    instructionPhrasing: "Solve these inequalities:",
    patterns: [
      "x³ > ax",
      "(x - a)(x - b)(x - c) > 0",
      "x⁴ - ax < 0",
    ],
    examples: [
      { question: "Solve: $x^3 > x$", answer: "$x > 1$ or $-1 < x < 0$", difficulty: "medium" },
      { question: "Solve: $x^3 - 9x \\leq 0$", answer: "$0 \\leq x \\leq 3$ or $x \\leq -3$", difficulty: "medium" },
      { question: "Solve: $x^3 - 5x^2 \\geq 0$", answer: "$x \\geq 5$ or $x = 0$", difficulty: "medium" },
      { question: "Solve: $x^4 - 8x < 0$", answer: "$0 < x < 2$", difficulty: "hard" },
      { question: "Solve: $(x + 2)(x - 1)(x - 4)(x - 6)(x - 10) > 0$", answer: "$x > 10$ or $4 < x < 6$ or $-2 < x < 1$", difficulty: "hard" },
      { question: "Solve: $(x + 1)(x - 2)^2(x - 3)(x - 7) > 0$", answer: "$x > 7$ or $-1 < x < 2$ or $2 < x < 3$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "N/A - all are medium or hard",
      medium: "Cubic, factorable",
      hard: "Fourth degree or higher, multiple factors",
    },
    forbiddenElements: ["complex factoring required"],
    allowedOperations: ["factoring", "sign chart", "root analysis"],
  },

  // ==========================================
  // 12. EXPONENTS
  // Pages 20-23 of booklet
  // ==========================================
  "Exponents - Simplification": {
    instructionPhrasing: "Reduce the following expressions:",
    patterns: [
      "aᵐ / aⁿ",
      "(aᵐ)ⁿ / aᵖ",
      "aᵐ · bⁿ / cᵖ (convertible bases)",
    ],
    examples: [
      { question: "Simplify: $\\frac{3^{75}}{3^{71}}$", answer: "$81$", difficulty: "easy" },
      { question: "Simplify: $\\frac{5^{63}}{5^{61}}$", answer: "$25$", difficulty: "easy" },
      { question: "Simplify: $\\frac{8^{10}}{2^{28}}$", answer: "$4$", difficulty: "medium" },
      { question: "Simplify: $\\frac{9^{50}}{27^{34}}$", answer: "$9^{-2} = \\frac{1}{81}$", difficulty: "medium" },
      { question: "Simplify: $\\frac{32^{15}}{8^{25}}$", answer: "$1$", difficulty: "medium" },
      { question: "Simplify: $\\frac{(27)^{29}}{243^{17}}$", answer: "$27$", difficulty: "hard" },
      { question: "Simplify: $\\frac{25^{15} \\cdot 125^{10}}{5^{58}}$", answer: "$25$", difficulty: "hard" },
      { question: "Simplify: $\\frac{9^{60} \\cdot 8^{40}}{3^{118} \\cdot 4^{60}}$", answer: "$8$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Same base, simple subtraction",
      medium: "Base conversion required (e.g., 8 = 2³)",
      hard: "Multiple bases, complex conversions",
    },
    forbiddenElements: ["logarithms in solution", "irrational bases"],
    allowedOperations: ["exponent laws", "base conversion", "simplification"],
  },

  "Exponents - Comparison": {
    instructionPhrasing: "For each of these pairs, determine which one is greater. Explain:",
    patterns: [
      "aᵐ vs bⁿ (convert to same base or exponent)",
      "(1/a)ᵐ vs (1/b)ⁿ",
    ],
    examples: [
      { question: "Which is greater: $3^{200}$ or $9^{100}$?", answer: "Equal ($9^{100} = 3^{200}$)", difficulty: "easy" },
      { question: "Which is greater: $3^{250}$ or $4^{100}$?", answer: "$3^{250}$", difficulty: "medium" },
      { question: "Which is greater: $2^{60}$ or $5^{30}$?", answer: "$5^{30}$ (since $4^{30} < 5^{30}$)", difficulty: "medium" },
      { question: "Which is greater: $(0.5)^{38}$ or $(0.5)^{40}$?", answer: "$(0.5)^{38}$ (larger exponent means smaller for base < 1)", difficulty: "medium" },
      { question: "Which is greater: $2^{51}$ or $3^{34}$?", answer: "$3^{34}$", difficulty: "hard" },
      { question: "Which is greater: $\\left(\\frac{1}{2}\\right)^{20}$ or $\\left(\\frac{1}{3}\\right)^{15}$?", answer: "$\\left(\\frac{1}{2}\\right)^{20}$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Same base after conversion",
      medium: "Compare using common exponent or base",
      hard: "Requires estimation or taking roots",
    },
    forbiddenElements: ["calculator required", "logarithm solution"],
    allowedOperations: ["base conversion", "exponent manipulation", "estimation"],
  },

  // ==========================================
  // 13. EXPONENTIAL EQUATIONS
  // Pages 24-26 of booklet
  // ==========================================
  "Exponential Equations": {
    instructionPhrasing: "In the following equations, find x, by manipulating both sides to have the same base:",
    patterns: [
      "aˣ = b (where b is power of a)",
      "aˣ = bʸ (convert to same base)",
      "aˣ⁺ⁿ = 1/aᵐ",
      "aˣ · aʸ = aᶻ",
      "aˣ + aˣ⁺¹ = b (factor out)",
      "a·bˣ + c·bˣ = d (combine like terms)",
    ],
    examples: [
      { question: "Solve for $x$: $3^x = 27$", answer: "$x = 3$", difficulty: "easy" },
      { question: "Solve for $x$: $5^x = 125$", answer: "$x = 3$", difficulty: "easy" },
      { question: "Solve for $x$: $27^x = 9$", answer: "$x = \\frac{2}{3}$", difficulty: "easy" },
      { question: "Solve for $x$: $3^x = \\frac{1}{9}$", answer: "$x = -2$", difficulty: "easy" },
      { question: "Solve for $x$: $2^x = \\frac{1}{8}$", answer: "$x = -3$", difficulty: "easy" },
      { question: "Solve for $x$: $4^{27} = 8^x$", answer: "$x = 18$", difficulty: "medium" },
      { question: "Solve for $x$: $9^{6-8x} = 256^{3x}$", answer: "$x = \\frac{3}{11}$", difficulty: "medium" },
      { question: "Solve for $x$: $3^x + 3^{x+1} = 162$", answer: "$x = 4$", difficulty: "medium" },
      { question: "Solve for $x$: $5^{x+2} + 5^{x-2} = 10$", answer: "$x = -1$", difficulty: "medium" },
      { question: "Solve for $x$: $3 \\cdot 6^x + 2 \\cdot 3^x \\cdot 2^x = 1080$", answer: "$x = 3$", difficulty: "hard" },
      { question: "Solve for $x$: $9^x + 9^{x+1} = 270$", answer: "$x = 1.5$", difficulty: "hard" },
      { question: "Solve for $x$: $8^x + 2^{3x+2} = 60$", answer: "$x = \\frac{\\ln 12}{\\ln 8}$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Direct base conversion, integer answer",
      medium: "Fraction exponents, factoring out common term",
      hard: "Substitution u = aˣ leading to quadratic",
    },
    forbiddenElements: ["logarithm notation in answer (for easy/medium)"],
    allowedOperations: ["base conversion", "exponent rules", "factoring", "substitution"],
  },

  // ==========================================
  // 14. LOGARITHMS
  // Pages 27-30 of booklet
  // ==========================================
  "Logarithms": {
    instructionPhrasing: "Calculate these logarithms:",
    patterns: [
      "log_a(b) where b = aⁿ",
      "log_a(b) + log_a(c)",
      "log_a(b) - log_a(c)",
      "log_a(bⁿ)",
    ],
    examples: [
      { question: "Evaluate: $\\log_3 9$", answer: "$2$", difficulty: "easy" },
      { question: "Evaluate: $\\log_7 49$", answer: "$2$", difficulty: "easy" },
      { question: "Evaluate: $\\log_2 16$", answer: "$4$", difficulty: "easy" },
      { question: "Evaluate: $\\log_8 16$", answer: "$\\frac{4}{3}$", difficulty: "medium" },
      { question: "Evaluate: $\\log_{16} 32$", answer: "$\\frac{5}{4}$", difficulty: "medium" },
      { question: "Evaluate: $\\log_9 27$", answer: "$\\frac{3}{2}$", difficulty: "medium" },
      { question: "Evaluate: $\\log_7 1$", answer: "$0$", difficulty: "easy" },
      { question: "Evaluate: $\\log_3 \\frac{1}{27}$", answer: "$-3$", difficulty: "medium" },
      { question: "Evaluate: $\\log_{\\frac{1}{2}} 4$", answer: "$-2$", difficulty: "hard" },
      { question: "Evaluate: $\\log_{\\frac{1}{4}} 32$", answer: "$-\\frac{5}{2}$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Perfect powers, integer result",
      medium: "Fraction result, or negative exponent",
      hard: "Fractional base, complex conversion",
    },
    forbiddenElements: ["natural log ln (use log_e notation if needed)", "calculator required"],
    allowedOperations: ["log definition", "log rules", "base conversion"],
  },

  "Logarithmic Equations": {
    instructionPhrasing: "In the following equations, find x: (use the definition of the logarithm)",
    patterns: [
      "log_a(x) = b",
      "log_x(a) = b",
      "log_a(f(x)) = b",
      "log(ax + b) = c",
    ],
    examples: [
      { question: "Solve for $x$: $\\log_9 x = 1$", answer: "$x = 9$", difficulty: "easy" },
      { question: "Solve for $x$: $\\log_x 4 = 2$", answer: "$x = 2$", difficulty: "easy" },
      { question: "Solve for $x$: $\\log_8 x = \\frac{2}{3}$", answer: "$x = 4$", difficulty: "medium" },
      { question: "Solve for $x$: $\\log_{27} x = \\frac{4}{3}$", answer: "$x = 81$", difficulty: "medium" },
      { question: "Solve for $x$: $\\log(2x + 1) = 2$", answer: "$x = \\frac{99}{2}$", difficulty: "medium" },
      { question: "Solve for $x$: $\\log_4(5x + 3) = 2.5$", answer: "$x = \\frac{32 - 3}{5} = \\frac{29}{5}$", difficulty: "hard" },
      { question: "Solve for $x$: $\\log_{27}(3x + 6) = \\frac{2}{3}$", answer: "$x = 1$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Direct application of definition",
      medium: "Fractional exponent in result",
      hard: "Linear expression inside log",
    },
    forbiddenElements: ["log equations with log on both sides (in easy)"],
    allowedOperations: ["log definition", "exponentiation", "algebraic manipulation"],
  },

  // ==========================================
  // 15. LINEAR FUNCTIONS
  // Pages 31-33 of booklet
  // ==========================================
  "Linear Functions": {
    instructionPhrasing: "Find the linear equation describing the line:",
    patterns: [
      "Line through point with given slope",
      "Line through two points",
      "Line parallel/perpendicular to given line through point",
      "Line through intersection of two lines",
    ],
    examples: [
      { question: "Find the equation of the line through $(2, -7)$ with slope $m = 3$", answer: "$y = 3x - 13$", difficulty: "easy" },
      { question: "Find the equation of the line through $(-3, -5)$ with slope $m = \\frac{5}{8}$", answer: "$8y = 5x + 55$ or $y = \\frac{5}{8}x + \\frac{55}{8}$", difficulty: "easy" },
      { question: "Find the equation of the line through $(8, 11)$ and $(5, 4)$", answer: "$y = \\frac{7}{3}(x - 5) + 4$ or $y = \\frac{7}{3}x - \\frac{23}{3}$", difficulty: "medium" },
      { question: "Find the equation of the line through $(5, 3)$ and $(-7, 3)$", answer: "$y = 3$", difficulty: "medium" },
      { question: "Find the equation of the line through $(-6, -1)$ and $(-6, 1)$", answer: "$x = -6$", difficulty: "medium" },
      { question: "Find the linear equation of the line passing through the origin, parallel to $3y + x = 5$", answer: "$y = -\\frac{1}{3}x$", difficulty: "hard" },
      { question: "Find the line through the intersection of $3x + y = 4$ and $y = x - 2$, parallel to the y-axis", answer: "$x = 1.5$", difficulty: "hard" },
      { question: "Find the line through $(2, 3)$ perpendicular to $x = 5$", answer: "$y = 3$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Integer slope, simple point",
      medium: "Fraction slope, or horizontal/vertical lines",
      hard: "Find intersection first, or perpendicular to vertical/horizontal",
    },
    forbiddenElements: ["parametric equations", "polar form", "three dimensions"],
    allowedOperations: ["point-slope form", "slope formula", "substitution", "perpendicular slope"],
  },

  // ==========================================
  // 16. QUADRATIC FUNCTIONS (PARABOLA)
  // Pages 34-36 of booklet
  // ==========================================
  "Quadratic Functions - Parabola": {
    instructionPhrasing: "For each of the following quadratic functions, find: (a) The axis of symmetry, (b) The vertex, (c) x and y intercepts, (d) The graph, (e) Positivity and Negativity intervals, (f) Increase and decrease intervals.",
    patterns: [
      "f(x) = ax² + bx + c",
      "f(x) = a(x - h)² + k (vertex form)",
      "Combined line and parabola problems",
    ],
    examples: [
      { question: "For $f(x) = x^2 + 8x$, find the vertex", answer: "Vertex: $(-4, -16)$", difficulty: "easy" },
      { question: "For $f(x) = -x^2 + 4x - 3$, find the x-intercepts", answer: "$x = 1$ and $x = 3$", difficulty: "easy" },
      { question: "For $f(x) = 4x^2 - 4x + 1$, find the vertex and axis of symmetry", answer: "Vertex: $(\\frac{1}{2}, 0)$, Axis: $x = \\frac{1}{2}$", difficulty: "medium" },
      { question: "For $f(x) = 2x^2 + 5x$, find positivity and negativity intervals", answer: "Positive: $x < -\\frac{5}{2}$ or $x > 0$; Negative: $-\\frac{5}{2} < x < 0$", difficulty: "medium" },
      { question: "For $y = x^2 + 10x + 16$, find points A, B, C, D where D is the vertex and A is y-intercept, B, C are x-intercepts", answer: "$A(0, 16)$, $B(-2, 0)$, $C(-8, 0)$, $D(-5, -9)$", difficulty: "hard" },
      { question: "For the parabola $y = x^2 - 7x + 6$ and line through the x-intercepts, find the equation of the line", answer: "Line AB: $y = -x + 6$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Integer vertex, simple intercepts",
      medium: "Fraction vertex, requires formula",
      hard: "Combined with line problems, multiple parts",
    },
    forbiddenElements: ["optimization word problems in easy/medium"],
    allowedOperations: ["vertex formula", "completing the square", "factoring", "discriminant"],
  },

  // ==========================================
  // 17. LIMITS
  // Page 37 of booklet
  // ==========================================
  "Limits": {
    instructionPhrasing: "Calculate these limits:",
    patterns: [
      "lim(x→a) polynomial",
      "lim(x→a) (x² - a²)/(x - a)",
      "lim(x→∞) polynomial/polynomial",
      "lim(x→a) with conjugate needed",
    ],
    examples: [
      { question: "Evaluate: $\\lim_{x \\to 2} (4x - 6)$", answer: "$2$", difficulty: "easy" },
      { question: "Evaluate: $\\lim_{x \\to 3} (x^2 - 9)/(x - 3)$", answer: "$6$", difficulty: "easy" },
      { question: "Evaluate: $\\lim_{x \\to 2} (x^2 - 4)/(x - 2)$", answer: "$4$", difficulty: "easy" },
      { question: "Evaluate: $\\lim_{x \\to \\infty} \\frac{3x^2 + 2x}{x^2 - 1}$", answer: "$3$", difficulty: "medium" },
      { question: "Evaluate: $\\lim_{x \\to 0} \\frac{x^2 + 3x}{x}$", answer: "$3$", difficulty: "medium" },
      { question: "Evaluate: $\\lim_{x \\to 4} \\frac{\\sqrt{x} - 2}{x - 4}$", answer: "$\\frac{1}{4}$", difficulty: "hard" },
      { question: "Evaluate: $\\lim_{x \\to 1} \\frac{x^3 - 1}{x - 1}$", answer: "$3$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Direct substitution or simple factoring",
      medium: "Factoring or leading term analysis",
      hard: "Conjugate multiplication or cubic factoring",
    },
    forbiddenElements: ["L'Hôpital's rule explicit use", "epsilon-delta proofs", "trigonometric limits"],
    allowedOperations: ["direct substitution", "factoring", "conjugate multiplication", "leading term analysis"],
  },

  // ==========================================
  // 18. DERIVATIVES OF POLYNOMIALS
  // Page 38 of booklet
  // ==========================================
  "Derivatives - Polynomials": {
    instructionPhrasing: "Differentiate the following functions:",
    patterns: [
      "y = axⁿ",
      "y = polynomial",
      "y = (ax + b)²",
      "y = polynomial with parameters",
    ],
    examples: [
      { question: "Find $f'(x)$ if $f(x) = x^4$", answer: "$f'(x) = 4x^3$", difficulty: "easy" },
      { question: "Find $f'(x)$ if $f(x) = 6x^4$", answer: "$f'(x) = 24x^3$", difficulty: "easy" },
      { question: "Find $f'(x)$ if $f(x) = x^3 + 7x^2 + 10x$", answer: "$f'(x) = 3x^2 + 14x + 10$", difficulty: "easy" },
      { question: "Find $f'(x)$ if $f(x) = 5$", answer: "$f'(x) = 0$", difficulty: "easy" },
      { question: "Find $f'(x)$ if $f(x) = x^3 + 6x^2 + x$", answer: "$f'(x) = 3x^2 + 12x + 1$", difficulty: "medium" },
      { question: "Find $f'(x)$ if $f(x) = 9x^5 + 3x^7 + x^2 + 5$", answer: "$f'(x) = 45x^4 + 21x^6 + 2x$", difficulty: "medium" },
      { question: "Find $f'(x)$ if $f(x) = (3x + 4)^2$", answer: "$f'(x) = 6(3x + 4) = 18x + 24$", difficulty: "medium" },
      { question: "Find $f'(x)$ if $f(x) = (x + 1)^3$", answer: "$f'(x) = 3(x + 1)^2$", difficulty: "hard" },
      { question: "Find $f'(x)$ if $f(x) = a^2x^2 + dx + c$ (a, d, c are constants)", answer: "$f'(x) = 2a^2x + d$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Single term or simple polynomial",
      medium: "Multiple terms, binomial squared",
      hard: "Binomial cubed, parameters",
    },
    forbiddenElements: ["chain rule beyond (ax+b)ⁿ", "product rule", "quotient rule"],
    allowedOperations: ["power rule", "sum rule", "constant multiple rule"],
  },

  // ==========================================
  // 19. USING DERIVATIVES
  // Pages 39-40 of booklet
  // ==========================================
  "Derivatives - Applications": {
    instructionPhrasing: "Calculate the derivative and determine behavior:",
    patterns: [
      "Find f'(a) for specific value",
      "Find slope of tangent at point",
      "Determine increasing/decreasing",
      "Find points where derivative equals given value",
    ],
    examples: [
      { question: "For $y = x^2 + 6x + 7$, find $f'(7)$ and determine if increasing/decreasing", answer: "$f'(7) = 20 > 0$, increasing", difficulty: "easy" },
      { question: "For $y = x^2 + 6x + 7$, find $f'(-3)$ and determine behavior", answer: "$f'(-3) = 0$, neither (critical point)", difficulty: "easy" },
      { question: "For $y = x^3 + 9x^2 + 24x + 1$, find slope at $x = -2$", answer: "Slope $= 0$ (critical point)", difficulty: "medium" },
      { question: "For $y = x^2 - 8x + 7$, find the point where the slope of tangent is $0$", answer: "$(4, -9)$", difficulty: "medium" },
      { question: "For $y = -x^2 + 4x - 3$, find the point where derivative equals $6$", answer: "$(-1, -8)$", difficulty: "medium" },
      { question: "For $f(x) = x^3 - 17x$, find points where tangent is parallel to $y = -5x + 1$", answer: "$(-2, 26)$ and $(2, -26)$", difficulty: "hard" },
      { question: "For $y = x^3 - x^2 - x + 5$, find points where slope of tangent is $1$", answer: "$\\left(\\frac{2}{3}, \\frac{113}{27}\\right)$ and $(-1, 6)$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Direct evaluation at given point",
      medium: "Solve f'(x) = 0 or f'(x) = constant",
      hard: "Find point given slope condition",
    },
    forbiddenElements: ["optimization word problems", "related rates"],
    allowedOperations: ["differentiation", "evaluation", "solving equations"],
  },

  // ==========================================
  // 20. EQUATION OF THE TANGENT LINE
  // Page 41 of booklet
  // ==========================================
  "Tangent Line Equations": {
    instructionPhrasing: "Find the equation of the tangent line:",
    patterns: [
      "Tangent to f(x) at x = a",
      "Tangent to f(x) at point (a, f(a))",
    ],
    examples: [
      { question: "Find the tangent line to $y = x^2$ at $x = 1$", answer: "$y = 2x - 1$", difficulty: "easy" },
      { question: "Find the tangent line to $f(x) = x^3 - 1$ at $(2, 7)$", answer: "$y = 12x - 17$", difficulty: "medium" },
      { question: "Find the tangent line to $y = x^3 - 5x^2 + 8x + 5$ at $(0, 5)$", answer: "$y = 8x + 5$", difficulty: "medium" },
      { question: "Find the tangent line to $y = x^2 - 6x$ at $x = -2$", answer: "$y = -10x - 4$", difficulty: "medium" },
      { question: "Find the tangent line to $y = x^2 - 5x + 17$ at $x = 2$", answer: "$y = -x + 13$", difficulty: "hard" },
      { question: "Find the tangent line to $y = x^3 + 5x^2 + 11x$ at $x = 1$", answer: "$y = 24x - 7$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Simple polynomial, integer slope",
      medium: "Cubic polynomial, point given",
      hard: "Polynomial with negative terms, verify point on curve",
    },
    forbiddenElements: ["implicit differentiation", "parametric curves"],
    allowedOperations: ["differentiation", "point-slope form", "evaluation"],
  },

  // ==========================================
  // 21. GRAPHING FUNCTIONS
  // Pages 42-43 of booklet
  // ==========================================
  "Graphing Polynomial Functions": {
    instructionPhrasing: "Graph these functions by finding: (a) Natural Domain, (b) Extreme points, (c) Intervals of increase/decrease, (d) Intersections with the axes, (e) Draw the graph.",
    patterns: [
      "y = ax² + bx + c",
      "y = x³ + ax² + bx",
      "y = (x - a)(x - b)²",
      "y = ax⁴ + bx²",
    ],
    examples: [
      { question: "Graph $y = x^2 + 8x$: find vertex, intercepts, increase/decrease", answer: "Vertex: $(-4, -16)$, intercepts: $(0,0)$, $(-8,0)$; decreasing $x < -4$, increasing $x > -4$", difficulty: "easy" },
      { question: "Graph $y = -x^2 + 4x - 3$: find vertex, intercepts", answer: "Vertex: $(2, 1)$ max, intercepts: $(1,0)$, $(3,0)$, $(0,-3)$", difficulty: "easy" },
      { question: "Graph $y = x^3 - 6x^2$: find critical points", answer: "Max: $(0,0)$, Min: $(4,-32)$; increasing $x<0$ and $x>4$", difficulty: "medium" },
      { question: "Graph $y = 12x - x^3$: find extreme points", answer: "Max: $(2, 16)$, Min: $(-2, -16)$", difficulty: "medium" },
      { question: "Graph $y = 2x^3 + 12x^2 + 18x$: find critical points and intercepts", answer: "Max: $(-1, 8)$, Min: $(-3, 0)$; intercepts: $(0,0)$, $(-3,0)$", difficulty: "hard" },
      { question: "Graph $y = 2x^4 - 16x^2$: find all critical points", answer: "Max: $(0, 0)$, Min: $(2, -32)$ and $(-2, -32)$", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Quadratic, integer vertex",
      medium: "Cubic with rational critical points",
      hard: "Cubic or quartic with multiple critical points",
    },
    forbiddenElements: ["asymptotes (for polynomials)", "piecewise functions"],
    allowedOperations: ["differentiation", "critical point analysis", "sign chart", "factoring"],
  },

  // ==========================================
  // 22. USING THE CHAIN RULE
  // Page 44 of booklet
  // ==========================================
  "Derivatives - Chain Rule": {
    instructionPhrasing: "Differentiate and simplify as much as possible:",
    patterns: [
      "y = √(ax + b)",
      "y = √(polynomial)",
      "y = (ax + b)ⁿ",
      "y = √u + √v (composite)",
    ],
    examples: [
      { question: "Find $f'(x)$ if $f(x) = \\sqrt{2x + 12}$", answer: "$f'(x) = \\frac{1}{\\sqrt{2x + 12}}$", difficulty: "easy" },
      { question: "Find $f'(x)$ if $f(x) = \\sqrt{2 + x^3}$", answer: "$f'(x) = \\frac{3x^2}{2\\sqrt{2 + x^3}}$", difficulty: "medium" },
      { question: "Find $f'(x)$ if $f(x) = \\sqrt{x^2 + 3x + 7}$", answer: "$f'(x) = \\frac{2x + 3}{2\\sqrt{x^2 + 3x + 7}}$", difficulty: "medium" },
      { question: "Find $f'(x)$ if $f(x) = (3 + 8x^2 + 1)^5$", answer: "$f'(x) = 80x(3 + 8x^2 + 1)^4$", difficulty: "medium" },
      { question: "Find $f'(x)$ if $f(x) = (2 - x)^3$", answer: "$f'(x) = -3(2 - x)^2$", difficulty: "medium" },
      { question: "Find $f'(x)$ if $f(x) = \\sqrt{x^2 + 1} + \\sqrt{x + 2}$", answer: "$f'(x) = \\frac{x}{\\sqrt{x^2+1}} + \\frac{1}{2\\sqrt{x+2}}$", difficulty: "hard" },
      { question: "Find $f'(x)$ if $f(x) = \\sqrt{x + 5} - \\sqrt{6} + \\sqrt{3 + 2x + 4}$", answer: "Apply chain rule to each term", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Single square root of linear expression",
      medium: "Square root of polynomial, or power of linear",
      hard: "Sum of multiple radicals",
    },
    forbiddenElements: ["nested chain rule (3+ compositions)", "implicit differentiation"],
    allowedOperations: ["chain rule", "power rule", "sum rule"],
  },

  // ==========================================
  // 23. DIFFERENTIATING RATIONAL FUNCTIONS
  // Pages 45-46 of booklet
  // ==========================================
  "Derivatives - Rational Functions": {
    instructionPhrasing: "Differentiate and simplify as much as possible. For functions marked by (*), find all critical points:",
    patterns: [
      "y = a/(x + b)",
      "y = (ax + b)/(cx + d)",
      "y = polynomial/polynomial",
      "y = 1/(polynomial)",
    ],
    examples: [
      { question: "Find $f'(x)$ if $f(x) = \\frac{2x}{x + 3}$", answer: "$f'(x) = \\frac{6}{(x+3)^2}$", difficulty: "easy" },
      { question: "Find $f'(x)$ if $f(x) = \\frac{4x}{x - 1}$", answer: "$f'(x) = \\frac{-4}{(x-1)^2}$", difficulty: "easy" },
      { question: "Find $f'(x)$ and critical points if $f(x) = \\frac{5x}{x - 4}$", answer: "$f'(x) = \\frac{-20}{(x-4)^2}$; no critical points (always negative)", difficulty: "medium" },
      { question: "Find $f'(x)$ if $f(x) = \\frac{2x + 4}{4x - 3}$", answer: "$f'(x) = \\frac{-22}{(4x-3)^2}$", difficulty: "medium" },
      { question: "Find $f'(x)$ if $f(x) = \\frac{x - 2}{x^2 - x - 2}$", answer: "Simplify first, then differentiate", difficulty: "hard" },
      { question: "Find $f'(x)$ if $f(x) = \\frac{(3x - 4)^6}{(5x + 1)}$", answer: "Use quotient and chain rule", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "Simple quotient, linear/linear",
      medium: "Quotient rule application, find critical points",
      hard: "Chain rule combined with quotient rule",
    },
    forbiddenElements: ["partial fractions before differentiation"],
    allowedOperations: ["quotient rule", "chain rule", "simplification", "critical point analysis"],
  },

  // ==========================================
  // 24. GRAPHING RATIONAL FUNCTIONS
  // Pages 47-50 of booklet
  // ==========================================
  "Graphing Rational Functions": {
    instructionPhrasing: "Graph these functions by finding: (a) Natural Domain, (b) Extreme points, (c) Intervals of increase/decrease, (d) Intersections with the axes, (e) Asymptotes, (f) Draw the graph.",
    patterns: [
      "y = ax/(x² + b)",
      "y = (x² + a)/(x² + b)",
      "y = polynomial/(x - a)",
      "y = x²/(x² - a)",
    ],
    examples: [
      { question: "Graph $y = \\frac{2x}{x^2 - 8}$: find domain, asymptotes, intercepts", answer: "Domain: $x \\neq \\pm\\sqrt{8}$; Asymptotes: $x = \\pm\\sqrt{8}$, $y = 0$; Intercept: $(0,0)$", difficulty: "medium" },
      { question: "Graph $y = \\frac{x^2 - 1}{x^2 - 8}$: find extreme points", answer: "Max: $(4, 1)$, Min: $(-2, 1)$", difficulty: "medium" },
      { question: "Graph $y = \\frac{x^2}{10x - 10}$: find asymptotes and behavior", answer: "Vertical asymptote: $x = 1$; Slant asymptote exists", difficulty: "hard" },
      { question: "Graph $y = \\frac{4x - 1}{x^2 - 2x}$: find all asymptotes", answer: "Vertical: $x = 0$, $x = 2$; Horizontal: $y = 0$", difficulty: "hard" },
      { question: "Graph $y = \\frac{x^2 - 2x}{4}$ and $y = \\frac{x^2 - 24x}{3}$", answer: "Compare the parabolic shapes", difficulty: "hard" },
    ],
    numberRanges: {
      easy: "N/A - all are medium or hard for rational functions",
      medium: "Simple rational, clear asymptotes",
      hard: "Multiple vertical asymptotes, oblique asymptote possible",
    },
    forbiddenElements: ["piecewise definitions", "complex analysis"],
    allowedOperations: ["domain analysis", "asymptote finding", "differentiation", "critical point analysis"],
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
    "Optimization word problems",
    "Related rates",
    "Implicit differentiation (except basic chain rule)",
  ],
  
  notationElements: [
    "θ (theta) as variable",
    "α (alpha), β (beta) as variables (except in parameters)",
    "π in answers (except area formulas)",
    "sin, cos, tan in any form",
    "arcsin, arccos, arctan",
    "[0, 2π) interval notation",
    "Degrees symbol °",
    "∞ in answers (only in limit notation for x→∞)",
    "ε (epsilon), δ (delta) for proofs",
    "∑ (summation)",
    "∫ (integral)",
    "∂ (partial derivative)",
    "i (imaginary unit)",
  ],
  
  questionTypes: [
    "Word problems (story problems)",
    "Real-world applications",
    "Proof-based questions",
    "Multiple choice",
    "True/False",
    "Calculator-dependent problems",
    "Graphing with technology",
  ],
};

/**
 * ALLOWED TOPICS - COMPLETE LIST
 * Only these 24 topic categories should appear in the app
 */
export const ALLOWED_BOOKLET_TOPICS = [
  "First-Degree Equations - One Variable",
  "First-Degree Equations - Two Variables",
  "Fractions - Multiplication and Division",
  "Fractions - Addition and Subtraction",
  "Equations with Parameters - One Variable",
  "Equations with Parameters - Two Variables",
  "Quadratic Equations",
  "Quadratic Equations - Two Variables",
  "Quadratic Equations - Parameters",
  "Biquadratic Equations",
  "Radical Equations",
  "Higher-Degree Equations",
  "Inequalities - First Degree",
  "Inequalities - Second Degree",
  "Inequalities - Quotients",
  "Inequalities - Higher Degrees",
  "Exponents - Simplification",
  "Exponents - Comparison",
  "Exponential Equations",
  "Logarithms",
  "Logarithmic Equations",
  "Linear Functions",
  "Quadratic Functions - Parabola",
  "Limits",
  "Derivatives - Polynomials",
  "Derivatives - Applications",
  "Tangent Line Equations",
  "Graphing Polynomial Functions",
  "Derivatives - Chain Rule",
  "Derivatives - Rational Functions",
  "Graphing Rational Functions",
];

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
  
  // Try matching by key components
  const keyWords = normalizedName.split(/[\s-]+/).filter(w => w.length > 3);
  for (const [key, template] of Object.entries(BOOKLET_EXERCISE_TEMPLATES)) {
    const templateKeyWords = key.toLowerCase().split(/[\s-]+/);
    const matchCount = keyWords.filter(kw => 
      templateKeyWords.some(tkw => tkw.includes(kw) || kw.includes(tkw))
    ).length;
    if (matchCount >= 2 || (keyWords.length === 1 && matchCount === 1)) {
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

/**
 * Get examples by difficulty for a topic
 */
export function getExamplesByDifficulty(
  topicName: string, 
  difficulty: 'easy' | 'medium' | 'hard'
): BookletExerciseExample[] {
  const template = getBookletTemplate(topicName);
  if (!template) return [];
  return template.examples.filter(ex => ex.difficulty === difficulty);
}

/**
 * Get all examples for a topic
 */
export function getAllExamples(topicName: string): BookletExerciseExample[] {
  const template = getBookletTemplate(topicName);
  if (!template) return [];
  return template.examples;
}

/**
 * Get instruction phrasing for a topic
 */
export function getInstructionPhrasing(topicName: string): string {
  const template = getBookletTemplate(topicName);
  return template?.instructionPhrasing || "Solve:";
}
