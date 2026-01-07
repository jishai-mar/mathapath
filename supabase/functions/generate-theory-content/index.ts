import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Booklet topics and their example patterns
const BOOKLET_TOPICS: Record<string, { instruction: string; exampleType: string; sampleProblems: string[] }> = {
  'Fractions': {
    instruction: 'Simplify / Calculate',
    exampleType: 'algebraic-manipulation',
    sampleProblems: ['\\frac{2}{3} + \\frac{5}{6}', '\\frac{x^2 - 4}{x + 2}', '\\frac{3a}{4b} \\cdot \\frac{8b^2}{9a}']
  },
  'Exponents': {
    instruction: 'Simplify',
    exampleType: 'algebraic-manipulation',
    sampleProblems: ['(2^3)^2', 'x^{-2} \\cdot x^5', '\\frac{a^4 \\cdot a^{-2}}{a^3}']
  },
  'Linear Equations': {
    instruction: 'Solve for the variable',
    exampleType: 'equation-solving',
    sampleProblems: ['3x + 7 = 22', '\\frac{2x - 1}{3} = 5', '4(x - 2) = 3x + 6']
  },
  'Systems of Equations': {
    instruction: 'Solve the system',
    exampleType: 'system-solving',
    sampleProblems: ['\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}', '\\begin{cases} 3x + 2y = 12 \\\\ x = y + 1 \\end{cases}']
  },
  'Quadratic Equations': {
    instruction: 'Solve for x',
    exampleType: 'equation-solving',
    sampleProblems: ['x^2 - 5x + 6 = 0', '2x^2 + 3x - 2 = 0', 'x^2 - 9 = 0']
  },
  'Linear Functions': {
    instruction: 'Find / Determine',
    exampleType: 'function-analysis',
    sampleProblems: ['Find the equation of a line through (2, 3) with slope 4', 'Find where y = 2x + 1 and y = -x + 7 intersect']
  },
  'Quadratic Functions': {
    instruction: 'Analyze / Find',
    exampleType: 'function-analysis',
    sampleProblems: ['Find the vertex of f(x) = x^2 - 4x + 3', 'Determine the roots of f(x) = 2x^2 - 8']
  },
  'Inequalities': {
    instruction: 'Solve the inequality',
    exampleType: 'inequality-solving',
    sampleProblems: ['2x + 3 > 7', 'x^2 - 4x - 5 < 0', '\\frac{x - 1}{x + 2} \\geq 0']
  },
  'Higher Degree Equations': {
    instruction: 'Solve for x',
    exampleType: 'equation-solving',
    sampleProblems: ['x^3 - 8 = 0', 'x^4 - 5x^2 + 4 = 0', 'x^3 - 6x^2 + 11x - 6 = 0']
  },
  'Radical Equations': {
    instruction: 'Solve for x',
    exampleType: 'equation-solving',
    sampleProblems: ['\\sqrt{x + 3} = 5', '\\sqrt{2x - 1} = x - 2', '\\sqrt{x} + \\sqrt{x - 5} = 5']
  },
  'Logarithms': {
    instruction: 'Simplify / Solve',
    exampleType: 'log-manipulation',
    sampleProblems: ['\\log_2{8}', '\\log{x} + \\log{(x+1)} = 1', '\\ln{e^5}']
  },
  'Exponential Equations': {
    instruction: 'Solve for x',
    exampleType: 'equation-solving',
    sampleProblems: ['2^x = 16', '3^{2x} = 27', '5^{x+1} = 125']
  },
  'Logarithmic Equations': {
    instruction: 'Solve for x',
    exampleType: 'equation-solving',
    sampleProblems: ['\\log_3{x} = 4', '\\log{(x+2)} + \\log{(x-1)} = 1', '\\ln{x} = 2']
  },
  'Limits': {
    instruction: 'Calculate the limit',
    exampleType: 'limit-calculation',
    sampleProblems: ['\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}', '\\lim_{x \\to \\infty} \\frac{3x^2 + 1}{x^2 - 2}', '\\lim_{x \\to 0} \\frac{\\sin{x}}{x}']
  },
  'Derivatives': {
    instruction: 'Differentiate',
    exampleType: 'differentiation',
    sampleProblems: ['f(x) = 3x^4 - 2x^2 + 5', 'f(x) = (x^2 + 1)^3', 'f(x) = \\frac{x}{x + 1}']
  },
  'Rational Functions': {
    instruction: 'Analyze / Find asymptotes',
    exampleType: 'function-analysis',
    sampleProblems: ['f(x) = \\frac{x + 1}{x - 2}', 'Find vertical asymptotes of \\frac{x^2 - 1}{x^2 - 4}']
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subtopicName, topicName, existingTheory, existingExamples } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log(`Generating booklet-style theory content for: ${subtopicName} (Topic: ${topicName})`);

    // Find matching booklet topic
    const matchedTopic = Object.entries(BOOKLET_TOPICS).find(([key]) => 
      topicName?.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(topicName?.toLowerCase() || '')
    );
    
    const topicConfig = matchedTopic?.[1] || {
      instruction: 'Solve / Simplify',
      exampleType: 'algebraic-manipulation',
      sampleProblems: []
    };

    // Determine if this topic needs a visual graph
    const graphTopics = ['function', 'graph', 'parabola', 'curve', 'plot', 'linear', 'quadratic'];
    const needsGraph = graphTopics.some(t => 
      subtopicName.toLowerCase().includes(t) || topicName.toLowerCase().includes(t)
    );

    const systemPrompt = `You are an expert math tutor creating content in the style of the Reichman Mechina booklet.

=== BOOKLET STYLE REQUIREMENTS ===

WORKED EXAMPLES must follow this EXACT format:
1. Problem: Clear, concise mathematical statement with proper LaTeX
2. Steps: Each step shows ONE algebraic manipulation with brief explanation
3. Answer: Final boxed answer with variable name (e.g., "x = 5" not just "5")

=== LATEX FORMATTING RULES (CRITICAL) ===
- Use \\frac{a}{b} for ALL fractions (never a/b)
- Use braces for ALL exponents: x^{2}, x^{-1}, x^{1/2}
- Use \\sqrt{x} for square roots
- Use \\cdot for multiplication (not *)
- Use \\begin{cases} for systems of equations
- NEVER use trigonometric functions (sin, cos, tan)
- NEVER include word problems or real-world applications

=== STEP FORMAT ===
Each step should be:
- Action phrase → Result
- Example: "Factor the left side → (x-2)(x-3) = 0"
- Example: "Apply the quadratic formula → x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
- Keep each step to ONE key transformation

=== INSTRUCTION PHRASING ===
Use phrases like: "${topicConfig.instruction}"
NO casual language like "Let's solve" or "Now we need to"

OUTPUT FORMAT (JSON only):
{
  "definition": "One clear sentence defining the concept. No filler.",
  "key_rule": "The ONE most important rule (max 15 words)",
  "formula": "Primary formula in LaTeX only",
  "when_to_use": "Brief phrase: when/why to use this concept",
  "worked_example": {
    "problem": "Clear problem statement in LaTeX",
    "steps": [
      "Step description → LaTeX result",
      "Step description → LaTeX result", 
      "Step description → LaTeX result"
    ],
    "answer": "Variable = value (e.g., x = 5 or x = 2 or x = -3)"
  },
  "additional_examples": [
    {
      "problem": "Second example problem (different difficulty)",
      "steps": ["Step → result", "Step → result"],
      "answer": "Final answer"
    }
  ],
  "common_mistake": {
    "wrong": "What students typically do wrong",
    "right": "Correct approach"
  },
  "needs_graph": ${needsGraph},
  "voiceover_scripts": {
    "intro": "Brief spoken intro (no LaTeX symbols)",
    "definition": "Definition rephrased for speaking",
    "key_rule": "Key rule explained naturally",
    "formula": "Formula described verbally",
    "example_intro": "Intro to the worked example",
    "summary": "Brief wrap-up"
  }
}

RULES:
- Minimum 3 steps, maximum 6 steps per worked example
- Each step MUST show the mathematical transformation
- Use arrow notation: "action → result"
- For equations with multiple solutions: show "x = a or x = b" format
- Keep explanations brief but mathematically precise`;

    const userPrompt = `Generate booklet-style theory content for: "${subtopicName}" (Topic: ${topicName}).

${topicConfig.sampleProblems.length > 0 ? `Reference these booklet-style problems for format:
${topicConfig.sampleProblems.join('\n')}` : ''}

${existingTheory ? `Existing theory for reference: ${existingTheory}` : ''}
${existingExamples?.length > 0 ? `Existing examples for reference: ${JSON.stringify(existingExamples)}` : ''}

Return ONLY valid JSON matching the specified format.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2048,
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
        additional_examples: [],
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
        definition: "Unable to parse content. Please refresh.",
        key_rule: "",
        formula: "",
        when_to_use: "",
        worked_example: { problem: "", steps: [], answer: "" },
        additional_examples: [],
        common_mistake: { wrong: "", right: "" },
        needs_graph: false,
        voiceover_scripts: {}
      };
    }

    console.log('Generated booklet-style theory content successfully');

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
