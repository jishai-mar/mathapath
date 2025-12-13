import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseId, userAnswer, userId, hintsUsed, timeSpentSeconds } = await req.json();

    if (!exerciseId || !userId) {
      return new Response(
        JSON.stringify({ error: "exerciseId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the exercise with correct answer (only accessible via service role)
    const { data: exercise, error: exerciseError } = await supabase
      .from("exercises")
      .select("id, correct_answer, explanation, subtopic_id, difficulty")
      .eq("id", exerciseId)
      .single();

    if (exerciseError || !exercise) {
      console.error("Exercise fetch error:", exerciseError);
      return new Response(
        JSON.stringify({ error: "Exercise not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize answers for comparison
    const normalize = (s: string) => 
      s.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/,/g, '')
        .trim();

    const isCorrect = userAnswer 
      ? normalize(userAnswer) === normalize(exercise.correct_answer)
      : false;

    // Fetch student's recent performance on this subtopic for personalization
    const { data: recentAttempts } = await supabase
      .from("exercise_attempts")
      .select(`
        is_correct,
        hints_used,
        exercises!inner(difficulty, subtopic_id)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Calculate performance stats by difficulty
    const performanceByDifficulty = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
    const subtopicAttempts = (recentAttempts || []).filter((a: any) => a.exercises?.subtopic_id === exercise.subtopic_id);
    
    subtopicAttempts.forEach((attempt: any) => {
      const diff = attempt.exercises?.difficulty as 'easy' | 'medium' | 'hard';
      if (diff && performanceByDifficulty[diff]) {
        performanceByDifficulty[diff].total++;
        if (attempt.is_correct) performanceByDifficulty[diff].correct++;
      }
    });

    // Calculate success rates
    const successRates = {
      easy: performanceByDifficulty.easy.total > 0 ? Math.round((performanceByDifficulty.easy.correct / performanceByDifficulty.easy.total) * 100) : null,
      medium: performanceByDifficulty.medium.total > 0 ? Math.round((performanceByDifficulty.medium.correct / performanceByDifficulty.medium.total) * 100) : null,
      hard: performanceByDifficulty.hard.total > 0 ? Math.round((performanceByDifficulty.hard.correct / performanceByDifficulty.hard.total) * 100) : null,
    };

    // Determine recommended next difficulty based on performance
    let suggestedDifficulty: 'easy' | 'medium' | 'hard' = exercise.difficulty;
    const currentDiff = exercise.difficulty;
    
    if (isCorrect) {
      // Student got it right - consider moving up
      if (currentDiff === 'easy' && (successRates.easy === null || successRates.easy >= 80)) {
        suggestedDifficulty = 'medium';
      } else if (currentDiff === 'medium' && (successRates.medium === null || successRates.medium >= 75)) {
        suggestedDifficulty = 'hard';
      }
    } else {
      // Student got it wrong - consider moving down
      if (currentDiff === 'hard' && successRates.hard !== null && successRates.hard < 50) {
        suggestedDifficulty = 'medium';
      } else if (currentDiff === 'medium' && successRates.medium !== null && successRates.medium < 40) {
        suggestedDifficulty = 'easy';
      }
    }

    // Save the attempt
    const { error: insertError } = await supabase
      .from("exercise_attempts")
      .insert({
        exercise_id: exerciseId,
        user_id: userId,
        user_answer: userAnswer || null,
        is_correct: isCorrect,
        hints_used: hintsUsed || 0,
        time_spent_seconds: timeSpentSeconds || null,
      });

    if (insertError) {
      console.error("Insert attempt error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save attempt" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Answer checked for exercise ${exerciseId}: ${isCorrect ? 'correct' : 'incorrect'}, suggested next: ${suggestedDifficulty}`);

    // Only return the correct answer and explanation AFTER submission
    return new Response(
      JSON.stringify({ 
        isCorrect,
        correctAnswer: exercise.correct_answer,
        explanation: exercise.explanation,
        suggestedDifficulty,
        performanceInsight: {
          currentDifficulty: exercise.difficulty,
          successRates,
          recommendation: suggestedDifficulty !== exercise.difficulty 
            ? `Based on your performance, ${suggestedDifficulty} exercises are recommended next.`
            : null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check answer error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
