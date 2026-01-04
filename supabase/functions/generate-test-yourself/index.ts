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

// All topics from the Reichman Mechina curriculum
const ALL_TOPICS = [
  "First-Degree Equations",
  "Fractions",
  "Quadratic Equations",
  "Biquadratic Equations",
  "Radical Equations",
  "Higher-Degree Equations",
  "Inequalities",
  "Exponents",
  "Exponential Equations",
  "Logarithms",
  "Linear Functions",
  "Quadratic Functions",
  "Limits",
  "Derivatives",
  "Chain Rule",
  "Rational Functions"
];

const QUESTION_TEMPLATES = `
You are generating a "Test Yourself" practice exam for Reichman Mechina math preparation.
The questions must match the EXACT style of the Reichman Mechina Exercise Booklet.

EXAM FORMAT:
- 5 questions totaling 100 points
- Each question has multiple parts (a, b, c, d) that may build on each other
- Questions progress from easier to harder
- Time allowed: 3 hours
- IMPORTANT: Each question should be from a DIFFERENT topic area

QUESTION STRUCTURE (based on 2021 exam format):

QUESTION 1 (20 points):
Context: Given parabola y = ax² + bx + c AND line y = mx + n
Part a (8 pts): Draw both graphs and find the parabola's negativity interval
Part b (6 pts): Find where parabola is above/below the line
Part c (6 pts): Find tangent line to parabola with given slope

QUESTION 2 (15 points):
Context: Equation with parameter "a"
Part a (8 pts): Solve the equation for x in terms of a
Part b (7 pts): Find values of a for unique/no solution

QUESTION 3 (20 points):
Context: Function involving e^x or logarithms
Part a (10 pts): Find x-axis intersections or solve equation
Part b (10 pts): Find tangent line at extreme point or solve related equation

QUESTION 4 (20 points):
Context: Rational or polynomial function
Part a (5 pts): Find the domain
Part b (15 pts): Find ALL extreme points

QUESTION 5 (25 points):
Context: Rational function, multi-part analysis
Part a (6 pts): Find specific value (like y-intercept or slope at a point)
Part b (5 pts): Find vertical asymptotes and discontinuities
Part c (7 pts): Find increase/decrease intervals  
Part d (7 pts): Find positivity interval

QUESTION FORMATTING:
- Use ONLY formal command phrases: "Solve for x:", "Find:", "Calculate:", "Simplify:"
- NO motivational phrases (Let's, Try, Can you, etc.)
- Use proper LaTeX: $\\frac{a}{b}$, $x^{n}$, $\\sqrt{x}$, $\\log_{a}(x)$, $e^{x}$
- Multi-character exponents MUST use braces: $5^{x+2}$ not $5^x+2$
- For inequalities use: $\\neq$, $\\leq$, $\\geq$, $<$, $>$

FORBIDDEN CONTENT:
- Trigonometric functions (sin, cos, tan, etc.)
- Greek letters for variables (θ, α, β) - only "a" as parameter name
- Word problems or story contexts
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

// Validate question content
function isValidQuestion(question: string): boolean {
  if (!question || question.trim().length < 10) return false;
  
  // Check for placeholder garbage
  const garbagePatterns = /TODO|\?\?\?|\.\.\.{4,}|eq0|PLACEHOLDER/i;
  if (garbagePatterns.test(question)) return false;
  
  return true;
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
    const shuffledTopics = [...ALL_TOPICS].sort(() => Math.random() - 0.5);
    const selectedTopics = shuffledTopics.slice(0, 5);

    console.log(`Generating Test Yourself exam with topics: ${selectedTopics.join(', ')}`);

    const prompt = `
Generate a complete "Test Yourself" practice exam following the Reichman Mechina 2021 format.
This exam should cover MIXED topics from the entire curriculum.

Selected topics for each question:
1. ${selectedTopics[0]}
2. ${selectedTopics[1]}
3. ${selectedTopics[2]}
4. ${selectedTopics[3]}
5. ${selectedTopics[4]}

${QUESTION_TEMPLATES}

Generate a complete exam with ALL 5 questions. For each question provide:
1. The question number and total points
2. The topic being tested
3. The context/given information (function, equation, etc.)
4. All parts (a, b, c, d) with their individual point values
5. The complete solution for each part

IMPORTANT: Use the assigned topics but keep the same point distribution (20, 15, 20, 20, 25 points).

Respond in this exact JSON format:
{
  "examTitle": "Test Yourself - Mixed Topics",
  "totalPoints": 100,
  "durationMinutes": 180,
  "questions": [
    {
      "questionNumber": 1,
      "totalPoints": 20,
      "topic": "${selectedTopics[0]}",
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
            content: "You are an expert math exam generator for Reichman Mechina preparation. Generate exams that exactly match the 2021 final exam format with mixed topics. Always respond with valid JSON only, no additional text." 
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

    // Apply auto-fix and validation to all questions
    exam.questions = exam.questions.map((q: any) => {
      // Fix context
      if (q.context) {
        q.context = autoFixLatex(q.context);
      }
      
      // Fix each part
      if (q.parts) {
        q.parts = q.parts.map((part: any) => {
          if (part.prompt) {
            part.prompt = autoFixLatex(part.prompt);
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

    // Verify point totals
    const totalPoints = exam.questions.reduce((sum: number, q: any) => sum + (q.totalPoints || 0), 0);
    if (totalPoints !== 100) {
      console.warn(`Point total is ${totalPoints}, expected 100.`);
    }

    console.log("Successfully generated Test Yourself exam with", exam.questions.length, "questions");

    return new Response(JSON.stringify({ 
      success: true, 
      exam,
      selectedTopics,
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
