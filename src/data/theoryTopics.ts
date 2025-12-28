import { TheoryTopic } from '@/components/theory/types';

// Topic IDs for routing
export const TOPIC_IDS = {
  FIRST_DEGREE_EQUATIONS: 'first-degree-equations',
  FRACTIONS: 'fractions',
  QUADRATIC_EQUATIONS: 'quadratic-equations',
  EXPONENTS: 'exponents',
  LOGARITHMS: 'logarithms',
  EPSILON_DELTA: 'epsilon-delta',
} as const;

// First-Degree Equations Theory
export const firstDegreeEquationsTheory: TheoryTopic = {
  id: TOPIC_IDS.FIRST_DEGREE_EQUATIONS,
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

// Map of all theory topics by ID
export const theoryTopicsMap: Record<string, TheoryTopic> = {
  [TOPIC_IDS.FIRST_DEGREE_EQUATIONS]: firstDegreeEquationsTheory,
  [TOPIC_IDS.FRACTIONS]: fractionsTheory,
  [TOPIC_IDS.QUADRATIC_EQUATIONS]: quadraticEquationsTheory,
  [TOPIC_IDS.EXPONENTS]: exponentsTheory,
  [TOPIC_IDS.LOGARITHMS]: logarithmsTheory,
  [TOPIC_IDS.EPSILON_DELTA]: limitsTheory,
};

// Get a theory topic by ID
export function getTheoryTopic(topicId: string): TheoryTopic | undefined {
  return theoryTopicsMap[topicId];
}
