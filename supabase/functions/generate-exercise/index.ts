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
    const { subtopicId, difficulty, existingExercises, userId, performanceData } = await req.json();

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

    // Fetch student's performance data if userId provided
    let studentContext = '';
    if (userId) {
      const { data: recentAttempts } = await supabase
        .from('exercise_attempts')
        .select(`
          is_correct,
          hints_used,
          misconception_tag,
          exercises!inner(difficulty, subtopic_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      const subtopicAttempts = (recentAttempts || []).filter((a: any) => a.exercises?.subtopic_id === subtopicId);
      
      if (subtopicAttempts.length > 0) {
        const stats = { easy: { c: 0, t: 0 }, medium: { c: 0, t: 0 }, hard: { c: 0, t: 0 } };
        const misconceptions: string[] = [];
        
        subtopicAttempts.forEach((a: any) => {
          const d = a.exercises?.difficulty;
          if (d && stats[d as keyof typeof stats]) {
            stats[d as keyof typeof stats].t++;
            if (a.is_correct) stats[d as keyof typeof stats].c++;
          }
          if (a.misconception_tag && !misconceptions.includes(a.misconception_tag)) {
            misconceptions.push(a.misconception_tag);
          }
        });

        const successRates = Object.entries(stats)
          .filter(([_, v]) => v.t > 0)
          .map(([k, v]) => `${k}: ${Math.round((v.c / v.t) * 100)}%`)
          .join(', ');

        studentContext = `
STUDENT PERFORMANCE CONTEXT:
- Success rates by difficulty: ${successRates || 'No data yet'}
- Common misconceptions: ${misconceptions.length > 0 ? misconceptions.join(', ') : 'None identified'}
- Total attempts in this subtopic: ${subtopicAttempts.length}

PERSONALIZATION INSTRUCTIONS:
${difficulty === 'easy' && stats.easy.t > 3 && (stats.easy.c / stats.easy.t) < 0.5 
  ? '- Student is struggling with easy problems. Create a very clear, foundational exercise with explicit structure.'
  : ''}
${difficulty === 'medium' && misconceptions.length > 0 
  ? `- Target these misconceptions in the exercise design: ${misconceptions.slice(0, 2).join(', ')}`
  : ''}
${difficulty === 'hard' && stats.hard.t > 2 && (stats.hard.c / stats.hard.t) > 0.7
  ? '- Student excels at hard problems. Create a challenging multi-step problem requiring insight.'
  : ''}
`;
      }
    }

    const examplesText = existingExercises && existingExercises.length > 0
      ? existingExercises.map((ex: any, i: number) => 
          `Example ${i + 1}:\nQuestion: ${ex.question}\nAnswer: ${ex.correct_answer}`
        ).join('\n\n')
      : 'No examples available - create a typical exercise for this topic.';

    const systemPrompt = `You are a mathematics educator creating exercises for the Reichman Mechina curriculum.

Topic: ${topicName}
Subtopic: ${subtopicName}
Difficulty: ${difficulty}
${studentContext}
EXERCISE DESIGN PHILOSOPHY:
Exercises must reinforce deep understanding, not just test mechanics.
Each exercise should require the student to apply concepts from the theory, not just follow procedures.

QUESTION FORMATTING - STRICT TEXTBOOK STYLE:
- Write questions EXACTLY as they would appear in a professional mathematics textbook
- Use ONLY formal, neutral command language:
  • "Solve for x:"
  • "Find all real solutions:"
  • "Simplify:"
  • "Determine the value of:"
  • "Calculate:"
  • "Factor completely:"
  • "Evaluate:"
- ABSOLUTELY NO motivational phrases: never use "Let's", "Try", "Can you", "Here's", "Now", "Great", etc.
- ABSOLUTELY NO commentary or context: just state the mathematical task directly
- ABSOLUTELY NO styling cues, colors, emphasis markers, or UI hints
- Questions must be concise, direct, and unambiguous

MATHEMATICAL NOTATION - CLEAN UNICODE (CRITICAL):
- Use ONLY clean Unicode symbols, NEVER LaTeX syntax
- Square root: √ (not \\sqrt, not sqrt, not ^(1/2))
- Exponents: ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ (e.g., x² not x^2, not x**2)
- Plus-minus: ± (not +/-, not +-) 
- Multiplication: × or · when explicit (not *, not x as multiply)
- Division in expressions: use fraction form a/b
- Inequality: ≤ ≥ ≠ < > (proper symbols)
- REMOVE all dollar signs ($), backslashes (\\), LaTeX commands
- REMOVE unnecessary parentheses around single variables: write x not (x)
- REMOVE extra spaces and formatting artifacts

FORBIDDEN PATTERNS (never include these):
- "Let's solve...", "Try to...", "Can you find..."
- "Here is a problem...", "Consider the following..."
- Any emoji or decorative characters
- $...$ or $$...$$ delimiters
- \\frac, \\sqrt, \\pm, or any LaTeX command
- Explanatory text before the actual question
- Multiple questions in one exercise

CORRECT EXAMPLES:
✓ "Solve for x: 3x² − 12 = 0"
✓ "Find all real solutions: √(x + 5) = 3"
✓ "Simplify: (2x³ + 6x²) ÷ 2x"
✓ "Factor completely: x² − 9"

INCORRECT EXAMPLES (never do this):
✗ "Let's solve this equation: $3x^2 - 12 = 0$"
✗ "Try to find x in: \\sqrt{x+5} = 3"
✗ "Here's a challenge! Can you simplify (2x^3 + 6x^2) / 2x?"

DIFFICULTY LEVELS:
- easy: single concept, direct application, 1-2 steps
- medium: multiple concepts combined, 3-4 steps, requires planning
- hard: complex reasoning, multiple approaches possible, requires insight

EXPLANATION - TEACH THE REASONING:
- Start by identifying what the problem is asking
- Explain WHY each step is taken, not just what to do
- Connect steps to underlying mathematical concepts
- Use phrases like "Notice that...", "This works because...", "The key insight is..."

HINTS - GUIDE WITHOUT REVEALING:
- First hint: Identify what type of problem this is or what concept applies
- Second hint: Suggest a starting strategy without showing steps
- Hints should make the student think, not just follow instructions

CORRECT ANSWER FORMAT:
- Use clean Unicode: "±3" not "+/-3" or "\\pm 3"
- Use proper fractions: "3/4" not "0.75" (unless decimals are appropriate)
- Multiple solutions: "2, −5" not "x = 2 or x = -5"

You MUST respond with valid JSON in exactly this format:
{
  "question": "Solve for x: 2x + 5 = 13",
  "correct_answer": "4",
  "explanation": "Step-by-step solution that teaches the reasoning",
  "hints": ["What operation undoes addition?", "After isolating the term with x, what operation isolates x itself?"]
}`;

    const userPrompt = `Generate a NEW ${difficulty} exercise for ${subtopicName}.

${examplesText}

Create a similar but DIFFERENT exercise appropriate for ${difficulty} difficulty.

CRITICAL REQUIREMENTS:
1. Question must use ONLY Unicode math symbols (√, ², ³, ±, ≤, ≥)
2. NO LaTeX syntax ($, \\, \\frac, \\sqrt, ^)
3. NO motivational phrases - just the mathematical task
4. Formal textbook language only (e.g., "Solve for x:", "Find all solutions:")
5. Clean, unambiguous mathematical notation`;

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
