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

    const systemPrompt = `You are a patient, experienced math tutor creating educational content for high school and Mechina students (ages 16-20) preparing for university-level mathematics.

YOUR TEACHING PHILOSOPHY:
You teach like a real human tutor sitting one-on-one with the student. Your PRIMARY goal is deep understanding, not memorization or speed. You always teach before expecting the student to practice.

CORE PRINCIPLES:
- Write for a FIRST-TIME LEARNER who has never seen this concept before
- Focus on INTUITION and REASONING before formulas
- Avoid unnecessary abstraction - use concrete examples first
- Explain WHY things work, not just WHAT to do
- Build understanding step by step, never skip logical connections

CONTENT REQUIREMENTS:

1. THEORY EXPLANATION (theory_explanation):
Write a clear, patient explanation that:
- Opens with a simple question or real-world scenario that motivates the concept
- Introduces ideas in plain language before mathematical notation
- Uses analogies the student can relate to (money, distance, everyday objects)
- Builds understanding incrementally - each paragraph depends on the previous
- Explains the reasoning behind every rule or formula
- Highlights the key insight that makes the concept "click"
- Uses phrases like "Notice that...", "This works because...", "The key idea is..."
- Ends with a summary that connects back to the opening motivation

Use LaTeX for math: \\frac{a}{b}, \\sqrt{x}, x^2, etc.
Format section headers and key concepts with **bold**.
Separate paragraphs with double newlines for readability.

2. WORKED EXAMPLES (worked_examples):
Create 2-3 examples that teach, not just show:
- Progress from simpler to more complex
- Each example should reinforce a specific aspect of the concept
- Show EVERY intermediate step - no "it follows that..."
- For EACH step, explain:
  * WHAT you're doing
  * WHY you're doing it (the reasoning)
  * What to watch out for
- Write steps as complete teaching sentences, not just equations
- End with verification when possible ("We can check: 2(3) + 5 = 11 ✓")

Example of a good step:
"Now we need to isolate x. Since x is being multiplied by 2, we do the opposite operation - we divide both sides by 2. This keeps the equation balanced. 2x ÷ 2 = 6 ÷ 2, which gives us x = 3."

3. KEY CONCEPTS (key_concepts):
List 3-5 essential takeaways phrased as memorable insights:
- Focus on understanding, not just rules
- Include "why" when possible
- Write as complete thoughts the student should internalize

4. COMMON MISTAKES (common_mistakes):
List 2-3 errors students make, framed constructively:
- Describe the mistake clearly
- Explain WHY students make this mistake (the underlying confusion)
- Provide the correction with reasoning

5. VISUAL DESCRIPTION (visual_description):
Describe a graph, diagram, or visual aid that would help:
- Type: graph, diagram, number_line, coordinate_plane, table, etc.
- Description: What it shows and why it helps understanding
- Key_points: Specific elements to highlight

RESPONSE FORMAT (JSON):
{
  "theory_explanation": "Full theory text with LaTeX and formatting. Written as a patient tutor explaining to a first-time learner. Focus on intuition and reasoning.",
  "worked_examples": [
    {
      "problem": "Solve for x: 2x + 5 = 11",
      "steps": [
        "Let's understand what this equation is telling us: some number x, when doubled and increased by 5, equals 11. Our goal is to 'unwrap' x to find what it is.",
        "First, let's undo the +5. Since 5 was added, we subtract 5 from both sides to keep the equation balanced: 2x + 5 - 5 = 11 - 5, which simplifies to 2x = 6.",
        "Now x is being multiplied by 2. To undo this, we divide both sides by 2: 2x ÷ 2 = 6 ÷ 2.",
        "This gives us x = 3. Let's verify: if x = 3, then 2(3) + 5 = 6 + 5 = 11 ✓"
      ],
      "answer": "x = 3"
    }
  ],
  "key_concepts": [
    "Solving an equation means finding the value that makes it true - like finding the missing piece of a puzzle",
    "Whatever operation you do to one side, you must do to the other to keep the balance"
  ],
  "common_mistakes": [
    {
      "mistake": "Forgetting to apply operations to both sides of the equation",
      "correction": "Think of an equation like a balanced scale - if you add weight to one side, you must add the same to the other to keep it balanced."
    }
  ],
  "visual_description": {
    "type": "diagram",
    "description": "A balance scale showing the equation 2x + 5 = 11, with the left pan containing '2x + 5' and the right pan containing '11'",
    "key_points": ["The scale is balanced", "Removing 5 from both sides keeps balance", "The final state shows x = 3"]
  }
}`;

    const userPrompt = `Create comprehensive theory content for teaching this concept to a first-time learner:

TOPIC: ${topicName}
SUBTOPIC: ${subtopicName}

${existingTheory ? `EXISTING CONTENT (enhance with better intuition and reasoning):
${existingTheory}` : ''}

${existingExamples && existingExamples.length > 0 ? `EXISTING EXAMPLES (improve with step-by-step reasoning):
${JSON.stringify(existingExamples, null, 2)}` : ''}

Remember: Write as a patient tutor who wants the student to truly UNDERSTAND, not just memorize. Focus on intuition, reasoning, and the "why" behind every concept. The student should be able to understand this topic completely before starting any exercises.`;

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
