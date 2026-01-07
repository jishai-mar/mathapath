import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Curriculum structure for the AI to understand
const CURRICULUM_CONTEXT = `
You are an expert mathematics tutor specializing in pre-university exponential equations.

CURRICULUM STRUCTURE (you must be aware of this hierarchy):

1. ALGEBRAIC MANIPULATION (prerequisite)
   - Simplifying expressions, combining like terms
   - Factoring and expanding
   - Isolating variables

2. SIMPLE EQUATIONS (prerequisite, depends on: algebraic manipulation)
   - Linear equations in one variable
   - Verification by substitution

3. LAWS OF EXPONENTS (prerequisite, depends on: algebraic manipulation)
   - Product rule: a^m · a^n = a^(m+n)
   - Quotient rule: a^m / a^n = a^(m-n)
   - Power rule: (a^m)^n = a^(mn)
   - Zero and negative exponents
   
4. LOGARITHMS AS INVERSE (prerequisite, depends on: laws of exponents)
   - Definition: a^x = y ⟺ log_a(y) = x
   - Basic properties: log(ab), log(a/b), log(a^n)
   - Change of base formula

5. EXPONENTIAL EQUATIONS (main topic, depends on: laws of exponents, logarithms, simple equations)
   - MASTERY DEFINITION: "A student can correctly solve exponential equations using exponent rules and logarithms, and justify each step."
   
   Learning Objectives:
   - Solve equations with same base by equating exponents
   - Rewrite bases to make them equal
   - Use logarithms when bases cannot be matched
   - Handle exponentials on both sides
   - Solve equations involving e^x
   - Identify and check for extraneous solutions

COMMON MISTAKES IN EXPONENTIAL EQUATIONS:
- Trying to "cancel" bases incorrectly (e.g., thinking 2^x / 2^y = x/y)
- Forgetting that a^x > 0 for all real x
- Not recognizing when to use logarithms vs base-matching
- Errors applying logarithm to both sides
- Forgetting domain restrictions

When a student struggles with exponential equations, consider whether they need to review prerequisites.
`;

// Problem generation templates
const PROBLEM_TEMPLATES = {
  easy: [
    { pattern: "a^x = a^n", example: "2^x = 2^5", strategy: "Equate exponents directly" },
    { pattern: "a^(x+b) = a^n", example: "3^(x+1) = 3^4", strategy: "Equate exponents, solve linear equation" },
    { pattern: "a^x = n (where n is a power of a)", example: "2^x = 8", strategy: "Rewrite right side as power of base" },
  ],
  medium: [
    { pattern: "a^x = b (bases related)", example: "4^x = 8", strategy: "Convert to common base (2), apply power rule" },
    { pattern: "a^x = b^(x-c)", example: "9^x = 27^(x-1)", strategy: "Convert both to common base, solve linear" },
    { pattern: "c·a^x = d", example: "5·2^x = 40", strategy: "Isolate exponential first, then solve" },
  ],
  hard: [
    { pattern: "a^x = b (no common base)", example: "3^x = 5", strategy: "Take logarithm of both sides" },
    { pattern: "a^x = b^(x+c)", example: "2^x = 3^(x-1)", strategy: "Take ln, use log properties, isolate x" },
    { pattern: "e^(2x) + ae^x + b = 0", example: "e^(2x) - 3e^x + 2 = 0", strategy: "Substitute u = e^x, solve quadratic" },
  ]
};

// Learning style explanation templates
const EXPLANATION_STYLES = {
  formal: {
    intro: "Let me show you the precise mathematical approach:",
    stepFormat: "Step {n}: ",
    notation: "full-symbolic",
    closing: "Therefore, x = {answer}. ∎"
  },
  intuitive: {
    intro: "Let me explain the thinking behind this:",
    stepFormat: "So what we're really doing here is... ",
    notation: "verbal-with-symbols",
    closing: "And that's how we find that x = {answer}!"
  }
};

interface TutorRequest {
  action: 'generate-problem' | 'check-answer' | 'get-hint' | 'explain-solution' | 'generate-exam' | 'assess-readiness';
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  problem?: string;
  studentAnswer?: string;
  learningStyle?: 'formal' | 'intuitive';
  conversationHistory?: { role: string; content: string }[];
  examAnswers?: { questionId: string; answer: string; correct: boolean; difficulty: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: TutorRequest = await req.json();
    const { action, difficulty, learningStyle = 'formal', conversationHistory = [] } = request;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log(`Exponential tutor action: ${action}, difficulty: ${difficulty}, style: ${learningStyle}`);

    let systemPrompt = CURRICULUM_CONTEXT;
    let userPrompt = "";

    // Configure based on learning style
    const styleConfig = EXPLANATION_STYLES[learningStyle];
    
    const styleInstructions = learningStyle === 'formal' 
      ? `
EXPLANATION STYLE: FORMAL
- Use precise mathematical notation
- Present step-by-step derivations with numbered steps
- Write expressions symbolically (e.g., "a^x = a^n ⟹ x = n")
- Be concise and rigorous
- End with QED or similar formal closure
`
      : `
EXPLANATION STYLE: INTUITIVE
- Explain the "why" before the "how"
- Use analogies and real-world connections when helpful
- Write in conversational tone
- Focus on understanding the reasoning, not just the steps
- Use phrases like "Think of it this way..." or "The key insight is..."
`;

    systemPrompt += styleInstructions;

    // Build prompts based on action
    switch (action) {
      case 'generate-problem':
        const diffLevel = difficulty || 'medium';
        const templates = PROBLEM_TEMPLATES[diffLevel];
        
        userPrompt = `
Generate a NEW exponential equation problem at ${diffLevel} difficulty level.

Template patterns for this level (generate a problem matching one of these, but with DIFFERENT numbers):
${templates.map(t => `- Pattern: ${t.pattern}, Example: ${t.example}`).join('\n')}

Requirements:
1. Generate a fresh problem (not from the examples)
2. The problem must have a clean, exact numerical answer (avoid messy decimals when possible)
3. For ${diffLevel} level, ensure appropriate complexity:
   - Easy: Same base or easily convertible to same base
   - Medium: Requires base rewriting or multiple steps
   - Hard: Requires logarithms or substitution techniques
4. Use bases like 2, 3, 4, 5, 8, 9, 10, 16, 27, e (for hard problems)

Respond in this exact JSON format:
{
  "problem": "The equation to solve (e.g., '2^(x+1) = 8')",
  "difficulty": "${diffLevel}",
  "solution": "The exact answer (e.g., 'x = 2')",
  "solutionSteps": ["Step 1: ...", "Step 2: ...", ...],
  "hint1": "A gentle nudge in the right direction",
  "hint2": "A more specific hint about the technique to use",
  "hint3": "Almost giving away the first step",
  "topicId": "exponential-equations",
  "prerequisiteCheck": "What prerequisite knowledge this problem tests"
}
`;
        break;

      case 'check-answer':
        userPrompt = `
A student is solving this exponential equation: ${request.problem}

The student's answer is: ${request.studentAnswer}

Evaluate the student's answer and respond as a human tutor would.

If CORRECT:
- Confirm they are correct with enthusiasm appropriate to the difficulty
- Briefly mention what they did well
- Optionally suggest how this connects to harder problems

If INCORRECT:
- Do NOT reveal the answer yet
- Ask a guiding question to help them see their mistake
- Reference the specific step where they likely went wrong
- Connect to common mistakes if applicable (e.g., "Did you remember that a^x is always positive?")

If PARTIALLY CORRECT (right approach, arithmetic error):
- Acknowledge the correct approach
- Point to where the calculation went wrong
- Encourage them to try again

Respond in JSON format:
{
  "isCorrect": boolean,
  "feedback": "Your response as a tutor (2-4 sentences)",
  "guidingQuestion": "A question to help them think (if incorrect/partial)",
  "encouragement": "A brief encouraging note",
  "mistakeType": "none" | "arithmetic" | "conceptual" | "notation" | null
}
`;
        break;

      case 'get-hint':
        userPrompt = `
A student is stuck on this exponential equation: ${request.problem}

Conversation so far:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

Provide a hint that helps them make progress WITHOUT solving the problem for them.

Your hint should:
1. Be appropriate to where they seem to be stuck
2. Ask a leading question rather than stating facts
3. Reference relevant prerequisite knowledge if needed
4. Be encouraging and patient

Respond in JSON format:
{
  "hint": "Your hint as a tutor (1-3 sentences)",
  "hintLevel": 1 | 2 | 3,
  "relatedConcept": "The mathematical concept this hint addresses"
}
`;
        break;

      case 'explain-solution':
        userPrompt = `
Provide a complete solution explanation for this exponential equation: ${request.problem}

Remember to use ${learningStyle.toUpperCase()} explanation style.

${learningStyle === 'formal' ? 
`For FORMAL style:
- Number each step precisely
- Use symbolic notation throughout
- Show all algebraic manipulations
- Be rigorous and concise` :
`For INTUITIVE style:
- Explain WHY each step makes sense
- Use phrases like "The key insight is..."
- Relate to their existing knowledge
- Make the reasoning feel natural`}

Respond in JSON format:
{
  "introduction": "Brief intro to the approach",
  "steps": [
    { "step": 1, "action": "What we do", "explanation": "Why/how in ${learningStyle} style", "result": "The mathematical result" }
  ],
  "finalAnswer": "x = ...",
  "keyInsight": "The main takeaway from this problem",
  "connection": "How this connects to the broader topic"
}
`;
        break;

      case 'generate-exam':
        userPrompt = `
Generate a practice exam focused on exponential equations.

The exam should:
1. Have exactly 6 questions with this distribution:
   - 2 easy questions (same base or simple conversion)
   - 2 medium questions (base rewriting, multiple steps)
   - 2 hard questions (logarithms required, e^x problems)

2. Cover these skills:
   - Equating exponents with same base
   - Converting bases (like 4^x = 8)
   - Isolating exponential terms
   - Using logarithms
   - Substitution for e^x problems

3. Each question should have a clean, exact answer

4. Mimic realistic pre-university exam style

Respond in JSON format:
{
  "examTitle": "Exponential Equations Practice Exam",
  "totalPoints": 30,
  "timeMinutes": 45,
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "problem": "Solve: ...",
      "points": 5,
      "difficulty": "easy" | "medium" | "hard",
      "solution": "x = ...",
      "solutionSteps": ["Step 1", "Step 2", ...],
      "skillTested": "What skill this tests"
    }
  ],
  "instructions": "Exam instructions for the student"
}
`;
        break;

      case 'assess-readiness':
        const examResults = request.examAnswers || [];
        const correctCount = examResults.filter(a => a.correct).length;
        const totalCount = examResults.length;
        const percentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
        
        // Group by difficulty
        const byDifficulty: Record<string, { correct: number; total: number }> = {
          easy: { correct: 0, total: 0 },
          medium: { correct: 0, total: 0 },
          hard: { correct: 0, total: 0 }
        };
        
        examResults.forEach(a => {
          const diff = a.difficulty || 'medium';
          byDifficulty[diff].total++;
          if (a.correct) byDifficulty[diff].correct++;
        });

        userPrompt = `
Analyze this student's performance on an exponential equations practice exam:

Overall: ${correctCount}/${totalCount} correct (${percentage.toFixed(1)}%)

Performance by difficulty:
- Easy problems: ${byDifficulty.easy.correct}/${byDifficulty.easy.total}
- Medium problems: ${byDifficulty.medium.correct}/${byDifficulty.medium.total}
- Hard problems: ${byDifficulty.hard.correct}/${byDifficulty.hard.total}

Individual results:
${examResults.map(a => `- ${a.questionId}: ${a.correct ? '✓' : '✗'} (${a.difficulty})`).join('\n')}

Provide a readiness assessment with specific, actionable feedback.

Respond in JSON format:
{
  "readinessLevel": "not-ready" | "almost-ready" | "ready",
  "overallScore": ${percentage.toFixed(1)},
  "summary": "2-3 sentence summary of their performance",
  "strengths": ["List specific things they do well"],
  "weaknesses": ["List specific areas needing work"],
  "recommendations": ["Specific study recommendations"],
  "nextSteps": "What they should do next",
  "encouragement": "A personalized encouraging message"
}
`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini-2025-04-14",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: userPrompt }
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
        return new Response(JSON.stringify({ error: "API credits exhausted." }), {
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

    // Parse JSON from response
    let result;
    try {
      let jsonStr = content;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error, returning raw:", parseError);
      // If we can't parse, return the raw content for some actions
      result = { rawResponse: content };
    }

    console.log(`Successfully processed ${action}`);

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Exponential tutor error:", error);
    return new Response(JSON.stringify({ 
      error: "An error occurred processing your request",
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
