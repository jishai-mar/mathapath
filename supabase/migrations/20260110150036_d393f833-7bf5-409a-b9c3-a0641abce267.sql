-- Insert topic-overview blocks for all topics (except Fractions which already has one)
-- Each block follows the same structure as the Fractions Complete Theory page

-- First-Degree Equations (11111111-1111-1111-1111-111111111101)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111101',
  'topic-overview',
  'O1',
  'First-Degree Equations — Complete Guide',
  0,
  '{
    "introduction": "A first-degree equation (also called a linear equation) is an equation where the variable appears only to the first power. Solving these equations is one of the most fundamental skills in algebra. You will use linear equations in nearly every area of mathematics.",
    "sections": [
      {
        "heading": "One Variable Equations",
        "content": [
          "A first-degree equation in one variable has the form ax + b = c, where x is the unknown and a, b, c are constants. The goal is to isolate x on one side of the equation.",
          "To solve, perform inverse operations: what is added, subtract; what is multiplied, divide. Always perform the same operation on both sides to keep the equation balanced."
        ],
        "rules": [
          "**Rule:** If ax + b = c, then x = (c - b) / a, provided a ≠ 0."
        ],
        "examples": [
          {
            "problem": "Solve: 3x + 7 = 22",
            "steps": [
              "Subtract 7 from both sides: 3x = 22 - 7 = 15",
              "Divide both sides by 3: x = 15 / 3 = 5"
            ],
            "result": "x = 5"
          },
          {
            "problem": "Solve: 5x - 12 = 3x + 8",
            "steps": [
              "Subtract 3x from both sides: 2x - 12 = 8",
              "Add 12 to both sides: 2x = 20",
              "Divide by 2: x = 10"
            ],
            "result": "x = 10"
          }
        ],
        "mistakes": [
          {
            "mistake": "Forgetting to perform the same operation on both sides",
            "why": "An equation is like a balance scale. Whatever you do to one side, you must do to the other to maintain equality."
          }
        ]
      },
      {
        "heading": "Two Variable Systems",
        "content": [
          "A system of two linear equations in two variables consists of two equations that must be satisfied simultaneously. The solution is an ordered pair (x, y) that makes both equations true.",
          "There are two main methods: Substitution (solve one equation for a variable and substitute into the other) and Elimination (add or subtract equations to eliminate a variable)."
        ],
        "rules": [
          "**Rule:** A system has exactly one solution when the lines intersect at one point (different slopes).",
          "**Rule:** A system has no solution when the lines are parallel (same slope, different intercepts).",
          "**Rule:** A system has infinitely many solutions when the equations represent the same line."
        ],
        "examples": [
          {
            "problem": "Solve the system: x + y = 10 and x - y = 4",
            "steps": [
              "Add both equations: (x + y) + (x - y) = 10 + 4",
              "Simplify: 2x = 14, so x = 7",
              "Substitute x = 7 into first equation: 7 + y = 10, so y = 3"
            ],
            "result": "x = 7, y = 3"
          }
        ]
      },
      {
        "heading": "Equations with Parameters",
        "content": [
          "A parameter is a letter (like k, m, or a) that represents a constant whose value may vary. When solving equations with parameters, the solution typically depends on the parameter value.",
          "Sometimes you need to consider special cases where the parameter takes values that would make a coefficient zero or cause division by zero."
        ],
        "examples": [
          {
            "problem": "Solve for x: kx + 3 = 2x + k",
            "steps": [
              "Move x terms to one side: kx - 2x = k - 3",
              "Factor out x: x(k - 2) = k - 3",
              "If k ≠ 2: x = (k - 3) / (k - 2)",
              "If k = 2: the equation becomes 0 = -1, which is false (no solution)"
            ],
            "result": "x = (k - 3) / (k - 2) when k ≠ 2; no solution when k = 2"
          }
        ],
        "mistakes": [
          {
            "mistake": "Forgetting to check for special parameter values",
            "why": "Parameters can take values that make expressions undefined or change the nature of the solution."
          }
        ]
      }
    ]
  }'::jsonb
);

-- Quadratic Equations (11111111-1111-1111-1111-111111111103)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111103',
  'topic-overview',
  'O1',
  'Quadratic Equations — Complete Guide',
  0,
  '{
    "introduction": "A quadratic equation is a second-degree polynomial equation of the form ax² + bx + c = 0, where a ≠ 0. These equations can have zero, one, or two real solutions. Quadratics appear throughout mathematics in physics, engineering, economics, and geometry.",
    "sections": [
      {
        "heading": "Standard Form",
        "content": [
          "The standard form of a quadratic equation is ax² + bx + c = 0, where a, b, and c are constants and a ≠ 0. The coefficient a is called the leading coefficient.",
          "Before solving, always rearrange the equation into standard form by moving all terms to one side, leaving zero on the other."
        ],
        "rules": [
          "**Rule:** Every quadratic equation has exactly two solutions (counting multiplicity), which may be real or complex numbers."
        ],
        "examples": [
          {
            "problem": "Write in standard form: 3x² = 5x - 2",
            "steps": [
              "Move all terms to the left side: 3x² - 5x + 2 = 0",
              "Here a = 3, b = -5, c = 2"
            ],
            "result": "3x² - 5x + 2 = 0"
          }
        ]
      },
      {
        "heading": "Factoring Method",
        "content": [
          "Factoring works when the quadratic can be written as a product of two linear factors. If (x - r)(x - s) = 0, then either x - r = 0 or x - s = 0.",
          "For x² + bx + c, find two numbers that multiply to c and add to b. For ax² + bx + c, you may need trial and error or the AC method."
        ],
        "rules": [
          "**Zero Product Property:** If AB = 0, then A = 0 or B = 0."
        ],
        "examples": [
          {
            "problem": "Solve: x² - 5x + 6 = 0",
            "steps": [
              "Find two numbers that multiply to 6 and add to -5: that is -2 and -3",
              "Factor: (x - 2)(x - 3) = 0",
              "Set each factor to zero: x - 2 = 0 or x - 3 = 0"
            ],
            "result": "x = 2 or x = 3"
          }
        ]
      },
      {
        "heading": "Quadratic Formula",
        "content": [
          "The quadratic formula gives the solutions to any quadratic equation ax² + bx + c = 0. It always works, even when factoring is difficult or impossible.",
          "The formula is: x = (-b ± √(b² - 4ac)) / (2a). The expression under the square root, b² - 4ac, is called the discriminant (Δ or D)."
        ],
        "rules": [
          "**Discriminant Rules:** If Δ > 0: two distinct real solutions. If Δ = 0: one repeated real solution. If Δ < 0: no real solutions (two complex solutions)."
        ],
        "examples": [
          {
            "problem": "Solve: 2x² + 5x - 3 = 0",
            "steps": [
              "Identify: a = 2, b = 5, c = -3",
              "Calculate discriminant: Δ = 25 - 4(2)(-3) = 25 + 24 = 49",
              "Apply formula: x = (-5 ± √49) / 4 = (-5 ± 7) / 4",
              "x = 2/4 = 1/2 or x = -12/4 = -3"
            ],
            "result": "x = 1/2 or x = -3"
          }
        ]
      },
      {
        "heading": "Completing the Square",
        "content": [
          "Completing the square transforms a quadratic into the form (x + p)² = q, which can be solved by taking square roots.",
          "This method is also useful for finding the vertex form of a parabola and deriving the quadratic formula."
        ],
        "examples": [
          {
            "problem": "Solve: x² + 6x + 5 = 0",
            "steps": [
              "Move constant to right: x² + 6x = -5",
              "Add (6/2)² = 9 to both sides: x² + 6x + 9 = 4",
              "Factor left side: (x + 3)² = 4",
              "Take square root: x + 3 = ±2",
              "Solve: x = -3 + 2 = -1 or x = -3 - 2 = -5"
            ],
            "result": "x = -1 or x = -5"
          }
        ]
      },
      {
        "heading": "Two Variable Quadratics",
        "content": [
          "Systems involving one linear and one quadratic equation can be solved by substitution. Substitute the linear equation into the quadratic to get a single equation in one variable.",
          "The solutions represent the intersection points between a line and a parabola."
        ],
        "examples": [
          {
            "problem": "Solve: y = x² and y = x + 2",
            "steps": [
              "Substitute: x² = x + 2",
              "Rearrange: x² - x - 2 = 0",
              "Factor: (x - 2)(x + 1) = 0",
              "Solutions: x = 2 gives y = 4; x = -1 gives y = 1"
            ],
            "result": "(2, 4) and (-1, 1)"
          }
        ]
      },
      {
        "heading": "Quadratics with Parameters",
        "content": [
          "When a quadratic contains a parameter, you analyze how the discriminant depends on the parameter to determine the nature of solutions.",
          "Common questions ask: for which values of k does the equation have two solutions, one solution, or no real solutions?"
        ],
        "examples": [
          {
            "problem": "For which values of k does x² + kx + 4 = 0 have exactly one solution?",
            "steps": [
              "Set discriminant to zero: k² - 16 = 0",
              "Solve: k² = 16, so k = ±4"
            ],
            "result": "k = 4 or k = -4"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Higher Degree Equations (11111111-1111-1111-1111-111111111104)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111104',
  'topic-overview',
  'O1',
  'Higher Degree Equations — Complete Guide',
  0,
  '{
    "introduction": "Higher degree equations are polynomial equations where the highest power of the variable is greater than 2. These include biquadratic equations (degree 4 with special structure), radical equations, and cubic equations. Special techniques allow us to reduce these to simpler equations.",
    "sections": [
      {
        "heading": "Biquadratic Equations",
        "content": [
          "A biquadratic equation has the form ax⁴ + bx² + c = 0. Notice there is no x³ or x term — only even powers.",
          "The key technique is substitution: let u = x², transforming the equation into a quadratic in u. Solve for u, then find x by taking square roots."
        ],
        "rules": [
          "**Rule:** After substituting u = x², solve au² + bu + c = 0. Then x = ±√u for each positive value of u."
        ],
        "examples": [
          {
            "problem": "Solve: x⁴ - 5x² + 4 = 0",
            "steps": [
              "Let u = x²: u² - 5u + 4 = 0",
              "Factor: (u - 1)(u - 4) = 0",
              "Solutions: u = 1 or u = 4",
              "Convert back: x² = 1 gives x = ±1; x² = 4 gives x = ±2"
            ],
            "result": "x = -2, -1, 1, 2"
          }
        ],
        "mistakes": [
          {
            "mistake": "Forgetting that x² = u gives two values of x (positive and negative)",
            "why": "Each positive value of u yields two solutions for x."
          }
        ]
      },
      {
        "heading": "Radical Equations",
        "content": [
          "A radical equation contains the variable under a square root (or other root). To solve, isolate the radical and then square both sides to eliminate it.",
          "Warning: Squaring can introduce extraneous solutions. Always check your answers in the original equation."
        ],
        "rules": [
          "**Rule:** After squaring, you must verify each solution in the original equation."
        ],
        "examples": [
          {
            "problem": "Solve: √(x + 3) = x - 3",
            "steps": [
              "Square both sides: x + 3 = (x - 3)²",
              "Expand: x + 3 = x² - 6x + 9",
              "Rearrange: x² - 7x + 6 = 0",
              "Factor: (x - 1)(x - 6) = 0",
              "Check x = 1: √4 = -2 (false). Check x = 6: √9 = 3 (true)"
            ],
            "result": "x = 6 (x = 1 is extraneous)"
          }
        ]
      },
      {
        "heading": "Cubic Equations",
        "content": [
          "A cubic equation has the form ax³ + bx² + cx + d = 0. Every cubic has at least one real root.",
          "For simple cubics, try to find a rational root using the Rational Root Theorem, then use polynomial division to reduce to a quadratic."
        ],
        "examples": [
          {
            "problem": "Solve: x³ - 6x² + 11x - 6 = 0",
            "steps": [
              "Try x = 1: 1 - 6 + 11 - 6 = 0 ✓",
              "Divide by (x - 1): x³ - 6x² + 11x - 6 = (x - 1)(x² - 5x + 6)",
              "Factor quadratic: (x - 1)(x - 2)(x - 3) = 0"
            ],
            "result": "x = 1, 2, or 3"
          }
        ]
      },
      {
        "heading": "Polynomial Factoring",
        "content": [
          "Factoring polynomials is essential for solving higher-degree equations. Key techniques include grouping, recognizing patterns (difference of squares, sum/difference of cubes), and the factor theorem.",
          "The Factor Theorem states: if f(a) = 0, then (x - a) is a factor of f(x)."
        ],
        "rules": [
          "**Sum of cubes:** a³ + b³ = (a + b)(a² - ab + b²)",
          "**Difference of cubes:** a³ - b³ = (a - b)(a² + ab + b²)"
        ],
        "examples": [
          {
            "problem": "Factor: x³ - 8",
            "steps": [
              "Recognize as difference of cubes: x³ - 2³",
              "Apply formula: (x - 2)(x² + 2x + 4)"
            ],
            "result": "(x - 2)(x² + 2x + 4)"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Inequalities (11111111-1111-1111-1111-111111111105)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111105',
  'topic-overview',
  'O1',
  'Inequalities — Complete Guide',
  0,
  '{
    "introduction": "An inequality compares two expressions using symbols like < (less than), > (greater than), ≤ (less than or equal), or ≥ (greater than or equal). Unlike equations that have specific solutions, inequalities have solution sets — ranges of values that make the inequality true.",
    "sections": [
      {
        "heading": "First-Degree Inequalities",
        "content": [
          "First-degree (linear) inequalities are solved much like linear equations, with one crucial difference: when you multiply or divide by a negative number, you must reverse the inequality sign.",
          "The solution is typically an interval, written in set notation or on a number line."
        ],
        "rules": [
          "**Rule:** When multiplying or dividing by a negative number, flip the inequality sign."
        ],
        "examples": [
          {
            "problem": "Solve: 3x - 7 < 8",
            "steps": [
              "Add 7: 3x < 15",
              "Divide by 3: x < 5"
            ],
            "result": "x < 5 (all numbers less than 5)"
          },
          {
            "problem": "Solve: -2x + 4 ≥ 10",
            "steps": [
              "Subtract 4: -2x ≥ 6",
              "Divide by -2 (flip the sign!): x ≤ -3"
            ],
            "result": "x ≤ -3"
          }
        ],
        "mistakes": [
          {
            "mistake": "Forgetting to flip the inequality when dividing by a negative",
            "why": "Multiplying or dividing by a negative reverses the order of numbers on the number line."
          }
        ]
      },
      {
        "heading": "Second-Degree Inequalities",
        "content": [
          "Quadratic inequalities require finding where a parabola is above or below zero. First, find the roots of the corresponding equation, then test intervals.",
          "The sign of the leading coefficient determines whether the parabola opens up or down, which affects the solution intervals."
        ],
        "examples": [
          {
            "problem": "Solve: x² - 4 < 0",
            "steps": [
              "Find roots: x² = 4 gives x = ±2",
              "The parabola opens up (positive leading coefficient)",
              "The parabola is below zero (negative) between the roots"
            ],
            "result": "-2 < x < 2"
          },
          {
            "problem": "Solve: x² - 4 > 0",
            "steps": [
              "Same roots: x = ±2",
              "Parabola is above zero outside the roots"
            ],
            "result": "x < -2 or x > 2"
          }
        ]
      },
      {
        "heading": "Quotient Inequalities",
        "content": [
          "Quotient (rational) inequalities involve fractions with x in the denominator. You cannot simply multiply by the denominator because you do not know its sign.",
          "Instead, move everything to one side, find a common denominator, and analyze the sign of the expression by finding critical points (zeros and undefined points)."
        ],
        "rules": [
          "**Rule:** Never multiply both sides by an expression containing x — its sign is unknown."
        ],
        "examples": [
          {
            "problem": "Solve: (x - 1)/(x + 2) > 0",
            "steps": [
              "Find critical points: x = 1 (zero), x = -2 (undefined)",
              "Test intervals: for x < -2, both factors negative → positive",
              "For -2 < x < 1, numerator negative, denominator positive → negative",
              "For x > 1, both positive → positive"
            ],
            "result": "x < -2 or x > 1"
          }
        ]
      },
      {
        "heading": "Higher-Degree Inequalities",
        "content": [
          "For polynomial inequalities of degree 3 or higher, factor completely and use a sign chart. List all roots, then determine the sign in each interval.",
          "The sign alternates at simple roots and stays the same at double (repeated) roots."
        ],
        "examples": [
          {
            "problem": "Solve: x(x - 1)(x + 2) ≤ 0",
            "steps": [
              "Roots: x = -2, 0, 1",
              "Test signs in each interval on a sign chart",
              "Negative or zero in: [-2, 0] ∪ {1}"
            ],
            "result": "-2 ≤ x ≤ 0 or x = 1"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Exponents (11111111-1111-1111-1111-111111111106)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111106',
  'topic-overview',
  'O1',
  'Exponents — Complete Guide',
  0,
  '{
    "introduction": "Exponents are a shorthand for repeated multiplication. The expression a^n means multiplying a by itself n times. Understanding exponent rules is essential for simplifying expressions, solving equations, and working with exponential functions.",
    "sections": [
      {
        "heading": "Laws of Exponents",
        "content": [
          "The fundamental laws of exponents let you simplify expressions with powers. These rules work for any base and are the foundation for all work with exponents.",
          "Product rule: when multiplying same bases, add exponents. Quotient rule: when dividing same bases, subtract exponents. Power rule: when raising a power to a power, multiply exponents."
        ],
        "rules": [
          "**Product:** a^m × a^n = a^(m+n)",
          "**Quotient:** a^m ÷ a^n = a^(m-n)",
          "**Power of a power:** (a^m)^n = a^(mn)",
          "**Power of a product:** (ab)^n = a^n × b^n",
          "**Power of a quotient:** (a/b)^n = a^n / b^n"
        ],
        "examples": [
          {
            "problem": "Simplify: 2³ × 2⁴",
            "steps": [
              "Same base, so add exponents: 2^(3+4) = 2⁷",
              "Calculate if needed: 2⁷ = 128"
            ],
            "result": "2⁷ = 128"
          }
        ]
      },
      {
        "heading": "Negative Exponents",
        "content": [
          "A negative exponent means the reciprocal of the positive power. The expression a^(-n) equals 1/a^n.",
          "This rule explains why a⁰ = 1: following the pattern a^n ÷ a^n = a^(n-n) = a⁰, and since any number divided by itself is 1, we get a⁰ = 1."
        ],
        "rules": [
          "**Negative exponent:** a^(-n) = 1/a^n (for a ≠ 0)",
          "**Zero exponent:** a⁰ = 1 (for a ≠ 0)"
        ],
        "examples": [
          {
            "problem": "Simplify: 5^(-2)",
            "steps": [
              "Apply negative exponent rule: 5^(-2) = 1/5²",
              "Calculate: 1/25"
            ],
            "result": "1/25"
          }
        ]
      },
      {
        "heading": "Fractional Exponents",
        "content": [
          "A fractional exponent represents a root. The expression a^(1/n) means the nth root of a. More generally, a^(m/n) means the nth root of a^m.",
          "Fractional exponents follow all the same rules as integer exponents."
        ],
        "rules": [
          "**Root as exponent:** a^(1/n) = ⁿ√a",
          "**General rule:** a^(m/n) = ⁿ√(a^m) = (ⁿ√a)^m"
        ],
        "examples": [
          {
            "problem": "Simplify: 8^(2/3)",
            "steps": [
              "Write as: (8^(1/3))² or (³√8)²",
              "³√8 = 2, so 2² = 4"
            ],
            "result": "4"
          }
        ]
      },
      {
        "heading": "Simplifying Expressions",
        "content": [
          "Complex exponential expressions can be simplified by systematically applying the laws of exponents. Work step by step, applying one rule at a time.",
          "Always express final answers with positive exponents unless otherwise instructed."
        ],
        "examples": [
          {
            "problem": "Simplify: (x³y^(-2))² / x^(-4)",
            "steps": [
              "Apply power rule to numerator: x⁶y^(-4)",
              "Divide: x⁶ ÷ x^(-4) = x^(6-(-4)) = x¹⁰",
              "Write with positive exponents: x¹⁰/y⁴"
            ],
            "result": "x¹⁰/y⁴"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Exponential Equations (11111111-1111-1111-1111-111111111107)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111107',
  'topic-overview',
  'O1',
  'Exponential Equations — Complete Guide',
  0,
  '{
    "introduction": "An exponential equation has the variable in the exponent. Examples include 2^x = 8 and 3^(2x) = 27. Solving these equations requires techniques like rewriting with a common base or using logarithms.",
    "sections": [
      {
        "heading": "Same Base Method",
        "content": [
          "When both sides of an equation can be written with the same base, you can set the exponents equal. If a^m = a^n (with a > 0, a ≠ 1), then m = n.",
          "This is the preferred method when it works, as it avoids logarithms entirely."
        ],
        "rules": [
          "**Rule:** If a^x = a^y, then x = y (for a > 0, a ≠ 1)"
        ],
        "examples": [
          {
            "problem": "Solve: 2^x = 32",
            "steps": [
              "Write 32 as a power of 2: 32 = 2⁵",
              "Now: 2^x = 2⁵",
              "Set exponents equal: x = 5"
            ],
            "result": "x = 5"
          },
          {
            "problem": "Solve: 9^x = 27",
            "steps": [
              "Write both as powers of 3: 9 = 3², 27 = 3³",
              "Equation becomes: (3²)^x = 3³",
              "Simplify: 3^(2x) = 3³",
              "Set exponents equal: 2x = 3, so x = 3/2"
            ],
            "result": "x = 3/2"
          }
        ]
      },
      {
        "heading": "Using Logarithms",
        "content": [
          "When you cannot write both sides with the same base, take logarithms of both sides. You can use any base — common log (base 10) or natural log (base e) are most frequent.",
          "Use the property log(a^x) = x·log(a) to bring the exponent down."
        ],
        "rules": [
          "**Rule:** If a^x = b, then x = log(b) / log(a)"
        ],
        "examples": [
          {
            "problem": "Solve: 5^x = 12",
            "steps": [
              "Take log of both sides: log(5^x) = log(12)",
              "Bring exponent down: x·log(5) = log(12)",
              "Solve: x = log(12) / log(5) ≈ 1.544"
            ],
            "result": "x = log(12)/log(5) ≈ 1.544"
          }
        ]
      },
      {
        "heading": "Substitution Method",
        "content": [
          "Some exponential equations can be reduced to quadratics by substitution. If you see terms like 4^x and 2^x together, note that 4^x = (2²)^x = (2^x)².",
          "Substitute u = 2^x (or similar), solve the resulting quadratic, then convert back."
        ],
        "examples": [
          {
            "problem": "Solve: 4^x - 3·2^x + 2 = 0",
            "steps": [
              "Note: 4^x = (2^x)². Let u = 2^x",
              "Equation becomes: u² - 3u + 2 = 0",
              "Factor: (u - 1)(u - 2) = 0",
              "u = 1: 2^x = 1, so x = 0",
              "u = 2: 2^x = 2, so x = 1"
            ],
            "result": "x = 0 or x = 1"
          }
        ]
      },
      {
        "heading": "Exponential Growth and Decay",
        "content": [
          "Many real-world applications involve exponential growth (population, compound interest) or decay (radioactive decay, depreciation).",
          "The general form is A = A₀ × b^t, where A₀ is the initial amount, b is the growth/decay factor, and t is time."
        ],
        "examples": [
          {
            "problem": "A bacteria population doubles every 3 hours. If there are 100 bacteria now, when will there be 1600?",
            "steps": [
              "Model: P = 100 × 2^(t/3), where t is hours",
              "Set up equation: 1600 = 100 × 2^(t/3)",
              "Simplify: 16 = 2^(t/3)",
              "16 = 2⁴, so t/3 = 4, giving t = 12"
            ],
            "result": "12 hours"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Logarithms (11111111-1111-1111-1111-111111111108)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111108',
  'topic-overview',
  'O1',
  'Logarithms — Complete Guide',
  0,
  '{
    "introduction": "A logarithm answers the question: to what power must we raise the base to get a given number? If b^x = y, then log_b(y) = x. Logarithms are the inverse of exponentials and are essential for solving exponential equations.",
    "sections": [
      {
        "heading": "Definition of Logarithm",
        "content": [
          "The logarithm base b of a number y is the exponent to which b must be raised to produce y. We write this as log_b(y) = x, which means b^x = y.",
          "Common bases: log means log base 10 (common logarithm), ln means log base e ≈ 2.718 (natural logarithm)."
        ],
        "rules": [
          "**Definition:** log_b(y) = x means b^x = y",
          "**Domain:** The argument of a logarithm must be positive. log_b(y) is only defined for y > 0."
        ],
        "examples": [
          {
            "problem": "Evaluate: log_2(8)",
            "steps": [
              "Ask: 2 to what power gives 8?",
              "2³ = 8, so log_2(8) = 3"
            ],
            "result": "3"
          }
        ]
      },
      {
        "heading": "Logarithm Laws",
        "content": [
          "Just as exponents have rules, so do logarithms. These laws allow you to combine, expand, and simplify logarithmic expressions.",
          "The product rule turns multiplication into addition. The quotient rule turns division into subtraction. The power rule brings exponents to the front."
        ],
        "rules": [
          "**Product rule:** log_b(xy) = log_b(x) + log_b(y)",
          "**Quotient rule:** log_b(x/y) = log_b(x) - log_b(y)",
          "**Power rule:** log_b(x^n) = n·log_b(x)",
          "**Change of base:** log_b(x) = log_c(x) / log_c(b)"
        ],
        "examples": [
          {
            "problem": "Expand: log(x²y/z)",
            "steps": [
              "Apply quotient rule: log(x²y) - log(z)",
              "Apply product rule: log(x²) + log(y) - log(z)",
              "Apply power rule: 2log(x) + log(y) - log(z)"
            ],
            "result": "2log(x) + log(y) - log(z)"
          }
        ]
      },
      {
        "heading": "Solving Logarithmic Expressions",
        "content": [
          "To simplify logarithmic expressions, apply the logarithm laws. To evaluate, try to express the argument as a power of the base.",
          "Special values: log_b(1) = 0 (because b⁰ = 1), log_b(b) = 1 (because b¹ = b)."
        ],
        "examples": [
          {
            "problem": "Simplify: log_3(9) + log_3(3)",
            "steps": [
              "log_3(9) = log_3(3²) = 2",
              "log_3(3) = 1",
              "Sum: 2 + 1 = 3"
            ],
            "result": "3"
          }
        ]
      },
      {
        "heading": "Inverse Relationship",
        "content": [
          "Logarithms and exponentials are inverses of each other. This means they undo each other: log_b(b^x) = x and b^(log_b(x)) = x.",
          "This relationship is key to solving equations: to undo an exponent, take a log; to undo a log, exponentiate."
        ],
        "examples": [
          {
            "problem": "Simplify: 10^(log(5))",
            "steps": [
              "log means log base 10",
              "10^(log_10(5)) = 5 by the inverse property"
            ],
            "result": "5"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Logarithmic Equations (11111111-1111-1111-1111-111111111109)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111109',
  'topic-overview',
  'O1',
  'Logarithmic Equations — Complete Guide',
  0,
  '{
    "introduction": "A logarithmic equation contains a logarithm with the variable in the argument. To solve these equations, you typically either combine logs and exponentiate, or use the definition to convert to exponential form. Always check that solutions give positive arguments.",
    "sections": [
      {
        "heading": "Basic Logarithmic Equations",
        "content": [
          "For equations of the form log_b(x) = c, convert to exponential form: x = b^c. This directly gives the solution.",
          "Remember that the argument of a logarithm must be positive, so reject any solution that makes the argument zero or negative."
        ],
        "examples": [
          {
            "problem": "Solve: log_2(x) = 5",
            "steps": [
              "Convert to exponential form: x = 2⁵",
              "Calculate: x = 32"
            ],
            "result": "x = 32"
          }
        ]
      },
      {
        "heading": "Equations with Multiple Logs",
        "content": [
          "When an equation has multiple logarithms with the same base, use the log laws to combine them into a single logarithm.",
          "If log_b(A) = log_b(B), then A = B (since log is one-to-one)."
        ],
        "examples": [
          {
            "problem": "Solve: log(x) + log(x - 3) = 1",
            "steps": [
              "Combine using product rule: log(x(x - 3)) = 1",
              "Convert to exponential: x(x - 3) = 10¹ = 10",
              "Expand: x² - 3x - 10 = 0",
              "Factor: (x - 5)(x + 2) = 0",
              "x = 5 or x = -2. Check: x = -2 makes log(x) undefined",
              "Only x = 5 is valid"
            ],
            "result": "x = 5"
          }
        ],
        "mistakes": [
          {
            "mistake": "Forgetting to check that all log arguments are positive",
            "why": "Logarithms are only defined for positive arguments. Extraneous solutions often appear."
          }
        ]
      },
      {
        "heading": "Change of Base",
        "content": [
          "When an equation has logs of different bases, convert them to a common base using the change of base formula.",
          "The change of base formula: log_a(x) = log_b(x) / log_b(a)."
        ],
        "examples": [
          {
            "problem": "Solve: log_2(x) = 3·log_4(x)",
            "steps": [
              "Convert log_4(x) using change of base: log_4(x) = log_2(x) / log_2(4) = log_2(x) / 2",
              "Substitute: log_2(x) = 3·(log_2(x) / 2) = (3/2)log_2(x)",
              "Let y = log_2(x): y = (3/2)y",
              "Rearrange: y - (3/2)y = 0, giving -(1/2)y = 0",
              "So y = 0, meaning log_2(x) = 0, thus x = 1"
            ],
            "result": "x = 1"
          }
        ]
      },
      {
        "heading": "Logarithmic Inequalities",
        "content": [
          "For logarithmic inequalities, remember that the logarithm function is increasing for base > 1 and decreasing for 0 < base < 1.",
          "When solving, always consider the domain (argument > 0) as an additional constraint."
        ],
        "examples": [
          {
            "problem": "Solve: log_2(x - 1) < 3",
            "steps": [
              "Domain: x - 1 > 0, so x > 1",
              "Since base 2 > 1, log is increasing: x - 1 < 2³ = 8",
              "So x < 9",
              "Combined with domain: 1 < x < 9"
            ],
            "result": "1 < x < 9"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Linear Functions (11111111-1111-1111-1111-111111111110)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111110',
  'topic-overview',
  'O1',
  'Linear Functions — Complete Guide',
  0,
  '{
    "introduction": "A linear function is a function whose graph is a straight line. Linear functions have the form f(x) = mx + b, where m is the slope and b is the y-intercept. They model constant rate of change and appear everywhere in mathematics and science.",
    "sections": [
      {
        "heading": "Slope-Intercept Form",
        "content": [
          "The slope-intercept form is y = mx + b. Here m is the slope (rate of change) and b is the y-intercept (where the line crosses the y-axis).",
          "The slope tells you how steep the line is and whether it rises (m > 0) or falls (m < 0) as you move right."
        ],
        "rules": [
          "**Slope formula:** m = (y₂ - y₁) / (x₂ - x₁) = rise / run",
          "**Y-intercept:** The point (0, b) where the line crosses the y-axis"
        ],
        "examples": [
          {
            "problem": "Find the equation of the line through (1, 3) with slope 2",
            "steps": [
              "Use y = mx + b with m = 2",
              "Substitute (1, 3): 3 = 2(1) + b",
              "Solve: b = 1"
            ],
            "result": "y = 2x + 1"
          }
        ]
      },
      {
        "heading": "Point-Slope Form",
        "content": [
          "The point-slope form is y - y₁ = m(x - x₁), where (x₁, y₁) is a known point and m is the slope.",
          "This form is useful when you know a point and the slope, or when you need to write the equation quickly."
        ],
        "examples": [
          {
            "problem": "Find the equation through (2, 5) and (4, 11)",
            "steps": [
              "Find slope: m = (11 - 5) / (4 - 2) = 6 / 2 = 3",
              "Use point-slope with (2, 5): y - 5 = 3(x - 2)",
              "Expand: y = 3x - 6 + 5 = 3x - 1"
            ],
            "result": "y = 3x - 1"
          }
        ]
      },
      {
        "heading": "Parallel and Perpendicular Lines",
        "content": [
          "Parallel lines have the same slope. Perpendicular lines have slopes that are negative reciprocals of each other.",
          "If one line has slope m, a perpendicular line has slope -1/m."
        ],
        "rules": [
          "**Parallel:** m₁ = m₂",
          "**Perpendicular:** m₁ × m₂ = -1"
        ],
        "examples": [
          {
            "problem": "Find a line perpendicular to y = 2x + 3 through (4, 1)",
            "steps": [
              "Original slope is 2, so perpendicular slope is -1/2",
              "Use point-slope: y - 1 = (-1/2)(x - 4)",
              "Simplify: y = -x/2 + 2 + 1 = -x/2 + 3"
            ],
            "result": "y = -x/2 + 3"
          }
        ]
      },
      {
        "heading": "Applications",
        "content": [
          "Linear functions model situations with constant rate of change: cost = fixed cost + (rate × quantity), distance = speed × time, temperature conversion, etc.",
          "The slope represents the rate of change, and the y-intercept represents the starting value."
        ],
        "examples": [
          {
            "problem": "A taxi charges 3 dollars flat plus 2 dollars per mile. Write the cost function.",
            "steps": [
              "Let x = miles, C(x) = cost",
              "Fixed cost: 3 (y-intercept)",
              "Rate: 2 dollars/mile (slope)"
            ],
            "result": "C(x) = 2x + 3"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Quadratic Functions (11111111-1111-1111-1111-111111111111)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  'topic-overview',
  'O1',
  'Quadratic Functions — Complete Guide',
  0,
  '{
    "introduction": "A quadratic function has the form f(x) = ax² + bx + c, where a ≠ 0. Its graph is a parabola — a U-shaped curve that opens upward if a > 0 or downward if a < 0. Quadratic functions model projectile motion, areas, and many optimization problems.",
    "sections": [
      {
        "heading": "Standard Form and Vertex",
        "content": [
          "The standard form is f(x) = ax² + bx + c. The vertex (turning point) has x-coordinate x = -b/(2a).",
          "The vertex is the minimum point if a > 0 (parabola opens up) or maximum point if a < 0 (parabola opens down)."
        ],
        "rules": [
          "**Vertex x-coordinate:** x = -b / (2a)",
          "**Vertex y-coordinate:** y = f(-b / (2a)) or use y = c - b² / (4a)"
        ],
        "examples": [
          {
            "problem": "Find the vertex of f(x) = x² - 6x + 5",
            "steps": [
              "Here a = 1, b = -6, c = 5",
              "Vertex x = -(-6) / (2·1) = 3",
              "Vertex y = f(3) = 9 - 18 + 5 = -4"
            ],
            "result": "Vertex: (3, -4)"
          }
        ]
      },
      {
        "heading": "Vertex Form",
        "content": [
          "Vertex form is f(x) = a(x - h)² + k, where (h, k) is the vertex. This form makes it easy to read the vertex directly.",
          "To convert from standard to vertex form, complete the square."
        ],
        "examples": [
          {
            "problem": "Write f(x) = x² + 4x + 1 in vertex form",
            "steps": [
              "Complete the square: x² + 4x + 4 - 4 + 1",
              "Factor: (x + 2)² - 3"
            ],
            "result": "f(x) = (x + 2)² - 3, vertex at (-2, -3)"
          }
        ]
      },
      {
        "heading": "Finding Roots",
        "content": [
          "The roots (zeros, x-intercepts) are where f(x) = 0. Use factoring, the quadratic formula, or completing the square.",
          "The discriminant Δ = b² - 4ac tells you how many real roots exist."
        ],
        "examples": [
          {
            "problem": "Find the roots of f(x) = x² - 4x - 5",
            "steps": [
              "Set equal to zero: x² - 4x - 5 = 0",
              "Factor: (x - 5)(x + 1) = 0",
              "Roots: x = 5 and x = -1"
            ],
            "result": "x = -1 and x = 5"
          }
        ]
      },
      {
        "heading": "Transformations",
        "content": [
          "Transformations shift, stretch, or reflect the basic parabola y = x².",
          "f(x) = a(x - h)² + k: a stretches/compresses and reflects, h shifts horizontally, k shifts vertically."
        ],
        "rules": [
          "**Vertical shift:** +k moves up, -k moves down",
          "**Horizontal shift:** (x - h) moves right, (x + h) moves left",
          "**Reflection:** If a < 0, the parabola flips upside down"
        ],
        "examples": [
          {
            "problem": "Describe the transformation: f(x) = -2(x - 3)² + 4",
            "steps": [
              "The negative sign reflects over x-axis (opens down)",
              "The 2 stretches vertically by factor 2",
              "The (x - 3) shifts right 3 units",
              "The +4 shifts up 4 units"
            ],
            "result": "Reflected, stretched by 2, shifted right 3 and up 4"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Rational Functions (11111111-1111-1111-1111-111111111113)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111113',
  'topic-overview',
  'O1',
  'Rational Functions — Complete Guide',
  0,
  '{
    "introduction": "A rational function is a ratio of two polynomials: f(x) = P(x)/Q(x). The domain excludes values where Q(x) = 0. Rational functions have interesting features like vertical asymptotes (where the function blows up) and horizontal asymptotes (long-term behavior).",
    "sections": [
      {
        "heading": "Domain",
        "content": [
          "The domain of a rational function includes all real numbers except where the denominator equals zero.",
          "To find the domain, set the denominator equal to zero and solve. Exclude these values."
        ],
        "examples": [
          {
            "problem": "Find the domain of f(x) = (x + 1) / (x² - 4)",
            "steps": [
              "Set denominator = 0: x² - 4 = 0",
              "Solve: x = ±2",
              "Domain is all real numbers except x = 2 and x = -2"
            ],
            "result": "x ∈ ℝ, x ≠ ±2"
          }
        ]
      },
      {
        "heading": "Vertical Asymptotes",
        "content": [
          "A vertical asymptote occurs at values of x where the denominator is zero but the numerator is not zero (after simplification).",
          "At a vertical asymptote, the function approaches positive or negative infinity."
        ],
        "examples": [
          {
            "problem": "Find vertical asymptotes of f(x) = 1 / (x - 3)",
            "steps": [
              "Set denominator = 0: x - 3 = 0, so x = 3",
              "Check numerator at x = 3: 1 ≠ 0",
              "Vertical asymptote at x = 3"
            ],
            "result": "VA: x = 3"
          }
        ]
      },
      {
        "heading": "Horizontal Asymptotes",
        "content": [
          "Horizontal asymptotes describe the end behavior — what happens as x → ±∞.",
          "Compare degrees: if degree of numerator < denominator, HA is y = 0. If degrees are equal, HA is the ratio of leading coefficients. If numerator degree > denominator, no HA (but may have slant asymptote)."
        ],
        "rules": [
          "**Degree of P < Degree of Q:** HA at y = 0",
          "**Degrees equal:** HA at y = (leading coeff of P) / (leading coeff of Q)",
          "**Degree of P > Degree of Q:** No horizontal asymptote"
        ],
        "examples": [
          {
            "problem": "Find the horizontal asymptote of f(x) = (3x² + 1) / (x² - 5)",
            "steps": [
              "Degrees are equal (both 2)",
              "HA = leading coefficients ratio: y = 3/1 = 3"
            ],
            "result": "HA: y = 3"
          }
        ]
      },
      {
        "heading": "Graphing Rational Functions",
        "content": [
          "To sketch a rational function: 1) Find domain, 2) Find asymptotes, 3) Find intercepts, 4) Plot a few points, 5) Sketch the curve.",
          "Remember: the graph approaches but never crosses vertical asymptotes. It may cross horizontal asymptotes."
        ],
        "examples": [
          {
            "problem": "Sketch y = x / (x - 2)",
            "steps": [
              "Domain: x ≠ 2",
              "VA: x = 2",
              "HA: y = 1 (degrees equal, leading coeffs both 1)",
              "Y-intercept: (0, 0)",
              "X-intercept: x = 0"
            ],
            "result": "Hyperbola-like curve with VA at x = 2 and HA at y = 1"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Limits (11111111-1111-1111-1111-111111111114)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111114',
  'topic-overview',
  'O1',
  'Limits — Complete Guide',
  0,
  '{
    "introduction": "A limit describes what value a function approaches as the input approaches some value. Limits are the foundation of calculus — they let us define derivatives and integrals. Even when a function is undefined at a point, the limit may still exist.",
    "sections": [
      {
        "heading": "Intuition and Definition",
        "content": [
          "The limit of f(x) as x approaches a, written lim (x→a) f(x) = L, means f(x) gets arbitrarily close to L as x gets close to a.",
          "Important: the limit depends on what happens NEAR a, not AT a. The function does not even need to be defined at a."
        ],
        "examples": [
          {
            "problem": "Find lim (x→2) (x² - 4)/(x - 2)",
            "steps": [
              "Direct substitution gives 0/0 (indeterminate)",
              "Factor: (x - 2)(x + 2) / (x - 2)",
              "Cancel: x + 2 (for x ≠ 2)",
              "Now substitute: 2 + 2 = 4"
            ],
            "result": "4"
          }
        ]
      },
      {
        "heading": "Limit Laws",
        "content": [
          "Limits can be computed using algebraic rules. If lim f(x) = L and lim g(x) = M, then: lim[f(x) + g(x)] = L + M, lim[f(x)·g(x)] = L·M, etc.",
          "For direct substitution: if f is continuous at a, then lim (x→a) f(x) = f(a)."
        ],
        "rules": [
          "**Sum rule:** lim[f + g] = lim f + lim g",
          "**Product rule:** lim[f · g] = (lim f) · (lim g)",
          "**Quotient rule:** lim[f / g] = (lim f) / (lim g), provided lim g ≠ 0"
        ],
        "examples": [
          {
            "problem": "Find lim (x→3) (x² + 2x)",
            "steps": [
              "Function is a polynomial, so use direct substitution",
              "3² + 2(3) = 9 + 6 = 15"
            ],
            "result": "15"
          }
        ]
      },
      {
        "heading": "Indeterminate Forms",
        "content": [
          "When direct substitution gives 0/0 or ∞/∞, the limit is indeterminate — you need algebraic techniques to find it.",
          "Common techniques: factor and cancel, rationalize (multiply by conjugate), or apply L''Hôpital''s rule."
        ],
        "examples": [
          {
            "problem": "Find lim (x→0) (√(1+x) - 1) / x",
            "steps": [
              "Direct substitution: (1 - 1) / 0 = 0/0",
              "Rationalize: multiply by (√(1+x) + 1) / (√(1+x) + 1)",
              "Simplify: ((1+x) - 1) / (x(√(1+x) + 1)) = x / (x(√(1+x) + 1)) = 1 / (√(1+x) + 1)",
              "Substitute x = 0: 1 / 2"
            ],
            "result": "1/2"
          }
        ]
      },
      {
        "heading": "One-Sided Limits",
        "content": [
          "The left-hand limit lim (x→a⁻) approaches a from values less than a. The right-hand limit lim (x→a⁺) approaches from values greater than a.",
          "The two-sided limit exists only if both one-sided limits exist and are equal."
        ],
        "examples": [
          {
            "problem": "Find lim (x→0) |x| / x",
            "steps": [
              "For x > 0: |x|/x = x/x = 1",
              "For x < 0: |x|/x = -x/x = -1",
              "Left limit = -1, right limit = 1",
              "Limits are different, so limit does not exist"
            ],
            "result": "DNE (does not exist)"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Derivatives Basics (11111111-1111-1111-1111-111111111115)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111115',
  'topic-overview',
  'O1',
  'Derivatives Basics — Complete Guide',
  0,
  '{
    "introduction": "The derivative of a function measures its instantaneous rate of change — how fast the output changes as the input changes. Geometrically, the derivative gives the slope of the tangent line at any point. Derivatives are central to calculus.",
    "sections": [
      {
        "heading": "Definition of Derivative",
        "content": [
          "The derivative of f at x = a is defined as f''(a) = lim (h→0) [f(a+h) - f(a)] / h, provided this limit exists.",
          "This limit represents the slope of the tangent line to the graph at x = a."
        ],
        "examples": [
          {
            "problem": "Find the derivative of f(x) = x² using the definition",
            "steps": [
              "f(x+h) = (x+h)² = x² + 2xh + h²",
              "[f(x+h) - f(x)] / h = [x² + 2xh + h² - x²] / h = (2xh + h²) / h = 2x + h",
              "As h → 0: f''(x) = 2x"
            ],
            "result": "f''(x) = 2x"
          }
        ]
      },
      {
        "heading": "Basic Derivative Rules",
        "content": [
          "Memorizing basic rules speeds up differentiation. The power rule, constant rule, and sum/difference rules handle most polynomials.",
          "Power rule: d/dx[xⁿ] = nxⁿ⁻¹. Constant rule: d/dx[c] = 0. Constant multiple: d/dx[cf(x)] = c·f''(x)."
        ],
        "rules": [
          "**Power rule:** d/dx[xⁿ] = nxⁿ⁻¹",
          "**Sum rule:** d/dx[f + g] = f'' + g''",
          "**Difference rule:** d/dx[f - g] = f'' - g''",
          "**Constant multiple:** d/dx[cf] = c·f''"
        ],
        "examples": [
          {
            "problem": "Find the derivative of f(x) = 3x⁴ - 5x² + 7",
            "steps": [
              "Apply power rule to each term:",
              "d/dx[3x⁴] = 12x³",
              "d/dx[-5x²] = -10x",
              "d/dx[7] = 0"
            ],
            "result": "f''(x) = 12x³ - 10x"
          }
        ]
      },
      {
        "heading": "Product Rule",
        "content": [
          "To differentiate a product of two functions: d/dx[f(x)g(x)] = f(x)g''(x) + f''(x)g(x).",
          "Memory aid: the derivative of a product is first times derivative of second plus second times derivative of first."
        ],
        "examples": [
          {
            "problem": "Find d/dx[x² · (3x + 1)]",
            "steps": [
              "Let f = x² and g = 3x + 1",
              "f'' = 2x, g'' = 3",
              "Product rule: x²(3) + (2x)(3x + 1) = 3x² + 6x² + 2x = 9x² + 2x"
            ],
            "result": "9x² + 2x"
          }
        ]
      },
      {
        "heading": "Quotient Rule",
        "content": [
          "To differentiate a quotient: d/dx[f(x)/g(x)] = [g(x)f''(x) - f(x)g''(x)] / [g(x)]².",
          "Memory aid: lo d-hi minus hi d-lo over lo-lo (bottom times derivative of top minus top times derivative of bottom, over bottom squared)."
        ],
        "examples": [
          {
            "problem": "Find d/dx[(x + 1) / (x - 1)]",
            "steps": [
              "Let f = x + 1 and g = x - 1",
              "f'' = 1, g'' = 1",
              "Quotient rule: [(x-1)(1) - (x+1)(1)] / (x-1)² = (x - 1 - x - 1) / (x-1)² = -2 / (x-1)²"
            ],
            "result": "-2 / (x - 1)²"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Derivative Applications (11111111-1111-1111-1111-111111111116)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111116',
  'topic-overview',
  'O1',
  'Derivative Applications — Complete Guide',
  0,
  '{
    "introduction": "Derivatives have many applications: finding tangent lines, identifying where functions increase or decrease, locating maximum and minimum values, and sketching curves. These techniques are essential for optimization and analysis.",
    "sections": [
      {
        "heading": "Tangent Lines",
        "content": [
          "The tangent line to y = f(x) at x = a has slope f''(a) and passes through the point (a, f(a)).",
          "Equation of tangent line: y - f(a) = f''(a)(x - a)."
        ],
        "examples": [
          {
            "problem": "Find the tangent line to f(x) = x² at x = 3",
            "steps": [
              "Point: f(3) = 9, so (3, 9)",
              "Slope: f''(x) = 2x, so f''(3) = 6",
              "Equation: y - 9 = 6(x - 3)",
              "Simplify: y = 6x - 9"
            ],
            "result": "y = 6x - 9"
          }
        ]
      },
      {
        "heading": "Increasing and Decreasing",
        "content": [
          "A function is increasing where f''(x) > 0 and decreasing where f''(x) < 0.",
          "To find intervals, solve f''(x) = 0 to get critical points, then test the sign of f'' in each interval."
        ],
        "examples": [
          {
            "problem": "Find where f(x) = x³ - 3x is increasing",
            "steps": [
              "f''(x) = 3x² - 3 = 3(x² - 1) = 3(x-1)(x+1)",
              "f''(x) = 0 when x = ±1",
              "Test intervals: f''(0) = -3 < 0, f''(2) = 9 > 0, f''(-2) = 9 > 0",
              "Increasing: x < -1 and x > 1"
            ],
            "result": "Increasing on (-∞, -1) and (1, ∞)"
          }
        ]
      },
      {
        "heading": "Local Extrema",
        "content": [
          "Local maxima and minima occur at critical points where f''(x) = 0 or f'' is undefined.",
          "First derivative test: if f'' changes from + to -, local max; if from - to +, local min."
        ],
        "rules": [
          "**Second derivative test:** If f''''(c) > 0, local min at x = c. If f''''(c) < 0, local max."
        ],
        "examples": [
          {
            "problem": "Find local extrema of f(x) = x³ - 3x",
            "steps": [
              "Critical points: x = ±1 (from f''(x) = 0)",
              "f''''(x) = 6x",
              "f''''(-1) = -6 < 0: local max at x = -1, value = 2",
              "f''''(1) = 6 > 0: local min at x = 1, value = -2"
            ],
            "result": "Local max: (-1, 2); Local min: (1, -2)"
          }
        ]
      },
      {
        "heading": "Curve Sketching",
        "content": [
          "To sketch a function: find domain, intercepts, asymptotes, critical points, intervals of increase/decrease, concavity, and inflection points.",
          "Combine all this information to draw an accurate graph."
        ],
        "examples": [
          {
            "problem": "Key features of f(x) = x³ - 3x",
            "steps": [
              "Domain: all real numbers",
              "Intercepts: (0, 0), (±√3, 0)",
              "Local max at (-1, 2), local min at (1, -2)",
              "Inflection point at x = 0 (where f'''' = 0)"
            ],
            "result": "S-shaped cubic curve"
          }
        ]
      }
    ]
  }'::jsonb
);

-- Chain Rule (11111111-1111-1111-1111-111111111117)
INSERT INTO theory_blocks (
  id, topic_id, block_type, block_number, title, order_index, content
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111117',
  'topic-overview',
  'O1',
  'Chain Rule — Complete Guide',
  0,
  '{
    "introduction": "The chain rule is used to differentiate composite functions — functions of the form f(g(x)). If you have an outer function applied to an inner function, the chain rule tells you how to find the derivative.",
    "sections": [
      {
        "heading": "The Chain Rule",
        "content": [
          "If y = f(g(x)), then dy/dx = f''(g(x)) · g''(x). In words: derivative of outer function (evaluated at inner) times derivative of inner function.",
          "Alternative notation: if y = f(u) and u = g(x), then dy/dx = (dy/du)(du/dx)."
        ],
        "rules": [
          "**Chain rule:** d/dx[f(g(x))] = f''(g(x)) · g''(x)"
        ],
        "examples": [
          {
            "problem": "Find the derivative of y = (3x + 1)⁵",
            "steps": [
              "Outer function: u⁵, derivative: 5u⁴",
              "Inner function: 3x + 1, derivative: 3",
              "Chain rule: 5(3x + 1)⁴ · 3 = 15(3x + 1)⁴"
            ],
            "result": "15(3x + 1)⁴"
          }
        ]
      },
      {
        "heading": "Recognizing Composite Functions",
        "content": [
          "A composite function is something plugged into something else. Look for expressions like (something)ⁿ, √(something), sin(something), e^(something), etc.",
          "Identify the outer function (the last operation) and the inner function (what is being operated on)."
        ],
        "examples": [
          {
            "problem": "Identify inner and outer functions in √(x² + 1)",
            "steps": [
              "The last operation is taking the square root",
              "Outer function: √u (or u^(1/2))",
              "Inner function: u = x² + 1"
            ],
            "result": "Outer: √u, Inner: x² + 1"
          }
        ]
      },
      {
        "heading": "Common Applications",
        "content": [
          "The chain rule is essential for differentiating: powers of expressions, roots of expressions, exponentials with non-trivial exponents, and trigonometric functions with expressions inside.",
          "Always work from outside to inside."
        ],
        "examples": [
          {
            "problem": "Find d/dx[e^(x²)]",
            "steps": [
              "Outer: e^u, derivative: e^u",
              "Inner: x², derivative: 2x",
              "Chain rule: e^(x²) · 2x = 2x·e^(x²)"
            ],
            "result": "2x·e^(x²)"
          },
          {
            "problem": "Find d/dx[sin(3x)]",
            "steps": [
              "Outer: sin(u), derivative: cos(u)",
              "Inner: 3x, derivative: 3",
              "Chain rule: cos(3x) · 3 = 3cos(3x)"
            ],
            "result": "3cos(3x)"
          }
        ]
      },
      {
        "heading": "Nested Chain Rule",
        "content": [
          "For deeply nested functions, apply the chain rule multiple times, working from outside to inside.",
          "Example: to differentiate f(g(h(x))), you get f''(g(h(x))) · g''(h(x)) · h''(x)."
        ],
        "examples": [
          {
            "problem": "Find d/dx[(2x + 1)³]²",
            "steps": [
              "Rewrite as (2x + 1)⁶",
              "Outer: u⁶, derivative: 6u⁵",
              "Inner: 2x + 1, derivative: 2",
              "Chain rule: 6(2x + 1)⁵ · 2 = 12(2x + 1)⁵"
            ],
            "result": "12(2x + 1)⁵"
          }
        ]
      }
    ]
  }'::jsonb
);