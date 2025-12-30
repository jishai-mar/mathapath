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
    const graphTopics = ['function', 'graph', 'parabola', 'curve', 'plot'];
    const needsGraph = graphTopics.some(t => 
      subtopicName.toLowerCase().includes(t) || topicName.toLowerCase().includes(t)
    );

    const systemPrompt = `You are an expert math tutor. Generate ULTRA-CLEAN theory content with voiceover scripts.

OUTPUT STRUCTURE (JSON only, no markdown):
{
  "definition": "One sentence defining what this is. Clear and direct.",
  "key_rule": "The ONE rule students must remember. Max 12 words.",
  "formula": "LaTeX formula only. No text.",
  "when_to_use": "One phrase: when/why to use this.",
  "worked_example": {
    "problem": "LaTeX problem",
    "steps": ["Step 1 → result", "Step 2 → result", "Step 3 → result"],
    "answer": "Final answer in LaTeX"
  },
  "common_mistake": {
    "wrong": "What students do wrong (under 10 words)",
    "right": "Correct approach (under 10 words)"
  },
  "needs_graph": ${needsGraph},
  "voiceover_scripts": {
    "intro": "A warm, engaging 1-2 sentence welcome to this topic. Spoken naturally.",
    "definition": "The definition rephrased for speaking. No LaTeX symbols, use plain English.",
    "key_rule": "The key rule explained conversationally. Add emphasis on the important part.",
    "formula": "Describe the formula verbally for someone listening. E.g. 'x squared plus y squared equals r squared'",
    "example_intro": "A brief intro to the example problem. Make it sound like a teacher about to demonstrate.",
    "summary": "A congratulatory wrap-up. 1-2 sentences celebrating what they learned."
  }
}

RULES:
- Definition: ONE clear sentence. No filler.
- Key Rule: The SINGLE most important principle. Students should memorize this.
- Formula: Pure LaTeX. No "where x is..." explanations.
- Example: MAX 3 steps. Each step shows action → result.
- Common Mistake: Brief and actionable.
- Voiceover Scripts: Written for TEXT-TO-SPEECH. No LaTeX, no special symbols. Natural spoken English.
- NO motivational text in main content. Voiceovers can be warm and encouraging.
- Write like a professional textbook with a friendly voice.`;

    const userPrompt = `Generate clean theory for: "${subtopicName}" (Topic: ${topicName}). Return ONLY valid JSON.`;

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
        max_completion_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      const fallbackTheory = {
        definition: "Content temporarily unavailable.",
        key_rule: "Please try again.",
        formula: "",
        when_to_use: "",
        worked_example: { problem: "", steps: [], answer: "" },
        common_mistake: { wrong: "", right: "" },
        needs_graph: false,
        voiceover_scripts: {},
        fallback: true,
        rate_limited: response.status === 429,
        credits_depleted: response.status === 402,
      };
      
      return new Response(JSON.stringify(fallbackTheory), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
