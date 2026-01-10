import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseAndValidate, generateTopicMasteryTestSchema } from '../_shared/validation.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const validation = await parseAndValidate(req, generateTopicMasteryTestSchema, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }
    const { topicId, userId } = validation.data;
    
    // Get additional optional fields from request
    const rawBody = await req.clone().json().catch(() => ({}));
    const questionCount = rawBody.questionCount || 8;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Generating mastery test for topic: ${topicId}`);

    // Fetch topic details
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .single();

    if (topicError || !topic) {
      throw new Error("Topic not found");
    }

    // Fetch ALL theory blocks for this topic
    const { data: theoryBlocks, error: theoryError } = await supabase
      .from("theory_blocks")
      .select("*")
      .eq("topic_id", topicId)
      .order("order_index");

    if (theoryError) throw theoryError;

    // Fetch foundational blocks (A# series)
    const { data: foundationalBlocks, error: foundError } = await supabase
      .from("theory_blocks")
      .select("*")
      .eq("topic_id", "00000000-0000-0000-0000-000000000000")
      .order("order_index");

    // Fetch ALL subtopics for the topic
    const { data: subtopics, error: subtopicsError } = await supabase
      .from("subtopics")
      .select("*")
      .eq("topic_id", topicId)
      .order("order_index");

    if (subtopicsError) throw subtopicsError;

    // Validation: Topic must have theory blocks
    if (!theoryBlocks || theoryBlocks.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "VALIDATION_FAILED: Topic has no theory blocks. Cannot generate mastery test." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build theory map for AI prompt
    const theoryMap = (theoryBlocks || []).map((b: any) => ({
      id: b.id,
      blockNumber: b.block_number,
      title: b.title,
      type: b.block_type,
      content: b.content
    }));

    const foundationalMap = (foundationalBlocks || []).map((b: any) => ({
      id: b.id,
      blockNumber: b.block_number,
      title: b.title,
      type: b.block_type
    }));

    const allBlockIds = [...theoryMap.map(b => b.id), ...foundationalMap.map(b => b.id)];
    const allBlockNumbers = [...theoryMap.map(b => b.blockNumber), ...foundationalMap.map(b => b.blockNumber)];

    const systemPrompt = `You are generating a cumulative mastery test for "${topic.name}".
This is a THEORY-FIRST test. Every question and solution step MUST reference stored theory blocks.

AVAILABLE TOPIC THEORY BLOCKS (you MUST cite these):
${theoryMap.map(b => `- ${b.blockNumber}: ${b.title} (${b.type}) [ID: ${b.id}]`).join('\n')}

FOUNDATIONAL ALGEBRA BLOCKS (available for all questions):
${foundationalMap.map(b => `- ${b.blockNumber}: ${b.title} [ID: ${b.id}]`).join('\n')}

SUBTOPICS TO COVER:
${(subtopics || []).map((s: any) => `- ${s.name} [ID: ${s.id}]`).join('\n')}

STRICT RULES:
1. Every question MUST specify:
   - primaryMethodBlockId (UUID from above)
   - primaryMethodBlockNumber (e.g., "M1")
   - conceptsTested array (e.g., ["D1", "T1", "M1"])
   - supportingTheoremIds and supportingTheoremNumbers
   - definitionIds and definitionNumbers

2. Every solution step MUST include:
   - theoryBlockId (UUID)
   - theoryBlockReference (e.g., "T1", "A3")
   - theoryCitation (e.g., "By Theorem T1 (Equal Bases Principle)")

3. Include EXACTLY 1 question that combines concepts from multiple subtopics (isCombinationQuestion: true)

4. NO questions may rely on concepts not in the theory blocks listed above

5. Solutions may ONLY cite blocks listed above

6. Use difficulty distribution: 2 easy, 4 medium, 2 hard

FORBIDDEN:
- Introducing new formulas or methods not in theory blocks
- Steps without theory citations
- Informal language ("obviously", "we can see", "it follows that" without citation)
- Questions that cannot be solved using the provided theory

Return JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "questionNumber": 1,
      "question": "Problem text with $LaTeX$",
      "correctAnswer": "Final answer",
      "difficulty": "easy|medium|hard",
      "subtopicId": "uuid from subtopics",
      "subtopicName": "Name of subtopic",
      "primaryMethodBlockId": "uuid of method block",
      "primaryMethodBlockNumber": "M1",
      "supportingTheoremIds": ["uuid1", "uuid2"],
      "supportingTheoremNumbers": ["T1", "T2"],
      "definitionIds": ["uuid"],
      "definitionNumbers": ["D1"],
      "conceptsTested": ["D1", "T1", "M1"],
      "isCombinationQuestion": false,
      "solution": [
        {
          "stepNumber": 1,
          "action": "What we do",
          "calculation": "$LaTeX$ math",
          "theoryBlockId": "uuid",
          "theoryBlockReference": "T1",
          "theoryCitation": "By Theorem T1 (Equal Bases Principle)"
        }
      ]
    }
  ]
}`;

    const userPrompt = `Generate ${questionCount} mastery test questions for "${topic.name}".

Requirements:
- Cover ALL subtopics across the questions
- Ensure EVERY theory block is tested at least once
- Include 1 combination question that requires knowledge from multiple subtopics
- Balance difficulties: 2 easy, ${questionCount - 4} medium, 2 hard
- Every solution step must cite a theory block by UUID and block number

This test helps students assess their cumulative understanding of the topic.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    // Parse JSON from response
    let testData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        testData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to generate valid test questions");
    }

    // Validate the generated test
    const questions = testData.questions || [];
    
    // Validation 1: Every question must have theory references
    for (const q of questions) {
      if (!q.primaryMethodBlockId) {
        console.error(`VALIDATION_FAILED: Question ${q.id} missing primaryMethodBlockId`);
        throw new Error(`Question ${q.id} has no primary method block`);
      }
      if (!q.conceptsTested || q.conceptsTested.length === 0) {
        console.error(`VALIDATION_FAILED: Question ${q.id} missing conceptsTested`);
        throw new Error(`Question ${q.id} has no concepts tested`);
      }
      
      // Validate solution steps
      for (const step of (q.solution || [])) {
        if (!step.theoryBlockId || !step.theoryCitation) {
          console.error(`VALIDATION_FAILED: Question ${q.id} Step ${step.stepNumber} missing citation`);
          throw new Error(`Question ${q.id} Step ${step.stepNumber} missing theory citation`);
        }
      }
    }

    // Validation 2: At least one combination question
    const combinationQuestions = questions.filter((q: any) => q.isCombinationQuestion);
    if (combinationQuestions.length === 0) {
      console.warn("No combination question found, marking last question as combination");
      if (questions.length > 0) {
        questions[questions.length - 1].isCombinationQuestion = true;
      }
    }

    // Add metadata
    const result = {
      topicId,
      topicName: topic.name,
      generatedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      theoryBlocksCovered: theoryMap.map((b: any) => b.blockNumber),
      subtopicsCovered: (subtopics || []).map((s: any) => ({ id: s.id, name: s.name })),
      questions
    };

    console.log(`Generated mastery test with ${questions.length} questions`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating mastery test:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
