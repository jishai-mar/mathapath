import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationRequest {
  topicId: string;
  subtopicId?: string;
  blockTypes?: string[];
  regenerate?: boolean;
}

const BLOCK_REQUIREMENTS = {
  topic: {
    definition: 2,
    theorem: 2,
    property: 1,
    method: 2,
    visual: 1,
    'worked-example': 3,
    'common-mistake': 2,
    'deep-dive': 2,
  },
  subtopic: {
    definition: 1,
    theorem: 1,
    method: 1,
    'worked-example': 1,
    'common-mistake': 1,
  }
};

const SYSTEM_PROMPT = `You are generating theory blocks for MathPath, a pre-university mathematics learning program.

CRITICAL RULES:
1. Use correct mathematical notation in LaTeX. All math expressions must be wrapped in $ or $$.
2. NO informal language: NEVER use "obviously", "you can see", "basically", "roughly", "simply", "just", "clearly".
3. Every theorem must include: name, formalStatement, hypothesis, conclusion, intuition, applications (2+).
4. Every definition must include: term, notation, formalStatement, domainRestrictions, examples (3+), nonExamples (1+).
5. Every method step must reference a theory block for justification using block numbers (A1, D1, T1, etc.).
6. Every worked example step must cite which block justifies it.
7. Every visual must include a concrete visualPlan describing exactly what to animate.
8. All cross-references must use block_numbers (D1, T1, M1, A1, etc.).
9. Theory must be rigorous, complete, and self-contained.

BLOCK NUMBERING:
- D# for definitions (D1, D2, D3...)
- T# for theorems (T1, T2, T3...)
- P# for properties (P1, P2, P3...)
- M# for methods (M1, M2, M3...)
- V# for visuals (V1, V2, V3...)
- E# for worked examples (E1, E2, E3...)
- C# for common mistakes (C1, C2, C3...)
- X# for deep dives (X1, X2, X3...)

FOUNDATIONAL BLOCKS (available for reference):
A1: Additive Property of Equality
A2: Multiplicative Property of Equality
A3: Power of a Power Rule
A4: Power of a Product Rule
A5: Distributive Property
A6: Power Rule for Logarithms
A7: Logarithm Definition
A8: Quadratic Formula
A9: Product Rule for Exponents
A10: Quotient Rule for Exponents
A11: Zero Exponent Rule
A12: Negative Exponent Rule
A13: Fractional Exponent Rule
A14: Product Rule for Logarithms
A15: Quotient Rule for Logarithms
A16: Factoring Quadratics
A17: Completing the Square
A18: Function Domain and Range
A19: Zero Product Property
A20: FOIL Method

OUTPUT FORMAT:
Return a JSON object with a "blocks" array. Each block must follow the exact schema for its type.`;

const BLOCK_SCHEMAS = `
DEFINITION BLOCK SCHEMA:
{
  "block_type": "definition",
  "block_number": "D#",
  "title": "Term Name",
  "content": {
    "term": "The mathematical term",
    "notation": "LaTeX notation, e.g., $f(x) = a^x$",
    "formalStatement": "Rigorous definition in complete sentences",
    "domainRestrictions": "e.g., $a > 0, a \\\\neq 1$",
    "examples": ["$2^x$", "$e^x$", "$10^x$"],
    "nonExamples": ["$x^2$ (variable base)"],
    "remarks": ["Optional additional notes"]
  }
}

THEOREM BLOCK SCHEMA:
{
  "block_type": "theorem",
  "block_number": "T#",
  "title": "Theorem Name",
  "content": {
    "name": "Formal theorem name",
    "hypothesis": "If... conditions (LaTeX)",
    "conclusion": "Then... result (LaTeX)",
    "formalStatement": "Complete formal statement combining hypothesis and conclusion",
    "intuition": "Why this theorem works (conceptual, but not informal)",
    "proof": [{"stepNumber": 1, "statement": "...", "justification": "By D1..."}],
    "applications": ["Application 1", "Application 2"]
  }
}

PROPERTY BLOCK SCHEMA:
{
  "block_type": "property",
  "block_number": "P#",
  "title": "Property Name",
  "content": {
    "name": "Property name",
    "statement": "Formal property statement in LaTeX",
    "derivation": "How it follows from definitions",
    "examples": ["Example 1", "Example 2"],
    "referencedBlocks": ["D1", "A3"]
  }
}

METHOD BLOCK SCHEMA:
{
  "block_type": "method",
  "block_number": "M#",
  "title": "Method Name",
  "content": {
    "name": "Solving [Type] Equations",
    "applicableWhen": "When to use this method",
    "steps": [
      {
        "stepNumber": 1,
        "action": "Description of what to do",
        "mathExpression": "LaTeX showing the step",
        "justifiedBy": "Reference to theory block (A1, D1, T1, etc.)"
      }
    ],
    "warnings": ["Common pitfall to avoid"],
    "miniExamples": ["Brief example"]
  }
}

VISUAL BLOCK SCHEMA:
{
  "block_type": "visual",
  "block_number": "V#",
  "title": "Visual Title",
  "content": {
    "description": "What this visual shows",
    "whatItShows": "Specific mathematical concept illustrated",
    "algebraicConnection": "How the visual relates to formulas",
    "keyObservations": ["Observation 1", "Observation 2"],
    "visualPlan": {
      "type": "graph|animation|diagram",
      "elements": ["function: $y = 2^x$", "asymptote: $y = 0$"],
      "sliders": [{"param": "a", "min": 0.5, "max": 3, "default": 2}],
      "animations": ["Show how curve changes as base changes"],
      "highlights": ["y-intercept at (0,1)", "horizontal asymptote"]
    }
  }
}

WORKED-EXAMPLE BLOCK SCHEMA:
{
  "block_type": "worked-example",
  "block_number": "E#",
  "title": "Example: [Problem Type]",
  "content": {
    "problem": "LaTeX problem statement",
    "difficulty": "basic|intermediate|advanced",
    "conceptsApplied": ["D1", "T2", "M1"],
    "solutionSteps": [
      {
        "stepNumber": 1,
        "action": "What we do",
        "latex": "Mathematical expression",
        "justification": "Explanation citing theory",
        "referencedBlockNumber": "D1"
      }
    ],
    "finalAnswer": "LaTeX final answer",
    "verification": "How to check the answer",
    "commonErrors": ["Error students might make"]
  }
}

COMMON-MISTAKE BLOCK SCHEMA:
{
  "block_type": "common-mistake",
  "block_number": "C#",
  "title": "Common Mistake: [Error Type]",
  "content": {
    "mistakeTitle": "Brief name for the error",
    "incorrectReasoning": "What students incorrectly think/do",
    "whyWrong": "Mathematical explanation of why it's wrong",
    "correction": "The correct approach",
    "miniExample": {
      "wrong": "Incorrect solution",
      "right": "Correct solution"
    }
  }
}

DEEP-DIVE BLOCK SCHEMA:
{
  "block_type": "deep-dive",
  "block_number": "X#",
  "title": "Deep Dive: [Question]",
  "content": {
    "question": "An interesting mathematical question",
    "answerExplanation": "Detailed answer",
    "boundaryCases": ["Edge case 1", "Edge case 2"],
    "extension": "Further exploration or connection to advanced math"
  }
}
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { topicId, subtopicId, blockTypes, regenerate = false }: GenerationRequest = await req.json();
    
    if (!topicId) {
      throw new Error('topicId is required');
    }

    // Fetch topic info
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, name, description')
      .eq('id', topicId)
      .single();
    
    if (topicError || !topic) {
      throw new Error(`Topic not found: ${topicId}`);
    }

    // Fetch subtopics for this topic
    const { data: subtopics } = await supabase
      .from('subtopics')
      .select('id, name, order_index')
      .eq('topic_id', topicId)
      .order('order_index');

    // Fetch existing blocks (to avoid duplicates)
    const { data: existingBlocks } = await supabase
      .from('theory_blocks')
      .select('id, block_number, block_type, title')
      .eq('topic_id', topicId);

    // Fetch foundational blocks for reference
    const { data: foundationalBlocks } = await supabase
      .from('theory_blocks')
      .select('block_number, title, block_type')
      .eq('topic_id', '11111111-1111-1111-1111-111111111100')
      .order('order_index');

    // Determine what blocks need to be generated
    const requirements = subtopicId ? BLOCK_REQUIREMENTS.subtopic : BLOCK_REQUIREMENTS.topic;
    const typesToGenerate = blockTypes || Object.keys(requirements);
    
    // Calculate what's missing
    const existingByType: Record<string, number> = {};
    existingBlocks?.forEach(b => {
      existingByType[b.block_type] = (existingByType[b.block_type] || 0) + 1;
    });

    const blocksNeeded: Record<string, number> = {};
    for (const [type, count] of Object.entries(requirements)) {
      if (typesToGenerate.includes(type)) {
        const existing = existingByType[type] || 0;
        const needed = regenerate ? count : Math.max(0, count - existing);
        if (needed > 0) {
          blocksNeeded[type] = needed;
        }
      }
    }

    if (Object.keys(blocksNeeded).length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All required blocks already exist',
        existingBlocks: existingBlocks?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build the generation prompt
    const foundationalRef = foundationalBlocks?.map(b => 
      `${b.block_number}: ${b.title}`
    ).join('\n') || '';

    const subtopicsRef = subtopics?.map(s => 
      `- ${s.name}`
    ).join('\n') || '';

    const existingRef = existingBlocks?.map(b => 
      `${b.block_number}: ${b.title} (${b.block_type})`
    ).join('\n') || 'None yet';

    const blocksRequest = Object.entries(blocksNeeded)
      .map(([type, count]) => `- ${count} ${type} block(s)`)
      .join('\n');

    const userPrompt = `Generate theory blocks for the topic: "${topic.name}"

TOPIC DESCRIPTION:
${topic.description || 'No description available'}

SUBTOPICS:
${subtopicsRef || 'No subtopics defined'}

EXISTING BLOCKS (do not duplicate):
${existingRef}

FOUNDATIONAL BLOCKS (available for reference):
${foundationalRef}

BLOCKS TO GENERATE:
${blocksRequest}

${BLOCK_SCHEMAS}

Generate the blocks now. Return ONLY valid JSON with a "blocks" array.`;

    console.log('Generating blocks for topic:', topic.name);
    console.log('Blocks needed:', blocksNeeded);

    // Call AI to generate blocks
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 16000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let parsedBlocks;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      parsedBlocks = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }

    const blocks = parsedBlocks.blocks || parsedBlocks;
    
    if (!Array.isArray(blocks)) {
      throw new Error('Response does not contain a blocks array');
    }

    // Validate and prepare blocks for insertion
    const validBlocks = [];
    const validationErrors = [];
    let orderOffset = (existingBlocks?.length || 0) + 1;

    for (const block of blocks) {
      const validation = validateBlock(block);
      if (validation.valid) {
        validBlocks.push({
          topic_id: topicId,
          block_type: block.block_type,
          block_number: block.block_number,
          title: block.title,
          content: block.content,
          order_index: orderOffset++,
          prerequisites: block.prerequisites || [],
        });
      } else {
        validationErrors.push({
          block: block.block_number || 'unknown',
          errors: validation.errors
        });
      }
    }

    // Insert valid blocks
    let insertedCount = 0;
    if (validBlocks.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('theory_blocks')
        .insert(validBlocks)
        .select('id, block_number, block_type');

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to insert blocks: ${insertError.message}`);
      }
      insertedCount = inserted?.length || 0;
    }

    return new Response(JSON.stringify({
      success: true,
      topic: topic.name,
      blocksRequested: blocksNeeded,
      blocksGenerated: blocks.length,
      blocksInserted: insertedCount,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generate-theory-blocks:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Validation function
function validateBlock(block: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required base fields
  if (!block.block_type) errors.push('Missing block_type');
  if (!block.block_number) errors.push('Missing block_number');
  if (!block.title) errors.push('Missing title');
  if (!block.content) errors.push('Missing content');

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate block_number format
  const blockNumberPattern = /^[DTPMVECX]\d+$/;
  if (!blockNumberPattern.test(block.block_number)) {
    errors.push(`Invalid block_number format: ${block.block_number}`);
  }

  // Type-specific validation
  const content = block.content;
  switch (block.block_type) {
    case 'definition':
      if (!content.term) errors.push('Definition missing term');
      if (!content.formalStatement) errors.push('Definition missing formalStatement');
      if (!content.examples || content.examples.length < 3) {
        errors.push('Definition requires at least 3 examples');
      }
      break;

    case 'theorem':
      if (!content.formalStatement) errors.push('Theorem missing formalStatement');
      if (!content.intuition) errors.push('Theorem missing intuition');
      if (!content.applications || content.applications.length < 2) {
        errors.push('Theorem requires at least 2 applications');
      }
      break;

    case 'method':
      if (!content.steps || content.steps.length === 0) {
        errors.push('Method missing steps');
      } else {
        for (const step of content.steps) {
          if (!step.justifiedBy) {
            errors.push(`Method step ${step.stepNumber} missing justifiedBy reference`);
          }
        }
      }
      break;

    case 'worked-example':
      if (!content.problem) errors.push('Worked example missing problem');
      if (!content.solutionSteps || content.solutionSteps.length === 0) {
        errors.push('Worked example missing solutionSteps');
      }
      if (!content.finalAnswer) errors.push('Worked example missing finalAnswer');
      break;

    case 'visual':
      if (!content.visualPlan) errors.push('Visual missing visualPlan');
      if (!content.algebraicConnection) errors.push('Visual missing algebraicConnection');
      break;

    case 'common-mistake':
      if (!content.incorrectReasoning) errors.push('Common mistake missing incorrectReasoning');
      if (!content.correction) errors.push('Common mistake missing correction');
      break;

    case 'deep-dive':
      if (!content.question) errors.push('Deep dive missing question');
      if (!content.answerExplanation) errors.push('Deep dive missing answerExplanation');
      break;
  }

  // Check for informal language
  const informalPatterns = [
    /\bobviously\b/i,
    /\byou can see\b/i,
    /\bbasically\b/i,
    /\broughly\b/i,
    /\bsimply\b/i,
    /\bjust\b/i,
    /\bclearly\b/i,
  ];

  const contentStr = JSON.stringify(content);
  for (const pattern of informalPatterns) {
    if (pattern.test(contentStr)) {
      errors.push(`Contains informal language: ${pattern.source}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
