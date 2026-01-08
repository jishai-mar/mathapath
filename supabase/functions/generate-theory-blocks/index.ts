import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
  mode?: 'generate' | 'repair' | 'validate-only';
  existingBlocks?: any[];
}

// Required block counts for complete topic coverage
const REQUIRED_BLOCKS = {
  'D': 2,  // Definitions
  'T': 3,  // Theorems/Properties
  'M': 2,  // Methods
  'V': 1,  // Visuals
  'E': 3,  // Worked Examples
  'C': 2,  // Common Mistakes
  'X': 2,  // Deep Dives
};

const REQUIRED_BLOCK_NUMBERS = [
  'D1', 'D2', 'T1', 'T2', 'T3', 'M1', 'M2', 'V1', 
  'E1', 'E2', 'E3', 'C1', 'C2', 'X1', 'X2'
];

// Foundational blocks reference for cross-citations
const FOUNDATION_BLOCKS = `A1: Additive Property of Equality
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
A20: FOIL Method`;

// Valid block number references (A1-A20 + topic blocks)
const VALID_FOUNDATION_REFS = Array.from({ length: 20 }, (_, i) => `A${i + 1}`);

// Informal language patterns to reject
const INFORMAL_PATTERNS = [
  /\bobviously\b/i,
  /\bbasically\b/i,
  /\byou can see\b/i,
  /\broughly\b/i,
  /\bjust\b/i,
  /\bsimply\b/i,
  /\bclearly\b/i,
];

// ============= VALIDATION FUNCTIONS =============

interface ValidationResult {
  valid: boolean;
  errors: string[];
  blockNumber: string;
}

function validateDefinitionContent(content: any): string[] {
  const errors: string[] = [];
  if (!content.term) errors.push('Missing required field: term');
  if (!content.notation) errors.push('Missing required field: notation');
  if (!content.formalStatement) errors.push('Missing required field: formalStatement');
  if (content.domainRestrictions === undefined) {
    // Allow null but must be present
    errors.push('Missing required field: domainRestrictions (can be null)');
  }
  if (!content.examples || !Array.isArray(content.examples) || content.examples.length < 3) {
    errors.push('Requires at least 3 examples');
  }
  if (!content.nonExamples || !Array.isArray(content.nonExamples) || content.nonExamples.length < 1) {
    errors.push('Requires at least 1 nonExample');
  }
  return errors;
}

function validateTheoremContent(content: any): string[] {
  const errors: string[] = [];
  if (!content.name) errors.push('Missing required field: name');
  if (!content.formalStatement) errors.push('Missing required field: formalStatement');
  if (!content.intuition) errors.push('Missing required field: intuition');
  if (!content.applications || !Array.isArray(content.applications) || content.applications.length < 2) {
    errors.push('Requires at least 2 applications');
  }
  return errors;
}

function validateMethodContent(content: any, validRefs: string[]): string[] {
  const errors: string[] = [];
  if (!content.name) errors.push('Missing required field: name');
  if (!content.applicableWhen) errors.push('Missing required field: applicableWhen');
  if (!content.steps || !Array.isArray(content.steps) || content.steps.length === 0) {
    errors.push('Requires at least 1 step');
  } else {
    content.steps.forEach((step: any, idx: number) => {
      if (!step.stepNumber) errors.push(`Step ${idx + 1}: missing stepNumber`);
      if (!step.action) errors.push(`Step ${idx + 1}: missing action`);
      if (!step.latex && !step.mathExpression) errors.push(`Step ${idx + 1}: missing latex/mathExpression`);
      if (!step.justification && !step.justifiedBy) errors.push(`Step ${idx + 1}: missing justification`);
      const ref = step.referencedBlockNumber || step.justifiedBy;
      if (!ref) {
        errors.push(`Step ${idx + 1}: missing referencedBlockNumber`);
      } else if (!validRefs.includes(ref)) {
        errors.push(`Step ${idx + 1}: invalid reference '${ref}'`);
      }
    });
  }
  if (!content.warnings || !Array.isArray(content.warnings) || content.warnings.length < 2) {
    errors.push('Requires at least 2 warnings');
  }
  return errors;
}

function validateVisualContent(content: any): string[] {
  const errors: string[] = [];
  if (!content.description) errors.push('Missing required field: description');
  if (!content.whatItShows) errors.push('Missing required field: whatItShows');
  if (!content.algebraicConnection) errors.push('Missing required field: algebraicConnection');
  if (!content.keyObservations || !Array.isArray(content.keyObservations) || content.keyObservations.length < 3) {
    errors.push('Requires at least 3 keyObservations');
  }
  if (!content.visualPlan) {
    errors.push('Missing required field: visualPlan');
  }
  return errors;
}

function validateWorkedExampleContent(content: any, validRefs: string[]): string[] {
  const errors: string[] = [];
  if (!content.problem) errors.push('Missing required field: problem');
  if (!content.difficulty || !['easy', 'medium', 'hard', 'basic', 'intermediate', 'advanced'].includes(content.difficulty)) {
    errors.push('Invalid or missing difficulty (must be easy/medium/hard)');
  }
  if (!content.conceptsApplied || !Array.isArray(content.conceptsApplied)) {
    errors.push('Missing required field: conceptsApplied');
  }
  if (!content.solutionSteps || !Array.isArray(content.solutionSteps) || content.solutionSteps.length === 0) {
    errors.push('Requires at least 1 solutionStep');
  } else {
    content.solutionSteps.forEach((step: any, idx: number) => {
      if (!step.stepNumber) errors.push(`SolutionStep ${idx + 1}: missing stepNumber`);
      if (!step.action) errors.push(`SolutionStep ${idx + 1}: missing action`);
      if (!step.latex) errors.push(`SolutionStep ${idx + 1}: missing latex`);
      if (!step.justification) errors.push(`SolutionStep ${idx + 1}: missing justification`);
      if (!step.referencedBlockNumber) {
        errors.push(`SolutionStep ${idx + 1}: missing referencedBlockNumber`);
      } else if (!validRefs.includes(step.referencedBlockNumber)) {
        errors.push(`SolutionStep ${idx + 1}: invalid reference '${step.referencedBlockNumber}'`);
      }
    });
  }
  if (!content.finalAnswer) errors.push('Missing required field: finalAnswer');
  if (!content.verification) errors.push('Missing required field: verification');
  if (!content.commonErrors || !Array.isArray(content.commonErrors) || content.commonErrors.length < 1) {
    errors.push('Requires at least 1 commonError');
  }
  return errors;
}

function validateCommonMistakeContent(content: any): string[] {
  const errors: string[] = [];
  if (!content.mistakeTitle) errors.push('Missing required field: mistakeTitle');
  if (!content.incorrectReasoning) errors.push('Missing required field: incorrectReasoning');
  if (!content.whyWrong) errors.push('Missing required field: whyWrong');
  if (!content.correction) errors.push('Missing required field: correction');
  if (!content.miniExample) errors.push('Missing required field: miniExample');
  return errors;
}

function validateDeepDiveContent(content: any): string[] {
  const errors: string[] = [];
  if (!content.question) errors.push('Missing required field: question');
  if (!content.answerExplanation) errors.push('Missing required field: answerExplanation');
  if (!content.boundaryCases) errors.push('Missing required field: boundaryCases');
  if (!content.extension) errors.push('Missing required field: extension');
  return errors;
}

function checkInformalLanguage(content: any): string[] {
  const errors: string[] = [];
  const contentStr = JSON.stringify(content);
  for (const pattern of INFORMAL_PATTERNS) {
    if (pattern.test(contentStr)) {
      errors.push(`Contains informal language: "${pattern.source.replace(/\\b/g, '')}"`);
    }
  }
  return errors;
}

function validateBlock(block: any, topicBlockNumbers: string[]): ValidationResult {
  const errors: string[] = [];
  const blockNumber = block.block_number || 'UNKNOWN';
  
  // Base field validation
  if (!block.block_type) errors.push('Missing block_type');
  if (!block.block_number) errors.push('Missing block_number');
  if (!block.title) errors.push('Missing title');
  if (!block.content) errors.push('Missing content');
  
  if (errors.length > 0) {
    return { valid: false, errors, blockNumber };
  }
  
  // Validate block_number format
  const blockNumberPattern = /^[DTMVECX]\d+$/;
  if (!blockNumberPattern.test(block.block_number)) {
    errors.push(`Invalid block_number format: ${block.block_number}`);
  }
  
  // Valid references include A1-A20 plus all topic blocks
  const validRefs = [...VALID_FOUNDATION_REFS, ...topicBlockNumbers];
  
  // Type-specific validation
  const content = block.content;
  switch (block.block_type) {
    case 'definition':
      errors.push(...validateDefinitionContent(content));
      break;
    case 'theorem':
    case 'property':
      errors.push(...validateTheoremContent(content));
      break;
    case 'method':
      errors.push(...validateMethodContent(content, validRefs));
      break;
    case 'visual':
      errors.push(...validateVisualContent(content));
      break;
    case 'worked-example':
      errors.push(...validateWorkedExampleContent(content, validRefs));
      break;
    case 'common-mistake':
      errors.push(...validateCommonMistakeContent(content));
      break;
    case 'deep-dive':
      errors.push(...validateDeepDiveContent(content));
      break;
    default:
      errors.push(`Unknown block_type: ${block.block_type}`);
  }
  
  // Check for informal language
  errors.push(...checkInformalLanguage(content));
  
  return { valid: errors.length === 0, errors, blockNumber };
}

function validateAllBlocks(blocks: any[]): { 
  valid: boolean; 
  validBlocks: any[]; 
  invalidBlocks: { blockNumber: string; errors: string[] }[];
  missingBlocks: string[];
} {
  const topicBlockNumbers = blocks.map(b => b.block_number).filter(Boolean);
  const validBlocks: any[] = [];
  const invalidBlocks: { blockNumber: string; errors: string[] }[] = [];
  
  for (const block of blocks) {
    const result = validateBlock(block, topicBlockNumbers);
    if (result.valid) {
      validBlocks.push(block);
    } else {
      invalidBlocks.push({ blockNumber: result.blockNumber, errors: result.errors });
    }
  }
  
  // Check for missing required blocks
  const presentNumbers = new Set(blocks.map(b => b.block_number));
  const missingBlocks = REQUIRED_BLOCK_NUMBERS.filter(bn => !presentNumbers.has(bn));
  
  return {
    valid: invalidBlocks.length === 0 && missingBlocks.length === 0,
    validBlocks,
    invalidBlocks,
    missingBlocks
  };
}

// ============= PROMPT TEMPLATES =============

function getGenerationPrompt(topicName: string, topicDescription: string): string {
  return `You are writing rigorous mathematics theory blocks for the topic: ${topicName}.

TOPIC DESCRIPTION:
${topicDescription || 'A standard pre-university mathematics topic.'}

Return exactly 15 blocks with block_numbers D1,D2,T1,T2,T3,M1,M2,V1,E1,E2,E3,C1,C2,X1,X2.

CRITICAL REQUIREMENTS:
1. Use only LaTeX for mathematics (wrapped in $ or $$).
2. Do not use informal language. FORBIDDEN: "obviously", "basically", "you can see", "roughly", "just", "simply", "clearly".
3. Every method step must include referencedBlockNumber pointing to A1-A20 or to one of the topic's blocks (D1, T1, etc.).
4. Every worked-example solutionStep must include referencedBlockNumber.
5. Worked examples must have difficulties: E1=easy, E2=medium, E3=hard.
6. Include domain restrictions where mathematically required.

FOUNDATIONAL BLOCKS (A1-A20) - Available for reference:
${FOUNDATION_BLOCKS}

BLOCK SCHEMAS:

DEFINITION (D1, D2):
{
  "block_type": "definition",
  "block_number": "D#",
  "title": "Term Name",
  "content": {
    "term": "The mathematical term",
    "notation": "LaTeX notation",
    "formalStatement": "Rigorous definition",
    "domainRestrictions": "Restrictions or null",
    "examples": ["Ex1", "Ex2", "Ex3"],
    "nonExamples": ["NonEx1"],
    "remarks": ["Optional notes"]
  }
}

THEOREM (T1, T2, T3):
{
  "block_type": "theorem",
  "block_number": "T#",
  "title": "Theorem Name",
  "content": {
    "name": "Formal name",
    "hypothesis": "If... (optional)",
    "conclusion": "Then... (optional)",
    "formalStatement": "Complete statement",
    "intuition": "Why this works conceptually",
    "proof": [{"stepNumber": 1, "statement": "...", "justification": "By..."}],
    "applications": ["App1", "App2"]
  }
}

METHOD (M1, M2):
{
  "block_type": "method",
  "block_number": "M#",
  "title": "Method Name",
  "content": {
    "name": "Method name",
    "applicableWhen": "When to use this method",
    "steps": [
      {
        "stepNumber": 1,
        "action": "What to do",
        "latex": "Mathematical expression",
        "justification": "Why this works",
        "referencedBlockNumber": "A1 or D1 etc."
      }
    ],
    "warnings": ["Warning1", "Warning2"],
    "miniExamples": ["Brief example"]
  }
}

VISUAL (V1):
{
  "block_type": "visual",
  "block_number": "V1",
  "title": "Visual Title",
  "content": {
    "description": "What this visual shows",
    "whatItShows": "Mathematical concept illustrated",
    "algebraicConnection": "How visual relates to formulas",
    "keyObservations": ["Obs1", "Obs2", "Obs3"],
    "visualPlan": {
      "type": "graph|animation|diagram",
      "elements": ["function: $y = ...$"],
      "domain": [-10, 10],
      "range": [-10, 10],
      "highlights": ["key point 1"]
    }
  }
}

WORKED-EXAMPLE (E1=easy, E2=medium, E3=hard):
{
  "block_type": "worked-example",
  "block_number": "E#",
  "title": "Example: Problem Type",
  "content": {
    "problem": "LaTeX problem statement",
    "difficulty": "easy|medium|hard",
    "conceptsApplied": ["D1", "T2", "M1"],
    "solutionSteps": [
      {
        "stepNumber": 1,
        "action": "What we do",
        "latex": "Math expression",
        "justification": "Why, citing theory",
        "referencedBlockNumber": "D1"
      }
    ],
    "finalAnswer": "LaTeX answer",
    "verification": "How to check",
    "commonErrors": ["Error students might make"]
  }
}

COMMON-MISTAKE (C1, C2):
{
  "block_type": "common-mistake",
  "block_number": "C#",
  "title": "Common Mistake: Error Type",
  "content": {
    "mistakeTitle": "Brief name",
    "incorrectReasoning": "What students wrongly think",
    "whyWrong": "Mathematical explanation",
    "correction": "Correct approach",
    "miniExample": {
      "wrong": "Incorrect: $...$",
      "right": "Correct: $...$"
    }
  }
}

DEEP-DIVE (X1, X2):
{
  "block_type": "deep-dive",
  "block_number": "X#",
  "title": "Deep Dive: Question",
  "content": {
    "question": "Interesting mathematical question",
    "answerExplanation": "Detailed answer",
    "boundaryCases": ["Edge case 1", "Edge case 2"],
    "extension": "Connection to advanced math"
  }
}

Return ONLY valid JSON in this exact shape:
{ "blocks": [ ...15 blocks... ], "prerequisites": [ "A1", "A2", ... ] }`;
}

function getRepairPrompt(topicName: string, invalidBlocks: { blockNumber: string; errors: string[] }[], currentBlocks: any[]): string {
  const errorDetails = invalidBlocks.map(ib => 
    `Block ${ib.blockNumber}:\n${ib.errors.map(e => `  - ${e}`).join('\n')}`
  ).join('\n\n');
  
  const blocksToFix = invalidBlocks.map(ib => ib.blockNumber);
  const currentBlocksJson = JSON.stringify(
    currentBlocks.filter(b => blocksToFix.includes(b.block_number)),
    null, 2
  );

  return `You are repairing invalid theory blocks for the topic: ${topicName}.

VALIDATION ERRORS:
${errorDetails}

CURRENT INVALID BLOCKS:
${currentBlocksJson}

FOUNDATIONAL BLOCKS (for references):
${FOUNDATION_BLOCKS}

INSTRUCTIONS:
1. Output ONLY the corrected blocks for: ${blocksToFix.join(', ')}
2. Do not change block_numbers
3. Do not add or remove blocks
4. Fix ALL validation errors listed above
5. Ensure all referencedBlockNumber fields point to valid blocks (A1-A20 or D1, T1, M1, etc.)
6. Remove any informal language

Return ONLY valid JSON: { "blocks": [ ...corrected blocks... ] }`;
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { 
      topicId, 
      mode = 'generate',
      existingBlocks,
      regenerate = false 
    }: GenerationRequest = await req.json();
    
    if (!topicId) {
      throw new Error('topicId is required');
    }

    console.log(`[generate-theory-blocks] Mode: ${mode}, Topic: ${topicId}`);

    // Fetch topic info
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, name, description')
      .eq('id', topicId)
      .single();
    
    if (topicError || !topic) {
      throw new Error(`Topic not found: ${topicId}`);
    }

    // For validate-only mode, just validate existing blocks
    if (mode === 'validate-only' && existingBlocks) {
      const validation = validateAllBlocks(existingBlocks);
      return new Response(JSON.stringify({
        success: validation.valid,
        validBlocks: validation.validBlocks.length,
        invalidBlocks: validation.invalidBlocks,
        missingBlocks: validation.missingBlocks
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch existing blocks if not regenerating
    let currentBlocks: any[] = [];
    if (!regenerate) {
      const { data: existing } = await supabase
        .from('theory_blocks')
        .select('*')
        .eq('topic_id', topicId);
      currentBlocks = existing || [];
    }

    // If we already have 15 blocks and not regenerating, skip
    if (!regenerate && currentBlocks.length >= 15) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All required blocks already exist',
        blocksCount: currentBlocks.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Delete existing blocks if regenerating
    if (regenerate && currentBlocks.length > 0) {
      console.log(`[generate-theory-blocks] Deleting ${currentBlocks.length} existing blocks for regeneration`);
      await supabase
        .from('theory_blocks')
        .delete()
        .eq('topic_id', topicId);
    }

    // ============= PASS 1: GENERATION =============
    console.log(`[generate-theory-blocks] Pass 1: Generating blocks for "${topic.name}"`);
    
    const generationPrompt = getGenerationPrompt(topic.name, topic.description || '');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'user', content: generationPrompt }
        ],
        max_tokens: 32000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[generate-theory-blocks] AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[generate-theory-blocks] JSON parse error:', parseError);
      console.error('[generate-theory-blocks] Raw content (first 1000 chars):', content.substring(0, 1000));
      throw new Error('Failed to parse AI response as JSON');
    }

    let blocks = parsedResponse.blocks || parsedResponse;
    if (!Array.isArray(blocks)) {
      throw new Error('Response does not contain a blocks array');
    }

    console.log(`[generate-theory-blocks] Generated ${blocks.length} blocks`);

    // ============= VALIDATION =============
    let validation = validateAllBlocks(blocks);
    console.log(`[generate-theory-blocks] Validation: ${validation.validBlocks.length} valid, ${validation.invalidBlocks.length} invalid, ${validation.missingBlocks.length} missing`);

    // ============= PASS 2: REPAIR (if needed) =============
    let repairAttempts = 0;
    const maxRepairAttempts = 2;

    while (!validation.valid && repairAttempts < maxRepairAttempts) {
      repairAttempts++;
      console.log(`[generate-theory-blocks] Pass 2: Repair attempt ${repairAttempts}`);

      const repairPrompt = getRepairPrompt(topic.name, validation.invalidBlocks, blocks);
      
      const repairResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'user', content: repairPrompt }
          ],
          max_tokens: 16000,
        }),
      });

      if (!repairResponse.ok) {
        console.error('[generate-theory-blocks] Repair API error');
        break;
      }

      const repairData = await repairResponse.json();
      const repairContent = repairData.choices?.[0]?.message?.content;

      if (!repairContent) {
        console.error('[generate-theory-blocks] No repair content');
        break;
      }

      try {
        const repairJsonMatch = repairContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, repairContent];
        const repairJsonStr = repairJsonMatch[1].trim();
        const repairedParsed = JSON.parse(repairJsonStr);
        const repairedBlocks = repairedParsed.blocks || repairedParsed;

        if (Array.isArray(repairedBlocks)) {
          // Merge repaired blocks into the original set
          const repairedNumbers = new Set(repairedBlocks.map((b: any) => b.block_number));
          blocks = blocks.filter((b: any) => !repairedNumbers.has(b.block_number));
          blocks.push(...repairedBlocks);
          
          validation = validateAllBlocks(blocks);
          console.log(`[generate-theory-blocks] After repair: ${validation.validBlocks.length} valid, ${validation.invalidBlocks.length} invalid`);
        }
      } catch (repairParseError) {
        console.error('[generate-theory-blocks] Failed to parse repair response');
      }
    }

    // ============= INSERT BLOCKS =============
    const blocksToInsert = validation.validBlocks.map((block, idx) => ({
      topic_id: topicId,
      block_type: block.block_type,
      block_number: block.block_number,
      title: block.title,
      content: block.content,
      order_index: idx + 1,
      prerequisites: parsedResponse.prerequisites || [],
    }));

    let insertedCount = 0;
    if (blocksToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('theory_blocks')
        .insert(blocksToInsert)
        .select('id, block_number');

      if (insertError) {
        console.error('[generate-theory-blocks] Insert error:', insertError);
        throw new Error(`Failed to insert blocks: ${insertError.message}`);
      }
      insertedCount = inserted?.length || 0;
      console.log(`[generate-theory-blocks] Inserted ${insertedCount} blocks`);
    }

    return new Response(JSON.stringify({
      success: true,
      topic: topic.name,
      topicId: topicId,
      blocksGenerated: blocks.length,
      blocksInserted: insertedCount,
      validationPassed: validation.valid,
      repairAttempts,
      invalidBlocks: validation.invalidBlocks.length > 0 ? validation.invalidBlocks : undefined,
      missingBlocks: validation.missingBlocks.length > 0 ? validation.missingBlocks : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[generate-theory-blocks] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
