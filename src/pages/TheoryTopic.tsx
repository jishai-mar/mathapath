import { TheoryPage } from '@/components/theory';
import { TheoryTopic } from '@/components/theory/types';

// Sample topic: Epsilon-Delta Definition of Limits
const limitsTheory: TheoryTopic = {
  id: 'epsilon-delta',
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

export default function TheoryTopicPage() {
  return <TheoryPage topic={limitsTheory} />;
}
