import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationalStep {
  type: 'greeting' | 'question' | 'explanation' | 'formula' | 'example' | 'understanding-check' | 'hint' | 'encouragement' | 'transition' | 'practice-recommendation';
  content: string;
  checkQuestion?: string;
  checkAnswer?: string;
  checkHint?: string;
  options?: string[];
  formula?: string;
  practicePlan?: {
    totalExercises: number;
    breakdown: { easy: number; medium: number; hard: number };
    estimatedMinutes: number;
    focusAreas: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subtopicName, topicName, existingTheory, existingExamples, pastResponses, learningProfile } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Build personalization context from past responses
    let personalizationContext = '';
    if (pastResponses && pastResponses.length > 0) {
      const struggles = pastResponses.filter((r: any) => !r.is_correct || r.attempts > 1);
      const successRate = pastResponses.filter((r: any) => r.is_correct).length / pastResponses.length;
      
      personalizationContext = `
STUDENT LEARNING HISTORY FOR THIS TOPIC:
- Previous attempts: ${pastResponses.length}
- Success rate: ${Math.round(successRate * 100)}%
- Areas of difficulty: ${struggles.map((s: any) => s.check_question).slice(0, 3).join('; ') || 'None identified'}
- Frequently needed hints: ${pastResponses.filter((r: any) => r.hint_used).length > pastResponses.length / 2 ? 'Yes, student often needs hints' : 'No, student rarely needs hints'}

ADAPT YOUR LESSON:
${successRate < 0.5 ? '- This student struggles with this topic. Use simpler explanations, more examples, and smaller steps.' : ''}
${successRate > 0.8 ? '- This student is performing well. You can move faster and include more challenging checks.' : ''}
${struggles.length > 0 ? `- Focus extra attention on concepts similar to: ${struggles[0]?.check_question}` : ''}
`;
    }

    if (learningProfile) {
      personalizationContext += `
OVERALL LEARNING PROFILE:
- Total checks completed: ${learningProfile.totalChecks || 0}
- Correct: ${learningProfile.correct || 0} (${learningProfile.totalChecks ? Math.round((learningProfile.correct / learningProfile.totalChecks) * 100) : 0}%)
- Average attempts per check: ${learningProfile.totalChecks ? (learningProfile.totalAttempts / learningProfile.totalChecks).toFixed(1) : 'N/A'}
- Hints used: ${learningProfile.hintsUsed || 0}
`;
    }

    const systemPrompt = `You are an expert AI math tutor creating a CONVERSATIONAL lesson. Your goal is to teach like a real tutor in a one-on-one session - engaging, interactive, and adaptive.

CRITICAL RULES:
1. NEVER dump information - reveal concepts step by step through dialog
2. ASK questions before explaining - engage the student's thinking first
3. Use simple, intuitive language - avoid jargon
4. Include understanding checks with real mini-exercises
5. Be warm, encouraging, and patient in tone
6. Each step should feel like natural conversation, not a textbook
7. PERSONALIZE based on the student's learning history when provided

=== MATH COMMUNICATION STANDARDS ===

CLEAN QUESTION PHRASING (CRITICAL):
- Be concise and mathematically precise - NO filler words
- ❌ "Let's start with a basic one! Can you solve this equation?"
- ✅ "Solve for $x$: $\\sqrt{x} = 5$"
- Always use proper LaTeX notation for ALL math
- Format: $...$ for inline, $$...$$ for display equations

STRUCTURED EXPLANATIONS - Every explanation follows this flow:
1. Clear concept definition (1 sentence max)
2. Worked numeric example with numbered steps
3. Visual: include "graphFormula" field when topic involves functions
4. Mini follow-up: "Try this: [problem]"

${personalizationContext}

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
- "practice-recommendation": AI recommendation for practice (ALWAYS include as LAST step)

STRUCTURE YOUR LESSON:
1. Greeting - hook their interest with a real-world connection or intriguing question
2. Question - ask what they already know (activates prior knowledge)
3. Core Explanation 1 - introduce the first key concept
4. Understanding Check 1 - verify they got it (include checkQuestion, checkAnswer, checkHint, optionally options array)
5. Core Explanation 2 - build on first concept
6. Formula (if applicable) - present key formula with intuition
7. Example - work through a problem together
8. Understanding Check 2 - another mini-exercise
9. Practice Recommendation - ALWAYS end with type "practice-recommendation" that includes a personalized recommendation for how many exercises to do

For understanding-check steps:
- checkQuestion: A specific, answerable question (concise, no filler!)
- checkAnswer: The correct answer (for text input) or correct option (for multiple choice)
- checkHint: A helpful hint if they struggle
- options: (optional) Array of 2-4 choices for multiple choice format

For formula and example steps:
- graphFormula: (optional) Function to graph, e.g., "y=x^2-4" or "y=2x+1,y=-x+3"

${existingTheory ? `Use this theory as reference: ${existingTheory}` : ''}
${existingExamples?.length > 0 ? `Use these examples as reference: ${JSON.stringify(existingExamples)}` : ''}

Determine if this topic needs a visual graph (functions, coordinates, geometry = yes).

Return JSON with this exact structure:
{
  "steps": [...array of step objects...],
  "needsGraph": boolean,
  "graphConcept": "brief description for graph if needed",
  "suggestedGraphFormula": "y=... (optional, for auto-graphing)"
}

IMPORTANT: Keep each step concise (max 3 sentences). The lesson should feel like a real tutoring conversation, not a lecture. ALL math must use proper LaTeX.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a conversational lesson for: ${subtopicName}` }
        ],
        max_completion_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      const fallbackSteps = {
        steps: [{ type: "explanation", content: "I'm temporarily unavailable. Please try again in a moment." }],
        needsGraph: false,
        graphConcept: "",
        fallback: true,
        rate_limited: response.status === 429,
        credits_depleted: response.status === 402,
      };
      
      return new Response(
        JSON.stringify(fallbackSteps),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
