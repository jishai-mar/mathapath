import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Available topics - 12 total
const BOOKLET_TOPICS = [
  { 
    id: "linear-equations",
    name: "Linear Equations", 
    patterns: ["Solve ax + b = c - dx", "Distribution and combining like terms", "Nested brackets"]
  },
  { 
    id: "quadratic-equations",
    name: "Quadratic Equations", 
    patterns: ["Factor or use quadratic formula", "Solve ax² + bx + c = 0"]
  },
  { 
    id: "biquadratic-equations",
    name: "Biquadratic Equations", 
    patterns: ["Substitute t = x², solve for t, then x"]
  },
  { 
    id: "fractions",
    name: "Algebraic Fractions", 
    patterns: ["Simplify products/quotients of polynomials", "Add/subtract with LCD"]
  },
  { 
    id: "radical-equations",
    name: "Radical Equations", 
    patterns: ["Isolate radical, square both sides, check solutions"]
  },
  { 
    id: "exponents",
    name: "Exponents", 
    patterns: ["Simplify expressions with same base", "Solve a^x = b by matching bases"]
  },
  { 
    id: "logarithms",
    name: "Logarithms", 
    patterns: ["Evaluate log expressions", "Solve log equations using log laws"]
  },
  { 
    id: "inequalities",
    name: "Inequalities", 
    patterns: ["Solve linear, quadratic, and rational inequalities on number line"]
  },
  { 
    id: "limits",
    name: "Limits", 
    patterns: ["Factor and cancel to evaluate", "Direct substitution", "Limits at infinity"]
  },
  { 
    id: "derivatives",
    name: "Derivatives", 
    patterns: ["Power rule f'(x)", "Find slope at a point", "Tangent line equation"]
  },
  { 
    id: "linear-functions",
    name: "Linear Functions", 
    patterns: ["Find slope from two points", "Find equation y = mx + b", "Parallel/perpendicular lines"]
  },
  { 
    id: "quadratic-functions",
    name: "Quadratic Functions", 
    patterns: ["Find vertex", "Find x-intercepts", "Convert to vertex form", "Find where f(x) > 0"]
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

// Calculate topic distribution based on number of selected topics
function calculateTopicDistribution(selectedTopicIds: string[]): string[] {
  const N = selectedTopicIds.length;
  
  // Shuffle the selected topics for randomness
  const shuffled = [...selectedTopicIds].sort(() => Math.random() - 0.5);
  
  // Case A: N >= 5 - one question per topic
  if (N >= 5) {
    return shuffled; // Each topic gets exactly 1 question
  }
  
  // Case B: N < 5 - need exactly 5 questions total
  const distribution: string[] = [];
  
  if (N === 1) {
    // All 5 questions from the single topic
    for (let i = 0; i < 5; i++) {
      distribution.push(shuffled[0]);
    }
  } else if (N === 2) {
    // Distribution [2, 3] randomly assigned
    const counts = Math.random() < 0.5 ? [2, 3] : [3, 2];
    for (let i = 0; i < counts[0]; i++) distribution.push(shuffled[0]);
    for (let i = 0; i < counts[1]; i++) distribution.push(shuffled[1]);
  } else if (N === 3) {
    // Distribution [2, 2, 1] randomly assigned
    const indices = [0, 1, 2].sort(() => Math.random() - 0.5);
    distribution.push(shuffled[indices[0]], shuffled[indices[0]]); // 2 questions
    distribution.push(shuffled[indices[1]], shuffled[indices[1]]); // 2 questions
    distribution.push(shuffled[indices[2]]); // 1 question
  } else if (N === 4) {
    // Distribution [2, 1, 1, 1] randomly assigned
    const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    distribution.push(shuffled[indices[0]], shuffled[indices[0]]); // 2 questions
    distribution.push(shuffled[indices[1]]); // 1 question
    distribution.push(shuffled[indices[2]]); // 1 question
    distribution.push(shuffled[indices[3]]); // 1 question
  }
  
  // Shuffle the final distribution so topics aren't grouped
  return distribution.sort(() => Math.random() - 0.5);
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

    // Parse request body for topic filter
    const body = await req.json().catch(() => ({}));
    const requestedTopicIds: string[] = body.selectedTopics || [];

    // Validate we have at least 1 topic
    if (requestedTopicIds.length < 1) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Please select at least 1 topic" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get topic objects for selected IDs
    const selectedTopics = BOOKLET_TOPICS.filter(t => requestedTopicIds.includes(t.id));
    
    if (selectedTopics.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No valid topics selected" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate distribution: which topic for each question
    const topicDistribution = calculateTopicDistribution(selectedTopics.map(t => t.id));
    const questionCount = topicDistribution.length;

    // Build the topics list for each question
    const questionsConfig = topicDistribution.map((topicId, idx) => {
      const topic = selectedTopics.find(t => t.id === topicId)!;
      return {
        questionNumber: idx + 1,
        topic: topic.name,
        patterns: topic.patterns
      };
    });

    console.log(`Generating quiz with ${questionCount} questions`);
    console.log(`Topic distribution: ${questionsConfig.map(q => q.topic).join(', ')}`);

    // Calculate points per question (distribute 100 points)
    const basePoints = Math.floor(100 / questionCount);
    const extraPoints = 100 - (basePoints * questionCount);
    const pointsPerQuestion = questionsConfig.map((_, idx) => 
      idx < extraPoints ? basePoints + 1 : basePoints
    );

    const questionsPrompt = questionsConfig.map((q, idx) => 
      `Question ${q.questionNumber} (${pointsPerQuestion[idx]} points) - Topic: ${q.topic}
       Exercise patterns: ${q.patterns.join(', ')}`
    ).join('\n\n');

    const prompt = `
Generate a diagnostic quiz titled "Let's find your level" to assess student knowledge.

${FORBIDDEN_QUESTION_TYPES}

QUIZ STRUCTURE:
- Total: ${questionCount} questions, 100 points total
- Each question belongs to EXACTLY ONE topic
- Each question MUST have between 3 and 5 subparts (a, b, c, and optionally d, e)
- All subparts of a question must be from the SAME topic
- Subparts should progress from easier to harder within the same topic
- Time allowed: 3 hours

QUESTIONS TO GENERATE:
${questionsPrompt}

SUBPART REQUIREMENTS:
- Minimum 3 parts per question (a, b, c)
- Maximum 5 parts per question (a, b, c, d, e)
- Each part tests a different aspect of the topic
- Difficulty should increase slightly from part a to the last part
- Label parts clearly as (a), (b), (c), etc.

QUESTION FORMATTING:
- Use ONLY formal command phrases: "Solve for x:", "Find:", "Calculate:", "Simplify:"
- NO motivational phrases (Let's, Try, Can you, etc.)
- Use proper LaTeX: $\\frac{a}{b}$, $x^{n}$, $\\sqrt{x}$, $\\log_{a}(x)$, $e^{x}$
- Multi-character exponents MUST use braces: $5^{x+2}$ not $5^x+2$

Respond in this exact JSON format:
{
  "examTitle": "Let's find your level",
  "totalPoints": 100,
  "durationMinutes": 180,
  "questions": [
    {
      "questionNumber": 1,
      "totalPoints": ${pointsPerQuestion[0]},
      "topic": "${questionsConfig[0].topic}",
      "context": "Given: [provide context for the question]",
      "parts": [
        {
          "partLabel": "a",
          "points": [points for this part],
          "prompt": "[the subquestion]",
          "solution": {
            "steps": ["Step 1: ...", "Step 2: ..."],
            "answer": "[final answer]"
          }
        },
        {
          "partLabel": "b",
          "points": [points for this part],
          "prompt": "[the subquestion]",
          "solution": {
            "steps": ["Step 1: ...", "Step 2: ..."],
            "answer": "[final answer]"
          }
        },
        {
          "partLabel": "c",
          "points": [points for this part],
          "prompt": "[the subquestion]",
          "solution": {
            "steps": ["Step 1: ...", "Step 2: ..."],
            "answer": "[final answer]"
          }
        }
      ]
    }
  ]
}

IMPORTANT: 
- Generate EXACTLY ${questionCount} questions
- Each question MUST have 3-5 parts (not more, not less than 3)
- Points for parts within a question should sum to the question's total points
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
            content: `You are an expert math diagnostic quiz generator. Generate quizzes that accurately assess student knowledge across different math topics. Each question has 3-5 subparts all from the same topic. Always respond with valid JSON only, no additional text.` 
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
    if (!exam.questions || exam.questions.length !== questionCount) {
      console.warn(`Expected ${questionCount} questions, got ${exam.questions?.length || 0}`);
    }

    // Apply auto-fix, validation, and ensure 3-5 parts per question
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
      
      // Ensure 3-5 parts
      if (q.parts && q.parts.length < 3) {
        console.warn(`Question ${q.questionNumber} has only ${q.parts.length} parts, expected 3-5`);
      }
      if (q.parts && q.parts.length > 5) {
        q.parts = q.parts.slice(0, 5); // Trim to max 5
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

    // Set the exam title
    exam.examTitle = "Let's find your level";

    if (hasWarnings) {
      console.log("Some questions had validation warnings but were included anyway");
    }

    // Verify point totals
    const totalPoints = exam.questions.reduce((sum: number, q: any) => sum + (q.totalPoints || 0), 0);
    if (totalPoints !== 100) {
      console.warn(`Point total is ${totalPoints}, expected 100.`);
    }

    console.log("Successfully generated diagnostic quiz with", exam.questions.length, "questions");

    return new Response(JSON.stringify({ 
      success: true, 
      exam,
      selectedTopics: selectedTopics.map(t => ({ id: t.id, name: t.name })),
      questionCount,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error generating quiz:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate quiz";
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
