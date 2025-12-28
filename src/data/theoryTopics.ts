import { TheoryTopic } from '@/components/theory/types';
import { TOPIC_DATABASE_IDS } from './topicDatabaseMapping';

// Topic IDs for routing
export const TOPIC_IDS = {
  FIRST_DEGREE_EQUATIONS: 'first-degree-equations',
  FRACTIONS: 'fractions',
  QUADRATIC_EQUATIONS: 'quadratic-equations',
  EXPONENTS: 'exponents',
  LOGARITHMS: 'logarithms',
  EPSILON_DELTA: 'epsilon-delta',
  // New topics
  HIGHER_DEGREE_EQUATIONS: 'higher-degree-equations',
  INEQUALITIES: 'inequalities',
  EXPONENTIAL_EQUATIONS: 'exponential-equations',
  LOGARITHMIC_EQUATIONS: 'logarithmic-equations',
  LINEAR_FUNCTIONS: 'linear-functions',
  QUADRATIC_FUNCTIONS: 'quadratic-functions',
  POLYNOMIAL_FUNCTIONS: 'polynomial-functions',
  RATIONAL_FUNCTIONS: 'rational-functions',
  LIMITS: 'limits',
  DERIVATIVES_BASICS: 'derivatives-basics',
  DERIVATIVE_APPLICATIONS: 'derivative-applications',
  CHAIN_RULE: 'chain-rule',
  TRIGONOMETRY_BASICS: 'trigonometry-basics',
  TRIGONOMETRIC_EQUATIONS: 'trigonometric-equations',
} as const;

// First-Degree Equations Theory
export const firstDegreeEquationsTheory: TheoryTopic = {
  id: TOPIC_IDS.FIRST_DEGREE_EQUATIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['first-degree-equations'],
  title: 'First-Degree Equations',
  subtitle: 'Master solving linear equations with one or more variables.',
  breadcrumb: [
    { label: 'Algebra', href: '/topics/algebra' },
    { label: 'Equations', href: '/topics/algebra/equations' },
    { label: 'First-Degree' },
  ],
  practiceUrl: '/practice/first-degree-equations',
  nextTopicId: TOPIC_IDS.FRACTIONS,
  nextTopicTitle: 'Fractions',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **first-degree equation** (or linear equation) is an equation where the highest power of the variable is 1.

The standard form of a linear equation in one variable is:`,
      formula: `ax + b = 0 \\quad \\text{where } a \\neq 0`,
      note: 'The solution is always a single value: x = -b/a',
    },
    {
      type: 'intuitive-explanation',
      title: 'What Are We Really Doing?',
      paragraphs: [
        `Solving an equation means finding the value that makes both sides equal. Think of it as a balance scale — whatever you do to one side, you must do to the other.`,
        `First-degree equations are the simplest type. They have exactly one solution because a straight line crosses the x-axis at exactly one point.`,
        `The goal is to isolate the variable by undoing operations: if something is added, subtract it; if multiplied, divide.`,
      ],
      metaphor: 'Think of x as a mystery number hidden under a blanket of operations. We peel off each layer until x stands alone.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Basic Equation',
      problem: `Solve: $7x + 40 = 58$`,
      steps: [
        {
          explanation: 'Subtract 40 from both sides to isolate the term with x:',
          math: `7x + 40 - 40 = 58 - 40`,
        },
        {
          explanation: 'Simplify:',
          math: `7x = 18`,
          highlight: true,
        },
        {
          explanation: 'Divide both sides by 7:',
          math: `x = \\frac{18}{7}`,
        },
      ],
      finalAnswer: '$x = \\frac{18}{7}$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Equation with Fractions',
      problem: `Solve: $\\frac{2x - 3}{5} = \\frac{x + 1}{3}$`,
      steps: [
        {
          explanation: 'Cross-multiply to eliminate fractions:',
          math: `3(2x - 3) = 5(x + 1)`,
        },
        {
          explanation: 'Expand both sides:',
          math: `6x - 9 = 5x + 5`,
        },
        {
          explanation: 'Subtract 5x from both sides:',
          math: `x - 9 = 5`,
          highlight: true,
        },
        {
          explanation: 'Add 9 to both sides:',
          math: `x = 14`,
        },
      ],
      finalAnswer: '$x = 14$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: System of Two Variables',
      problem: `Solve: $\\begin{cases} 2x + 3y = 12 \\\\ x - y = 1 \\end{cases}$`,
      steps: [
        {
          explanation: 'From the second equation, express x in terms of y:',
          math: `x = y + 1`,
        },
        {
          explanation: 'Substitute into the first equation:',
          math: `2(y + 1) + 3y = 12`,
        },
        {
          explanation: 'Expand and combine like terms:',
          math: `2y + 2 + 3y = 12 \\Rightarrow 5y = 10`,
          highlight: true,
        },
        {
          explanation: 'Solve for y, then find x:',
          math: `y = 2, \\quad x = 2 + 1 = 3`,
        },
      ],
      finalAnswer: '$x = 3, \\; y = 2$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'Why can\'t a = 0 in the standard form?',
          answer: `If $a = 0$, the equation becomes $b = 0$, which is either always true (infinite solutions) or always false (no solutions). It's no longer an equation to solve.`,
        },
        {
          question: 'What if the equation has parameters?',
          answer: `When an equation contains a parameter (like $k$), you solve for $x$ in terms of $k$. Sometimes you must consider special cases where $k$ takes values that would make coefficients zero.`,
        },
        {
          question: 'How do I check my answer?',
          answer: `Substitute your solution back into the original equation. If both sides are equal, your answer is correct. Always verify with the original form, not a simplified version.`,
        },
      ],
    },
  ],
};

// Fractions Theory
export const fractionsTheory: TheoryTopic = {
  id: TOPIC_IDS.FRACTIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['fractions'],
  title: 'Fractions',
  subtitle: 'Master all fraction operations: multiply, divide, add, subtract.',
  breadcrumb: [
    { label: 'Algebra', href: '/topics/algebra' },
    { label: 'Arithmetic', href: '/topics/algebra/arithmetic' },
    { label: 'Fractions' },
  ],
  practiceUrl: '/practice/fractions',
  nextTopicId: TOPIC_IDS.QUADRATIC_EQUATIONS,
  nextTopicTitle: 'Quadratic Equations',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **fraction** represents a part of a whole, written as one number over another:`,
      formula: `\\frac{a}{b} \\quad \\text{where } b \\neq 0`,
      note: 'The top number (a) is the numerator. The bottom number (b) is the denominator.',
    },
    {
      type: 'intuitive-explanation',
      title: 'The Four Operations',
      paragraphs: [
        `**Multiplication:** Multiply straight across — numerator times numerator, denominator times denominator.`,
        `**Division:** Flip the second fraction and multiply. "Keep, Change, Flip."`,
        `**Addition/Subtraction:** You need a common denominator first. Then add or subtract only the numerators.`,
        `Always simplify your final answer by canceling common factors.`,
      ],
      metaphor: 'Fractions are like pizza slices. You can only add slices if they\'re cut the same way (same denominator).',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Multiplication',
      problem: `Simplify: $\\frac{3a^2b}{4c} \\cdot \\frac{8c^2}{9ab}$`,
      steps: [
        {
          explanation: 'Multiply numerators and denominators:',
          math: `\\frac{3a^2b \\cdot 8c^2}{4c \\cdot 9ab}`,
        },
        {
          explanation: 'Expand the products:',
          math: `\\frac{24a^2bc^2}{36abc}`,
        },
        {
          explanation: 'Cancel common factors (GCD = 12abc):',
          math: `\\frac{24a^2bc^2}{36abc} = \\frac{2ac}{3}`,
          highlight: true,
        },
      ],
      finalAnswer: '$\\frac{2ac}{3}$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Division',
      problem: `Simplify: $\\frac{x^2 - 4}{x + 3} \\div \\frac{x - 2}{x^2 - 9}$`,
      steps: [
        {
          explanation: 'Flip the second fraction and multiply:',
          math: `\\frac{x^2 - 4}{x + 3} \\cdot \\frac{x^2 - 9}{x - 2}`,
        },
        {
          explanation: 'Factor all polynomials:',
          math: `\\frac{(x-2)(x+2)}{x + 3} \\cdot \\frac{(x-3)(x+3)}{x - 2}`,
        },
        {
          explanation: 'Cancel (x-2) and (x+3):',
          math: `(x+2)(x-3)`,
          highlight: true,
        },
        {
          explanation: 'Expand if required:',
          math: `x^2 - x - 6`,
        },
      ],
      finalAnswer: '$(x+2)(x-3) = x^2 - x - 6$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Adding Fractions',
      problem: `Simplify: $\\frac{2}{x-1} + \\frac{3}{x+1}$`,
      steps: [
        {
          explanation: 'Find the common denominator: $(x-1)(x+1)$',
          math: `\\frac{2(x+1)}{(x-1)(x+1)} + \\frac{3(x-1)}{(x-1)(x+1)}`,
        },
        {
          explanation: 'Combine numerators:',
          math: `\\frac{2(x+1) + 3(x-1)}{(x-1)(x+1)}`,
        },
        {
          explanation: 'Expand and simplify the numerator:',
          math: `\\frac{2x + 2 + 3x - 3}{x^2 - 1} = \\frac{5x - 1}{x^2 - 1}`,
          highlight: true,
        },
      ],
      finalAnswer: '$\\frac{5x - 1}{x^2 - 1}$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'What is a complex fraction?',
          answer: `A complex fraction has fractions in the numerator, denominator, or both. To simplify, multiply by the LCD of all inner fractions to eliminate the "fractions within fractions."`,
        },
        {
          question: 'Why can\'t the denominator be zero?',
          answer: `Division by zero is undefined in mathematics. If the denominator equals zero, the fraction has no meaning. Always note restrictions on variables.`,
        },
        {
          question: 'When should I factor before multiplying?',
          answer: `Always factor first! This makes it easier to identify and cancel common factors before doing any multiplication. Less work, fewer errors.`,
        },
      ],
    },
  ],
};

// Quadratic Equations Theory
export const quadraticEquationsTheory: TheoryTopic = {
  id: TOPIC_IDS.QUADRATIC_EQUATIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['quadratic-equations'],
  title: 'Quadratic Equations',
  subtitle: 'Solve second-degree equations using factoring, the formula, and completing the square.',
  breadcrumb: [
    { label: 'Algebra', href: '/topics/algebra' },
    { label: 'Equations', href: '/topics/algebra/equations' },
    { label: 'Quadratic' },
  ],
  practiceUrl: '/practice/quadratic-equations',
  nextTopicId: TOPIC_IDS.EXPONENTS,
  nextTopicTitle: 'Exponents',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **quadratic equation** is a second-degree polynomial equation of the form:`,
      formula: `ax^2 + bx + c = 0 \\quad \\text{where } a \\neq 0`,
      note: 'Every quadratic has at most two solutions (real or complex).',
    },
    {
      type: 'formal-definition',
      content: `The solutions are given by the **quadratic formula**:`,
      formula: `x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`,
      note: 'The discriminant Δ = b² - 4ac determines the nature of the roots.',
    },
    {
      type: 'intuitive-explanation',
      title: 'Understanding the Discriminant',
      paragraphs: [
        `The discriminant $\\Delta = b^2 - 4ac$ tells you everything about the solutions:`,
        `$\\Delta > 0$: Two distinct real roots. The parabola crosses the x-axis at two points.`,
        `$\\Delta = 0$: One repeated root. The parabola touches the x-axis at exactly one point (the vertex).`,
        `$\\Delta < 0$: No real roots. The parabola never touches the x-axis. Solutions are complex.`,
      ],
      metaphor: 'The discriminant is like a preview — it tells you what to expect before you even solve.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Factoring Method',
      problem: `Solve: $x^2 - 5x + 6 = 0$`,
      steps: [
        {
          explanation: 'Find two numbers that multiply to 6 and add to -5:',
          math: `(-2) \\times (-3) = 6, \\quad (-2) + (-3) = -5`,
        },
        {
          explanation: 'Factor the quadratic:',
          math: `(x - 2)(x - 3) = 0`,
          highlight: true,
        },
        {
          explanation: 'Apply the zero product property:',
          math: `x - 2 = 0 \\text{ or } x - 3 = 0`,
        },
      ],
      finalAnswer: '$x = 2$ or $x = 3$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Quadratic Formula',
      problem: `Solve: $2x^2 + 3x - 5 = 0$`,
      steps: [
        {
          explanation: 'Identify coefficients: $a = 2$, $b = 3$, $c = -5$',
        },
        {
          explanation: 'Calculate the discriminant:',
          math: `\\Delta = 3^2 - 4(2)(-5) = 9 + 40 = 49`,
        },
        {
          explanation: 'Apply the quadratic formula:',
          math: `x = \\frac{-3 \\pm \\sqrt{49}}{2 \\cdot 2} = \\frac{-3 \\pm 7}{4}`,
          highlight: true,
        },
        {
          explanation: 'Calculate both solutions:',
          math: `x_1 = \\frac{-3 + 7}{4} = 1, \\quad x_2 = \\frac{-3 - 7}{4} = -\\frac{5}{2}`,
        },
      ],
      finalAnswer: '$x = 1$ or $x = -\\frac{5}{2}$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Completing the Square',
      problem: `Solve: $x^2 + 6x + 5 = 0$`,
      steps: [
        {
          explanation: 'Move the constant to the right side:',
          math: `x^2 + 6x = -5`,
        },
        {
          explanation: 'Add $(6/2)^2 = 9$ to both sides:',
          math: `x^2 + 6x + 9 = -5 + 9`,
        },
        {
          explanation: 'Factor the left side as a perfect square:',
          math: `(x + 3)^2 = 4`,
          highlight: true,
        },
        {
          explanation: 'Take the square root of both sides:',
          math: `x + 3 = \\pm 2 \\Rightarrow x = -1 \\text{ or } x = -5`,
        },
      ],
      finalAnswer: '$x = -1$ or $x = -5$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'When should I use factoring vs. the formula?',
          answer: `Use factoring when the equation has nice integer roots (you can spot the factors quickly). Use the formula when factoring seems difficult or when you need exact answers with radicals.`,
        },
        {
          question: 'What is Vieta\'s formulas?',
          answer: `For $ax^2 + bx + c = 0$ with roots $r$ and $s$: the sum $r + s = -\\frac{b}{a}$ and the product $rs = \\frac{c}{a}$. Useful for checking answers or finding roots without full solving.`,
        },
        {
          question: 'How do parameters change the equation?',
          answer: `When the equation contains a parameter $k$, you may need to consider cases where the discriminant is positive, zero, or negative. Different values of $k$ can give different numbers of real solutions.`,
        },
      ],
    },
  ],
  visualizer: {
    type: 'interactive',
    title: 'Parabola Visualizer',
    badge: 'Interactive',
    badgeVariant: 'default',
    description: 'See how changing coefficients affects the parabola and its roots.',
    controls: [
      {
        id: 'a',
        label: 'Coefficient a',
        symbol: 'a',
        min: -2,
        max: 2,
        step: 0.5,
        defaultValue: 1,
      },
      {
        id: 'b',
        label: 'Coefficient b',
        symbol: 'b',
        min: -5,
        max: 5,
        step: 0.5,
        defaultValue: 0,
      },
    ],
    graphConfig: {
      function: 'x^2',
      domain: [-5, 5],
      range: [-5, 10],
      showGrid: true,
      showAxis: true,
    },
  },
};

// Exponents Theory
export const exponentsTheory: TheoryTopic = {
  id: TOPIC_IDS.EXPONENTS,
  databaseTopicId: TOPIC_DATABASE_IDS['exponents'],
  title: 'Exponents',
  subtitle: 'Master the laws of exponents and simplify exponential expressions.',
  breadcrumb: [
    { label: 'Algebra', href: '/topics/algebra' },
    { label: 'Expressions', href: '/topics/algebra/expressions' },
    { label: 'Exponents' },
  ],
  practiceUrl: '/practice/exponents',
  nextTopicId: TOPIC_IDS.LOGARITHMS,
  nextTopicTitle: 'Logarithms',
  blocks: [
    {
      type: 'formal-definition',
      content: `An **exponent** indicates how many times to multiply a base by itself:`,
      formula: `a^n = \\underbrace{a \\times a \\times \\cdots \\times a}_{n \\text{ times}}`,
      note: 'Here, a is the base and n is the exponent (or power).',
    },
    {
      type: 'formal-definition',
      content: `The fundamental **laws of exponents** are:`,
      formula: `\\begin{aligned}
a^m \\cdot a^n &= a^{m+n} \\\\[4pt]
\\frac{a^m}{a^n} &= a^{m-n} \\\\[4pt]
(a^m)^n &= a^{mn} \\\\[4pt]
(ab)^n &= a^n b^n \\\\[4pt]
a^0 &= 1 \\; (a \\neq 0) \\\\[4pt]
a^{-n} &= \\frac{1}{a^n}
\\end{aligned}`,
    },
    {
      type: 'intuitive-explanation',
      title: 'Building Intuition',
      paragraphs: [
        `**Product rule:** When multiplying same bases, you're combining the repeated multiplications. $a^3 \\cdot a^2 = (aaa)(aa) = a^5$.`,
        `**Quotient rule:** When dividing, you cancel factors. $a^5 / a^2 = (aaaaa)/(aa) = aaa = a^3$.`,
        `**Power of a power:** Each of the $m$ factors gets raised to $n$. It's multiplication, not addition.`,
        `**Negative exponents:** These flip the base to the denominator. $2^{-3} = 1/2^3 = 1/8$.`,
      ],
      metaphor: 'Exponents are shorthand for repeated multiplication, just as multiplication is shorthand for repeated addition.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Simplifying Products',
      problem: `Simplify: $\\frac{2^5 \\cdot 4^3}{8^2}$`,
      steps: [
        {
          explanation: 'Express all terms with base 2:',
          math: `4 = 2^2, \\quad 8 = 2^3`,
        },
        {
          explanation: 'Rewrite the expression:',
          math: `\\frac{2^5 \\cdot (2^2)^3}{(2^3)^2} = \\frac{2^5 \\cdot 2^6}{2^6}`,
        },
        {
          explanation: 'Apply exponent rules:',
          math: `\\frac{2^{11}}{2^6} = 2^{11-6} = 2^5`,
          highlight: true,
        },
      ],
      finalAnswer: '$2^5 = 32$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Negative and Fractional Exponents',
      problem: `Simplify: $\\frac{x^{-2} \\cdot x^5}{x^{-1}}$`,
      steps: [
        {
          explanation: 'Apply the product rule to the numerator:',
          math: `x^{-2} \\cdot x^5 = x^{-2+5} = x^3`,
        },
        {
          explanation: 'Apply the quotient rule:',
          math: `\\frac{x^3}{x^{-1}} = x^{3-(-1)} = x^4`,
          highlight: true,
        },
      ],
      finalAnswer: '$x^4$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Fractional Exponents (Roots)',
      problem: `Simplify: $\\left( \\frac{27}{8} \\right)^{\\frac{2}{3}}$`,
      steps: [
        {
          explanation: 'Apply the fractional exponent to numerator and denominator:',
          math: `\\frac{27^{2/3}}{8^{2/3}}`,
        },
        {
          explanation: 'Interpret $a^{2/3}$ as $(\\sqrt[3]{a})^2$:',
          math: `\\frac{(\\sqrt[3]{27})^2}{(\\sqrt[3]{8})^2} = \\frac{3^2}{2^2}`,
          highlight: true,
        },
        {
          explanation: 'Calculate:',
          math: `\\frac{9}{4}`,
        },
      ],
      finalAnswer: '$\\frac{9}{4}$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'Why is a⁰ = 1?',
          answer: `Consider $a^n / a^n = a^{n-n} = a^0$. But any number divided by itself equals 1. So $a^0 = 1$ (when $a \\neq 0$).`,
        },
        {
          question: 'What does a^(1/2) mean?',
          answer: `$a^{1/2} = \\sqrt{a}$ because $(a^{1/2})^2 = a^1 = a$. More generally, $a^{1/n} = \\sqrt[n]{a}$, the nth root of a.`,
        },
        {
          question: 'What about negative bases?',
          answer: `Be careful! $(-2)^2 = 4$ but $-2^2 = -4$. Parentheses matter. Also, $(-a)^{1/2}$ is undefined in real numbers when $a > 0$.`,
        },
      ],
    },
  ],
};

// Logarithms Theory
export const logarithmsTheory: TheoryTopic = {
  id: TOPIC_IDS.LOGARITHMS,
  databaseTopicId: TOPIC_DATABASE_IDS['logarithms'],
  title: 'Logarithms',
  subtitle: 'Understand logarithms as the inverse of exponentiation.',
  breadcrumb: [
    { label: 'Algebra', href: '/topics/algebra' },
    { label: 'Expressions', href: '/topics/algebra/expressions' },
    { label: 'Logarithms' },
  ],
  practiceUrl: '/practice/logarithms',
  nextTopicId: 'linear-functions',
  nextTopicTitle: 'Linear Functions',
  blocks: [
    {
      type: 'formal-definition',
      content: `The **logarithm** base $b$ of $x$ is the exponent to which $b$ must be raised to get $x$:`,
      formula: `\\log_b(x) = y \\iff b^y = x \\quad (b > 0, b \\neq 1, x > 0)`,
      note: 'Logarithms and exponents are inverse operations.',
    },
    {
      type: 'formal-definition',
      content: `The fundamental **logarithm properties** are:`,
      formula: `\\begin{aligned}
\\log_b(xy) &= \\log_b(x) + \\log_b(y) \\\\[4pt]
\\log_b\\left(\\frac{x}{y}\\right) &= \\log_b(x) - \\log_b(y) \\\\[4pt]
\\log_b(x^n) &= n \\cdot \\log_b(x) \\\\[4pt]
\\log_b(b) &= 1 \\\\[4pt]
\\log_b(1) &= 0
\\end{aligned}`,
    },
    {
      type: 'intuitive-explanation',
      title: 'The Core Insight',
      paragraphs: [
        `A logarithm answers the question: "What power do I raise the base to in order to get this number?"`,
        `$\\log_2(8) = 3$ because $2^3 = 8$. The answer is the exponent.`,
        `**Product rule:** Logs turn multiplication into addition (useful for simplifying products).`,
        `**Power rule:** Logs bring exponents down as coefficients (key for solving exponential equations).`,
      ],
      metaphor: 'If exponents ask "what do I get?", logarithms ask "what power did I use?"',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Evaluating Logarithms',
      problem: `Evaluate: $\\log_3(81)$`,
      steps: [
        {
          explanation: 'Ask: "3 to what power equals 81?"',
        },
        {
          explanation: 'Express 81 as a power of 3:',
          math: `81 = 3^4`,
          highlight: true,
        },
        {
          explanation: 'Therefore:',
          math: `\\log_3(81) = 4`,
        },
      ],
      finalAnswer: '$\\log_3(81) = 4$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Using Properties',
      problem: `Simplify: $\\log_2(8) + \\log_2(4) - \\log_2(2)$`,
      steps: [
        {
          explanation: 'Evaluate each logarithm:',
          math: `\\log_2(8) = 3, \\quad \\log_2(4) = 2, \\quad \\log_2(2) = 1`,
        },
        {
          explanation: 'Add and subtract:',
          math: `3 + 2 - 1 = 4`,
          highlight: true,
        },
      ],
      finalAnswer: '$4$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Change of Base',
      problem: `Express $\\log_4(32)$ using base 2`,
      steps: [
        {
          explanation: 'Use the change of base formula:',
          math: `\\log_4(32) = \\frac{\\log_2(32)}{\\log_2(4)}`,
        },
        {
          explanation: 'Evaluate each logarithm:',
          math: `\\log_2(32) = 5, \\quad \\log_2(4) = 2`,
        },
        {
          explanation: 'Divide:',
          math: `\\frac{5}{2}`,
          highlight: true,
        },
      ],
      finalAnswer: '$\\log_4(32) = \\frac{5}{2}$',
    },
    {
      type: 'worked-example',
      title: 'Example 4: Expanding Expressions',
      problem: `Expand: $\\log_b\\left( \\frac{x^3 \\sqrt{y}}{z^2} \\right)$`,
      steps: [
        {
          explanation: 'Apply the quotient rule:',
          math: `\\log_b(x^3 \\sqrt{y}) - \\log_b(z^2)`,
        },
        {
          explanation: 'Apply the product rule to the first term:',
          math: `\\log_b(x^3) + \\log_b(\\sqrt{y}) - \\log_b(z^2)`,
        },
        {
          explanation: 'Apply the power rule (note $\\sqrt{y} = y^{1/2}$):',
          math: `3\\log_b(x) + \\frac{1}{2}\\log_b(y) - 2\\log_b(z)`,
          highlight: true,
        },
      ],
      finalAnswer: '$3\\log_b(x) + \\frac{1}{2}\\log_b(y) - 2\\log_b(z)$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'What is the natural logarithm?',
          answer: `The natural logarithm $\\ln(x) = \\log_e(x)$ uses the special base $e \\approx 2.718$. It appears naturally in calculus, compound interest, and exponential growth/decay.`,
        },
        {
          question: 'Why must x > 0 for log(x)?',
          answer: `Because $b^y$ is always positive for any base $b > 0$. You cannot raise a positive number to any power and get zero or a negative result. So logarithms are only defined for positive inputs.`,
        },
        {
          question: 'What is the change of base formula?',
          answer: `$\\log_a(x) = \\frac{\\log_b(x)}{\\log_b(a)}$ for any valid base $b$. This allows you to convert between any two bases, or to compute logs using a calculator that only has log₁₀ or ln.`,
        },
      ],
    },
  ],
};

// Epsilon-Delta Definition of Limits (existing)
export const limitsTheory: TheoryTopic = {
  id: TOPIC_IDS.EPSILON_DELTA,
  databaseTopicId: TOPIC_DATABASE_IDS['epsilon-delta'],
  title: 'Understanding the Limit',
  subtitle: 'Visualizing ε-δ relationships in real-time to build intuition.',
  breadcrumb: [
    { label: 'Calculus', href: '/topics/calculus' },
    { label: 'Limits', href: '/topics/calculus/limits' },
    { label: 'Epsilon-Delta Definition' },
  ],
  practiceUrl: '/practice/limits',
  nextTopicId: 'limit-laws',
  nextTopicTitle: 'Limit Laws',
  blocks: [
    {
      type: 'formal-definition',
      content: `Let $f$ be a function defined on an open interval containing $c$ (except possibly at $c$) and let $L$ be a real number.

The statement that the limit of $f(x)$ as $x$ approaches $c$ is $L$ means that:`,
      formula: `\\forall \\varepsilon > 0, \\exists \\delta > 0 \\text{ s.t. } 0 < |x - c| < \\delta \\Rightarrow |f(x) - L| < \\varepsilon`,
      note: 'This is the precise mathematical definition that underpins all of calculus.',
    },
    {
      type: 'intuitive-explanation',
      title: 'Intuitive Breakdown',
      paragraphs: [
        `Imagine you are challenging someone. You say, "I bet you cannot get the function value $f(x)$ within a tiny distance $\\varepsilon$ of the target $L$."`,
        `To win the challenge, they must find a range around $c$ (width $\\delta$) such that every $x$ inside lands within your $\\varepsilon$ target. If they can always find such a $\\delta$, no matter how small you make $\\varepsilon$, the limit exists.`,
      ],
      metaphor: 'Think of ε as your tolerance for error, and δ as how carefully you need to aim.',
    },
    {
      type: 'worked-example',
      title: 'Example: Proving a Limit',
      problem: `Prove that $\\lim_{x \\to 2} (3x - 1) = 5$`,
      steps: [
        {
          explanation: 'We need to show: for any $\\varepsilon > 0$, we can find $\\delta > 0$ such that $|x - 2| < \\delta$ implies $|(3x-1) - 5| < \\varepsilon$.',
        },
        {
          explanation: 'Simplify the target inequality:',
          math: `|(3x - 1) - 5| = |3x - 6| = 3|x - 2|`,
        },
        {
          explanation: 'We want $3|x - 2| < \\varepsilon$, which means:',
          math: `|x - 2| < \\frac{\\varepsilon}{3}`,
          highlight: true,
        },
        {
          explanation: 'So we can choose $\\delta = \\varepsilon / 3$. For any $\\varepsilon > 0$, this $\\delta$ works.',
        },
      ],
      finalAnswer: '$\\delta = \\frac{\\varepsilon}{3}$ proves the limit exists and equals 5.',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'Why must δ depend on ε?',
          answer: `Because $\\varepsilon$ represents how close to $L$ you want to be. Smaller $\\varepsilon$ means stricter requirements, so you typically need a smaller $\\delta$ (tighter control on $x$) to guarantee $f(x)$ stays within that tighter bound.`,
        },
        {
          question: 'What happens if the limit does not exist?',
          answer: `If no matter what $\\delta$ you try, you cannot keep $f(x)$ within $\\varepsilon$ of a single value $L$, then the limit does not exist. This happens when the function oscillates, has a jump, or approaches different values from the left and right.`,
        },
        {
          question: 'Is the value at x = c important?',
          answer: `No! The limit only cares about what happens near $c$, not at $c$. The function does not even need to be defined at $c$ for the limit to exist. This is why limits are so powerful—they describe behavior as you approach a point.`,
        },
      ],
    },
  ],
  visualizer: {
    type: 'interactive',
    title: 'Limit exists',
    badge: 'Convergent',
    badgeVariant: 'success',
    description: 'Adjust ε and δ to see how they constrain the function.',
    controls: [
      {
        id: 'epsilon',
        label: 'Epsilon',
        symbol: 'ε',
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
      },
      {
        id: 'delta',
        label: 'Delta',
        symbol: 'δ',
        min: 0.1,
        max: 0.5,
        step: 0.05,
        defaultValue: 0.25,
      },
    ],
    graphConfig: {
      function: 'x^2',
      domain: [-1, 4],
      range: [-1, 10],
      showGrid: true,
      showAxis: true,
    },
  },
};

// Higher Degree Equations Theory
export const higherDegreeEquationsTheory: TheoryTopic = {
  id: TOPIC_IDS.HIGHER_DEGREE_EQUATIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['higher-degree-equations'],
  title: 'Higher Degree Equations',
  subtitle: 'Solve biquadratic, radical, and polynomial equations of degree 3+.',
  breadcrumb: [
    { label: 'Algebra', href: '/topics/algebra' },
    { label: 'Equations', href: '/topics/algebra/equations' },
    { label: 'Higher Degree' },
  ],
  practiceUrl: '/practice/higher-degree-equations',
  nextTopicId: TOPIC_IDS.INEQUALITIES,
  nextTopicTitle: 'Inequalities',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **biquadratic equation** has the form:`,
      formula: `ax^4 + bx^2 + c = 0 \\quad \\text{where } a \\neq 0`,
      note: 'Substitute u = x² to convert to a quadratic in u.',
    },
    {
      type: 'formal-definition',
      content: `A **radical equation** contains the variable under a root:`,
      formula: `\\sqrt{f(x)} = g(x)`,
      note: 'Square both sides, but always check for extraneous solutions.',
    },
    {
      type: 'intuitive-explanation',
      title: 'Strategy Overview',
      paragraphs: [
        `**Biquadratic equations:** Use substitution $u = x^2$ to reduce to a quadratic. Solve for $u$, then take square roots to find $x$. Remember: $u$ must be non-negative for real solutions.`,
        `**Radical equations:** Isolate the radical, then square both sides. This can introduce extraneous solutions, so always verify by substituting back.`,
        `**Higher degree polynomials:** Look for rational roots using the Rational Root Theorem, or factor by grouping.`,
      ],
      metaphor: 'Higher degree equations are puzzles that reduce to simpler ones through clever substitution.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Biquadratic Equation',
      problem: `Solve: $x^4 - 5x^2 + 4 = 0$`,
      steps: [
        {
          explanation: 'Substitute $u = x^2$:',
          math: `u^2 - 5u + 4 = 0`,
        },
        {
          explanation: 'Factor the quadratic:',
          math: `(u - 1)(u - 4) = 0`,
          highlight: true,
        },
        {
          explanation: 'Solve for $u$: $u = 1$ or $u = 4$',
        },
        {
          explanation: 'Back-substitute and solve for $x$:',
          math: `x^2 = 1 \\Rightarrow x = \\pm 1 \\quad x^2 = 4 \\Rightarrow x = \\pm 2`,
        },
      ],
      finalAnswer: '$x = \\pm 1, \\pm 2$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Radical Equation',
      problem: `Solve: $\\sqrt{2x + 3} = x$`,
      steps: [
        {
          explanation: 'Square both sides:',
          math: `2x + 3 = x^2`,
        },
        {
          explanation: 'Rearrange to standard form:',
          math: `x^2 - 2x - 3 = 0`,
        },
        {
          explanation: 'Factor:',
          math: `(x - 3)(x + 1) = 0 \\Rightarrow x = 3 \\text{ or } x = -1`,
          highlight: true,
        },
        {
          explanation: 'Check: $x = 3$: $\\sqrt{9} = 3$ ✓. $x = -1$: $\\sqrt{1} = -1$ ✗ (LHS is positive)',
        },
      ],
      finalAnswer: '$x = 3$ (only valid solution)',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Factoring by Grouping',
      problem: `Solve: $x^3 - 2x^2 - x + 2 = 0$`,
      steps: [
        {
          explanation: 'Group terms:',
          math: `(x^3 - 2x^2) + (-x + 2) = 0`,
        },
        {
          explanation: 'Factor each group:',
          math: `x^2(x - 2) - 1(x - 2) = 0`,
        },
        {
          explanation: 'Factor out $(x - 2)$:',
          math: `(x - 2)(x^2 - 1) = 0`,
          highlight: true,
        },
        {
          explanation: 'Factor further and solve:',
          math: `(x - 2)(x - 1)(x + 1) = 0`,
        },
      ],
      finalAnswer: '$x = -1, 1, 2$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'Why do radical equations create extraneous solutions?',
          answer: `Squaring both sides is not a reversible operation. $(-3)^2 = 9$ and $3^2 = 9$, so squaring loses sign information. Solutions that don't satisfy the original equation are extraneous.`,
        },
        {
          question: 'What if u is negative in a biquadratic?',
          answer: `If $u < 0$, then $x^2 = u$ has no real solutions. Those values of $u$ are discarded. Only non-negative values of $u$ give real solutions for $x$.`,
        },
        {
          question: 'How do I find rational roots of a polynomial?',
          answer: `The Rational Root Theorem says possible rational roots are $\\pm \\frac{p}{q}$ where $p$ divides the constant term and $q$ divides the leading coefficient. Test these candidates by substitution.`,
        },
      ],
    },
  ],
};

// Inequalities Theory
export const inequalitiesTheory: TheoryTopic = {
  id: TOPIC_IDS.INEQUALITIES,
  databaseTopicId: TOPIC_DATABASE_IDS['inequalities'],
  title: 'Inequalities',
  subtitle: 'Solve linear, quadratic, and rational inequalities with sign analysis.',
  breadcrumb: [
    { label: 'Algebra', href: '/topics/algebra' },
    { label: 'Inequalities' },
  ],
  practiceUrl: '/practice/inequalities',
  nextTopicId: TOPIC_IDS.EXPONENTIAL_EQUATIONS,
  nextTopicTitle: 'Exponential Equations',
  blocks: [
    {
      type: 'formal-definition',
      content: `An **inequality** compares two expressions using $<, >, \\leq, \\geq$. Solutions are typically intervals:`,
      formula: `ax + b > 0 \\quad \\Rightarrow \\quad x > -\\frac{b}{a} \\; (\\text{if } a > 0)`,
      note: 'Multiplying or dividing by a negative flips the inequality sign.',
    },
    {
      type: 'formal-definition',
      content: `For **quadratic and rational inequalities**, use sign analysis:`,
      formula: `\\frac{(x - r_1)(x - r_2)}{(x - s_1)} > 0`,
      note: 'Find critical points (zeros and undefined points), then test intervals.',
    },
    {
      type: 'intuitive-explanation',
      title: 'The Sign Chart Method',
      paragraphs: [
        `**Step 1:** Find critical points — where the expression equals zero or is undefined.`,
        `**Step 2:** Place these points on a number line, dividing it into intervals.`,
        `**Step 3:** Test one value from each interval to determine if the expression is positive or negative.`,
        `**Step 4:** Select intervals that satisfy the inequality. Include endpoints only if the inequality is $\\leq$ or $\\geq$.`,
      ],
      metaphor: 'A sign chart is like a map showing where the expression is above or below zero.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Linear Inequality',
      problem: `Solve: $3x - 7 \\leq 2x + 5$`,
      steps: [
        {
          explanation: 'Subtract $2x$ from both sides:',
          math: `x - 7 \\leq 5`,
        },
        {
          explanation: 'Add 7 to both sides:',
          math: `x \\leq 12`,
          highlight: true,
        },
      ],
      finalAnswer: '$x \\leq 12$ or $(-\\infty, 12]$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Quadratic Inequality',
      problem: `Solve: $x^2 - 4x - 5 > 0$`,
      steps: [
        {
          explanation: 'Factor the quadratic:',
          math: `(x - 5)(x + 1) > 0`,
        },
        {
          explanation: 'Critical points: $x = -1$ and $x = 5$',
        },
        {
          explanation: 'Test intervals: $(-\\infty, -1)$: positive; $(-1, 5)$: negative; $(5, \\infty)$: positive',
          highlight: true,
        },
        {
          explanation: 'Select where expression is positive:',
          math: `x < -1 \\text{ or } x > 5`,
        },
      ],
      finalAnswer: '$(-\\infty, -1) \\cup (5, \\infty)$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Rational Inequality',
      problem: `Solve: $\\frac{x + 2}{x - 3} \\geq 0$`,
      steps: [
        {
          explanation: 'Find critical points: numerator zero at $x = -2$, denominator zero at $x = 3$',
        },
        {
          explanation: 'Sign chart: test points in $(-\\infty, -2)$, $(-2, 3)$, $(3, \\infty)$',
          math: `(-\\infty, -2): \\frac{-}{-} = + \\quad (-2, 3): \\frac{+}{-} = - \\quad (3, \\infty): \\frac{+}{+} = +`,
          highlight: true,
        },
        {
          explanation: 'Include $x = -2$ (equals zero), exclude $x = 3$ (undefined):',
        },
      ],
      finalAnswer: '$(-\\infty, -2] \\cup (3, \\infty)$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'Why does multiplying by a negative flip the sign?',
          answer: `When you multiply by a negative, you reverse the order. For example, $2 < 5$, but $-2 > -5$. The inequality direction must flip to stay true.`,
        },
        {
          question: 'What about absolute value inequalities?',
          answer: `$|x| < a$ means $-a < x < a$. $|x| > a$ means $x < -a$ or $x > a$. Split into cases based on whether the inequality is "less than" or "greater than."`,
        },
        {
          question: 'How do I handle compound inequalities?',
          answer: `For $a < x < b$, solve as two separate inequalities and find the intersection. For "or" statements, find the union of solution sets.`,
        },
      ],
    },
  ],
  visualizer: {
    type: 'interactive',
    title: 'Inequality Sign Chart',
    badge: 'Interactive',
    badgeVariant: 'default',
    description: 'See how the sign changes across critical points.',
    controls: [
      {
        id: 'root1',
        label: 'Root 1',
        symbol: 'r₁',
        min: -5,
        max: 0,
        step: 1,
        defaultValue: -2,
      },
      {
        id: 'root2',
        label: 'Root 2',
        symbol: 'r₂',
        min: 0,
        max: 5,
        step: 1,
        defaultValue: 3,
      },
    ],
    graphConfig: {
      function: '(x+2)(x-3)',
      domain: [-5, 6],
      range: [-10, 10],
      showGrid: true,
      showAxis: true,
    },
  },
};

// Exponential Equations Theory
export const exponentialEquationsTheory: TheoryTopic = {
  id: TOPIC_IDS.EXPONENTIAL_EQUATIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['exponential-equations'],
  title: 'Exponential Equations',
  subtitle: 'Solve equations where the variable is in the exponent.',
  breadcrumb: [
    { label: 'Algebra', href: '/topics/algebra' },
    { label: 'Equations', href: '/topics/algebra/equations' },
    { label: 'Exponential' },
  ],
  practiceUrl: '/practice/exponential-equations',
  nextTopicId: TOPIC_IDS.LOGARITHMIC_EQUATIONS,
  nextTopicTitle: 'Logarithmic Equations',
  blocks: [
    {
      type: 'formal-definition',
      content: `An **exponential equation** has the variable in an exponent. Key principle:`,
      formula: `a^{f(x)} = a^{g(x)} \\quad \\Rightarrow \\quad f(x) = g(x) \\quad (a > 0, a \\neq 1)`,
      note: 'If bases are equal, exponents must be equal.',
    },
    {
      type: 'formal-definition',
      content: `When bases cannot be matched, use logarithms:`,
      formula: `a^x = b \\quad \\Rightarrow \\quad x = \\log_a(b) = \\frac{\\ln b}{\\ln a}`,
    },
    {
      type: 'intuitive-explanation',
      title: 'Solution Strategies',
      paragraphs: [
        `**Same base:** If you can write both sides with the same base, just equate exponents: $8^x = 32$ becomes $2^{3x} = 2^5$, so $3x = 5$.`,
        `**Different bases:** Take logarithms of both sides: $5^x = 12$ becomes $x = \\log_5(12) = \\frac{\\ln 12}{\\ln 5}$.`,
        `**Substitution:** For equations like $4^x - 3 \\cdot 2^x + 2 = 0$, substitute $u = 2^x$ to get a quadratic.`,
      ],
      metaphor: 'Exponential equations hide the answer in the exponent. Logarithms are the key to unlock it.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Same Base',
      problem: `Solve: $27^{x+1} = 9^{2x}$`,
      steps: [
        {
          explanation: 'Express both sides with base 3:',
          math: `(3^3)^{x+1} = (3^2)^{2x}`,
        },
        {
          explanation: 'Simplify exponents:',
          math: `3^{3(x+1)} = 3^{4x}`,
        },
        {
          explanation: 'Equate exponents:',
          math: `3x + 3 = 4x`,
          highlight: true,
        },
        {
          explanation: 'Solve:',
          math: `x = 3`,
        },
      ],
      finalAnswer: '$x = 3$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Using Logarithms',
      problem: `Solve: $5^{2x-1} = 7$`,
      steps: [
        {
          explanation: 'Take natural log of both sides:',
          math: `\\ln(5^{2x-1}) = \\ln 7`,
        },
        {
          explanation: 'Apply the power rule:',
          math: `(2x - 1) \\ln 5 = \\ln 7`,
          highlight: true,
        },
        {
          explanation: 'Solve for $x$:',
          math: `2x - 1 = \\frac{\\ln 7}{\\ln 5} \\Rightarrow x = \\frac{1}{2}\\left(1 + \\frac{\\ln 7}{\\ln 5}\\right)`,
        },
      ],
      finalAnswer: '$x = \\frac{1}{2}\\left(1 + \\frac{\\ln 7}{\\ln 5}\\right) \\approx 1.10$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Substitution',
      problem: `Solve: $4^x - 6 \\cdot 2^x + 8 = 0$`,
      steps: [
        {
          explanation: 'Note that $4^x = (2^2)^x = (2^x)^2$. Let $u = 2^x$:',
          math: `u^2 - 6u + 8 = 0`,
        },
        {
          explanation: 'Factor:',
          math: `(u - 2)(u - 4) = 0`,
          highlight: true,
        },
        {
          explanation: 'Solve: $u = 2$ or $u = 4$',
        },
        {
          explanation: 'Back-substitute: $2^x = 2 \\Rightarrow x = 1$; $2^x = 4 \\Rightarrow x = 2$',
        },
      ],
      finalAnswer: '$x = 1$ or $x = 2$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'Why must the base be positive and not 1?',
          answer: `If $a \\leq 0$, $a^x$ is not defined for all real $x$. If $a = 1$, then $1^x = 1$ for all $x$, so the equation either has infinite solutions or none.`,
        },
        {
          question: 'How do I check for extraneous solutions?',
          answer: `Exponential functions are always positive, so any equation like $a^x = -5$ has no real solution. After solving, verify your answer makes the original equation true.`,
        },
        {
          question: 'What about equations with multiple exponential terms?',
          answer: `Try to express all terms with the same base, then substitute. For example, with $3^x$ and $9^x$, write $9^x = (3^2)^x = (3^x)^2$.`,
        },
      ],
    },
  ],
};

// Logarithmic Equations Theory
export const logarithmicEquationsTheory: TheoryTopic = {
  id: TOPIC_IDS.LOGARITHMIC_EQUATIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['logarithmic-equations'],
  title: 'Logarithmic Equations',
  subtitle: 'Solve equations containing logarithms using properties and exponentiation.',
  breadcrumb: [
    { label: 'Algebra', href: '/topics/algebra' },
    { label: 'Equations', href: '/topics/algebra/equations' },
    { label: 'Logarithmic' },
  ],
  practiceUrl: '/practice/logarithmic-equations',
  nextTopicId: TOPIC_IDS.LINEAR_FUNCTIONS,
  nextTopicTitle: 'Linear Functions',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **logarithmic equation** contains a logarithm with the variable in its argument. Key principle:`,
      formula: `\\log_a(f(x)) = k \\quad \\Rightarrow \\quad f(x) = a^k`,
      note: 'Convert to exponential form to solve.',
    },
    {
      type: 'formal-definition',
      content: `When both sides have logarithms with the same base:`,
      formula: `\\log_a(f(x)) = \\log_a(g(x)) \\quad \\Rightarrow \\quad f(x) = g(x)`,
      note: 'Arguments must be equal (and positive).',
    },
    {
      type: 'intuitive-explanation',
      title: 'Solution Strategies',
      paragraphs: [
        `**Single log = constant:** Convert to exponential form. $\\log_2(x) = 5$ means $x = 2^5 = 32$.`,
        `**Log = log:** If bases match, set arguments equal. $\\log_3(x+1) = \\log_3(7)$ means $x + 1 = 7$.`,
        `**Multiple logs:** Combine using log properties first, then solve.`,
        `**Always check domain:** Arguments of logs must be positive!`,
      ],
      metaphor: 'Logarithmic equations are like locked boxes — exponentiation is the key that opens them.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Basic Logarithmic Equation',
      problem: `Solve: $\\log_5(2x - 1) = 2$`,
      steps: [
        {
          explanation: 'Convert to exponential form:',
          math: `2x - 1 = 5^2 = 25`,
          highlight: true,
        },
        {
          explanation: 'Solve for $x$:',
          math: `2x = 26 \\Rightarrow x = 13`,
        },
        {
          explanation: 'Check: $2(13) - 1 = 25 > 0$ ✓',
        },
      ],
      finalAnswer: '$x = 13$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Combining Logarithms',
      problem: `Solve: $\\log_2(x) + \\log_2(x - 2) = 3$`,
      steps: [
        {
          explanation: 'Use the product rule:',
          math: `\\log_2(x(x - 2)) = 3`,
        },
        {
          explanation: 'Convert to exponential form:',
          math: `x(x - 2) = 2^3 = 8`,
        },
        {
          explanation: 'Expand and solve the quadratic:',
          math: `x^2 - 2x - 8 = 0 \\Rightarrow (x-4)(x+2) = 0`,
          highlight: true,
        },
        {
          explanation: 'Check domain: $x = 4$ ✓ (both $x > 0$ and $x - 2 > 0$); $x = -2$ ✗ (negative)',
        },
      ],
      finalAnswer: '$x = 4$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Logarithms on Both Sides',
      problem: `Solve: $\\log_3(x + 5) = \\log_3(2x - 1)$`,
      steps: [
        {
          explanation: 'Since bases are equal, set arguments equal:',
          math: `x + 5 = 2x - 1`,
        },
        {
          explanation: 'Solve:',
          math: `5 + 1 = 2x - x \\Rightarrow x = 6`,
          highlight: true,
        },
        {
          explanation: 'Check: $6 + 5 = 11 > 0$ ✓ and $2(6) - 1 = 11 > 0$ ✓',
        },
      ],
      finalAnswer: '$x = 6$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'Why must I check the domain?',
          answer: `Logarithms are only defined for positive arguments. Algebraic manipulations can introduce solutions where the original log was undefined. Always verify that all arguments are positive.`,
        },
        {
          question: 'What if the bases are different?',
          answer: `Use the change of base formula to convert to a common base, or convert each log to exponential form and solve the resulting equation.`,
        },
        {
          question: 'Can logarithmic equations have no solution?',
          answer: `Yes! If all candidate solutions make an argument negative or zero, there's no solution. For example, $\\log(x) = \\log(-x)$ has no solution since both cannot be positive simultaneously.`,
        },
      ],
    },
  ],
};

// Linear Functions Theory
export const linearFunctionsTheory: TheoryTopic = {
  id: TOPIC_IDS.LINEAR_FUNCTIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['linear-functions'],
  title: 'Linear Functions',
  subtitle: 'Understand slope, intercepts, and the equations of lines.',
  breadcrumb: [
    { label: 'Functions', href: '/topics/functions' },
    { label: 'Linear Functions' },
  ],
  practiceUrl: '/practice/linear-functions',
  nextTopicId: TOPIC_IDS.QUADRATIC_FUNCTIONS,
  nextTopicTitle: 'Quadratic Functions',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **linear function** has the form:`,
      formula: `f(x) = mx + b`,
      note: 'm is the slope (rate of change), b is the y-intercept (where the line crosses the y-axis).',
    },
    {
      type: 'formal-definition',
      content: `The **slope** between two points $(x_1, y_1)$ and $(x_2, y_2)$ is:`,
      formula: `m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{\\Delta y}{\\Delta x}`,
      note: 'Rise over run: how much y changes for each unit change in x.',
    },
    {
      type: 'intuitive-explanation',
      title: 'Key Concepts',
      paragraphs: [
        `**Slope:** Positive slope goes up (↗), negative slope goes down (↘), zero slope is horizontal (→), undefined slope is vertical (↑).`,
        `**Intercepts:** x-intercept is where $y = 0$ (solve $mx + b = 0$). y-intercept is $(0, b)$.`,
        `**Parallel lines** have equal slopes. **Perpendicular lines** have slopes that are negative reciprocals: $m_1 \\cdot m_2 = -1$.`,
        `**Forms:** Slope-intercept ($y = mx + b$), point-slope ($y - y_1 = m(x - x_1)$), standard ($Ax + By = C$).`,
      ],
      metaphor: 'The slope is like the steepness of a hill — it tells you how hard you have to work to climb.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Finding the Equation',
      problem: `Find the equation of the line through $(2, 5)$ with slope $m = 3$`,
      steps: [
        {
          explanation: 'Use point-slope form:',
          math: `y - y_1 = m(x - x_1)`,
        },
        {
          explanation: 'Substitute the point and slope:',
          math: `y - 5 = 3(x - 2)`,
          highlight: true,
        },
        {
          explanation: 'Convert to slope-intercept form:',
          math: `y = 3x - 6 + 5 = 3x - 1`,
        },
      ],
      finalAnswer: '$y = 3x - 1$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Line Through Two Points',
      problem: `Find the equation of the line through $(1, 4)$ and $(3, 10)$`,
      steps: [
        {
          explanation: 'Calculate the slope:',
          math: `m = \\frac{10 - 4}{3 - 1} = \\frac{6}{2} = 3`,
        },
        {
          explanation: 'Use point-slope with either point:',
          math: `y - 4 = 3(x - 1)`,
          highlight: true,
        },
        {
          explanation: 'Simplify:',
          math: `y = 3x - 3 + 4 = 3x + 1`,
        },
      ],
      finalAnswer: '$y = 3x + 1$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Perpendicular Line',
      problem: `Find a line perpendicular to $y = 2x + 3$ through the point $(4, 1)$`,
      steps: [
        {
          explanation: 'The original slope is $m = 2$. Perpendicular slope:',
          math: `m_{\\perp} = -\\frac{1}{2}`,
          highlight: true,
        },
        {
          explanation: 'Use point-slope form:',
          math: `y - 1 = -\\frac{1}{2}(x - 4)`,
        },
        {
          explanation: 'Simplify:',
          math: `y = -\\frac{1}{2}x + 2 + 1 = -\\frac{1}{2}x + 3`,
        },
      ],
      finalAnswer: '$y = -\\frac{1}{2}x + 3$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'What does slope really mean?',
          answer: `Slope is the rate of change — how much $y$ changes for each unit increase in $x$. A slope of 3 means "for every 1 step right, go 3 steps up." In real-world contexts, it might represent speed, cost per unit, etc.`,
        },
        {
          question: 'When is a line vertical?',
          answer: `A vertical line has the form $x = k$ (constant). The slope is undefined because $\\Delta x = 0$, and division by zero is not allowed. Vertical lines are not functions.`,
        },
        {
          question: 'How do I convert between forms?',
          answer: `From standard form $Ax + By = C$: solve for $y$ to get slope-intercept. From slope-intercept: substitute a point to verify, or multiply to clear fractions for standard form.`,
        },
      ],
    },
  ],
  visualizer: {
    type: 'interactive',
    title: 'Line Visualizer',
    badge: 'Interactive',
    badgeVariant: 'default',
    description: 'Adjust slope and intercept to see how the line changes.',
    controls: [
      {
        id: 'm',
        label: 'Slope',
        symbol: 'm',
        min: -3,
        max: 3,
        step: 0.5,
        defaultValue: 1,
      },
      {
        id: 'b',
        label: 'Y-Intercept',
        symbol: 'b',
        min: -5,
        max: 5,
        step: 0.5,
        defaultValue: 0,
      },
    ],
    graphConfig: {
      function: 'x',
      domain: [-5, 5],
      range: [-5, 5],
      showGrid: true,
      showAxis: true,
    },
  },
};

// Quadratic Functions Theory
export const quadraticFunctionsTheory: TheoryTopic = {
  id: TOPIC_IDS.QUADRATIC_FUNCTIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['quadratic-functions'],
  title: 'Quadratic Functions',
  subtitle: 'Analyze parabolas: vertex, axis of symmetry, roots, and transformations.',
  breadcrumb: [
    { label: 'Functions', href: '/topics/functions' },
    { label: 'Quadratic Functions' },
  ],
  practiceUrl: '/practice/quadratic-functions',
  nextTopicId: TOPIC_IDS.POLYNOMIAL_FUNCTIONS,
  nextTopicTitle: 'Polynomial Functions',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **quadratic function** has the general form:`,
      formula: `f(x) = ax^2 + bx + c \\quad (a \\neq 0)`,
      note: 'The graph is a parabola: opens up if a > 0, down if a < 0.',
    },
    {
      type: 'formal-definition',
      content: `The **vertex form** reveals the vertex directly:`,
      formula: `f(x) = a(x - h)^2 + k`,
      note: 'Vertex at (h, k). Convert using h = -b/(2a), k = f(h).',
    },
    {
      type: 'intuitive-explanation',
      title: 'Anatomy of a Parabola',
      paragraphs: [
        `**Vertex:** The turning point. Minimum if $a > 0$, maximum if $a < 0$. Located at $x = -\\frac{b}{2a}$.`,
        `**Axis of symmetry:** Vertical line through the vertex: $x = -\\frac{b}{2a}$.`,
        `**Roots/Zeros:** Where the parabola crosses the x-axis. Found by solving $ax^2 + bx + c = 0$.`,
        `**Y-intercept:** Always at $(0, c)$ — just substitute $x = 0$.`,
      ],
      metaphor: 'A parabola is like a valley or a hill — the vertex is either the lowest point or the highest point.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Finding the Vertex',
      problem: `Find the vertex of $f(x) = 2x^2 - 8x + 3$`,
      steps: [
        {
          explanation: 'Calculate the x-coordinate of the vertex:',
          math: `h = -\\frac{b}{2a} = -\\frac{-8}{2(2)} = \\frac{8}{4} = 2`,
        },
        {
          explanation: 'Calculate the y-coordinate by substituting:',
          math: `k = f(2) = 2(2)^2 - 8(2) + 3 = 8 - 16 + 3 = -5`,
          highlight: true,
        },
      ],
      finalAnswer: 'Vertex: $(2, -5)$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Graphing Analysis',
      problem: `For $f(x) = -x^2 + 4x + 5$, find vertex, axis of symmetry, roots, and y-intercept`,
      steps: [
        {
          explanation: 'Vertex: $h = -\\frac{4}{2(-1)} = 2$, $k = f(2) = -4 + 8 + 5 = 9$',
          math: `\\text{Vertex: } (2, 9)`,
        },
        {
          explanation: 'Axis of symmetry:',
          math: `x = 2`,
        },
        {
          explanation: 'Roots: Solve $-x^2 + 4x + 5 = 0$ → $x^2 - 4x - 5 = 0$ → $(x-5)(x+1) = 0$',
          math: `x = 5 \\text{ or } x = -1`,
          highlight: true,
        },
        {
          explanation: 'Y-intercept: $f(0) = 5$',
          math: `\\text{Y-intercept: } (0, 5)`,
        },
      ],
      finalAnswer: 'Opens down, vertex (2, 9), axis x = 2, roots at -1 and 5, y-intercept at 5',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Converting to Vertex Form',
      problem: `Write $f(x) = x^2 + 6x + 5$ in vertex form`,
      steps: [
        {
          explanation: 'Complete the square. Take half of 6, square it:',
          math: `\\left(\\frac{6}{2}\\right)^2 = 9`,
        },
        {
          explanation: 'Add and subtract 9:',
          math: `f(x) = (x^2 + 6x + 9) + 5 - 9 = (x + 3)^2 - 4`,
          highlight: true,
        },
      ],
      finalAnswer: '$f(x) = (x + 3)^2 - 4$, vertex at $(-3, -4)$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'How does "a" affect the parabola?',
          answer: `The sign of $a$ determines direction: positive opens up, negative opens down. The magnitude affects width: $|a| > 1$ makes it narrower, $|a| < 1$ makes it wider.`,
        },
        {
          question: 'What is the range of a quadratic function?',
          answer: `If $a > 0$: range is $[k, \\infty)$ (minimum at vertex). If $a < 0$: range is $(-\\infty, k]$ (maximum at vertex). The domain is always all real numbers.`,
        },
        {
          question: 'How do I find the equation given vertex and a point?',
          answer: `Use vertex form $f(x) = a(x-h)^2 + k$. Substitute the vertex for $(h, k)$ and the point for $(x, f(x))$, then solve for $a$.`,
        },
      ],
    },
  ],
  visualizer: {
    type: 'interactive',
    title: 'Parabola Explorer',
    badge: 'Interactive',
    badgeVariant: 'default',
    description: 'See how coefficients affect the shape and position of the parabola.',
    controls: [
      {
        id: 'a',
        label: 'Coefficient a',
        symbol: 'a',
        min: -2,
        max: 2,
        step: 0.5,
        defaultValue: 1,
      },
      {
        id: 'h',
        label: 'Vertex h',
        symbol: 'h',
        min: -3,
        max: 3,
        step: 0.5,
        defaultValue: 0,
      },
      {
        id: 'k',
        label: 'Vertex k',
        symbol: 'k',
        min: -5,
        max: 5,
        step: 0.5,
        defaultValue: 0,
      },
    ],
    graphConfig: {
      function: 'x^2',
      domain: [-6, 6],
      range: [-5, 10],
      showGrid: true,
      showAxis: true,
    },
  },
};

// Polynomial Functions Theory
export const polynomialFunctionsTheory: TheoryTopic = {
  id: TOPIC_IDS.POLYNOMIAL_FUNCTIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['polynomial-functions'],
  title: 'Polynomial Functions',
  subtitle: 'Analyze higher-degree polynomials: end behavior, roots, and multiplicity.',
  breadcrumb: [
    { label: 'Functions', href: '/topics/functions' },
    { label: 'Polynomial Functions' },
  ],
  practiceUrl: '/practice/polynomial-functions',
  nextTopicId: TOPIC_IDS.RATIONAL_FUNCTIONS,
  nextTopicTitle: 'Rational Functions',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **polynomial function** of degree $n$ has the form:`,
      formula: `f(x) = a_n x^n + a_{n-1} x^{n-1} + \\cdots + a_1 x + a_0 \\quad (a_n \\neq 0)`,
      note: 'The degree is the highest power of x with a non-zero coefficient.',
    },
    {
      type: 'formal-definition',
      content: `In **factored form**, a polynomial shows its roots directly:`,
      formula: `f(x) = a(x - r_1)^{m_1}(x - r_2)^{m_2} \\cdots`,
      note: 'Each $r_i$ is a root, and $m_i$ is its multiplicity.',
    },
    {
      type: 'intuitive-explanation',
      title: 'Key Features',
      paragraphs: [
        `**End behavior:** Determined by the leading term $a_n x^n$. Even degree: both ends go the same direction. Odd degree: ends go opposite directions.`,
        `**Roots and multiplicity:** If $(x - r)^m$ is a factor, the graph touches (even $m$) or crosses (odd $m$) at $x = r$.`,
        `**Turning points:** A degree-$n$ polynomial has at most $n - 1$ turning points.`,
        `**Fundamental Theorem:** Every degree-$n$ polynomial has exactly $n$ roots (counting multiplicity and complex roots).`,
      ],
      metaphor: 'Polynomials are like roller coasters — the degree tells you the maximum number of hills and valleys.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: End Behavior',
      problem: `Describe the end behavior of $f(x) = -2x^5 + 3x^2 - 1$`,
      steps: [
        {
          explanation: 'Identify the leading term:',
          math: `-2x^5`,
        },
        {
          explanation: 'Analyze: Odd degree (5), negative leading coefficient (-2)',
          highlight: true,
        },
        {
          explanation: 'End behavior:',
          math: `\\text{As } x \\to -\\infty, f(x) \\to +\\infty \\quad \\text{As } x \\to +\\infty, f(x) \\to -\\infty`,
        },
      ],
      finalAnswer: 'Rises to the left, falls to the right',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Finding Roots',
      problem: `Find all roots of $f(x) = x^3 - 4x^2 - 7x + 10$`,
      steps: [
        {
          explanation: 'Try possible rational roots (factors of 10 / factors of 1): ±1, ±2, ±5, ±10',
        },
        {
          explanation: 'Test $x = 1$: $f(1) = 1 - 4 - 7 + 10 = 0$ ✓',
          highlight: true,
        },
        {
          explanation: 'Divide by $(x - 1)$ using synthetic division:',
          math: `f(x) = (x - 1)(x^2 - 3x - 10)`,
        },
        {
          explanation: 'Factor the quadratic:',
          math: `(x - 1)(x - 5)(x + 2)`,
        },
      ],
      finalAnswer: 'Roots: $x = -2, 1, 5$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Multiplicity and Graph Behavior',
      problem: `Describe the behavior at each root of $f(x) = (x + 1)^2(x - 2)^3$`,
      steps: [
        {
          explanation: 'Root $x = -1$ has multiplicity 2 (even):',
          math: `\\text{Graph touches but does not cross the x-axis}`,
        },
        {
          explanation: 'Root $x = 2$ has multiplicity 3 (odd):',
          math: `\\text{Graph crosses the x-axis with a flattening}`,
          highlight: true,
        },
      ],
      finalAnswer: 'Bounces at $x = -1$, crosses with inflection at $x = 2$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'What is synthetic division?',
          answer: `A shortcut for dividing a polynomial by $(x - c)$. Write coefficients in a row, bring down the first, multiply by $c$, add to next coefficient, repeat. The last number is the remainder.`,
        },
        {
          question: 'How do I write a polynomial from its roots?',
          answer: `If roots are $r_1, r_2, \\ldots, r_n$, write $f(x) = a(x - r_1)(x - r_2) \\cdots (x - r_n)$. Use an additional point to find $a$ if needed.`,
        },
        {
          question: 'What about complex roots?',
          answer: `Complex roots come in conjugate pairs for polynomials with real coefficients. If $2 + 3i$ is a root, so is $2 - 3i$. These create irreducible quadratic factors.`,
        },
      ],
    },
  ],
};

// Rational Functions Theory
export const rationalFunctionsTheory: TheoryTopic = {
  id: TOPIC_IDS.RATIONAL_FUNCTIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['rational-functions'],
  title: 'Rational Functions',
  subtitle: 'Analyze functions with polynomials in numerator and denominator.',
  breadcrumb: [
    { label: 'Functions', href: '/topics/functions' },
    { label: 'Rational Functions' },
  ],
  practiceUrl: '/practice/rational-functions',
  nextTopicId: TOPIC_IDS.LIMITS,
  nextTopicTitle: 'Limits',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **rational function** is a ratio of two polynomials:`,
      formula: `f(x) = \\frac{P(x)}{Q(x)} \\quad \\text{where } Q(x) \\neq 0`,
      note: 'Domain excludes values where the denominator equals zero.',
    },
    {
      type: 'formal-definition',
      content: `**Asymptote rules:**`,
      formula: `\\begin{aligned}
\\text{Vertical:} &\\quad x = a \\text{ where } Q(a) = 0 \\text{ but } P(a) \\neq 0 \\\\
\\text{Horizontal:} &\\quad y = \\frac{\\text{lead coef of } P}{\\text{lead coef of } Q} \\text{ if degrees equal}
\\end{aligned}`,
      note: 'If degree of P < Q: horizontal asymptote y = 0. If degree of P > Q: no horizontal asymptote (oblique possible).',
    },
    {
      type: 'intuitive-explanation',
      title: 'Understanding Asymptotes',
      paragraphs: [
        `**Vertical asymptotes:** Where the denominator is zero (and numerator isn't). The function shoots to ±∞.`,
        `**Holes:** If both numerator and denominator have the same factor $(x - a)$, there's a hole at $x = a$, not an asymptote.`,
        `**Horizontal asymptotes:** Compare degrees. Equal degrees → ratio of leading coefficients. Numerator smaller → y = 0.`,
        `**Oblique asymptotes:** If numerator degree is exactly one more than denominator, divide to find the slant asymptote.`,
      ],
      metaphor: 'Vertical asymptotes are walls the function cannot cross. Horizontal asymptotes are levels the function approaches at the ends.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Finding Asymptotes',
      problem: `Find all asymptotes of $f(x) = \\frac{2x + 1}{x - 3}$`,
      steps: [
        {
          explanation: 'Vertical asymptote: Set denominator = 0:',
          math: `x - 3 = 0 \\Rightarrow x = 3`,
        },
        {
          explanation: 'Horizontal asymptote: Degrees are equal (both 1), so:',
          math: `y = \\frac{2}{1} = 2`,
          highlight: true,
        },
      ],
      finalAnswer: 'Vertical asymptote: $x = 3$; Horizontal asymptote: $y = 2$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Hole vs. Asymptote',
      problem: `Analyze $f(x) = \\frac{x^2 - 4}{x - 2}$`,
      steps: [
        {
          explanation: 'Factor the numerator:',
          math: `f(x) = \\frac{(x-2)(x+2)}{x-2}`,
        },
        {
          explanation: 'Cancel the common factor:',
          math: `f(x) = x + 2 \\quad \\text{for } x \\neq 2`,
          highlight: true,
        },
        {
          explanation: 'There is a hole at $x = 2$, not a vertical asymptote.',
        },
        {
          explanation: 'The hole is at the point:',
          math: `(2, 2 + 2) = (2, 4)`,
        },
      ],
      finalAnswer: 'Hole at $(2, 4)$; graph is the line $y = x + 2$ with a point removed',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Oblique Asymptote',
      problem: `Find the oblique asymptote of $f(x) = \\frac{x^2 + 2x + 1}{x - 1}$`,
      steps: [
        {
          explanation: 'Degree of numerator (2) is one more than denominator (1), so oblique asymptote exists.',
        },
        {
          explanation: 'Perform polynomial division:',
          math: `\\frac{x^2 + 2x + 1}{x - 1} = x + 3 + \\frac{4}{x - 1}`,
          highlight: true,
        },
        {
          explanation: 'As $x \\to \\pm\\infty$, the remainder approaches 0:',
        },
      ],
      finalAnswer: 'Oblique asymptote: $y = x + 3$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'How do I find the domain of a rational function?',
          answer: `The domain is all real numbers except where the denominator equals zero. Factor the denominator, set each factor equal to zero, and exclude those x-values.`,
        },
        {
          question: 'Can a function cross its horizontal asymptote?',
          answer: `Yes! Horizontal asymptotes describe end behavior, not behavior in the middle. A function can cross its horizontal asymptote for finite x-values.`,
        },
        {
          question: 'What is the difference between a hole and an asymptote?',
          answer: `A hole is a single missing point where both numerator and denominator are zero (removable discontinuity). An asymptote is where only the denominator is zero, causing the function to shoot to infinity.`,
        },
      ],
    },
  ],
  visualizer: {
    type: 'interactive',
    title: 'Rational Function Explorer',
    badge: 'Interactive',
    badgeVariant: 'default',
    description: 'See asymptotes and behavior of rational functions.',
    controls: [
      {
        id: 'a',
        label: 'Numerator coef',
        symbol: 'a',
        min: -3,
        max: 3,
        step: 1,
        defaultValue: 1,
      },
      {
        id: 'c',
        label: 'Vertical asymptote',
        symbol: 'c',
        min: -3,
        max: 3,
        step: 1,
        defaultValue: 0,
      },
    ],
    graphConfig: {
      function: '1/x',
      domain: [-5, 5],
      range: [-10, 10],
      showGrid: true,
      showAxis: true,
    },
  },
};

// Limits (Computational) Theory
export const limitsComputationalTheory: TheoryTopic = {
  id: TOPIC_IDS.LIMITS,
  databaseTopicId: TOPIC_DATABASE_IDS['limits'],
  title: 'Limits',
  subtitle: 'Evaluate limits using algebraic techniques and special cases.',
  breadcrumb: [
    { label: 'Calculus', href: '/topics/calculus' },
    { label: 'Limits' },
  ],
  practiceUrl: '/practice/limits',
  nextTopicId: TOPIC_IDS.DERIVATIVES_BASICS,
  nextTopicTitle: 'Derivatives Basics',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **limit** describes the value a function approaches as the input approaches a point:`,
      formula: `\\lim_{x \\to c} f(x) = L`,
      note: 'This means f(x) gets arbitrarily close to L as x gets close to c.',
    },
    {
      type: 'formal-definition',
      content: `**Key limit laws:**`,
      formula: `\\begin{aligned}
\\lim_{x \\to c} [f(x) + g(x)] &= \\lim_{x \\to c} f(x) + \\lim_{x \\to c} g(x) \\\\
\\lim_{x \\to c} [f(x) \\cdot g(x)] &= \\lim_{x \\to c} f(x) \\cdot \\lim_{x \\to c} g(x) \\\\
\\lim_{x \\to c} \\frac{f(x)}{g(x)} &= \\frac{\\lim_{x \\to c} f(x)}{\\lim_{x \\to c} g(x)} \\quad (\\text{if denominator} \\neq 0)
\\end{aligned}`,
    },
    {
      type: 'intuitive-explanation',
      title: 'Evaluation Strategies',
      paragraphs: [
        `**Direct substitution:** Try plugging in $c$. If you get a number, that's the limit!`,
        `**Indeterminate forms (0/0):** Factor, cancel, then substitute. Or rationalize if there are radicals.`,
        `**Infinity limits:** Divide by the highest power of $x$ to simplify. Leading terms dominate.`,
        `**One-sided limits:** Approach from left ($x \\to c^-$) or right ($x \\to c^+$). Both must equal for limit to exist.`,
      ],
      metaphor: 'A limit is like asking "Where are we heading?" — not "Where are we now?"',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Factoring',
      problem: `Evaluate: $\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$`,
      steps: [
        {
          explanation: 'Direct substitution gives 0/0 (indeterminate). Factor:',
          math: `\\frac{x^2 - 4}{x - 2} = \\frac{(x-2)(x+2)}{x-2}`,
        },
        {
          explanation: 'Cancel $(x - 2)$:',
          math: `= x + 2`,
          highlight: true,
        },
        {
          explanation: 'Now substitute:',
          math: `\\lim_{x \\to 2} (x + 2) = 4`,
        },
      ],
      finalAnswer: '$\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2} = 4$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Rationalizing',
      problem: `Evaluate: $\\lim_{x \\to 0} \\frac{\\sqrt{x + 4} - 2}{x}$`,
      steps: [
        {
          explanation: 'Direct substitution gives 0/0. Multiply by conjugate:',
          math: `\\frac{\\sqrt{x+4} - 2}{x} \\cdot \\frac{\\sqrt{x+4} + 2}{\\sqrt{x+4} + 2}`,
        },
        {
          explanation: 'Simplify numerator using difference of squares:',
          math: `= \\frac{(x + 4) - 4}{x(\\sqrt{x+4} + 2)} = \\frac{x}{x(\\sqrt{x+4} + 2)}`,
          highlight: true,
        },
        {
          explanation: 'Cancel $x$ and substitute:',
          math: `= \\frac{1}{\\sqrt{4} + 2} = \\frac{1}{4}`,
        },
      ],
      finalAnswer: '$\\frac{1}{4}$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Limit at Infinity',
      problem: `Evaluate: $\\lim_{x \\to \\infty} \\frac{3x^2 + 2x}{5x^2 - 1}$`,
      steps: [
        {
          explanation: 'Divide numerator and denominator by $x^2$ (highest power):',
          math: `\\frac{3 + \\frac{2}{x}}{5 - \\frac{1}{x^2}}`,
        },
        {
          explanation: 'As $x \\to \\infty$, the fractions with $x$ in the denominator → 0:',
          math: `= \\frac{3 + 0}{5 - 0} = \\frac{3}{5}`,
          highlight: true,
        },
      ],
      finalAnswer: '$\\frac{3}{5}$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'What is an indeterminate form?',
          answer: `Forms like $\\frac{0}{0}$, $\\frac{\\infty}{\\infty}$, $0 \\cdot \\infty$, $\\infty - \\infty$, $0^0$, $1^\\infty$, $\\infty^0$ need more work. They don't have an automatic answer — you must manipulate the expression.`,
        },
        {
          question: 'When does a limit not exist?',
          answer: `When left and right limits differ, when the function oscillates infinitely, or when it goes to $\\pm\\infty$ (though we sometimes say the limit "is" infinity).`,
        },
        {
          question: 'What is L\'Hôpital\'s Rule?',
          answer: `For $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$: $\\lim \\frac{f(x)}{g(x)} = \\lim \\frac{f'(x)}{g'(x)}$ if the right side exists. Differentiate top and bottom separately (not the quotient rule!).`,
        },
      ],
    },
  ],
};

// Derivatives Basics Theory
export const derivativesBasicsTheory: TheoryTopic = {
  id: TOPIC_IDS.DERIVATIVES_BASICS,
  databaseTopicId: TOPIC_DATABASE_IDS['derivatives-basics'],
  title: 'Derivatives Basics',
  subtitle: 'Learn the fundamental rules of differentiation.',
  breadcrumb: [
    { label: 'Calculus', href: '/topics/calculus' },
    { label: 'Derivatives', href: '/topics/calculus/derivatives' },
    { label: 'Basics' },
  ],
  practiceUrl: '/practice/derivatives-basics',
  nextTopicId: TOPIC_IDS.DERIVATIVE_APPLICATIONS,
  nextTopicTitle: 'Derivative Applications',
  blocks: [
    {
      type: 'formal-definition',
      content: `The **derivative** of $f(x)$ is defined as the limit:`,
      formula: `f'(x) = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}`,
      note: 'This measures the instantaneous rate of change (slope of tangent line).',
    },
    {
      type: 'formal-definition',
      content: `**Basic differentiation rules:**`,
      formula: `\\begin{aligned}
\\frac{d}{dx}[c] &= 0 \\\\[4pt]
\\frac{d}{dx}[x^n] &= nx^{n-1} \\\\[4pt]
\\frac{d}{dx}[cf(x)] &= c \\cdot f'(x) \\\\[4pt]
\\frac{d}{dx}[f(x) + g(x)] &= f'(x) + g'(x)
\\end{aligned}`,
    },
    {
      type: 'intuitive-explanation',
      title: 'What Derivatives Mean',
      paragraphs: [
        `**Geometrically:** The derivative at a point is the slope of the tangent line there.`,
        `**Physically:** If position is $s(t)$, then velocity is $s'(t)$ and acceleration is $s''(t)$.`,
        `**Power rule:** Bring the exponent down, reduce it by 1. Works for any real exponent, including negative and fractional.`,
        `**Linearity:** Derivatives distribute over sums and pull out constants. Take derivatives term by term.`,
      ],
      metaphor: 'The derivative is the speedometer of a function — it tells you how fast the output is changing.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Power Rule',
      problem: `Find $f'(x)$ if $f(x) = 3x^4 - 2x^3 + 5x - 7$`,
      steps: [
        {
          explanation: 'Apply the power rule term by term:',
        },
        {
          explanation: '$\\frac{d}{dx}[3x^4] = 3 \\cdot 4x^3 = 12x^3$',
        },
        {
          explanation: '$\\frac{d}{dx}[-2x^3] = -2 \\cdot 3x^2 = -6x^2$',
        },
        {
          explanation: '$\\frac{d}{dx}[5x] = 5$; $\\frac{d}{dx}[-7] = 0$',
          highlight: true,
        },
      ],
      finalAnswer: '$f\'(x) = 12x^3 - 6x^2 + 5$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Negative and Fractional Exponents',
      problem: `Differentiate $g(x) = \\frac{1}{x^2} + \\sqrt{x}$`,
      steps: [
        {
          explanation: 'Rewrite using exponents:',
          math: `g(x) = x^{-2} + x^{1/2}`,
        },
        {
          explanation: 'Apply the power rule:',
          math: `g'(x) = -2x^{-3} + \\frac{1}{2}x^{-1/2}`,
          highlight: true,
        },
        {
          explanation: 'Rewrite in original form:',
          math: `g'(x) = -\\frac{2}{x^3} + \\frac{1}{2\\sqrt{x}}`,
        },
      ],
      finalAnswer: '$g\'(x) = -\\frac{2}{x^3} + \\frac{1}{2\\sqrt{x}}$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Using the Definition',
      problem: `Use the limit definition to find $f'(x)$ for $f(x) = x^2$`,
      steps: [
        {
          explanation: 'Set up the difference quotient:',
          math: `\\frac{f(x+h) - f(x)}{h} = \\frac{(x+h)^2 - x^2}{h}`,
        },
        {
          explanation: 'Expand and simplify:',
          math: `= \\frac{x^2 + 2xh + h^2 - x^2}{h} = \\frac{2xh + h^2}{h}`,
        },
        {
          explanation: 'Factor out $h$:',
          math: `= \\frac{h(2x + h)}{h} = 2x + h`,
          highlight: true,
        },
        {
          explanation: 'Take the limit as $h \\to 0$:',
          math: `f'(x) = 2x`,
        },
      ],
      finalAnswer: '$f\'(x) = 2x$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'What is the difference between f\' and df/dx?',
          answer: `They mean the same thing — the derivative of $f$ with respect to $x$. $f'$ is Lagrange notation (prime), while $\\frac{df}{dx}$ is Leibniz notation. Leibniz notation is helpful for chain rule and related rates.`,
        },
        {
          question: 'Can every function be differentiated?',
          answer: `No. A function must be continuous to be differentiable, but continuity alone isn't enough. Sharp corners (like $|x|$ at $x=0$) and vertical tangents are not differentiable.`,
        },
        {
          question: 'What is higher-order differentiation?',
          answer: `You can differentiate repeatedly. $f''(x)$ is the second derivative (rate of change of the rate of change), $f'''(x)$ is third, etc. For example, if $f(x) = x^3$, then $f'(x) = 3x^2$, $f''(x) = 6x$, $f'''(x) = 6$.`,
        },
      ],
    },
  ],
  visualizer: {
    type: 'interactive',
    title: 'Tangent Line Visualizer',
    badge: 'Interactive',
    badgeVariant: 'default',
    description: 'See how the tangent line changes as you move along the curve.',
    controls: [
      {
        id: 'x0',
        label: 'Point x₀',
        symbol: 'x₀',
        min: -3,
        max: 3,
        step: 0.5,
        defaultValue: 1,
      },
    ],
    graphConfig: {
      function: 'x^2',
      domain: [-4, 4],
      range: [-2, 10],
      showGrid: true,
      showAxis: true,
    },
  },
};

// Derivative Applications Theory
export const derivativeApplicationsTheory: TheoryTopic = {
  id: TOPIC_IDS.DERIVATIVE_APPLICATIONS,
  databaseTopicId: TOPIC_DATABASE_IDS['derivative-applications'],
  title: 'Derivative Applications',
  subtitle: 'Use derivatives to find extrema, analyze functions, and solve optimization problems.',
  breadcrumb: [
    { label: 'Calculus', href: '/topics/calculus' },
    { label: 'Derivatives', href: '/topics/calculus/derivatives' },
    { label: 'Applications' },
  ],
  practiceUrl: '/practice/derivative-applications',
  nextTopicId: TOPIC_IDS.CHAIN_RULE,
  nextTopicTitle: 'Chain Rule',
  blocks: [
    {
      type: 'formal-definition',
      content: `A **critical point** occurs where $f'(x) = 0$ or $f'(x)$ is undefined:`,
      formula: `f'(c) = 0 \\text{ or undefined} \\Rightarrow c \\text{ is a critical point}`,
      note: 'Critical points are candidates for local maxima, minima, or inflection points.',
    },
    {
      type: 'formal-definition',
      content: `**First Derivative Test:**`,
      formula: `\\begin{aligned}
f' \\text{ changes } + \\to - &\\Rightarrow \\text{local maximum} \\\\
f' \\text{ changes } - \\to + &\\Rightarrow \\text{local minimum} \\\\
f' \\text{ same sign} &\\Rightarrow \\text{no extremum}
\\end{aligned}`,
    },
    {
      type: 'intuitive-explanation',
      title: 'Using Derivatives for Analysis',
      paragraphs: [
        `**Increasing/Decreasing:** $f'(x) > 0$ means $f$ is increasing; $f'(x) < 0$ means decreasing.`,
        `**Concavity:** $f''(x) > 0$ means concave up (smiley); $f''(x) < 0$ means concave down (frowny).`,
        `**Second Derivative Test:** At a critical point, $f''(c) > 0$ → minimum, $f''(c) < 0$ → maximum.`,
        `**Tangent line equation:** At $(a, f(a))$: $y - f(a) = f'(a)(x - a)$.`,
      ],
      metaphor: 'The first derivative is velocity; the second derivative is acceleration. Together they describe the full motion.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Finding Extrema',
      problem: `Find the local extrema of $f(x) = x^3 - 3x + 2$`,
      steps: [
        {
          explanation: 'Find the derivative:',
          math: `f'(x) = 3x^2 - 3 = 3(x^2 - 1) = 3(x-1)(x+1)`,
        },
        {
          explanation: 'Set $f\'(x) = 0$:',
          math: `x = -1 \\text{ or } x = 1`,
          highlight: true,
        },
        {
          explanation: 'First derivative test: $f\' < 0$ on $(-1, 1)$, $f\' > 0$ elsewhere',
        },
        {
          explanation: 'At $x = -1$: changes $+ \\to -$ → local max. At $x = 1$: changes $- \\to +$ → local min.',
        },
      ],
      finalAnswer: 'Local max at $(-1, 4)$; local min at $(1, 0)$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Equation of Tangent Line',
      problem: `Find the tangent line to $f(x) = x^2$ at $x = 3$`,
      steps: [
        {
          explanation: 'Find the point: $f(3) = 9$, so point is $(3, 9)$',
        },
        {
          explanation: 'Find the slope: $f\'(x) = 2x$, so $f\'(3) = 6$',
          highlight: true,
        },
        {
          explanation: 'Use point-slope form:',
          math: `y - 9 = 6(x - 3)`,
        },
        {
          explanation: 'Simplify:',
          math: `y = 6x - 9`,
        },
      ],
      finalAnswer: '$y = 6x - 9$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Curve Sketching',
      problem: `Analyze $f(x) = x^3 - 6x^2 + 9x + 1$`,
      steps: [
        {
          explanation: '$f\'(x) = 3x^2 - 12x + 9 = 3(x-1)(x-3)$; critical points at $x = 1, 3$',
        },
        {
          explanation: '$f\'\'(x) = 6x - 12$; zero at $x = 2$ (inflection point)',
        },
        {
          explanation: 'Second derivative test: $f\'\'(1) = -6 < 0$ → max; $f\'\'(3) = 6 > 0$ → min',
          highlight: true,
        },
        {
          explanation: 'Calculate: $f(1) = 5$ (max), $f(3) = 1$ (min), $f(2) = 3$ (inflection)',
        },
      ],
      finalAnswer: 'Max at (1, 5), min at (3, 1), inflection at (2, 3)',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'What is the difference between local and global extrema?',
          answer: `Local extrema are high/low points in a neighborhood. Global (absolute) extrema are the highest/lowest over the entire domain. On a closed interval, check critical points AND endpoints.`,
        },
        {
          question: 'How do I solve optimization problems?',
          answer: `1. Write a formula for the quantity to optimize. 2. Express it in one variable using constraints. 3. Find critical points. 4. Test which gives max/min. 5. Check endpoints if domain is closed.`,
        },
        {
          question: 'What if the second derivative is zero at a critical point?',
          answer: `The second derivative test is inconclusive. Use the first derivative test instead (check sign changes). The point could be a max, min, or inflection point.`,
        },
      ],
    },
  ],
};

// Chain Rule Theory
export const chainRuleTheory: TheoryTopic = {
  id: TOPIC_IDS.CHAIN_RULE,
  databaseTopicId: TOPIC_DATABASE_IDS['chain-rule'],
  title: 'Chain Rule',
  subtitle: 'Differentiate composite functions using the chain rule.',
  breadcrumb: [
    { label: 'Calculus', href: '/topics/calculus' },
    { label: 'Derivatives', href: '/topics/calculus/derivatives' },
    { label: 'Chain Rule' },
  ],
  practiceUrl: '/practice/chain-rule',
  nextTopicId: TOPIC_IDS.TRIGONOMETRY_BASICS,
  nextTopicTitle: 'Trigonometry Basics',
  blocks: [
    {
      type: 'formal-definition',
      content: `The **chain rule** for differentiating a composite function:`,
      formula: `\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)`,
      note: 'Derivative of outer × derivative of inner. In Leibniz notation: dy/dx = dy/du × du/dx.',
    },
    {
      type: 'formal-definition',
      content: `**Generalized power rule** (special case of chain rule):`,
      formula: `\\frac{d}{dx}[u^n] = n \\cdot u^{n-1} \\cdot \\frac{du}{dx}`,
      note: 'Works for any function u(x) raised to a power.',
    },
    {
      type: 'intuitive-explanation',
      title: 'Understanding the Chain Rule',
      paragraphs: [
        `**The idea:** If $y$ depends on $u$ which depends on $x$, the rate of change of $y$ with respect to $x$ is the product of the intermediate rates.`,
        `**Outer and inner:** Identify the "outer" function and the "inner" function. Differentiate outside, keep inside, then multiply by derivative of inside.`,
        `**Multiple chains:** For deeply nested functions, apply chain rule repeatedly. $(f \\circ g \\circ h)'(x) = f'(g(h(x))) \\cdot g'(h(x)) \\cdot h'(x)$.`,
      ],
      metaphor: 'The chain rule is like gear ratios — if one gear turns twice as fast as another, and that turns three times as fast as a third, the total is 2 × 3 = 6.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Basic Chain Rule',
      problem: `Find $\\frac{d}{dx}[(3x + 1)^5]$`,
      steps: [
        {
          explanation: 'Identify: outer = $u^5$, inner = $u = 3x + 1$',
        },
        {
          explanation: 'Derivative of outer: $5u^4$',
        },
        {
          explanation: 'Derivative of inner: $\\frac{du}{dx} = 3$',
        },
        {
          explanation: 'Apply chain rule:',
          math: `5(3x + 1)^4 \\cdot 3 = 15(3x + 1)^4`,
          highlight: true,
        },
      ],
      finalAnswer: '$15(3x + 1)^4$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Square Root Function',
      problem: `Differentiate $f(x) = \\sqrt{x^2 + 4x}$`,
      steps: [
        {
          explanation: 'Rewrite: $f(x) = (x^2 + 4x)^{1/2}$',
        },
        {
          explanation: 'Outer: $u^{1/2}$ → derivative: $\\frac{1}{2}u^{-1/2}$',
        },
        {
          explanation: 'Inner: $u = x^2 + 4x$ → derivative: $2x + 4$',
        },
        {
          explanation: 'Apply chain rule:',
          math: `f'(x) = \\frac{1}{2}(x^2 + 4x)^{-1/2} \\cdot (2x + 4) = \\frac{2x + 4}{2\\sqrt{x^2 + 4x}}`,
          highlight: true,
        },
      ],
      finalAnswer: '$f\'(x) = \\frac{x + 2}{\\sqrt{x^2 + 4x}}$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Nested Functions',
      problem: `Find $\\frac{d}{dx}[\\sin(x^3)]$ (assuming you know $\\frac{d}{dx}[\\sin u] = \\cos u$)`,
      steps: [
        {
          explanation: 'Outer: $\\sin(u)$ → derivative: $\\cos(u)$',
        },
        {
          explanation: 'Inner: $u = x^3$ → derivative: $3x^2$',
        },
        {
          explanation: 'Apply chain rule:',
          math: `\\frac{d}{dx}[\\sin(x^3)] = \\cos(x^3) \\cdot 3x^2 = 3x^2\\cos(x^3)`,
          highlight: true,
        },
      ],
      finalAnswer: '$3x^2\\cos(x^3)$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'How do I know when to use the chain rule?',
          answer: `Whenever you have a "function of a function" — something inside another operation. If the inside is more than just $x$, you probably need the chain rule. Ask: "Is there an inner function?"`,
        },
        {
          question: 'What about the product rule combined with chain rule?',
          answer: `You often need both! For $h(x) = x^2 \\cdot (3x+1)^4$: use product rule for the two factors, and chain rule when differentiating $(3x+1)^4$.`,
        },
        {
          question: 'What is implicit differentiation?',
          answer: `When $y$ is defined implicitly by an equation like $x^2 + y^2 = 25$, differentiate both sides with respect to $x$, treating $y$ as a function of $x$. Use chain rule: $\\frac{d}{dx}[y^2] = 2y \\cdot \\frac{dy}{dx}$.`,
        },
      ],
    },
  ],
};

// Trigonometry Basics Theory
export const trigonometryBasicsTheory: TheoryTopic = {
  id: TOPIC_IDS.TRIGONOMETRY_BASICS,
  title: 'Trigonometry Basics',
  subtitle: 'Master the unit circle, trig functions, and fundamental identities.',
  breadcrumb: [
    { label: 'Trigonometry', href: '/topics/trigonometry' },
    { label: 'Basics' },
  ],
  practiceUrl: '/practice/trigonometry-basics',
  nextTopicId: TOPIC_IDS.TRIGONOMETRIC_EQUATIONS,
  nextTopicTitle: 'Trigonometric Equations',
  blocks: [
    {
      type: 'formal-definition',
      content: `For an angle $\\theta$ on the unit circle, the point has coordinates:`,
      formula: `(\\cos\\theta, \\sin\\theta)`,
      note: 'cos is the x-coordinate, sin is the y-coordinate.',
    },
    {
      type: 'formal-definition',
      content: `The six trigonometric functions are:`,
      formula: `\\begin{aligned}
\\sin\\theta &= \\frac{\\text{opp}}{\\text{hyp}} \\quad \\cos\\theta = \\frac{\\text{adj}}{\\text{hyp}} \\quad \\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta} \\\\[6pt]
\\csc\\theta &= \\frac{1}{\\sin\\theta} \\quad \\sec\\theta = \\frac{1}{\\cos\\theta} \\quad \\cot\\theta = \\frac{1}{\\tan\\theta}
\\end{aligned}`,
    },
    {
      type: 'formal-definition',
      content: `**Key identities:**`,
      formula: `\\begin{aligned}
\\sin^2\\theta + \\cos^2\\theta &= 1 \\\\
\\tan^2\\theta + 1 &= \\sec^2\\theta \\\\
1 + \\cot^2\\theta &= \\csc^2\\theta
\\end{aligned}`,
    },
    {
      type: 'intuitive-explanation',
      title: 'The Unit Circle',
      paragraphs: [
        `**Special angles:** Memorize values for 0°, 30°, 45°, 60°, 90° (or 0, π/6, π/4, π/3, π/2 in radians).`,
        `**Reference angles:** Any angle can be related to an angle in the first quadrant. The sign depends on the quadrant.`,
        `**ASTC rule:** "All Students Take Calculus" — tells which functions are positive in each quadrant (All, Sin, Tan, Cos).`,
        `**Period:** sin and cos repeat every $2\\pi$. tan repeats every $\\pi$.`,
      ],
      metaphor: 'The unit circle is a clock where the hand traces out all possible angle values as it goes around.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Unit Circle Values',
      problem: `Find $\\sin(\\frac{2\\pi}{3})$ and $\\cos(\\frac{2\\pi}{3})$`,
      steps: [
        {
          explanation: '$\\frac{2\\pi}{3}$ is in quadrant II. Reference angle is $\\pi - \\frac{2\\pi}{3} = \\frac{\\pi}{3}$',
        },
        {
          explanation: 'Values for $\\frac{\\pi}{3}$ (60°):',
          math: `\\sin(\\frac{\\pi}{3}) = \\frac{\\sqrt{3}}{2}, \\quad \\cos(\\frac{\\pi}{3}) = \\frac{1}{2}`,
        },
        {
          explanation: 'In quadrant II: sin is positive, cos is negative',
          highlight: true,
        },
      ],
      finalAnswer: '$\\sin(\\frac{2\\pi}{3}) = \\frac{\\sqrt{3}}{2}$, $\\cos(\\frac{2\\pi}{3}) = -\\frac{1}{2}$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Using Pythagorean Identity',
      problem: `If $\\sin\\theta = \\frac{3}{5}$ and $\\theta$ is in quadrant II, find $\\cos\\theta$`,
      steps: [
        {
          explanation: 'Use the Pythagorean identity:',
          math: `\\sin^2\\theta + \\cos^2\\theta = 1`,
        },
        {
          explanation: 'Substitute and solve:',
          math: `(\\frac{3}{5})^2 + \\cos^2\\theta = 1 \\Rightarrow \\cos^2\\theta = 1 - \\frac{9}{25} = \\frac{16}{25}`,
        },
        {
          explanation: '$\\cos\\theta = \\pm\\frac{4}{5}$. In quadrant II, cosine is negative:',
          highlight: true,
        },
      ],
      finalAnswer: '$\\cos\\theta = -\\frac{4}{5}$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: Converting Degrees and Radians',
      problem: `Convert 135° to radians and $\\frac{5\\pi}{4}$ to degrees`,
      steps: [
        {
          explanation: 'Degrees to radians: multiply by $\\frac{\\pi}{180}$:',
          math: `135° \\times \\frac{\\pi}{180} = \\frac{135\\pi}{180} = \\frac{3\\pi}{4}`,
          highlight: true,
        },
        {
          explanation: 'Radians to degrees: multiply by $\\frac{180}{\\pi}$:',
          math: `\\frac{5\\pi}{4} \\times \\frac{180}{\\pi} = \\frac{5 \\times 180}{4} = 225°`,
        },
      ],
      finalAnswer: '$135° = \\frac{3\\pi}{4}$ rad; $\\frac{5\\pi}{4}$ rad $= 225°$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'Why use radians instead of degrees?',
          answer: `Radians are "natural" for calculus. The derivative formulas $\\frac{d}{dx}[\\sin x] = \\cos x$ only work when $x$ is in radians. Also, arc length = radius × angle in radians.`,
        },
        {
          question: 'How do I remember the special angle values?',
          answer: `For sine at 0°, 30°, 45°, 60°, 90°: think $\\frac{\\sqrt{0}}{2}, \\frac{\\sqrt{1}}{2}, \\frac{\\sqrt{2}}{2}, \\frac{\\sqrt{3}}{2}, \\frac{\\sqrt{4}}{2}$. Cosine is the same pattern but reversed.`,
        },
        {
          question: 'What is the domain and range of trig functions?',
          answer: `sin, cos: domain all reals, range $[-1, 1]$. tan: domain excludes odd multiples of $\\frac{\\pi}{2}$, range all reals. Know these for graphing and solving equations.`,
        },
      ],
    },
  ],
  visualizer: {
    type: 'interactive',
    title: 'Unit Circle',
    badge: 'Interactive',
    badgeVariant: 'default',
    description: 'Explore how angle changes affect sin and cos values.',
    controls: [
      {
        id: 'theta',
        label: 'Angle θ',
        symbol: 'θ',
        min: 0,
        max: 6.28,
        step: 0.1,
        defaultValue: 0.79,
      },
    ],
    graphConfig: {
      function: 'cos(x)',
      domain: [-1.5, 1.5],
      range: [-1.5, 1.5],
      showGrid: true,
      showAxis: true,
    },
  },
};

// Trigonometric Equations Theory
export const trigonometricEquationsTheory: TheoryTopic = {
  id: TOPIC_IDS.TRIGONOMETRIC_EQUATIONS,
  title: 'Trigonometric Equations',
  subtitle: 'Solve equations involving sine, cosine, tangent, and their inverses.',
  breadcrumb: [
    { label: 'Trigonometry', href: '/topics/trigonometry' },
    { label: 'Equations' },
  ],
  practiceUrl: '/practice/trigonometric-equations',
  blocks: [
    {
      type: 'formal-definition',
      content: `The **general solution** for basic trig equations:`,
      formula: `\\begin{aligned}
\\sin\\theta &= k \\Rightarrow \\theta = \\arcsin(k) + 2\\pi n \\text{ or } \\theta = \\pi - \\arcsin(k) + 2\\pi n \\\\
\\cos\\theta &= k \\Rightarrow \\theta = \\pm\\arccos(k) + 2\\pi n \\\\
\\tan\\theta &= k \\Rightarrow \\theta = \\arctan(k) + \\pi n
\\end{aligned}`,
      note: 'Here n is any integer. The period of tan is π, while sin and cos have period 2π.',
    },
    {
      type: 'intuitive-explanation',
      title: 'Solution Strategy',
      paragraphs: [
        `**Isolate the trig function:** Get $\\sin\\theta = k$ (or cos, tan) by itself.`,
        `**Find reference angle:** Use inverse trig to find the principal value.`,
        `**Find all solutions in one period:** Use symmetry (e.g., both $\\theta$ and $\\pi - \\theta$ have the same sine).`,
        `**Add the period:** For all solutions, add multiples of the period ($2\\pi$ for sin/cos, $\\pi$ for tan).`,
      ],
      metaphor: 'Solving trig equations is like finding all the times a clock shows a certain position — it happens repeatedly.',
    },
    {
      type: 'worked-example',
      title: 'Example 1: Basic Sine Equation',
      problem: `Solve $\\sin\\theta = \\frac{1}{2}$ for $\\theta \\in [0, 2\\pi)$`,
      steps: [
        {
          explanation: 'Reference angle: $\\arcsin(\\frac{1}{2}) = \\frac{\\pi}{6}$',
        },
        {
          explanation: 'Sine is positive in quadrants I and II:',
          math: `\\theta = \\frac{\\pi}{6} \\text{ (Q1) or } \\theta = \\pi - \\frac{\\pi}{6} = \\frac{5\\pi}{6} \\text{ (Q2)}`,
          highlight: true,
        },
      ],
      finalAnswer: '$\\theta = \\frac{\\pi}{6}, \\frac{5\\pi}{6}$',
    },
    {
      type: 'worked-example',
      title: 'Example 2: Quadratic in Trig Function',
      problem: `Solve $2\\cos^2\\theta - \\cos\\theta - 1 = 0$ for $\\theta \\in [0, 2\\pi)$`,
      steps: [
        {
          explanation: 'Let $u = \\cos\\theta$. Solve the quadratic:',
          math: `2u^2 - u - 1 = 0 \\Rightarrow (2u + 1)(u - 1) = 0`,
        },
        {
          explanation: 'Solutions: $u = -\\frac{1}{2}$ or $u = 1$',
          highlight: true,
        },
        {
          explanation: '$\\cos\\theta = 1 \\Rightarrow \\theta = 0$',
        },
        {
          explanation: '$\\cos\\theta = -\\frac{1}{2} \\Rightarrow \\theta = \\frac{2\\pi}{3}, \\frac{4\\pi}{3}$',
        },
      ],
      finalAnswer: '$\\theta = 0, \\frac{2\\pi}{3}, \\frac{4\\pi}{3}$',
    },
    {
      type: 'worked-example',
      title: 'Example 3: General Solution',
      problem: `Find all solutions to $\\tan\\theta = \\sqrt{3}$`,
      steps: [
        {
          explanation: 'Reference angle: $\\arctan(\\sqrt{3}) = \\frac{\\pi}{3}$',
        },
        {
          explanation: 'Tangent has period $\\pi$, so:',
          math: `\\theta = \\frac{\\pi}{3} + \\pi n, \\quad n \\in \\mathbb{Z}`,
          highlight: true,
        },
      ],
      finalAnswer: '$\\theta = \\frac{\\pi}{3} + \\pi n$ for any integer $n$',
    },
    {
      type: 'worked-example',
      title: 'Example 4: Using Identities',
      problem: `Solve $\\sin(2\\theta) = \\cos\\theta$ for $\\theta \\in [0, 2\\pi)$`,
      steps: [
        {
          explanation: 'Use double angle formula: $\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta$',
          math: `2\\sin\\theta\\cos\\theta = \\cos\\theta`,
        },
        {
          explanation: 'Factor:',
          math: `\\cos\\theta(2\\sin\\theta - 1) = 0`,
          highlight: true,
        },
        {
          explanation: 'Case 1: $\\cos\\theta = 0 \\Rightarrow \\theta = \\frac{\\pi}{2}, \\frac{3\\pi}{2}$',
        },
        {
          explanation: 'Case 2: $\\sin\\theta = \\frac{1}{2} \\Rightarrow \\theta = \\frac{\\pi}{6}, \\frac{5\\pi}{6}$',
        },
      ],
      finalAnswer: '$\\theta = \\frac{\\pi}{6}, \\frac{\\pi}{2}, \\frac{5\\pi}{6}, \\frac{3\\pi}{2}$',
    },
    {
      type: 'deep-dive',
      questions: [
        {
          question: 'Why do I need to check for extraneous solutions?',
          answer: `Some algebraic steps (like squaring both sides) can introduce false solutions. Always verify your answers by substituting back into the original equation.`,
        },
        {
          question: 'How do I handle equations with different trig functions?',
          answer: `Use identities to rewrite everything in terms of one trig function. For example, use $\\sin^2\\theta + \\cos^2\\theta = 1$ to convert between sin and cos.`,
        },
        {
          question: 'What if the equation has a phase shift?',
          answer: `For equations like $\\sin(\\theta - \\frac{\\pi}{4}) = \\frac{1}{2}$, let $u = \\theta - \\frac{\\pi}{4}$. Solve for $u$, then solve for $\\theta = u + \\frac{\\pi}{4}$.`,
        },
      ],
    },
  ],
};

// Map of all theory topics by ID
// Note: Trigonometry and epsilon-delta removed - not in Reichman Mechina booklet
export const theoryTopicsMap: Record<string, TheoryTopic> = {
  [TOPIC_IDS.FIRST_DEGREE_EQUATIONS]: firstDegreeEquationsTheory,
  [TOPIC_IDS.FRACTIONS]: fractionsTheory,
  [TOPIC_IDS.QUADRATIC_EQUATIONS]: quadraticEquationsTheory,
  [TOPIC_IDS.EXPONENTS]: exponentsTheory,
  [TOPIC_IDS.LOGARITHMS]: logarithmsTheory,
  [TOPIC_IDS.HIGHER_DEGREE_EQUATIONS]: higherDegreeEquationsTheory,
  [TOPIC_IDS.INEQUALITIES]: inequalitiesTheory,
  [TOPIC_IDS.EXPONENTIAL_EQUATIONS]: exponentialEquationsTheory,
  [TOPIC_IDS.LOGARITHMIC_EQUATIONS]: logarithmicEquationsTheory,
  [TOPIC_IDS.LINEAR_FUNCTIONS]: linearFunctionsTheory,
  [TOPIC_IDS.QUADRATIC_FUNCTIONS]: quadraticFunctionsTheory,
  [TOPIC_IDS.POLYNOMIAL_FUNCTIONS]: polynomialFunctionsTheory,
  [TOPIC_IDS.RATIONAL_FUNCTIONS]: rationalFunctionsTheory,
  [TOPIC_IDS.LIMITS]: limitsComputationalTheory,
  [TOPIC_IDS.DERIVATIVES_BASICS]: derivativesBasicsTheory,
  [TOPIC_IDS.DERIVATIVE_APPLICATIONS]: derivativeApplicationsTheory,
  [TOPIC_IDS.CHAIN_RULE]: chainRuleTheory,
};

// Get a theory topic by ID
export function getTheoryTopic(topicId: string): TheoryTopic | undefined {
  return theoryTopicsMap[topicId];
}
