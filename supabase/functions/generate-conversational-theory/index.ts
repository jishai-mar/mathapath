import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationalStep {
  type: 'greeting' | 'question' | 'explanation' | 'formula' | 'example' | 'understanding-check' | 'hint' | 'encouragement' | 'transition';
  content: string;
  checkQuestion?: string;
  checkAnswer?: string;
  checkHint?: string;
  options?: string[];
  formula?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subtopicName, topicName, existingTheory, existingExamples } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert AI math tutor creating a CONVERSATIONAL lesson. Your goal is to teach like a real tutor in a one-on-one session - engaging, interactive, and adaptive.

CRITICAL RULES:
1. NEVER dump information - reveal concepts step by step through dialog
2. ASK questions before explaining - engage the student's thinking first
3. Use simple, intuitive language - avoid jargon
4. Include understanding checks with real mini-exercises
5. Be warm, encouraging, and patient in tone
6. Each step should feel like natural conversation, not a textbook

Generate a JSON array of conversational steps that teach "${subtopicName}" (part of ${topicName || 'Mathematics'}).

STEP TYPES:
- "greeting": Warm welcome, introduce the topic with curiosity hook
- "question": Ask student what they know or think (prompts reflection)
- "explanation": Teach one concept piece (2-3 sentences max)
- "formula": Present a key formula with simple explanation
- "example": Walk through a worked example step-by-step
- "understanding-check": Mini-exercise to verify comprehension
- "hint": Helpful tip or alternative explanation
- "encouragement": Positive reinforcement
- "transition": Bridge between sections

STRUCTURE YOUR LESSON:
1. Greeting - hook their interest with a real-world connection or intriguing question
2. Question - ask what they already know (activates prior knowledge)
3. Core Explanation 1 - introduce the first key concept
4. Understanding Check 1 - verify they got it (include checkQuestion, checkAnswer, checkHint, optionally options array)
5. Core Explanation 2 - build on first concept
6. Formula (if applicable) - present key formula with intuition
7. Example - work through a problem together
8. Understanding Check 2 - another mini-exercise
9. Encouragement - celebrate progress, preview practice

For understanding-check steps:
- checkQuestion: A specific, answerable question
- checkAnswer: The correct answer (for text input) or correct option (for multiple choice)
- checkHint: A helpful hint if they struggle
- options: (optional) Array of 2-4 choices for multiple choice format

${existingTheory ? `Use this theory as reference: ${existingTheory}` : ''}
${existingExamples?.length > 0 ? `Use these examples as reference: ${JSON.stringify(existingExamples)}` : ''}

Determine if this topic needs a visual graph (functions, coordinates, geometry = yes).

Return JSON with this exact structure:
{
  "steps": [...array of step objects...],
  "needsGraph": boolean,
  "graphConcept": "brief description for graph if needed"
}

IMPORTANT: Keep each step concise (max 3 sentences). The lesson should feel like a real tutoring conversation, not a lecture.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a conversational lesson for: ${subtopicName}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response as JSON");
      }
    }

    // Validate and ensure proper structure
    if (!parsed.steps || !Array.isArray(parsed.steps)) {
      throw new Error("Invalid response structure - missing steps array");
    }

    // Ensure each step has required fields
    const validatedSteps = parsed.steps.map((step: any) => ({
      type: step.type || 'explanation',
      content: step.content || '',
      ...(step.checkQuestion && { checkQuestion: step.checkQuestion }),
      ...(step.checkAnswer && { checkAnswer: step.checkAnswer }),
      ...(step.checkHint && { checkHint: step.checkHint }),
      ...(step.options && { options: step.options }),
      ...(step.formula && { formula: step.formula }),
    }));

    console.log(`Generated ${validatedSteps.length} conversational steps for "${subtopicName}"`);

    return new Response(
      JSON.stringify({
        steps: validatedSteps,
        needsGraph: parsed.needsGraph || false,
        graphConcept: parsed.graphConcept || ''
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating conversational theory:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
