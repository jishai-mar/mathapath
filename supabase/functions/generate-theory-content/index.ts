import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { subtopicName, topicName, existingTheory, existingExamples } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating theory content for: ${subtopicName} (Topic: ${topicName})`);

const systemPrompt = `You are a math tutor creating MINIMAL, CLEAN educational content. Less is more.

CRITICAL RULES:
- Keep explanations SHORT and SCANNABLE
- Focus on ONE key principle per topic
- Include a clear FORMULA or GENERAL FORM
- Provide step-by-step PROCESS (max 3-4 steps)
- Add ONE practical tip about common mistakes

CONTENT STRUCTURE:

1. THEORY EXPLANATION (theory_explanation):
Start with **The Fundamental Principle** in 2-3 sentences.
Then provide the general form/formula.
Keep total text under 150 words.

Example format:
"**The Fundamental Principle**

Just as numerical fractions can be simplified by dividing out common factors (e.g., 12/16 = 3/4), algebraic fractions follow the exact same logic. The key is to see expressions as products of factors.

**General Form:**
\\frac{A \\times C}{B \\times C} = \\frac{A}{B}"

2. WORKED EXAMPLES (worked_examples):
Create 1-2 examples with CLEAR, CONCISE steps.
Each step format: "Title: Brief description → math result"

Example:
{
  "problem": "Simplify: \\frac{x^2 - 9}{2x + 6}",
  "steps": [
    "Factorize Completely: Identify factors in numerator and denominator → (x-3)(x+3) / 2(x+3)",
    "Cancel Common Factors: Remove (x+3) from top and bottom → (x-3) / 2",
    "Write Final Answer: Simplified form → \\frac{x-3}{2}"
  ],
  "answer": "\\frac{x-3}{2}"
}

3. KEY CONCEPTS (key_concepts):
List 2-3 essential takeaways as short, memorable phrases.

4. COMMON MISTAKES (common_mistakes):
List 1-2 common errors with correction.

{
  "mistake": "Students try to cancel terms that are added, not multiplied. (x+3)/3 ≠ x",
  "correction": "You can only cancel factors that are MULTIPLIED, not added terms."
}

5. VISUAL DESCRIPTION (visual_description):
Describe what graph/diagram would help.

RESPONSE FORMAT (JSON):
{
  "theory_explanation": "**The Fundamental Principle**\\n\\nConcise explanation here.\\n\\n**General Form:**\\n[formula in LaTeX]",
  "worked_examples": [
    {
      "problem": "Problem statement",
      "steps": [
        "Step 1 Title: Description → result",
        "Step 2 Title: Description → result"
      ],
      "answer": "Final answer"
    }
  ],
  "key_concepts": [
    "Short concept 1",
    "Short concept 2"
  ],
  "common_mistakes": [
    {
      "mistake": "What students do wrong",
      "correction": "The correct approach"
    }
  ],
  "visual_description": {
    "type": "graph",
    "description": "What the visual shows",
    "key_points": ["Point 1", "Point 2"]
  }
}`;

    const userPrompt = `Create MINIMAL, CLEAN theory content for:

TOPIC: ${topicName}
SUBTOPIC: ${subtopicName}

${existingTheory ? `EXISTING CONTENT TO SIMPLIFY:
${existingTheory}` : ''}

Remember: Less is more. Keep it scannable. Focus on ONE key principle with a formula and 2-3 process steps.`;

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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    let theoryContent;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      theoryContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Return a structured fallback
      theoryContent = {
        theory_explanation: content,
        worked_examples: [],
        key_concepts: [],
        common_mistakes: [],
        visual_description: null
      };
    }

    console.log('Generated theory content successfully');

    return new Response(JSON.stringify(theoryContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-theory-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
