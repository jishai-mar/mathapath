import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PreviousAttempt {
  misconception_tag: string | null;
  explanation_variant: number;
  ai_feedback: string | null;
}

interface RequestBody {
  imageBase64: string;
  question: string;
  correctAnswer: string;
  difficulty: string;
  previousAttempts?: PreviousAttempt[];
  subtopicName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      imageBase64, 
      question, 
      correctAnswer, 
      difficulty,
      previousAttempts = [],
      subtopicName = ''
    } = await req.json() as RequestBody;

    if (!imageBase64 || !question) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageBase64, question' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Determine explanation variant based on previous attempts
    const incorrectAttempts = previousAttempts.filter(a => {
      if (!a.ai_feedback) return false;
      try {
        const parsed = JSON.parse(a.ai_feedback);
        return !parsed.is_correct;
      } catch {
        return false;
      }
    });
    
    const attemptCount = incorrectAttempts.length + 1;
    const previousFeedback = incorrectAttempts.length > 0 
      ? incorrectAttempts.map(a => {
          try {
            return JSON.parse(a.ai_feedback || '{}');
          } catch {
            return {};
          }
        })
      : [];

    // Build adaptive system prompt based on attempt count
    let adaptiveInstructions = '';
    
    if (attemptCount === 1) {
      adaptiveInstructions = `
This is the student's FIRST attempt.
- Identify where their reasoning went wrong
- Ask a guiding question to help them see the error
- Suggest a small step they should try
- Do NOT give the answer`;
    } else if (attemptCount === 2) {
      adaptiveInstructions = `
This is the student's SECOND attempt. The previous guidance didn't help.
YOU MUST CHANGE YOUR TEACHING APPROACH:
- Break the problem into smaller sub-steps
- Include a MINI-EXERCISE: a simpler stepping-stone problem
- Use a different analogy or explanation method
- Ask a diagnostic question to find the root confusion
- Previous guidance that didn't work: ${JSON.stringify(previousFeedback.slice(-1))}`;
    } else {
      adaptiveInstructions = `
This is attempt #${attemptCount}. Previous guidance has NOT helped.
NOW you may be more direct, but still TEACH rather than just solve:
- Explain the concept step-by-step with a clear example
- Show WHY each step is taken
- Include a MINI-EXERCISE as a stepping stone
- Offer an ALTERNATIVE_APPROACH with a completely different method
- Previous failed guidance: ${JSON.stringify(previousFeedback.slice(-2))}

Even now, walk through the reasoning - don't just give the answer without explanation.`;
    }

    const systemPrompt = `You are an expert math tutor analyzing a student's handwritten work for the Reichman Mechina math curriculum.
${subtopicName ? `Current topic: ${subtopicName}` : ''}
Current exercise difficulty: ${difficulty || 'medium'}

${adaptiveInstructions}

CRITICAL TEACHING PHILOSOPHY - NEVER GIVE THE ANSWER DIRECTLY:
When a student makes a mistake, you are a GUIDING TUTOR, not an answer-giver.
- NEVER reveal the correct answer or the final solution
- NEVER show the complete correct working
- Instead, guide the student to discover the answer themselves through scaffolding

Your approach when the student is INCORRECT:
1. Praise what they did correctly first
2. Identify the FIRST point where their reasoning went wrong
3. Ask a GUIDING QUESTION that helps them see their error (e.g., "What happens when you multiply both sides by -1? Does the inequality sign change?")
4. Provide a SMALL HINT or intermediate step they should try
5. If helpful, give them a simpler sub-problem to solve first
6. NEVER show the final answer - let them discover it

Examples of good guiding responses:
- "You're on the right track with isolating x. Now, look at step 3 - when you divided by -2, what should happen to the inequality sign?"
- "Great start! Let's pause at the factoring step. Can you first find two numbers that multiply to 6 and add to 5?"
- "You correctly moved the terms. Now, before continuing, try simplifying the left side first. What is 3x - x?"

Only reveal the full solution after ${attemptCount >= 3 ? 'this is their 3rd+ attempt and they still struggle' : 'multiple failed guided attempts (not on first attempts)'}.

Your role:
1. Carefully examine the student's handwritten solution
2. Identify which steps are correct and where their reasoning is sound
3. Pinpoint exactly where the solution goes wrong (if at all)
4. Provide a GUIDING hint or question, NOT the answer
5. Classify the type of mistake with a misconception_tag

Be specific but concise. Focus on the math concepts, not handwriting quality.
Do NOT use dollar signs ($) in your response - just write the math expressions directly.
For example, write "x = 5" not "$x = 5$".

You MUST respond with valid JSON in exactly this format:
{
  "what_went_well": "Specific praise for correct steps and good reasoning",
  "where_it_breaks": "A GUIDING QUESTION or hint about where the error is - do NOT give the answer. Ask the student to think about this specific step.",
  "what_to_focus_on_next": "A small intermediate step or sub-question for the student to try",
  "is_correct": true/false,
  "suggested_difficulty": "easy" | "medium" | "hard",
  "misconception_tag": "category of the error (e.g., 'sign_error', 'distribution_error', 'fraction_error', 'order_of_operations', 'algebraic_manipulation', 'none' if correct)",
  "explanation_variant": ${attemptCount}${attemptCount >= 2 ? `,
  "mini_exercise": {
    "question": "A simpler stepping-stone problem (NOT the same problem) that targets the specific skill they need",
    "hint": "A gentle nudge for the mini exercise, still not giving the answer"
  }` : ''}${attemptCount >= 3 ? `,
  "alternative_approach": "A different method or perspective to approach the problem - describe the METHOD, not the solution"` : ''}
}

If the work is correct, set is_correct to true and suggest moving to a harder difficulty.
If incorrect, guide them toward understanding - NEVER just give them the answer.`;

    const userPrompt = `Analyze this student's handwritten work.

Question: ${question}
Correct Answer: ${correctAnswer}

Look at the image and evaluate their solution process.`;

    console.log(`Analyzing handwritten work (attempt #${attemptCount})...`);

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
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              { 
                type: 'image_url', 
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', content);

    // Parse the JSON response
    let feedback;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Provide fallback feedback
      feedback = {
        what_went_well: "I can see you've attempted the problem.",
        where_it_breaks: "I had trouble analyzing your work. Please try again or submit a clearer image.",
        what_to_focus_on_next: "Make sure your work is clearly visible and well-lit.",
        is_correct: false,
        suggested_difficulty: difficulty || 'medium',
        misconception_tag: 'analysis_failed',
        explanation_variant: attemptCount,
      };
    }

    // Ensure explanation_variant is set
    feedback.explanation_variant = attemptCount;

    return new Response(
      JSON.stringify(feedback),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-handwritten-work:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        what_went_well: "Unable to analyze at this time.",
        where_it_breaks: "Please try again or use text input instead.",
        what_to_focus_on_next: "Keep practicing!",
        is_correct: false,
        suggested_difficulty: 'medium',
        misconception_tag: 'error',
        explanation_variant: 1,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
