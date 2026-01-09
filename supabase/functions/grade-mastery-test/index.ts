import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseAndValidate, gradeMasteryTestFullSchema } from '../_shared/validation.ts';

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
    const validation = await parseAndValidate(req, gradeMasteryTestFullSchema, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }
    const { testId, topicId, questions, answers, timeSpentMinutes } = validation.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Grading mastery test for topic: ${topicId}`);

    // Fetch theory blocks for scoring breakdown
    const { data: theoryBlocks } = await supabase
      .from("theory_blocks")
      .select("id, block_number, block_type, title")
      .eq("topic_id", topicId);

    const theoryBlockMap = new Map(
      (theoryBlocks || []).map((b: any) => [b.id, b])
    );

    // Grade each answer
    const gradedAnswers: any[] = [];
    let correctCount = 0;

    // Track scores by theory block
    const blockScores = new Map<string, { correct: number; total: number; block: any }>();

    // Initialize block scores
    for (const block of theoryBlocks || []) {
      blockScores.set(block.id, { correct: 0, total: 0, block });
    }

    // Track scores by subtopic
    const subtopicScores = new Map<string, { correct: number; total: number; name: string }>();

    for (const question of questions) {
      const answer = answers.find((a: any) => a.questionId === question.id);
      const userAnswer = answer?.userAnswer?.trim() || "";
      const correctAnswer = question.correctAnswer?.trim() || "";

      // Use AI to check mathematical equivalence
      let isCorrect = false;
      
      if (userAnswer) {
        const checkPrompt = `Compare these mathematical answers. Return ONLY "true" if they are equivalent, "false" otherwise.
Student answer: ${userAnswer}
Correct answer: ${correctAnswer}

Consider mathematical equivalence (e.g., "x=2" equals "2" for solving equations, "1/2" equals "0.5").`;

        const checkResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: checkPrompt }],
            temperature: 0,
            max_tokens: 10,
          }),
        });

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          const result = checkData.choices[0]?.message?.content?.toLowerCase().trim();
          isCorrect = result === "true";
        }
      }

      if (isCorrect) correctCount++;

      gradedAnswers.push({
        questionId: question.id,
        userAnswer,
        correctAnswer,
        isCorrect,
        timeSpentSeconds: answer?.timeSpentSeconds
      });

      // Update theory block scores
      const allBlockIds = [
        question.primaryMethodBlockId,
        ...(question.supportingTheoremIds || []),
        ...(question.definitionIds || [])
      ].filter(Boolean);

      for (const blockId of allBlockIds) {
        const score = blockScores.get(blockId);
        if (score) {
          score.total++;
          if (isCorrect) score.correct++;
        }
      }

      // Update subtopic scores
      const subtopicId = question.subtopicId;
      if (subtopicId) {
        const existing = subtopicScores.get(subtopicId) || { 
          correct: 0, 
          total: 0, 
          name: question.subtopicName 
        };
        existing.total++;
        if (isCorrect) existing.correct++;
        subtopicScores.set(subtopicId, existing);
      }
    }

    // Calculate theory block breakdown
    const theoryBlockScores = Array.from(blockScores.entries())
      .filter(([_, score]) => score.total > 0)
      .map(([blockId, score]) => {
        const percentage = Math.round((score.correct / score.total) * 100);
        let status: 'strong' | 'needs-review' | 'weak' = 'strong';
        if (percentage < 50) status = 'weak';
        else if (percentage < 80) status = 'needs-review';

        return {
          blockId,
          blockNumber: score.block.block_number,
          blockType: score.block.block_type,
          title: score.block.title,
          correct: score.correct,
          total: score.total,
          percentage,
          status
        };
      });

    const weakBlocks = theoryBlockScores
      .filter(b => b.status === 'weak' || b.status === 'needs-review')
      .map(b => b.blockId);

    const strongBlocks = theoryBlockScores
      .filter(b => b.status === 'strong')
      .map(b => b.blockId);

    // Calculate subtopic breakdown
    const subtopicCoverage = Array.from(subtopicScores.entries()).map(([id, data]) => ({
      subtopicId: id,
      subtopicName: data.name,
      correct: data.correct,
      total: data.total
    }));

    const totalQuestions = questions.length;
    const overallPercentage = Math.round((correctCount / totalQuestions) * 100);

    const result = {
      totalQuestions,
      correctCount,
      overallPercentage,
      timeSpentMinutes,
      theoryBlockScores,
      weakBlocks,
      strongBlocks,
      subtopicCoverage,
      gradedAnswers
    };

    console.log(`Graded test: ${correctCount}/${totalQuestions} (${overallPercentage}%)`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error grading mastery test:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
