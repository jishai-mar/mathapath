-- =====================================================
-- THEORY-FIRST ARCHITECTURE: COMPLETE DATABASE SETUP
-- =====================================================

-- 1. Create Foundations topic for global algebra rules
INSERT INTO topics (id, name, description, icon, order_index)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Foundations',
  'Universal algebra rules and properties used across all topics',
  'library',
  0
) ON CONFLICT (id) DO NOTHING;

-- 2. Add required columns to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS primary_method_block_id UUID REFERENCES theory_blocks(id),
ADD COLUMN IF NOT EXISTS supporting_theorem_ids UUID[] DEFAULT '{}';

-- =====================================================
-- FOUNDATIONAL THEORY BLOCKS (A# Series)
-- =====================================================

INSERT INTO theory_blocks (id, topic_id, block_type, block_number, order_index, title, content) VALUES

-- A1: Additive Inverse (adding/subtracting both sides)
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'property', 'A1', 1,
 'Additive Property of Equality',
 '{
   "name": "Additive Property of Equality",
   "formalStatement": "If $a = b$, then $a + c = b + c$ for any $c \\in \\mathbb{R}$",
   "explanation": "Adding or subtracting the same value from both sides of an equation preserves equality.",
   "applications": ["Isolating variables by moving terms", "Simplifying equations"],
   "examples": ["From $x + 3 = 7$, subtract 3: $x = 4$"]
 }'::jsonb),

-- A2: Multiplicative Inverse (multiplying/dividing both sides)
('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'property', 'A2', 2,
 'Multiplicative Property of Equality',
 '{
   "name": "Multiplicative Property of Equality",
   "formalStatement": "If $a = b$ and $c \\neq 0$, then $ac = bc$ and $\\frac{a}{c} = \\frac{b}{c}$",
   "explanation": "Multiplying or dividing both sides of an equation by the same non-zero value preserves equality.",
   "applications": ["Clearing coefficients", "Solving for isolated variables"],
   "examples": ["From $3x = 12$, divide by 3: $x = 4$"]
 }'::jsonb),

-- A3: Power of a Power
('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'property', 'A3', 3,
 'Power of a Power Rule',
 '{
   "name": "Power of a Power",
   "formalStatement": "$(a^m)^n = a^{m \\cdot n}$",
   "explanation": "When raising a power to another power, multiply the exponents.",
   "domain": "$a \\in \\mathbb{R}$, $m, n \\in \\mathbb{R}$",
   "examples": ["$(2^3)^2 = 2^{3 \\cdot 2} = 2^6 = 64$", "$(x^2)^3 = x^6$"]
 }'::jsonb),

-- A4: Power of a Product
('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'property', 'A4', 4,
 'Power of a Product Rule',
 '{
   "name": "Power of a Product",
   "formalStatement": "$(ab)^n = a^n \\cdot b^n$",
   "explanation": "When raising a product to a power, each factor is raised to that power.",
   "domain": "$a, b \\in \\mathbb{R}$, $n \\in \\mathbb{R}$",
   "examples": ["$(2x)^3 = 2^3 \\cdot x^3 = 8x^3$"]
 }'::jsonb),

-- A5: Distributive Property
('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'property', 'A5', 5,
 'Distributive Property',
 '{
   "name": "Distributive Property",
   "formalStatement": "$a(b + c) = ab + ac$",
   "explanation": "Multiplication distributes over addition. This works in both directions: expanding and factoring.",
   "examples": ["$3(x + 2) = 3x + 6$", "$2x + 6 = 2(x + 3)$"]
 }'::jsonb),

-- A6: Logarithm of a Power (Power Rule for Logs)
('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'theorem', 'A6', 6,
 'Power Rule for Logarithms',
 '{
   "name": "Power Rule for Logarithms",
   "formalStatement": "$\\log_a(M^n) = n \\cdot \\log_a(M)$",
   "hypothesis": "For $a > 0$, $a \\neq 1$, $M > 0$, $n \\in \\mathbb{R}$",
   "conclusion": "The exponent can be brought down as a coefficient",
   "intuition": "This rule allows us to ''bring down'' exponents, which is essential for solving exponential equations.",
   "proof": [
     {"stepNumber": 1, "statement": "Let $x = \\log_a(M)$, so $a^x = M$", "justification": "Definition of logarithm"},
     {"stepNumber": 2, "statement": "Then $M^n = (a^x)^n = a^{xn}$", "justification": "Power of a Power (A3)"},
     {"stepNumber": 3, "statement": "So $\\log_a(M^n) = xn = n \\cdot \\log_a(M)$", "justification": "Definition of logarithm"}
   ],
   "examples": ["$\\log(5^x) = x \\cdot \\log(5)$", "$\\log_2(8^3) = 3 \\cdot \\log_2(8) = 3 \\cdot 3 = 9$"]
 }'::jsonb),

-- A7: Logarithm Definition
('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'definition', 'A7', 7,
 'Logarithm Definition',
 '{
   "term": "Logarithm",
   "notation": "$\\log_a(b) = x \\iff a^x = b$",
   "formalStatement": "The logarithm base $a$ of $b$ is the exponent $x$ such that $a^x = b$",
   "domain": "$a > 0$, $a \\neq 1$, $b > 0$",
   "intuition": "The logarithm answers: ''What power of $a$ gives $b$?''",
   "examples": ["$\\log_2(8) = 3$ because $2^3 = 8$", "$\\log_{10}(100) = 2$ because $10^2 = 100$"]
 }'::jsonb),

-- A8: Quadratic Formula
('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'theorem', 'A8', 8,
 'Quadratic Formula',
 '{
   "name": "Quadratic Formula",
   "formalStatement": "For $ax^2 + bx + c = 0$ with $a \\neq 0$: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$",
   "hypothesis": "$a \\neq 0$",
   "conclusion": "The solutions are given by the formula above",
   "discriminant": "The discriminant $D = b^2 - 4ac$ determines the number of real solutions: $D > 0$ gives 2 solutions, $D = 0$ gives 1 solution, $D < 0$ gives no real solutions.",
   "examples": ["For $x^2 - 5x + 6 = 0$: $x = \\frac{5 \\pm \\sqrt{25-24}}{2} = \\frac{5 \\pm 1}{2}$, so $x = 3$ or $x = 2$"]
 }'::jsonb)

ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  title = EXCLUDED.title;

-- =====================================================
-- EXPONENTIAL EQUATIONS THEORY BLOCKS (D#, T#, M#, V#, E#)
-- Topic ID: 11111111-1111-1111-1111-111111111107
-- =====================================================

INSERT INTO theory_blocks (id, topic_id, block_type, block_number, order_index, title, content, latex_content) VALUES

-- D1: Definition of Exponential Equation
('e0000000-0000-0000-0001-000000000001', '11111111-1111-1111-1111-111111111107', 'definition', 'D1', 1,
 'Exponential Equation',
 '{
   "term": "Exponential Equation",
   "notation": "$a^{f(x)} = b$",
   "formalStatement": "An equation in which the unknown variable appears in an exponent. The general form is $a^{f(x)} = b$ where $a > 0$, $a \\neq 1$, and $b > 0$.",
   "domain": "$a > 0$, $a \\neq 1$, $b > 0$",
   "examples": [
     "$2^x = 8$ (exponential equation with base 2)",
     "$3^{2x+1} = 27$ (exponential equation with linear exponent)",
     "$5^{x^2} = 125$ (exponential equation with quadratic exponent)"
   ],
   "counterexamples": [
     "$x^2 = 8$ (polynomial equation: variable is base, not exponent)",
     "$(-2)^x = 8$ (invalid: negative base not allowed in general)"
   ],
   "remarks": [
     "The restriction $a \\neq 1$ is essential because $1^x = 1$ for all $x$, making the equation degenerate.",
     "The restriction $b > 0$ is necessary because $a^x > 0$ for all $x$ when $a > 0$."
   ]
 }'::jsonb,
 '$a^{f(x)} = b$ where $a > 0$, $a \neq 1$, $b > 0$'),

-- T1: Equal Bases Principle
('e0000000-0000-0000-0001-000000000002', '11111111-1111-1111-1111-111111111107', 'theorem', 'T1', 2,
 'Equal Bases Principle',
 '{
   "name": "Equal Bases Principle",
   "hypothesis": "For $a > 0$, $a \\neq 1$",
   "conclusion": "$a^m = a^n \\iff m = n$",
   "formalStatement": "If $a > 0$ and $a \\neq 1$, then $a^m = a^n$ if and only if $m = n$",
   "proof": [
     {"stepNumber": 1, "statement": "The exponential function $f(x) = a^x$ is strictly monotonic for $a > 0$, $a \\neq 1$", "justification": "Property of exponential functions: increasing if $a > 1$, decreasing if $0 < a < 1$"},
     {"stepNumber": 2, "statement": "A strictly monotonic function is injective (one-to-one)", "justification": "Definition of injectivity: $f(x_1) = f(x_2) \\Rightarrow x_1 = x_2$"},
     {"stepNumber": 3, "statement": "Therefore, $a^m = a^n$ implies $m = n$", "justification": "Injectivity: equal outputs require equal inputs"}
   ],
   "intuition": "Since exponential functions are one-to-one, if two powers of the same base are equal, their exponents must be equal. This is the foundation of the Same Base Method.",
   "applications": [
     "$2^x = 2^5 \\Rightarrow x = 5$",
     "$3^{2x} = 3^6 \\Rightarrow 2x = 6 \\Rightarrow x = 3$"
   ]
 }'::jsonb,
 '$a^m = a^n \\iff m = n$ for $a > 0$, $a \\neq 1$'),

-- T2: Logarithm-Exponential Inverse
('e0000000-0000-0000-0001-000000000003', '11111111-1111-1111-1111-111111111107', 'theorem', 'T2', 3,
 'Logarithm as Inverse of Exponentiation',
 '{
   "name": "Logarithm-Exponential Inverse Relationship",
   "hypothesis": "For $a > 0$, $a \\neq 1$, and $b > 0$",
   "conclusion": "$a^x = b \\iff x = \\log_a(b)$",
   "formalStatement": "$a^x = b$ if and only if $x = \\log_a(b)$, where $a > 0$, $a \\neq 1$, $b > 0$",
   "proof": [
     {"stepNumber": 1, "statement": "By definition, $\\log_a(b)$ is the unique exponent $x$ such that $a^x = b$", "justification": "Definition A7 (Logarithm)"}
   ],
   "intuition": "The logarithm ''undoes'' exponentiation. If we ask ''what power of $a$ gives $b$?'', the answer is $\\log_a(b)$.",
   "applications": [
     "From $2^x = 10$, we get $x = \\log_2(10) \\approx 3.322$",
     "From $e^x = 5$, we get $x = \\ln(5) \\approx 1.609$"
   ]
 }'::jsonb,
 '$a^x = b \\iff x = \\log_a(b)$'),

-- M1: Same Base Method
('e0000000-0000-0000-0001-000000000004', '11111111-1111-1111-1111-111111111107', 'method', 'M1', 4,
 'Same Base Method',
 '{
   "name": "Same Base Method",
   "applicableWhen": "Both sides of the equation can be expressed as powers of the same base.",
   "steps": [
     {
       "stepNumber": 1,
       "action": "Identify a common base that can express both sides",
       "mathExpression": "Find $a$ such that LHS $= a^{f(x)}$ and RHS $= a^{g(x)}$",
       "justifiedBy": "Recognition of powers: $4 = 2^2$, $8 = 2^3$, $27 = 3^3$, $16 = 2^4$, etc."
     },
     {
       "stepNumber": 2,
       "action": "Rewrite both sides with the common base",
       "mathExpression": "$a^{f(x)} = a^{g(x)}$",
       "justifiedBy": "Substitution of equivalent expressions"
     },
     {
       "stepNumber": 3,
       "action": "Apply the Equal Bases Principle (T1) to equate exponents",
       "mathExpression": "$f(x) = g(x)$",
       "justifiedBy": "By Theorem T1: if bases are equal, exponents are equal"
     },
     {
       "stepNumber": 4,
       "action": "Solve the resulting equation for $x$",
       "justifiedBy": "Standard algebraic techniques (A1, A2)"
     }
   ],
   "warnings": [
     "Ensure the base is positive and not equal to 1",
     "Remember: $(a^m)^n = a^{mn}$ when simplifying powers of powers (Rule A3)",
     "Check that your solution satisfies the original equation"
   ],
   "commonBases": {
     "2": [2, 4, 8, 16, 32, 64],
     "3": [3, 9, 27, 81],
     "5": [5, 25, 125],
     "10": [10, 100, 1000]
   }
 }'::jsonb,
 NULL),

-- M2: Logarithm Method
('e0000000-0000-0000-0001-000000000005', '11111111-1111-1111-1111-111111111107', 'method', 'M2', 5,
 'Logarithm Method',
 '{
   "name": "Logarithm Method",
   "applicableWhen": "The Same Base Method (M1) is not applicable, or when a numerical (approximate) answer is needed.",
   "steps": [
     {
       "stepNumber": 1,
       "action": "Isolate the exponential term on one side",
       "mathExpression": "$a^{f(x)} = b$",
       "justifiedBy": "By Algebra Rules A1, A2 (additive/multiplicative properties)"
     },
     {
       "stepNumber": 2,
       "action": "Take the logarithm of both sides (any base works; common log or natural log)",
       "mathExpression": "$\\log(a^{f(x)}) = \\log(b)$",
       "justifiedBy": "Logarithm is a function: applying the same function to equal values gives equal results"
     },
     {
       "stepNumber": 3,
       "action": "Apply the Power Rule (A6) to bring down the exponent",
       "mathExpression": "$f(x) \\cdot \\log(a) = \\log(b)$",
       "justifiedBy": "By Algebra Rule A6: $\\log(M^n) = n \\cdot \\log(M)$"
     },
     {
       "stepNumber": 4,
       "action": "Solve for $f(x)$ by dividing",
       "mathExpression": "$f(x) = \\frac{\\log(b)}{\\log(a)}$",
       "justifiedBy": "By Algebra Rule A2 (assuming $\\log(a) \\neq 0$, which holds since $a \\neq 1$)"
     },
     {
       "stepNumber": 5,
       "action": "Solve for $x$ if $f(x)$ is not simply $x$",
       "justifiedBy": "Standard algebraic techniques (A1, A2)"
     }
   ],
   "warnings": [
     "Both sides must be positive before taking logarithms (cannot take $\\log$ of negative or zero)",
     "Remember to check that solutions satisfy original domain constraints",
     "The choice of logarithm base does not matter: $\\log_{10}$, $\\ln$, or $\\log_a$ all work"
   ],
   "note": "The result $\\frac{\\log(b)}{\\log(a)}$ is also equal to $\\log_a(b)$ by the change of base formula."
 }'::jsonb,
 NULL),

-- V1: Visual - Exponential Function Behavior
('e0000000-0000-0000-0001-000000000006', '11111111-1111-1111-1111-111111111107', 'visual', 'V1', 6,
 'Graph of Exponential Functions',
 '{
   "description": "Interactive visualization showing how $y = a^x$ behaves for different bases, and how solving $a^x = b$ corresponds to finding the x-coordinate of the intersection with $y = b$.",
   "graphConfig": {
     "type": "function",
     "functions": [
       {"expression": "2^x", "label": "$y = 2^x$", "color": "#3b82f6"},
       {"expression": "3^x", "label": "$y = 3^x$", "color": "#10b981"}
     ],
     "domain": [-3, 4],
     "range": [-1, 20],
     "showGrid": true,
     "showAxis": true,
     "controls": [
       {"id": "base", "label": "Base a", "symbol": "a", "min": 1.1, "max": 5, "step": 0.1, "defaultValue": 2}
     ]
   },
   "algebraicInterpretation": "The horizontal line $y = b$ intersects $y = a^x$ at exactly one point when $b > 0$. The x-coordinate of this intersection is the solution to $a^x = b$, which equals $\\log_a(b)$.",
   "keyObservations": [
     "All exponential functions $y = a^x$ (with $a > 0$) pass through $(0, 1)$ because $a^0 = 1$",
     "As $x \\to \\infty$, $a^x \\to \\infty$ when $a > 1$ (exponential growth)",
     "As $x \\to -\\infty$, $a^x \\to 0$ (approaches horizontal asymptote $y = 0$)",
     "The function is strictly increasing for $a > 1$, which justifies Theorem T1",
     "For $0 < a < 1$, the function is strictly decreasing, but T1 still holds"
   ],
   "annotations": [
     {"type": "point", "x": 0, "y": 1, "label": "$(0, 1)$ - all exponential curves pass here"},
     {"type": "asymptote", "y": 0, "label": "$y = 0$ - horizontal asymptote"}
   ],
   "supportsTheory": ["T1", "T2"]
 }'::jsonb,
 NULL),

-- E1: Worked Example - Same Base Method
('e0000000-0000-0000-0001-000000000007', '11111111-1111-1111-1111-111111111107', 'worked-example', 'E1', 7,
 'Same Base Method Example',
 '{
   "problem": "Solve $4^{x+1} = 8^x$",
   "difficulty": "intermediate",
   "conceptsApplied": ["D1", "T1", "M1", "A3"],
   "solution": [
     {
       "stepNumber": 1,
       "action": "Recognize that 4 and 8 are both powers of 2",
       "calculation": "$4 = 2^2$ and $8 = 2^3$",
       "justification": "By Method M1, Step 1: identify common base",
       "theoryBlockReference": "M1"
     },
     {
       "stepNumber": 2,
       "action": "Rewrite both sides with base 2",
       "calculation": "$(2^2)^{x+1} = (2^3)^x$",
       "justification": "Substitution of equivalent expressions",
       "theoryBlockReference": "M1"
     },
     {
       "stepNumber": 3,
       "action": "Simplify using the power of a power rule",
       "calculation": "$2^{2(x+1)} = 2^{3x}$, which gives $2^{2x+2} = 2^{3x}$",
       "justification": "By Algebra Rule A3: $(a^m)^n = a^{mn}$",
       "theoryBlockReference": "A3"
     },
     {
       "stepNumber": 4,
       "action": "Apply the Equal Bases Principle",
       "calculation": "$2x + 2 = 3x$",
       "justification": "By Theorem T1: bases equal implies exponents equal",
       "theoryBlockReference": "T1"
     },
     {
       "stepNumber": 5,
       "action": "Solve the linear equation",
       "calculation": "$2 = 3x - 2x$, so $x = 2$",
       "justification": "By Algebra Rule A1: subtract $2x$ from both sides",
       "theoryBlockReference": "A1"
     }
   ],
   "finalAnswer": "$x = 2$",
   "verification": "Check: $4^{2+1} = 4^3 = 64$ and $8^2 = 64$. \\checkmark",
   "commonErrors": [
     "Forgetting to multiply exponents when simplifying $(2^2)^{x+1}$",
     "Writing $2^{2x+1}$ instead of $2^{2x+2}$"
   ]
 }'::jsonb,
 NULL),

-- E2: Worked Example - Logarithm Method
('e0000000-0000-0000-0001-000000000008', '11111111-1111-1111-1111-111111111107', 'worked-example', 'E2', 8,
 'Logarithm Method Example',
 '{
   "problem": "Solve $5^x = 20$",
   "difficulty": "basic",
   "conceptsApplied": ["D1", "T2", "M2", "A6"],
   "solution": [
     {
       "stepNumber": 1,
       "action": "The exponential term is already isolated",
       "calculation": "$5^x = 20$",
       "justification": "By Method M2, Step 1: isolate exponential term (already done)",
       "theoryBlockReference": "M2"
     },
     {
       "stepNumber": 2,
       "action": "Take the logarithm of both sides",
       "calculation": "$\\log(5^x) = \\log(20)$",
       "justification": "By Method M2, Step 2: apply log to both sides",
       "theoryBlockReference": "M2"
     },
     {
       "stepNumber": 3,
       "action": "Apply the Power Rule to bring down the exponent",
       "calculation": "$x \\cdot \\log(5) = \\log(20)$",
       "justification": "By Algebra Rule A6: $\\log(M^n) = n \\cdot \\log(M)$",
       "theoryBlockReference": "A6"
     },
     {
       "stepNumber": 4,
       "action": "Solve for $x$ by dividing",
       "calculation": "$x = \\frac{\\log(20)}{\\log(5)} = \\frac{1.301}{0.699} \\approx 1.861$",
       "justification": "By Method M2, Step 4: divide to isolate $x$",
       "theoryBlockReference": "M2"
     }
   ],
   "finalAnswer": "$x = \\frac{\\log(20)}{\\log(5)} \\approx 1.861$",
   "verification": "Check: $5^{1.861} \\approx 20.0$. \\checkmark",
   "commonErrors": [
     "Forgetting to apply the power rule, leaving $\\log(5^x)$ unsimplified",
     "Dividing in wrong order: $\\frac{\\log(5)}{\\log(20)}$ instead of $\\frac{\\log(20)}{\\log(5)}$"
   ],
   "alternativeMethod": "Using natural log: $x = \\frac{\\ln(20)}{\\ln(5)} = \\frac{2.996}{1.609} \\approx 1.861$"
 }'::jsonb,
 NULL),

-- E3: Worked Example - Mixed (requires isolating first)
('e0000000-0000-0000-0001-000000000009', '11111111-1111-1111-1111-111111111107', 'worked-example', 'E3', 9,
 'Logarithm Method with Isolation',
 '{
   "problem": "Solve $2 \\cdot 3^x + 5 = 23$",
   "difficulty": "intermediate",
   "conceptsApplied": ["D1", "M2", "A1", "A2", "A6"],
   "solution": [
     {
       "stepNumber": 1,
       "action": "Subtract 5 from both sides to begin isolating the exponential",
       "calculation": "$2 \\cdot 3^x = 18$",
       "justification": "By Algebra Rule A1: additive property of equality",
       "theoryBlockReference": "A1"
     },
     {
       "stepNumber": 2,
       "action": "Divide both sides by 2 to fully isolate the exponential",
       "calculation": "$3^x = 9$",
       "justification": "By Algebra Rule A2: multiplicative property of equality",
       "theoryBlockReference": "A2"
     },
     {
       "stepNumber": 3,
       "action": "Recognize that 9 is a power of 3, so use Same Base Method",
       "calculation": "$3^x = 3^2$",
       "justification": "Observation: $9 = 3^2$; applying Method M1",
       "theoryBlockReference": "M1"
     },
     {
       "stepNumber": 4,
       "action": "Apply Equal Bases Principle",
       "calculation": "$x = 2$",
       "justification": "By Theorem T1: equal bases implies equal exponents",
       "theoryBlockReference": "T1"
     }
   ],
   "finalAnswer": "$x = 2$",
   "verification": "Check: $2 \\cdot 3^2 + 5 = 2 \\cdot 9 + 5 = 18 + 5 = 23$. \\checkmark"
 }'::jsonb,
 NULL)

ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  title = EXCLUDED.title,
  latex_content = EXCLUDED.latex_content;