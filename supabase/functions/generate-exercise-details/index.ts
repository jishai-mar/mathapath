import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { validateRequestBody, generateExerciseDetailsSchema } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body ONCE
    let rawBody: Record<string, unknown>;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields using the schema
    const validation = validateRequestBody(rawBody, generateExerciseDetailsSchema, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }
    const { exerciseId, includeHints, includeExplanation } = validation.data;
    
    // Get additional optional fields from the same parsed body
    const subtopicId = rawBody.subtopicId as string | undefined;
    const subtopicName = rawBody.subtopicName as string | undefined;
    const topicName = rawBody.topicName as string | undefined;
    const question = (rawBody.question as string) || '';
    const difficulty = rawBody.difficulty as string | undefined;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // CRITICAL: Fetch the correct answer from the database
    let correctAnswer = '';
    let explanation = '';
    if (exerciseId) {
      const { data: exercise, error: exerciseError } = await supabase
        .from('exercises')
        .select('correct_answer, explanation')
        .eq('id', exerciseId)
        .single();
      
      if (!exerciseError && exercise) {
        correctAnswer = exercise.correct_answer;
        explanation = exercise.explanation || '';
        console.log(`Fetched correct answer: ${correctAnswer}`);
      } else {
        console.warn('Could not fetch exercise answer:', exerciseError?.message);
      }
    }

    // Get subtopic info if we have subtopicId but not names
    let actualSubtopicName = subtopicName;
    let actualTopicName = topicName;
    
    if (subtopicId && (!subtopicName || !topicName)) {
      const { data: subtopic } = await supabase
        .from('subtopics')
        .select('name, topics(name)')
        .eq('id', subtopicId)
        .single();
      
      if (subtopic) {
        actualSubtopicName = subtopic.name;
        actualTopicName = (subtopic as any).topics?.name || 'Mathematics';
      }
    }

    const systemPrompt = `You are an expert math tutor creating comprehensive step-by-step solutions.
Your solutions must be MATHEMATICALLY CORRECT and lead to the KNOWN CORRECT ANSWER.

TOPIC: ${actualTopicName || 'Mathematics'}
SUBTOPIC: ${actualSubtopicName || 'General'}
DIFFICULTY: ${difficulty || 'medium'}

${correctAnswer ? `
=== CRITICAL: THE CORRECT ANSWER IS KNOWN ===
CORRECT ANSWER: ${correctAnswer}

Your solution MUST lead to this exact answer. Work backwards if needed to ensure your steps arrive at: ${correctAnswer}
` : ''}

=== OUTPUT STRUCTURE ===

Return a JSON object with these fields:

1. "theory": An object containing:
   - "title": A clear title for the concept being used
   - "explanation": A 2-3 paragraph explanation of the method (in Dutch or English, matching the question language)
   - "keyFormulas": An array of key formulas using LaTeX (wrap in $)
   - "miniExample": A simple worked example with "problem" and "solution" fields

2. "solutionSteps": An array with 3-6 step objects:
   - "stepNumber": 1, 2, 3, etc.
   - "title": Short step title (e.g., "Isoleer de variabele")
   - "action": What operation to perform
   - "calculation": The math for this step (LaTeX with $ delimiters)
   - "explanation": Why we do this step

3. "finalAnswer": The final answer (MUST match the known correct answer: "${correctAnswer || 'derive from your solution'}")

4. "tip": A helpful study tip for this problem type

=== MATHEMATICAL NOTATION ===
- Wrap ALL math in $ delimiters
- Use proper LaTeX: $\\frac{a}{b}$, $\\sqrt{x}$, $x^{2}$
- For multiple solutions: "$x = 2$ of $x = -2$" or "$x = 2, -2$"

=== LANGUAGE ===
Use Dutch for explanations:
- "Stap" for step
- "We beginnen met..." for starting explanations
- "Dus..." for conclusions

Return ONLY valid JSON. No markdown code blocks.`;

    const userPrompt = `Generate a complete step-by-step solution for:

EXERCISE: ${question}
${correctAnswer ? `KNOWN CORRECT ANSWER: ${correctAnswer}` : ''}
${explanation ? `EXISTING EXPLANATION: ${explanation}` : ''}

Your solution MUST:
1. Be mathematically rigorous
2. Lead to the correct answer: ${correctAnswer || '(derive from solving)'}
3. Have 3-6 clear steps
4. Use proper LaTeX notation

Return valid JSON only.`;

    console.log(`Generating exercise details for: ${question}, correct answer: ${correctAnswer || 'unknown'}`);

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
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Return a meaningful fallback with the known correct answer
      return new Response(
        JSON.stringify(createFallbackSolution(question, correctAnswer, actualSubtopicName)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify(createFallbackSolution(question, correctAnswer, actualSubtopicName)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI response received, parsing...');

    // Parse the JSON response with improved extraction
    let result;
    try {
      let jsonText = String(content).trim();
      
      // Remove markdown code fences if present
      const fenced = jsonText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
      if (fenced?.[1]) {
        jsonText = fenced[1].trim();
      } else {
        // Extract first complete JSON object
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonText = jsonText.slice(firstBrace, lastBrace + 1);
        }
      }
      
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Content:', content.substring(0, 500));
      return new Response(
        JSON.stringify(createFallbackSolution(question, correctAnswer, actualSubtopicName)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and ensure required structure
    if (!result.solutionSteps || !Array.isArray(result.solutionSteps) || result.solutionSteps.length === 0) {
      console.warn('Invalid solution structure, using fallback');
      return new Response(
        JSON.stringify(createFallbackSolution(question, correctAnswer, actualSubtopicName)),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure finalAnswer matches known correct answer
    if (correctAnswer && result.finalAnswer !== correctAnswer) {
      result.finalAnswer = correctAnswer;
    }

    // Ensure theory exists
    if (!result.theory) {
      result.theory = {
        title: actualSubtopicName || "Wiskundige Methode",
        explanation: "Pas de juiste wiskundige operaties systematisch toe.",
        keyFormulas: [],
        miniExample: null
      };
    }

    console.log('Exercise details generated successfully with', result.solutionSteps.length, 'steps');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-exercise-details:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Creates a meaningful fallback solution when AI fails
 */
function createFallbackSolution(question: string, correctAnswer: string, subtopicName: string | undefined) {
  // Try to create a basic solution based on the question type
  const isQuadratic = question.toLowerCase().includes('x²') || question.includes('x^2');
  const isLinear = question.toLowerCase().includes('solve') && !isQuadratic;
  const isDerivative = question.toLowerCase().includes("f'") || question.toLowerCase().includes('derivative');
  const isLimit = question.toLowerCase().includes('lim');
  
  let steps;
  let theory;
  
  if (isDerivative) {
    theory = {
      title: "Afgeleiden (Derivatives)",
      explanation: "De afgeleide van een functie geeft de helling van de raaklijn in elk punt. Gebruik de machtsregel: als f(x) = xⁿ, dan f'(x) = n·xⁿ⁻¹.",
      keyFormulas: ["$\\frac{d}{dx}(x^n) = n \\cdot x^{n-1}$", "$\\frac{d}{dx}(c) = 0$"],
      miniExample: { problem: "$f(x) = x^3$", solution: "$f'(x) = 3x^2$" }
    };
    steps = [
      { stepNumber: 1, title: "Identificeer de functie", action: "Bekijk de gegeven functie", calculation: question, explanation: "We identificeren eerst welke termen we moeten afleiden." },
      { stepNumber: 2, title: "Pas de machtsregel toe", action: "Gebruik de regel: d/dx(xⁿ) = n·xⁿ⁻¹", calculation: "Voor elke term: vermenigvuldig met de exponent en verlaag de exponent met 1", explanation: "De machtsregel is de basis voor het afleiden van polynomen." },
      { stepNumber: 3, title: "Eindantwoord", action: "Schrijf het resultaat op", calculation: correctAnswer ? `$f'(x) = ${correctAnswer}$` : "Zie de volledige uitwerking", explanation: "Dit is de afgeleide van de oorspronkelijke functie." }
    ];
  } else if (isQuadratic) {
    theory = {
      title: "Kwadratische Vergelijkingen",
      explanation: "Een kwadratische vergelijking heeft de vorm ax² + bx + c = 0. Los op door: factoriseren, de abc-formule, of door vereenvoudiging.",
      keyFormulas: ["$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"],
      miniExample: { problem: "$x^2 - 4 = 0$", solution: "$x = \\pm 2$" }
    };
    steps = [
      { stepNumber: 1, title: "Herken de vergelijking", action: "Identificeer a, b, en c", calculation: question, explanation: "We identificeren de coëfficiënten in de standaardvorm." },
      { stepNumber: 2, title: "Los op", action: "Gebruik de geschikte methode", calculation: "Pas factorisatie of de abc-formule toe", explanation: "Kies de methode die het beste past bij deze vergelijking." },
      { stepNumber: 3, title: "Eindantwoord", action: "Noteer alle oplossingen", calculation: correctAnswer ? `$x = ${correctAnswer}$` : "Zie de volledige uitwerking", explanation: "Een kwadratische vergelijking kan 0, 1 of 2 oplossingen hebben." }
    ];
  } else {
    theory = {
      title: subtopicName || "Wiskundige Methode",
      explanation: "Los de vergelijking stap voor stap op door inverse operaties toe te passen.",
      keyFormulas: ["Behoud balans: wat je aan één kant doet, doe je ook aan de andere kant"],
      miniExample: { problem: "$2x + 3 = 7$", solution: "$2x = 4$, dus $x = 2$" }
    };
    steps = [
      { stepNumber: 1, title: "Analyseer het probleem", action: "Bekijk wat er gevraagd wordt", calculation: question, explanation: "We identificeren eerst het type probleem en de aanpak." },
      { stepNumber: 2, title: "Werk stap voor stap", action: "Pas de juiste operaties toe", calculation: "Gebruik inverse operaties om te vereenvoudigen", explanation: "Door systematisch te vereenvoudigen komen we tot het antwoord." },
      { stepNumber: 3, title: "Eindantwoord", action: "Noteer de oplossing", calculation: correctAnswer ? `$${correctAnswer}$` : "Zie de volledige uitwerking", explanation: "Controleer je antwoord door terug te substitueren." }
    ];
  }

  return {
    theory,
    solutionSteps: steps,
    finalAnswer: correctAnswer || "Zie de uitwerking hierboven",
    tip: "Controleer altijd je antwoord door het terug te substitueren in de oorspronkelijke vergelijking."
  };
}
