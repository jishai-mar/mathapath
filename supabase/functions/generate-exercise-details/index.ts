import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseId, subtopicId, subtopicName, topicName, question, difficulty } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: question' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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

    const systemPrompt = `You are an expert math tutor creating comprehensive learning materials.
Generate theory content and a detailed step-by-step solution for the given exercise.

TOPIC: ${actualTopicName || 'Mathematics'}
SUBTOPIC: ${actualSubtopicName || 'General'}
DIFFICULTY: ${difficulty || 'medium'}

You must return a JSON object with:

1. "theory": An object containing:
   - "title": A clear title for the concept
   - "explanation": A concise 2-3 paragraph explanation of the concept
   - "keyFormulas": An array of key formulas/rules (using LaTeX, wrapped in $)
   - "miniExample": A small worked example (different from the main exercise) with "problem" and "solution"

2. "solutionSteps": An array of step objects, each with:
   - "stepNumber": The step number (1, 2, 3, etc.)
   - "title": A short title for this step (e.g., "Isolate the variable")
   - "action": What to do in this step
   - "calculation": The mathematical work (using LaTeX with $ delimiters)
   - "explanation": Plain language explanation of why we do this

3. "finalAnswer": The final answer (with $ delimiters for math)

4. "tip": A helpful tip for solving similar problems

Keep explanations clear and student-friendly. Use LaTeX notation wrapped in $ for all math.`;

    const userPrompt = `Generate detailed theory and step-by-step solution for this exercise:

Exercise: ${question}

Return valid JSON only.`;

    console.log(`Generating exercise details for: ${question}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
      throw new Error('Failed to generate exercise details');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received');

    // Parse the JSON response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a structured fallback
      result = {
        theory: {
          title: actualSubtopicName || "Mathematical Concept",
          explanation: "This topic involves applying mathematical operations systematically to solve equations or expressions.",
          keyFormulas: ["Apply inverse operations", "Maintain equation balance"],
          miniExample: {
            problem: "Solve: $2x + 3 = 7$",
            solution: "Subtract 3: $2x = 4$. Divide by 2: $x = 2$"
          }
        },
        solutionSteps: [
          {
            stepNumber: 1,
            title: "Understand the problem",
            action: "Identify what we need to find",
            calculation: question,
            explanation: "Read the problem carefully and identify the unknown."
          },
          {
            stepNumber: 2,
            title: "Apply the method",
            action: "Use the appropriate technique",
            calculation: "Working...",
            explanation: "Apply the relevant mathematical operations."
          },
          {
            stepNumber: 3,
            title: "Find the answer",
            action: "Calculate the final result",
            calculation: "See full solution",
            explanation: "Complete the calculation to find the answer."
          }
        ],
        finalAnswer: "See the complete solution above",
        tip: "Always check your answer by substituting back into the original equation."
      };
    }

    // Ensure we have required fields
    if (!result.solutionSteps || !Array.isArray(result.solutionSteps)) {
      result.solutionSteps = [];
    }
    if (!result.theory) {
      result.theory = {
        title: actualSubtopicName || "Topic",
        explanation: "Theory content not available.",
        keyFormulas: [],
        miniExample: null
      };
    }

    console.log('Exercise details generated successfully');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-exercise-details:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
