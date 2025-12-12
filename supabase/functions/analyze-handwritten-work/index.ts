import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, question, correctAnswer, difficulty } = await req.json();

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

    const systemPrompt = `You are an expert math tutor analyzing a student's handwritten work for the Reichman Mechina math curriculum. Your role is to:

1. Carefully examine the student's handwritten solution
2. Identify which steps are correct and where their reasoning is sound
3. Pinpoint exactly where the solution goes wrong (if at all)
4. Understand the underlying conceptual gap or misconception
5. Provide encouraging, constructive feedback

Be specific but concise. Focus on the math concepts, not handwriting quality.
Current exercise difficulty: ${difficulty || 'medium'}

You MUST respond with valid JSON in exactly this format:
{
  "what_went_well": "Specific praise for correct steps and good reasoning",
  "where_it_breaks": "Exact point where the solution goes wrong, or empty string if correct",
  "what_to_focus_on_next": "Specific concept or technique to practice",
  "is_correct": true/false,
  "suggested_difficulty": "easy" | "medium" | "hard"
}

If the work is correct, set is_correct to true and suggest moving to a harder difficulty.
If incorrect, analyze the error pattern to suggest appropriate next difficulty.`;

    const userPrompt = `Analyze this student's handwritten work.

Question: ${question}
Correct Answer: ${correctAnswer}

Look at the image and evaluate their solution process.`;

    console.log('Sending request to Lovable AI for handwritten analysis...');

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
      };
    }

    return new Response(
      JSON.stringify(feedback),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-handwritten-work:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        // Provide fallback so UI doesn't break
        what_went_well: "Unable to analyze at this time.",
        where_it_breaks: "Please try again or use text input instead.",
        what_to_focus_on_next: "Keep practicing!",
        is_correct: false,
        suggested_difficulty: 'medium',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
