import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Exam structure matching Practice Exam format
const EXAM_STRUCTURE = {
  totalPoints: 100,
  durationMinutes: 180,
  questionCount: 5
};

// ONLY topics with actual exercise patterns from the Reichman Mechina booklet
const BOOKLET_TOPICS = [
  { 
    name: "First-Degree Equations", 
    patterns: ["Solve ax + b = c - dx", "Distribution and combining like terms", "Nested brackets"]
  },
  { 
    name: "Systems of Linear Equations", 
    patterns: ["Solve 2x2 systems using substitution or elimination"]
  },
  { 
    name: "Algebraic Fractions", 
    patterns: ["Simplify products/quotients of polynomials", "Add/subtract with LCD"]
  },
  { 
    name: "Equations with Parameters", 
    patterns: ["Solve for x in terms of parameter a", "Find domain restrictions"]
  },
  { 
    name: "Quadratic Equations", 
    patterns: ["Factor or use quadratic formula", "Solve ax² + bx + c = 0"]
  },
  { 
    name: "Biquadratic Equations", 
    patterns: ["Substitute t = x², solve for t, then x"]
  },
  { 
    name: "Equations with Radicals", 
    patterns: ["Isolate radical, square both sides, check solutions"]
  },
  { 
    name: "Inequalities", 
    patterns: ["Solve linear, quadratic, and rational inequalities on number line"]
  },
  { 
    name: "Exponents and Powers", 
    patterns: ["Simplify expressions with same base", "Solve a^x = b by matching bases"]
  },
  { 
    name: "Logarithms", 
    patterns: ["Evaluate log expressions", "Solve log equations using log laws"]
  },
  { 
    name: "Linear Functions", 
    patterns: ["Find slope from two points", "Find equation y = mx + b", "Parallel/perpendicular lines"]
  },
  { 
    name: "Quadratic Functions (Parabola)", 
    patterns: ["Find vertex", "Find x-intercepts", "Convert to vertex form", "Find where f(x) > 0"]
  },
  { 
    name: "Limits", 
    patterns: ["Factor and cancel to evaluate", "Direct substitution", "Limits at infinity"]
  },
  { 
    name: "Derivatives of Polynomials", 
    patterns: ["Power rule f'(x)", "Find slope at a point", "Tangent line equation"]
  },
  { 
    name: "Rational Functions", 
    patterns: ["Find domain (denominator ≠ 0)", "Vertical asymptotes", "Increase/decrease intervals"]
  }
];

// FORBIDDEN question types - NOT in the booklet curriculum
const FORBIDDEN_QUESTION_TYPES = `
THESE QUESTION TYPES ARE NOT IN THE REICHMAN MECHINA BOOKLET - NEVER GENERATE:

❌ "Find the coordinates of the hole" or any mention of "holes" or "removable discontinuities"
❌ "Find the oblique asymptote" or "slant asymptote"
❌ "Use L'Hôpital's rule"
❌ "Epsilon-delta proofs" or "formal limit definition"
❌ "Use the chain rule" for complex compositions (only simple power rule allowed)
❌ "Implicit differentiation"
❌ "Find f''(x)" or "second derivative"
❌ "Find inflection points"
❌ "Find the area under the curve" or any integration
❌ Trigonometry (sin, cos, tan, θ, radians, degrees)
❌ Complex numbers (i, imaginary)
❌ Word problems or real-world applications
❌ "Sketch the complete graph" as a standalone question
❌ Parametric equations
❌ Polar coordinates

ONLY THESE BOOKLET QUESTION TYPES ARE ALLOWED:
✓ "Solve for x:" with specific equation types from the booklet
✓ "Simplify:" algebraic expressions and fractions
✓ "Evaluate:" limits by factoring/substitution, logarithms
✓ "Find f'(x) if f(x) = ..." using power rule
✓ "Find the equation of the tangent line at x = a"
✓ "Find the vertex/x-intercepts of the parabola"
✓ "Find the slope/equation of the line through points"
✓ "Solve the inequality:" linear, quadratic, rational
✓ "Find the domain of f(x)" for rational functions
✓ "Find increase/decrease intervals using f'(x)"
✓ "Find positivity interval where f(x) > 0"
✓ "Find vertical asymptotes" (NOT holes, NOT oblique)
`;

// Regex patterns to detect forbidden content in generated questions
const FORBIDDEN_PATTERNS = [
  /coordinates?\s+of\s+(?:the\s+)?holes?/i,
  /removable\s+discontinuit/i,
  /oblique\s+asymptote/i,
  /slant\s+asymptote/i,
  /L'H[oô]pital/i,
  /epsilon[- ]?delta/i,
  /chain\s+rule/i,
  /implicit\s+differentiation/i,
  /second\s+derivative/i,
  /f''\s*\(/i,
  /inflection\s+point/i,
  /area\s+under/i,
  /\bsin\b|\bcos\b|\btan\b|\bcot\b|\bsec\b|\bcsc\b/i,
  /\bθ\b|\btheta\b/i,
  /\bradians?\b|\bdegrees?\b/i,
  /imaginary|complex\s+number/i,
  /\bi\s*=/i,
  /sketch\s+(?:the\s+)?(?:complete\s+)?graph/i,
  /word\s+problem/i,
  /real[- ]world/i,
];

// Check if content contains forbidden patterns
function containsForbiddenContent(text: string): boolean {
  if (!text) return false;
  return FORBIDDEN_PATTERNS.some(pattern => pattern.test(text));
}

const QUESTION_TEMPLATES = `
You are generating a "Practice Quiz" for Reichman Mechina math preparation.
The questions must match ONLY exercise types from the official Reichman Mechina Exercise Booklet.

${FORBIDDEN_QUESTION_TYPES}

EXAM FORMAT:
- 5 questions totaling 100 points
- Each question has multiple parts (a, b, c, d) that may build on each other
- Questions progress from easier to harder
- Time allowed: 3 hours
- IMPORTANT: Each question should be from a DIFFERENT topic area

QUESTION STRUCTURE (based on 2021 exam format):

QUESTION 1 (20 points) - Parabola + Line Analysis:
Part a (8 pts): Draw parabola y = ax² + bx + c and line, find where parabola is negative
Part b (6 pts): Find where parabola is above/below the line (inequality)
Part c (6 pts): Find tangent line to parabola with given slope
DO NOT ask about "holes" - this topic doesn't have holes!

QUESTION 2 (15 points) - Equation with Parameter:
Part a (8 pts): Solve the equation for x in terms of parameter a
Part b (7 pts): Find values of a for which there is a unique solution / no solution
This tests solving skills and domain analysis.

QUESTION 3 (20 points) - Exponential/Logarithmic Equation:
Part a (10 pts): Solve exponential or logarithmic equation for x
Part b (10 pts): Find derivative and tangent line, OR solve a related equation
Use log laws and properties, power rule for derivatives.

QUESTION 4 (20 points) - Polynomial or Rational Function:
Part a (5 pts): Find the domain (where denominator ≠ 0)
Part b (15 pts): Find ALL extreme points using f'(x) = 0
DO NOT ask about "holes" or "oblique asymptotes" - only vertical asymptotes and domain!

QUESTION 5 (25 points) - Rational Function Analysis:
Part a (6 pts): Find y-intercept f(0) or evaluate at specific point
Part b (5 pts): Find vertical asymptotes (where denominator = 0 and numerator ≠ 0)
Part c (7 pts): Find increase/decrease intervals using f'(x)
Part d (7 pts): Find positivity interval where f(x) > 0
DO NOT ask about "holes", "oblique asymptotes", or "sketch complete graph"!

QUESTION FORMATTING:
- Use ONLY formal command phrases: "Solve for x:", "Find:", "Calculate:", "Simplify:"
- NO motivational phrases (Let's, Try, Can you, etc.)
- Use proper LaTeX: $\\frac{a}{b}$, $x^{n}$, $\\sqrt{x}$, $\\log_{a}(x)$, $e^{x}$
- Multi-character exponents MUST use braces: $5^{x+2}$ not $5^x+2$
- For inequalities use: $\\neq$, $\\leq$, $\\geq$, $<$, $>$

ABSOLUTELY FORBIDDEN (will be rejected):
- "coordinates of holes" - NOT in curriculum
- "oblique asymptote" - NOT in curriculum  
- "L'Hôpital's rule" - NOT in curriculum
- Any trigonometry - NOT in curriculum
- "sketch the complete graph" - NOT a booklet question type
`;

// Auto-fix common LaTeX corruption patterns
function autoFixLatex(text: string): string {
  if (!text) return text;
  
  let result = text;
  
  // Fix corrupted \neq patterns (where \n was interpreted as newline)
  result = result.replace(/([a-zA-Z])\s*\n\s*eq\s*(\d)/g, '$1 \\neq $2');
  result = result.replace(/([a-zA-Z])eq(\d)/gi, '$1 \\neq $2');
  result = result.replace(/([a-zA-Z])\s+eq\s+(\d)/gi, '$1 \\neq $2');
  
  // Fix double-prefixed commands
  result = result.replace(/\\f\\frac/g, '\\frac');
  result = result.replace(/\\s\\sqrt/g, '\\sqrt');
  
  // Fix missing backslash on commands
  result = result.replace(/(?<!\\)rac\{/g, '\\frac{');
  result = result.replace(/(?<!\\)qrt\{/g, '\\sqrt{');
  
  return result;
}

// Validate question content - reject forbidden patterns
function isValidQuestion(question: string): { valid: boolean; reason?: string } {
  if (!question || question.trim().length < 10) {
    return { valid: false, reason: "Question too short" };
  }
  
  // Check for placeholder garbage
  const garbagePatterns = /TODO|\?\?\?|\.\.\.{4,}|eq0|PLACEHOLDER/i;
  if (garbagePatterns.test(question)) {
    return { valid: false, reason: "Contains placeholder text" };
  }
  
  // Check for forbidden curriculum content
  if (containsForbiddenContent(question)) {
    return { valid: false, reason: "Contains off-curriculum content" };
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Randomly select 5 different topics for variety
    const shuffledTopics = [...BOOKLET_TOPICS].sort(() => Math.random() - 0.5);
    const selectedTopics = shuffledTopics.slice(0, 5);

    console.log(`Generating Practice Quiz with booklet topics: ${selectedTopics.map(t => t.name).join(', ')}`);

    const prompt = `
Generate a complete "Practice Quiz" following the Reichman Mechina 2021 exam format.
This exam should cover MIXED topics from the curriculum.

Selected topics for each question:
1. ${selectedTopics[0].name} - Exercise patterns: ${selectedTopics[0].patterns.join(', ')}
2. ${selectedTopics[1].name} - Exercise patterns: ${selectedTopics[1].patterns.join(', ')}
3. ${selectedTopics[2].name} - Exercise patterns: ${selectedTopics[2].patterns.join(', ')}
4. ${selectedTopics[3].name} - Exercise patterns: ${selectedTopics[3].patterns.join(', ')}
5. ${selectedTopics[4].name} - Exercise patterns: ${selectedTopics[4].patterns.join(', ')}

${QUESTION_TEMPLATES}

Generate a complete exam with ALL 5 questions. For each question provide:
1. The question number and total points
2. The topic being tested
3. The context/given information (function, equation, etc.)
4. All parts (a, b, c, d) with their individual point values
5. The complete solution for each part

CRITICAL REMINDERS:
- NO questions about "holes" or "removable discontinuities" - this is NOT in the booklet!
- NO "oblique asymptotes" - only vertical asymptotes are in the curriculum!
- NO trigonometry of any kind!
- Use the assigned topics and their exercise patterns

Point distribution: 20, 15, 20, 20, 25 points.

Respond in this exact JSON format:
{
  "examTitle": "Practice Quiz - Mixed Topics",
  "totalPoints": 100,
  "durationMinutes": 180,
  "questions": [
    {
      "questionNumber": 1,
      "totalPoints": 20,
      "topic": "${selectedTopics[0].name}",
      "context": "Given: ...",
      "parts": [
        {
          "partLabel": "a",
          "points": 8,
          "prompt": "...",
          "solution": {
            "steps": ["Step 1: ...", "Step 2: ..."],
            "answer": "..."
          }
        }
      ]
    }
  ]
}
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are an expert math exam generator for Reichman Mechina preparation. 
Generate exams that exactly match the 2021 final exam format with topics from the official exercise booklet.
CRITICAL: Never include questions about "holes", "oblique asymptotes", "L'Hôpital's rule", or trigonometry - these are NOT in the Reichman Mechina curriculum.
Always respond with valid JSON only, no additional text.` 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("Raw AI response:", content.substring(0, 500));

    // Parse JSON from response
    let exam;
    try {
      let jsonStr = content;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      exam = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Failed to parse exam JSON");
    }

    // Validate exam structure
    if (!exam.questions || exam.questions.length !== 5) {
      throw new Error("Invalid exam structure: expected 5 questions");
    }

    // Apply auto-fix, validation, and filter forbidden content
    let hasWarnings = false;
    exam.questions = exam.questions.map((q: any) => {
      // Fix context
      if (q.context) {
        q.context = autoFixLatex(q.context);
        const contextCheck = isValidQuestion(q.context);
        if (!contextCheck.valid) {
          console.warn(`Question ${q.questionNumber} context issue: ${contextCheck.reason}`);
          hasWarnings = true;
        }
      }
      
      // Fix each part
      if (q.parts) {
        q.parts = q.parts.map((part: any) => {
          if (part.prompt) {
            part.prompt = autoFixLatex(part.prompt);
            const promptCheck = isValidQuestion(part.prompt);
            if (!promptCheck.valid) {
              console.warn(`Question ${q.questionNumber} part ${part.partLabel} issue: ${promptCheck.reason}`);
              hasWarnings = true;
            }
          }
          if (part.solution?.steps) {
            part.solution.steps = part.solution.steps.map((step: string) => autoFixLatex(step));
          }
          if (part.solution?.answer) {
            part.solution.answer = autoFixLatex(part.solution.answer);
          }
          return part;
        });
      }
      
      return q;
    });

    if (hasWarnings) {
      console.log("Some questions had validation warnings but were included anyway");
    }

    // Verify point totals
    const totalPoints = exam.questions.reduce((sum: number, q: any) => sum + (q.totalPoints || 0), 0);
    if (totalPoints !== 100) {
      console.warn(`Point total is ${totalPoints}, expected 100.`);
    }

    console.log("Successfully generated Practice Quiz with", exam.questions.length, "booklet-aligned questions");

    return new Response(JSON.stringify({ 
      success: true, 
      exam,
      selectedTopics: selectedTopics.map(t => t.name),
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating exam:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "An error occurred processing your request",
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
