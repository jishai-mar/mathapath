import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Exam structure based on Reichman 2021 format
const EXAM_STRUCTURE = {
  totalPoints: 100,
  durationMinutes: 180,
  questionCount: 5
};

// Question type definitions with exact patterns from the 2021 exam
const QUESTION_TEMPLATES = `
You are generating a practice final exam for Reichman Mechina math preparation.

EXAM FORMAT:
- 5 questions totaling 100 points
- Each question has multiple parts (a, b, c, d) that may build on each other
- Questions progress from easier to harder
- Time allowed: 3 hours

QUESTION TYPES (based on 2021 exam):

QUESTION 1 (20 points) - Parabola and Line Analysis:
Context: Given parabola y = ax² + bx + c AND line y = mx + n
Part a (8 pts): Draw both graphs and find the parabola's negativity interval
Part b (6 pts): Find where parabola is above/below the line
Part c (6 pts): Find tangent line to parabola with given slope

Example:
"Given: Parabola y = x² - 6x + 5 and line y = -3x + 5
a. Draw both graphs and find the parabola's negativity interval.
b. For which values of x is the parabola above the line?
c. Find the equation of the tangent line to the parabola with slope m = 2."

QUESTION 2 (15 points) - Parametric Equation:
Context: Equation with parameter "a"
Part a (8 pts): Solve the equation for x in terms of a
Part b (7 pts): Find values of a for unique/no solution

Example:
"Given the equation: (a - 2)x² + (2a - 4)x + a = 0
a. Solve the equation for x (express your answer in terms of a).
b. For which values of a does the equation have exactly one solution?"

QUESTION 3 (20 points) - Exponential Function:
Context: Function involving e^x (often requires substitution u = e^x)
Part a (10 pts): Find x-axis intersections
Part b (10 pts): Find tangent line at extreme point

Example:
"Given the function: y = e^(2x) - 5e^x + 6
Hint: Use substitution u = e^x
a. Does the function intersect the x-axis? If so, find the intersection point(s).
b. Find the equation of the tangent line at the function's extreme point."

QUESTION 4 (20 points) - Domain and Extrema:
Context: Rational or polynomial function
Part a (5 pts): Find the domain
Part b (15 pts): Find ALL extreme points

Example:
"Given the function: y = (x² - 4)/(x² - 9)
a. Find the domain of the function.
b. Find all extreme points of the function."

QUESTION 5 (25 points) - Complete Function Analysis:
Context: Rational function with parameter, multi-part analysis
Part a (6 pts): Find parameter value from given condition
Part b (5 pts): Find vertical asymptotes and discontinuities
Part c (7 pts): Find increase/decrease intervals  
Part d (7 pts): Find positivity interval

Example:
"Given the function: y = (x - a)²/(x² - 9)
a. The slope of the tangent line at x = 0 equals 1. Find the value of a.
b. Using a = 3 (even if you got a different value in part a), find vertical asymptotes and discontinuity points.
c. Find the intervals where the function is increasing and decreasing.
d. Find the interval where the function is positive."

STRICT REQUIREMENTS:
1. Use ONLY algebraic notation (x, y, a as parameter)
2. NO trigonometry (sin, cos, tan, etc.)
3. NO word problems or story contexts
4. Use proper math notation: ², ³, √, ≤, ≥
5. Include e^x exponential functions in Question 3
6. All coefficients should be reasonable integers (mostly -10 to 10)
7. Ensure questions have clean, solvable answers
8. Point values must sum to exactly 100

FORBIDDEN CONTENT:
- Trigonometric functions
- Greek letters for variables (θ, α, β) - only "a" as parameter name
- Word problems
- Interval notation with π
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { difficulty = 'standard' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating practice exam with difficulty: ${difficulty}`);

    const prompt = `
Generate a complete practice final exam following the Reichman Mechina 2021 format.

Difficulty level: ${difficulty}

${QUESTION_TEMPLATES}

Generate a complete exam with ALL 5 questions. For each question provide:
1. The question number and total points
2. The context/given information (function, equation, etc.)
3. All parts (a, b, c, d) with their individual point values
4. The complete solution for each part

IMPORTANT: Make sure the numbers are different from the examples but follow the exact same structure.

Respond in this exact JSON format:
{
  "examTitle": "Practice Final Exam",
  "totalPoints": 100,
  "durationMinutes": 180,
  "questions": [
    {
      "questionNumber": 1,
      "totalPoints": 20,
      "topic": "Parabola and Line Analysis",
      "context": "Given: Parabola y = ... and line y = ...",
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
            content: "You are an expert math exam generator for Reichman Mechina preparation. Generate exams that exactly match the 2021 final exam format. Always respond with valid JSON only, no additional text." 
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
      // Remove markdown code blocks if present
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

    // Verify point totals
    const totalPoints = exam.questions.reduce((sum: number, q: any) => sum + (q.totalPoints || 0), 0);
    if (totalPoints !== 100) {
      console.warn(`Point total is ${totalPoints}, expected 100. Adjusting...`);
    }

    console.log("Successfully generated exam with", exam.questions.length, "questions");

    return new Response(JSON.stringify({ 
      success: true, 
      exam,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating exam:", error);
    return new Response(JSON.stringify({ 
      error: "An error occurred processing your request",
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
