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

    // Determine if this topic needs a visual graph
    const graphTopics = ['linear', 'quadratic', 'parabola', 'function', 'graph', 'derivative', 'limit', 'exponential', 'logarithm'];
    const needsGraph = graphTopics.some(t => 
      subtopicName.toLowerCase().includes(t) || topicName.toLowerCase().includes(t)
    );

    const systemPrompt = `You are an expert math tutor. Create ULTRA-MINIMAL theory content.

ABSOLUTE RULES:
1. NO filler words, NO motivational text, NO "let's learn" phrases
2. Maximum 3 sentences for the core concept
3. ONE formula box only
4. ONE worked example with 3 steps max
5. ONE common mistake
6. Write like a professional textbook, not a chatbot

STRUCTURE:

theory_explanation: Write EXACTLY this structure:
"[One sentence defining what this is]

[One sentence explaining when/why to use it]

**Formula:** [LaTeX formula]"

That's it. Nothing more.

worked_examples: ONE example only:
{
  "problem": "[Problem in LaTeX]",
  "steps": [
    "[Action verb]: [What to do] → [Result in LaTeX]",
    "[Action verb]: [What to do] → [Result in LaTeX]",
    "[Action verb]: [What to do] → [Result in LaTeX]"
  ],
  "answer": "[Final answer in LaTeX]"
}

key_concepts: 2 bullet points max. Each under 10 words.

common_mistakes: ONE mistake only:
{
  "mistake": "[What students do wrong - under 15 words]",
  "correction": "[Correct approach - under 15 words]"
}

visual_description: ${needsGraph ? 'Describe what a graph would show (type: "graph")' : 'Set to null - this topic does not need a graph'}

RESPONSE (pure JSON, no markdown):
{
  "theory_explanation": "...",
  "worked_examples": [...],
  "key_concepts": [...],
  "common_mistakes": [...],
  "visual_description": ${needsGraph ? '{...}' : 'null'}
}`;

    const userPrompt = `Generate ultra-minimal theory for: "${subtopicName}" (from ${topicName})`;

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
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      theoryContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
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
