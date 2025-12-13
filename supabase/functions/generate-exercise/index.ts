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
    const { subtopicId, difficulty, existingExercises } = await req.json();

    if (!subtopicId || !difficulty) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: subtopicId, difficulty' }),
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

    // Get subtopic info
    const { data: subtopic } = await supabase
      .from('subtopics')
      .select('name, topics(name)')
      .eq('id', subtopicId)
      .single();

    const topicName = (subtopic as any)?.topics?.name || 'Mathematics';
    const subtopicName = subtopic?.name || 'General';

    const examplesText = existingExercises && existingExercises.length > 0
      ? existingExercises.map((ex: any, i: number) => 
          `Example ${i + 1}:\nQuestion: ${ex.question}\nAnswer: ${ex.correct_answer}`
        ).join('\n\n')
      : 'No examples available - create a typical exercise for this topic.';

    const systemPrompt = `You are a mathematics educator creating exercises for the Reichman Mechina curriculum.

Topic: ${topicName}
Subtopic: ${subtopicName}
Difficulty: ${difficulty}

EXERCISE DESIGN PHILOSOPHY:
Exercises must reinforce deep understanding, not just test mechanics.
Each exercise should require the student to apply concepts from the theory, not just follow procedures.

QUESTION FORMATTING - TEXTBOOK STYLE:
- Write questions exactly as they would appear in a high-quality mathematics textbook
- Use formal, neutral language: "Solve for x:", "Find all solutions:", "Simplify:", "Determine:", "Calculate:"
- NO motivational phrases, commentary, or casual language (never "Let's", "Try this", "Can you", etc.)
- NO styling cues, colors, or emphasis markers
- Questions must be direct, professional, and unambiguous

MATHEMATICAL NOTATION - UNICODE SYMBOLS:
- Use actual math symbols, NOT LaTeX syntax in visible text
- Use √ for square root (not \\sqrt)
- Use ² ³ for exponents (e.g., x² not x^2)
- Use ÷ for division, × for multiplication when needed
- Use ± for plus-minus
- Use fractions as a/b format
- Remove unnecessary parentheses around single variables

DIFFICULTY LEVELS:
- easy: single concept, direct application, 1-2 steps
- medium: multiple concepts combined, 3-4 steps, requires planning
- hard: complex reasoning, multiple approaches possible, requires insight

EXPLANATION - TEACH, DON'T JUST SOLVE:
The explanation must be written like a patient tutor explaining to a student:
- Start by identifying what the problem is asking
- Explain WHY each step is taken, not just what to do
- Connect steps to underlying mathematical concepts
- Anticipate common mistakes and address them
- Use phrases like "Notice that...", "This works because...", "The key insight is..."

HINTS - GUIDE, DON'T REVEAL:
Hints should guide thinking, not give away the answer:
- First hint: Identify what type of problem this is or what concept applies
- Second hint: Suggest a starting strategy without showing steps
- Hints should make the student think, not just follow instructions

You MUST respond with valid JSON in exactly this format:
{
  "question": "Solve for x: 2x + 5 = 13",
  "correct_answer": "4",
  "explanation": "Step-by-step solution that teaches the reasoning, not just the mechanics",
  "hints": ["What operation 'undoes' addition?", "After isolating the term with x, what operation isolates x itself?"]
}`;

    const userPrompt = `Generate a NEW ${difficulty} exercise for ${subtopicName}.

${examplesText}

Create a similar but different exercise appropriate for ${difficulty} difficulty.
Use Unicode math symbols (√, ², ³, ±) not LaTeX commands. No motivational phrases.`;

    console.log('Generating new exercise with AI...');

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI generated exercise:', content);

    // Parse the JSON response
    let exercise;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        exercise = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to generate valid exercise');
    }

    // Insert into database
    const { data: newExercise, error: insertError } = await supabase
      .from('exercises')
      .insert({
        subtopic_id: subtopicId,
        question: exercise.question,
        correct_answer: exercise.correct_answer,
        explanation: exercise.explanation,
        hints: exercise.hints || [],
        difficulty: difficulty,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert exercise:', insertError);
      throw new Error('Failed to save generated exercise');
    }

    console.log('New exercise created:', newExercise.id);

    return new Response(
      JSON.stringify(newExercise),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-exercise:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
