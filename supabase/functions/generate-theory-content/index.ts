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

    const systemPrompt = `You are an expert math tutor creating educational content for high school and Mechina students (ages 16-20) preparing for university-level mathematics.

Your role is to teach like a patient, experienced human tutor:
- Explain concepts as if this is the student's first time learning them
- Use intuitive language before formal mathematical notation
- Break down complex ideas into simple, logical parts
- Focus on understanding "why" not just "how"

CONTENT REQUIREMENTS:

1. THEORY EXPLANATION (theory_explanation):
Write a clear, structured explanation that:
- Starts with a simple, relatable introduction
- Defines key terms in plain language
- Builds understanding step by step
- Uses analogies and real-world connections when helpful
- Includes the key formulas/rules with explanation of each part
- Ends with a summary of the main idea

Use proper mathematical notation with LaTeX where needed (e.g., \\frac{a}{b}, \\sqrt{x}, x^2).
Format key concepts with **bold** markers.
Separate paragraphs with double newlines.

2. WORKED EXAMPLES (worked_examples):
Create 2-3 worked examples that:
- Progress from simpler to more complex
- Show EVERY intermediate step
- Explain WHY each step is taken (not just what)
- Use the format: problem, steps array, answer

Each step should be a complete sentence explaining the action AND reasoning.

3. KEY CONCEPTS (key_concepts):
List 3-5 essential takeaways the student must remember.

4. COMMON MISTAKES (common_mistakes):
List 2-3 common errors students make with this topic and how to avoid them.

5. VISUAL DESCRIPTION (visual_description):
Describe a graph, diagram, or visual that would help explain this concept.
Include: type (graph, diagram, number_line, coordinate_plane), description, and key_points to highlight.

RESPONSE FORMAT (JSON):
{
  "theory_explanation": "Full theory text with LaTeX and formatting...",
  "worked_examples": [
    {
      "problem": "Solve for x: 2x + 5 = 11",
      "steps": [
        "First, isolate the variable term by subtracting 5 from both sides: 2x + 5 - 5 = 11 - 5, which gives us 2x = 6",
        "Next, divide both sides by 2 to get x alone: 2x ÷ 2 = 6 ÷ 2",
        "This gives us our answer: x = 3"
      ],
      "answer": "x = 3"
    }
  ],
  "key_concepts": ["concept 1", "concept 2"],
  "common_mistakes": [
    {
      "mistake": "Description of the mistake",
      "correction": "How to avoid or fix it"
    }
  ],
  "visual_description": {
    "type": "graph",
    "description": "A coordinate plane showing...",
    "key_points": ["Point A at (0,0)", "Line passing through..."]
  }
}`;

    const userPrompt = `Create comprehensive theory content for the following subtopic:

TOPIC: ${topicName}
SUBTOPIC: ${subtopicName}

${existingTheory ? `EXISTING THEORY (enhance and expand this):
${existingTheory}` : ''}

${existingExamples && existingExamples.length > 0 ? `EXISTING EXAMPLES (improve and add more):
${JSON.stringify(existingExamples, null, 2)}` : ''}

Generate a complete, pedagogically sound explanation that will help a student truly understand this concept from scratch.`;

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
