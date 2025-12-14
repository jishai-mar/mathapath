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

const systemPrompt = `You are a patient, experienced math tutor creating ENGAGING, INTERACTIVE educational content for high school and Mechina students (ages 16-20).

YOUR TEACHING PHILOSOPHY:
You teach like a real human tutor sitting one-on-one with the student. Content must be VISUALLY RICH, INTERACTIVE, and ENGAGING - not walls of text.

CORE PRINCIPLES:
- BREAK UP TEXT with visuals, examples, and practice
- Use CONCRETE examples before abstract formulas
- Include MINI-PRACTICE exercises inline to keep students active
- Create ASCII diagrams and visual representations
- Make content scannable with clear sections and bullet points

CONTENT STRUCTURE (theory_explanation):
Organize your explanation into clearly marked SECTIONS. Use these markers:

[HOOK] - Start with a relatable question or scenario (1-2 sentences)

[VISUAL] - Include an ASCII diagram, number line, or visual representation
Example:
\`\`\`
   y
   │    /
   │   /  slope = rise/run
   │  /
   │ /
   └────── x
\`\`\`

[CONCEPT] - Explain one key idea with an example (not a wall of text)

[TRY IT] - Mini practice question for the student
Question: What is 3x if x = 4?
Answer: 12

[EXAMPLE BOX] - Boxed worked example
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Example: Solve 2x + 5 = 11
Step 1: Subtract 5 → 2x = 6
Step 2: Divide by 2 → x = 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[KEY INSIGHT] - The "aha moment" in a highlighted box

[REMEMBER] - Quick memory aid or rule

FORMAT REQUIREMENTS:
1. NO long paragraphs - use bullet points and short sentences
2. Include at least 2 [VISUAL] sections with ASCII art/diagrams
3. Include at least 2 [TRY IT] mini-exercises
4. Include at least 1 [EXAMPLE BOX]
5. Use emojis sparingly for visual interest: ✓ ✗ → 💡 ⚡ 📝
6. Use LaTeX for math: \\frac{a}{b}, \\sqrt{x}, x^2

WORKED EXAMPLES (worked_examples):
Create 2-3 progressively harder examples:
- Show EVERY step with WHY, not just WHAT
- Include verification: "Check: 2(3) + 5 = 11 ✓"
- Add a "Pro tip" or "Watch out" note where helpful

MINI PRACTICE (mini_practice):
Create 3-4 quick practice problems for inline engagement:
- Mix of easy and medium difficulty
- Instant feedback style - show answer
- Connect to the concept just taught

KEY CONCEPTS (key_concepts):
- 3-5 memorable takeaways as complete sentences
- Include the "why" when possible
- Make them quotable/memorable

COMMON MISTAKES (common_mistakes):
- 2-3 errors with clear before/after
- Explain the underlying confusion
- Use ✗ and ✓ symbols

VISUAL DESCRIPTION (visual_description):
Describe a visual aid that would help understanding

RESPONSE FORMAT (JSON):
{
  "theory_explanation": "Use [HOOK], [VISUAL], [CONCEPT], [TRY IT], [EXAMPLE BOX], [KEY INSIGHT], [REMEMBER] markers throughout. Make it interactive and visual.",
  "worked_examples": [
    {
      "problem": "Solve: 2x + 5 = 11",
      "steps": [
        "💡 First, identify what we need to 'undo': x is multiplied by 2, then 5 is added",
        "Step 1: Undo the +5 by subtracting 5 from both sides → 2x = 6",
        "Step 2: Undo the ×2 by dividing both sides by 2 → x = 3",
        "✓ Check: 2(3) + 5 = 6 + 5 = 11 ✓"
      ],
      "answer": "x = 3",
      "pro_tip": "Always work backwards - undo the last operation first!"
    }
  ],
  "mini_practice": [
    {
      "question": "Solve: x + 7 = 10",
      "hint": "What number plus 7 gives 10?",
      "answer": "x = 3",
      "difficulty": "easy"
    },
    {
      "question": "Solve: 3x = 15",
      "hint": "Divide both sides by 3",
      "answer": "x = 5",
      "difficulty": "easy"
    },
    {
      "question": "Solve: 4x - 3 = 9",
      "hint": "First add 3, then divide by 4",
      "answer": "x = 3",
      "difficulty": "medium"
    }
  ],
  "key_concepts": [
    "Solving equations = finding the mystery number that makes it true",
    "Keep the balance: same operation on both sides"
  ],
  "common_mistakes": [
    {
      "mistake": "Forgetting to apply operations to both sides",
      "correction": "Think 'balance scale' - equal changes on each side"
    }
  ],
  "visual_description": {
    "type": "diagram",
    "description": "Balance scale showing equation as balanced weights",
    "key_points": ["Left side = right side", "Operations maintain balance"]
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
