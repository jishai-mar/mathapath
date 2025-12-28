// Exam templates based on Reichman Mechina 2021 Final Exam format

export interface ExamPart {
  partLabel: string; // "a", "b", "c", "d", "e"
  prompt: string;
  points: number;
  dependsOn?: string; // Previous part reference
  skillsTested: string[];
}

export interface ExamQuestion {
  questionNumber: number;
  totalPoints: number;
  topic: string[];
  context?: string; // Given function or setup
  parts: ExamPart[];
}

export interface ExamTemplate {
  title: string;
  totalPoints: number;
  durationMinutes: number;
  questions: ExamQuestion[];
}

// 2021 Exam Structure - 5 questions, 100 points total
export const EXAM_2021_STRUCTURE: ExamTemplate = {
  title: "Practice Final Exam - Reichman Mechina Style",
  totalPoints: 100,
  durationMinutes: 180,
  questions: [
    {
      questionNumber: 1,
      totalPoints: 20,
      topic: ["parabola", "linear-functions", "tangent-lines"],
      parts: [
        {
          partLabel: "a",
          prompt: "Draw both graphs and find the parabola's negativity interval",
          points: 8,
          skillsTested: ["graphing", "quadratic-analysis", "interval-notation"]
        },
        {
          partLabel: "b", 
          prompt: "Find the interval where the parabola is above/below the line",
          points: 6,
          dependsOn: "a",
          skillsTested: ["inequality-solving", "graph-interpretation"]
        },
        {
          partLabel: "c",
          prompt: "Find the tangent line to the parabola with the given slope",
          points: 6,
          skillsTested: ["derivatives", "tangent-lines"]
        }
      ]
    },
    {
      questionNumber: 2,
      totalPoints: 15,
      topic: ["parametric-equations", "quadratic-equations"],
      parts: [
        {
          partLabel: "a",
          prompt: "Solve the equation with parameter 'a' and simplify",
          points: 8,
          skillsTested: ["equation-solving", "algebraic-manipulation"]
        },
        {
          partLabel: "b",
          prompt: "Find values of 'a' for which the equation has a unique solution / no solution",
          points: 7,
          dependsOn: "a",
          skillsTested: ["parameter-analysis", "discriminant"]
        }
      ]
    },
    {
      questionNumber: 3,
      totalPoints: 20,
      topic: ["exponential-functions", "derivatives", "tangent-lines"],
      parts: [
        {
          partLabel: "a",
          prompt: "Does the function intersect the x-axis? If so, find the intersection point(s)",
          points: 10,
          skillsTested: ["exponential-equations", "substitution"]
        },
        {
          partLabel: "b",
          prompt: "Find the tangent line at the function's extreme point",
          points: 10,
          skillsTested: ["derivatives", "extreme-points", "tangent-lines"]
        }
      ]
    },
    {
      questionNumber: 4,
      totalPoints: 20,
      topic: ["rational-functions", "domain", "extreme-points"],
      parts: [
        {
          partLabel: "a",
          prompt: "Find the domain of the function",
          points: 5,
          skillsTested: ["domain-analysis"]
        },
        {
          partLabel: "b",
          prompt: "Find ALL extreme points of the function",
          points: 15,
          skillsTested: ["derivatives", "critical-points", "extreme-points"]
        }
      ]
    },
    {
      questionNumber: 5,
      totalPoints: 25,
      topic: ["function-analysis", "asymptotes", "intervals"],
      parts: [
        {
          partLabel: "a",
          prompt: "Find the parameter value given a condition (e.g., slope at a point)",
          points: 6,
          skillsTested: ["derivatives", "parameter-solving"]
        },
        {
          partLabel: "b",
          prompt: "Find vertical asymptotes and discontinuity points",
          points: 5,
          skillsTested: ["asymptotes", "discontinuity"]
        },
        {
          partLabel: "c",
          prompt: "Find increase and decrease intervals",
          points: 7,
          skillsTested: ["derivatives", "monotonicity"]
        },
        {
          partLabel: "d",
          prompt: "Find the function's positivity interval",
          points: 7,
          skillsTested: ["sign-analysis", "inequality-solving"]
        }
      ]
    }
  ]
};

// Question type templates for AI generation
export const EXAM_QUESTION_TEMPLATES = {
  // Question 1: Parabola + Line
  parabolaLine: {
    contextPattern: "Given: Parabola y = ax² + bx + c and line y = mx + n",
    examples: [
      {
        parabola: "y = x² - 6x + 5",
        line: "y = -3x + 5",
        parts: {
          a: "Draw both graphs and find the parabola's negativity interval",
          b: "For which values of x is the parabola above the line?",
          c: "Find the tangent line to the parabola with slope m = 2"
        }
      }
    ],
    numberRanges: {
      a: { min: -3, max: 3 },
      b: { min: -10, max: 10 },
      c: { min: -15, max: 15 }
    }
  },

  // Question 2: Parametric Equation
  parametricEquation: {
    contextPattern: "Solve for x in terms of parameter a",
    examples: [
      {
        equation: "(a - 2)x² + (2a - 4)x + a = 0",
        parts: {
          a: "Solve the equation for x (express answer in terms of a)",
          b: "For which values of a does the equation have exactly one solution?"
        }
      },
      {
        equation: "ax² - (a + 2)x + 2 = 0",
        parts: {
          a: "Solve for x",
          b: "Find all values of a for which there is no solution"
        }
      }
    ]
  },

  // Question 3: Exponential Function
  exponentialFunction: {
    contextPattern: "Given: y = f(e^x) or y = ae^x + be^(-x) + c",
    examples: [
      {
        function: "y = e^(2x) - 5e^x + 6",
        hint: "Use substitution u = e^x",
        parts: {
          a: "Does the function intersect the x-axis? Find intersection points",
          b: "Find the tangent line at the function's minimum point"
        }
      },
      {
        function: "y = e^(2x) - 4e^x + 3",
        parts: {
          a: "Find where y = 0",
          b: "Find the equation of the tangent at the extreme point"
        }
      }
    ]
  },

  // Question 4: Domain and Extrema
  domainExtrema: {
    contextPattern: "Given: y = rational or complex polynomial function",
    examples: [
      {
        function: "y = (x² - 4) / (x² - 9)",
        parts: {
          a: "Find the domain",
          b: "Find all extreme points"
        }
      },
      {
        function: "y = x³ - 6x² + 9x + 1",
        parts: {
          a: "Find the domain",
          b: "Find all local maxima and minima"
        }
      }
    ]
  },

  // Question 5: Complete Function Analysis
  functionAnalysis: {
    contextPattern: "Given: y = (x - a)² / (x² - b) with unknown parameter",
    examples: [
      {
        function: "y = (x - a)² / (x² - 9)",
        condition: "The slope of the tangent at x = 0 is 1",
        parts: {
          a: "Find the value of parameter a",
          b: "Using a = 3, find vertical asymptotes and discontinuity points",
          c: "Find increase and decrease intervals",
          d: "Find the positivity interval"
        }
      }
    ]
  }
};

// Difficulty modifiers for exam generation
export const EXAM_DIFFICULTY_MODIFIERS = {
  standard: {
    coefficientRange: { min: -5, max: 5 },
    includeNegatives: true,
    includeFractions: false
  },
  challenging: {
    coefficientRange: { min: -10, max: 10 },
    includeNegatives: true,
    includeFractions: true
  }
};

// Scoring rubric patterns
export const SCORING_PATTERNS = {
  graphing: "2 points per correct graph element",
  algebraicSteps: "1 point per major algebraic step",
  finalAnswer: "2 points for correct final answer",
  justification: "1-2 points for proper explanation",
  partialCredit: "Half credit for correct method with arithmetic error"
};
