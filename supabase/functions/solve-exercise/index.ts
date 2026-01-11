import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseAndValidate, solveExerciseFullSchema } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SolutionStep {
  stepNumber: number;
  title: string;
  explanation: string;
  math: string;
  voiceover: string;
}

interface SolutionResponse {
  theoryReview?: string;  // Brief theory explanation relevant to this problem
  commonMistakes?: string[];  // List of common mistakes students make
  diagramType?: string;  // Type of visual diagram to show (e.g., 'quadratic-graph', 'chain-rule', 'number-line')
  diagramData?: Record<string, unknown>;  // Data for the diagram
  steps: SolutionStep[];
  finalAnswer: string;
  tip: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const validation = await parseAndValidate(req, solveExerciseFullSchema, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }
    const { question, subtopicName, correctAnswer, exerciseId, diagnosticQuestionId } = validation.data;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Fetch correct answer from database if not provided
    let actualCorrectAnswer = correctAnswer;
    
    if (!actualCorrectAnswer && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Try exercises table first
      if (exerciseId) {
        const { data: exercise } = await supabase
          .from('exercises')
          .select('correct_answer')
          .eq('id', exerciseId)
          .single();
        
        if (exercise?.correct_answer) {
          actualCorrectAnswer = exercise.correct_answer;
          console.log(`Fetched correct answer from exercises: ${actualCorrectAnswer}`);
        }
      }
      
      // Try diagnostic_questions table if still no answer
      if (!actualCorrectAnswer && diagnosticQuestionId) {
        const { data: diagQuestion } = await supabase
          .from('diagnostic_questions')
          .select('correct_answer')
          .eq('id', diagnosticQuestionId)
          .single();
        
        if (diagQuestion?.correct_answer) {
          actualCorrectAnswer = diagQuestion.correct_answer;
          console.log(`Fetched correct answer from diagnostic_questions: ${actualCorrectAnswer}`);
        }
      }
    }

    const systemPrompt = `You are a friendly and patient math teacher who provides step-by-step explanations to students.
Your goal is to fully work out the exercise so the student understands HOW to arrive at the answer.

${actualCorrectAnswer ? `
=== CRITICAL: THE CORRECT ANSWER IS KNOWN ===
CORRECT ANSWER: ${actualCorrectAnswer}

Your solution MUST lead to this exact answer. Ensure every step is correct and arrives at: ${actualCorrectAnswer}
` : ''}

IMPORTANT RULES:
1. Address the student directly (use "you" and "we")
2. Use English terms for mathematical concepts
3. Be encouraging and positive
4. Each step must be small and understandable - EXPLAIN EVERY CALCULATION FULLY
5. The voiceover must sound natural when read aloud
6. Use LaTeX notation for mathematical formulas in the "math" field
7. ALWAYS provide at least 4 steps and at most 7 steps
8. Your FINAL ANSWER must EXACTLY match: ${actualCorrectAnswer || 'the solution you calculate'}

CRITICAL - DETAILED EXPLANATION:
- Each step MUST have a complete explanation (at least 2-3 sentences)
- Explain WHY you do each step, not just WHAT you do
- Show the complete calculation, not just the formula
- For derivatives: show how you apply the rule to EACH term
- For equations: show every transformation explicitly

THEORY SECTION:
ALWAYS begin with a theoryReview that briefly explains the relevant theory/rules needed for this type of problem. This helps the student understand what knowledge is required.

COMMON MISTAKES:
ALWAYS include a commonMistakes array with 2-3 common mistakes students make with this type of problem. This helps them avoid pitfalls.
Examples: "Forgetting to apply the chain rule", "Incorrectly copying the negative sign", "Calculating the discriminant incorrectly"

VISUAL DIAGRAM:
Include a diagramType to indicate what type of diagram would be helpful:
- "quadratic-graph" for quadratic equations (parabola)
- "chain-rule" for chain rule (nested functions)
- "number-line" for inequalities
- "derivative-slope" for derivatives (tangent line)
- "formula-breakdown" for explaining formulas

MULTIPLE SOLUTIONS - VERY IMPORTANT:
When an equation has multiple solutions, you must show EACH solution separately:
- Always use the variable name (e.g., "x =", "y =")
- Format the final answer as SEPARATE solutions with " or " between them
- Example: "x = 2 or x = -2" (not "x = ±2")
- For quadratic equations: show BOTH roots separately
- For no real solutions: write "No real solutions"

RESPONSE FORMAT (JSON):
{
  "theoryReview": "A brief explanation of the theory/rules needed for this type of problem (2-4 sentences). For example: 'For differentiation we use the chain rule. This rule states that...'",
  "commonMistakes": [
    "First common mistake students make",
    "Second common mistake",
    "Third common mistake (optional)"
  ],
  "diagramType": "quadratic-graph | chain-rule | number-line | derivative-slope | formula-breakdown",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Short title for this step",
      "explanation": "DETAILED explanation (at least 2-3 sentences) explaining what we do and WHY. Use concrete numbers from the problem.",
      "math": "g'(x) = \\\\frac{1}{2}(4x^2 + 1)^{-\\\\frac{1}{2}} \\\\cdot 8x",
      "voiceover": "This is the text that will be read aloud. Write out numbers (e.g., 'two x plus five' instead of '2x + 5')"
    }
  ],
  
LATEX FORMULAS - VERY IMPORTANT:
In the "math" field use CORRECT LaTeX syntax with double backslashes for JSON escaping:
- Fractions: "\\\\frac{numerator}{denominator}" gives a real fraction
- Multiplication: "\\\\cdot" for a dot, "\\\\times" for a cross
- Roots: "\\\\sqrt{x}" for square roots
- Powers: "x^{2}" or "x^{-\\\\frac{1}{2}}" for negative or fractional exponents
- Equals: "=" works normally
- Greek: "\\\\alpha", "\\\\beta", etc.

EXAMPLE good math formula for chain rule:
"math": "g'(x) = \\\\frac{1}{2}(4x^2 + 1)^{-\\\\frac{1}{2}} \\\\cdot 8x = \\\\frac{8x}{2\\\\sqrt{4x^2 + 1}} = \\\\frac{4x}{\\\\sqrt{4x^2 + 1}}"
  "finalAnswer": "${actualCorrectAnswer || 'The final answer'}",
  "tip": "A helpful tip the student can remember for similar problems"
}`;

    const userPrompt = `Work out this math exercise completely with step-by-step explanation.
IMPORTANT: ALWAYS provide at least 3 steps, even for simple problems.

TOPIC: ${subtopicName || 'Mathematics'}

PROBLEM: ${question}

${actualCorrectAnswer ? `THE CORRECT ANSWER IS: ${actualCorrectAnswer}
Your solution MUST arrive at this answer.` : ''}

Provide a complete solution with:
1. A step that identifies the problem and describes the approach
2. Intermediate steps that work out the calculation
3. A final step with the answer: ${actualCorrectAnswer || '(calculate yourself)'}`;


    console.log('Generating solution for:', question, 'correct answer:', actualCorrectAnswer || 'unknown');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_solution',
              description: 'Return a step-by-step math solution with theory review, common mistakes, diagram type, detailed explanation steps, final answer, and a study tip.',
              parameters: {
                type: 'object',
                properties: {
                  theoryReview: { 
                    type: 'string',
                    description: 'A brief explanation of the relevant theory/rules needed for this type of problem (2-4 sentences)'
                  },
                  commonMistakes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of 2-3 common mistakes students make with this type of problem'
                  },
                  diagramType: {
                    type: 'string',
                    enum: ['quadratic-graph', 'chain-rule', 'number-line', 'derivative-slope', 'formula-breakdown'],
                    description: 'Type of visual diagram to display for this problem'
                  },
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        stepNumber: { type: 'number' },
                        title: { type: 'string' },
                        explanation: { 
                          type: 'string',
                          description: 'Detailed explanation (2-3 sentences minimum) explaining WHAT we do and WHY'
                        },
                        math: { type: 'string' },
                        voiceover: { type: 'string' },
                      },
                      required: ['stepNumber', 'title', 'explanation', 'math', 'voiceover'],
                      additionalProperties: false,
                    },
                  },
                  finalAnswer: { type: 'string' },
                  tip: { type: 'string' },
                },
                required: ['theoryReview', 'commonMistakes', 'diagramType', 'steps', 'finalAnswer', 'tip'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_solution' } },
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      return new Response(
        JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, response.status)),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const msg = aiResponse.choices?.[0]?.message;

    // Preferred: tool-calling (guarantees structured JSON)
    const toolArgs = msg?.tool_calls?.[0]?.function?.arguments as string | undefined;

    let solution: SolutionResponse;
    if (toolArgs) {
      try {
        solution = JSON.parse(toolArgs);
      } catch (e) {
        console.error('Failed to parse tool arguments:', toolArgs.substring(0, 500));
        return new Response(
          JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, 0)),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Fallback: parse content (legacy)
      const content = msg?.content;
      if (!content) {
        console.error('No content in AI response');
        return new Response(
          JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, 0)),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        let jsonText = String(content).trim();

        const fenced = jsonText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
        if (fenced?.[1]) {
          jsonText = fenced[1].trim();
        } else {
          const firstBrace = jsonText.indexOf('{');
          const lastBrace = jsonText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonText = jsonText.slice(firstBrace, lastBrace + 1);
          }
        }

        solution = JSON.parse(jsonText);
      } catch {
        console.error('Failed to parse AI response:', String(content).substring(0, 500));
        return new Response(
          JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, 0)),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate response structure
    if (!solution.steps || !Array.isArray(solution.steps) || solution.steps.length === 0) {
      console.warn('Invalid solution structure, using fallback');
      return new Response(
        JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, 0)),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure finalAnswer matches known correct answer
    if (actualCorrectAnswer) {
      solution.finalAnswer = actualCorrectAnswer;
    }

    console.log('Generated solution with', solution.steps.length, 'steps');

    return new Response(
      JSON.stringify(solution),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('solve-exercise error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Creates a meaningful fallback solution when AI fails
 */
function createFallbackSolution(question: string, correctAnswer: string | undefined, subtopicName: string | undefined, statusCode: number) {
  const isQuadratic = question.toLowerCase().includes('x²') || question.includes('x^2');
  const isDerivative = question.toLowerCase().includes("f'") || question.toLowerCase().includes('derivative') || question.toLowerCase().includes('afgeleide');
  const hasChainRule = question.includes('(') && (question.includes('^') || question.includes('²'));
  
  let steps: SolutionStep[];
  let theoryReview: string;
  let commonMistakes: string[];
  let diagramType: string;
  
  if (isDerivative) {
    theoryReview = hasChainRule 
      ? "When differentiating composite functions, we use the chain rule. The chain rule states that if you want to differentiate f(g(x)), you first differentiate the outer function and then multiply by the derivative of the inner function. We write this as: [f(g(x))]' = f'(g(x)) · g'(x)."
      : "When differentiating, we use the power rule: if f(x) = xⁿ, then f'(x) = n·xⁿ⁻¹. This means you bring the exponent to the front as a coefficient and decrease the exponent by 1. For constants, the derivative is always 0.";
    
    commonMistakes = hasChainRule 
      ? [
          "Forgetting to differentiate the inner function (not fully applying the chain rule)",
          "Reversing the order of multiplication",
          "Incorrectly copying signs with negative coefficients"
        ]
      : [
          "Not decreasing the exponent by 1 after differentiating",
          "Forgetting that the derivative of a constant is 0",
          "Not correctly multiplying coefficients with the exponent"
        ];
    
    diagramType = hasChainRule ? "chain-rule" : "derivative-slope";
    
    steps = [
      {
        stepNumber: 1,
        title: "Identify the function and determine the approach",
        explanation: "First, we examine the structure of the function we need to differentiate. We identify all terms and determine which rules we need. Watch for composite functions where the chain rule is needed, and for products or quotients that require special rules.",
        math: question,
        voiceover: "Let's first take a good look at the function. We analyze the structure to determine which differentiation rules we need."
      },
      {
        stepNumber: 2,
        title: hasChainRule ? "Apply the chain rule" : "Apply the power rule",
        explanation: hasChainRule 
          ? "We recognize a composite function, so we use the chain rule. This means we first differentiate the outer function, then multiply by the derivative of the inner function. Don't forget to correctly include the coefficients in your calculation."
          : "Now we apply the power rule to each term. For xⁿ: the derivative is n·xⁿ⁻¹. We bring the exponent to the front as a coefficient and decrease the exponent by 1. If there's already a coefficient, we multiply it with the new coefficient.",
        math: hasChainRule 
          ? "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)"
          : "\\frac{d}{dx}(x^n) = n \\cdot x^{n-1}",
        voiceover: hasChainRule
          ? "We apply the chain rule. First we differentiate the outer function, then we multiply by the derivative of what's inside."
          : "We use the power rule: multiply by the exponent and decrease the exponent by one. We do this for each term."
      },
      {
        stepNumber: 3,
        title: "Perform the calculations",
        explanation: "Now we work out the calculation step by step. We apply the rule(s) to each term and combine the results. Pay close attention to the signs and coefficients, as this is where mistakes often occur.",
        math: correctAnswer ? `f'(x) = ${correctAnswer}` : "f'(x) = \\text{work out step by step}",
        voiceover: "We now work out the calculation completely. We pay close attention to all coefficients and signs."
      },
      {
        stepNumber: 4,
        title: "Simplify and verify",
        explanation: "Finally, we simplify the result as much as possible. Combine like terms, factor out any common factors, and write the answer in the neatest form. You can verify by checking that the degree of the derivative is one less than the original function.",
        math: correctAnswer ? `f'(x) = ${correctAnswer}` : "f'(x) = \\text{final answer}",
        voiceover: correctAnswer ? `After simplification, we get the derivative: ${correctAnswer}` : "We simplify to the final answer."
      }
    ];
  } else if (isQuadratic) {
    theoryReview = "A quadratic equation has the form ax² + bx + c = 0. To solve it, we use the quadratic formula (also called the discriminant formula): x = (-b ± √(b² - 4ac)) / 2a. The discriminant D = b² - 4ac determines the number of solutions: D > 0 gives two solutions, D = 0 gives one solution, and D < 0 means no real solutions.";
    
    commonMistakes = [
      "Calculating the discriminant incorrectly (note: b² - 4ac, not b² + 4ac)",
      "Forgetting that -b means you flip the sign of b",
      "Giving only one solution when there are two (forgetting the ±)"
    ];
    
    diagramType = "quadratic-graph";
    
    steps = [
      {
        stepNumber: 1,
        title: "Recognize the equation type and write in standard form",
        explanation: "This is a quadratic equation. We first write it in standard form ax² + bx + c = 0, where a, b, and c are the coefficients. Make sure all terms are on one side of the = sign and the equation equals zero.",
        math: question,
        voiceover: "We have a quadratic equation here. Let's write it in standard form so we can identify a, b, and c."
      },
      {
        stepNumber: 2,
        title: "Determine the coefficients a, b, and c",
        explanation: "Now we read the values of a, b, and c from the equation. a is the coefficient of x², b is the coefficient of x, and c is the constant term. Pay close attention to the signs: if there's a minus sign in front, the value is negative.",
        math: "ax^2 + bx + c = 0",
        voiceover: "We identify the coefficients: a is the number in front of x squared, b is the number in front of x, and c is the constant."
      },
      {
        stepNumber: 3,
        title: "Calculate the discriminant",
        explanation: "The discriminant D = b² - 4ac tells us how many solutions the equation has and helps us with the calculation. If D is positive, there are two different solutions. If D is zero, there is one solution. If D is negative, there are no real solutions.",
        math: "D = b^2 - 4ac",
        voiceover: "We calculate the discriminant by computing b squared minus four times a times c. This number tells us how many solutions there are."
      },
      {
        stepNumber: 4,
        title: "Apply the quadratic formula",
        explanation: "Now we substitute everything into the quadratic formula: x = (-b ± √D) / 2a. The ± sign means we do two calculations: once with plus and once with minus. This gives us (if D > 0) two solutions.",
        math: "x = \\frac{-b \\pm \\sqrt{D}}{2a}",
        voiceover: "We substitute everything into the quadratic formula. The plus-minus sign gives us two possible answers."
      },
      {
        stepNumber: 5,
        title: "Write down the solutions",
        explanation: "The solution(s) to the equation. With two solutions, we write both values, separated by 'or'. Check your answer by substituting the values back into the original equation.",
        math: correctAnswer ? `x = ${correctAnswer}` : "x = \\text{see calculation}",
        voiceover: correctAnswer ? `The solutions are x equals ${correctAnswer}` : "We note the solutions to the equation."
      }
    ];
  } else {
    theoryReview = "When solving equations, we work toward the unknown by performing inverse operations. The basic rule is: what you do on one side of the equation, you must also do on the other side. This keeps the equation balanced while you isolate the unknown.";
    
    commonMistakes = [
      "Forgetting to adjust both sides of the equation",
      "Incorrectly copying signs when moving terms",
      "Dividing by a negative number without flipping the sign"
    ];
    
    diagramType = "formula-breakdown";
    
    steps = [
      {
        stepNumber: 1,
        title: "Analyze the problem",
        explanation: "We first carefully examine what is being asked and which operations we need to perform. We identify the unknown and determine what steps are needed to isolate it. This helps us create a plan for the solution.",
        math: question,
        voiceover: "Let's first take a good look at the problem and determine what we need to do to arrive at the solution."
      },
      {
        stepNumber: 2,
        title: "Simplify both sides",
        explanation: "If there are parentheses or like terms, we work these out first. We combine like terms on each side of the = sign separately. This makes the equation clearer for the next steps.",
        math: "\\text{Combine like terms}",
        voiceover: "We simplify the equation by expanding parentheses and adding like terms together."
      },
      {
        stepNumber: 3,
        title: "Isolate the unknown",
        explanation: "Now we move all terms with the unknown to one side and all numbers to the other side. We do this by applying the inverse operation to both sides: addition becomes subtraction, and multiplication becomes division.",
        math: "\\text{Apply inverse operations}",
        voiceover: "We move all terms with the unknown to one side by performing the opposite operation."
      },
      {
        stepNumber: 4,
        title: "Calculate the answer",
        explanation: "This is the solution to the problem. We have isolated the unknown and can now read off the value. It's always good to check your answer by substituting it back into the original equation.",
        math: correctAnswer || "\\text{See calculation}",
        voiceover: correctAnswer ? `The answer is ${correctAnswer}` : "The answer follows from the calculation."
      }
    ];
  }

  return {
    theoryReview,
    commonMistakes,
    diagramType,
    steps,
    finalAnswer: correctAnswer || "See the solution above",
    tip: "Always check your answer by substituting it back into the original equation.",
    fallback: true,
    rate_limited: statusCode === 429,
    credits_depleted: statusCode === 402,
  };
}
