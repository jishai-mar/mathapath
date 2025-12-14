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
    const { exerciseId, userAnswer, userId, hintsUsed, timeSpentSeconds, currentSubLevel } = await req.json();

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
        .replace(/±/g, '+-')
        .replace(/−/g, '-')
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
      .limit(30);

    // Calculate performance stats by difficulty
    const performanceByDifficulty = { 
      easy: { correct: 0, total: 0, streak: 0 }, 
      medium: { correct: 0, total: 0, streak: 0 }, 
      hard: { correct: 0, total: 0, streak: 0 } 
    };
    
    const subtopicAttempts = (recentAttempts || []).filter((a: any) => a.exercises?.subtopic_id === exercise.subtopic_id);
    
    // Track consecutive correct answers for current difficulty
    let consecutiveCorrectCurrent = 0;
    let consecutiveWrongCurrent = 0;
    let foundWrong = false;
    let foundCorrect = false;

    for (const attempt of subtopicAttempts) {
      const exerciseData = (attempt as any).exercises;
      const diff = exerciseData?.difficulty as 'easy' | 'medium' | 'hard' | undefined;
      if (diff && performanceByDifficulty[diff]) {
        performanceByDifficulty[diff].total++;
        if (attempt.is_correct) performanceByDifficulty[diff].correct++;
      }
      
      // Count consecutive for current difficulty (before this attempt)
      if (diff === exercise.difficulty) {
        if (!foundWrong && attempt.is_correct) {
          consecutiveCorrectCurrent++;
        } else {
          foundWrong = true;
        }
        
        if (!foundCorrect && !attempt.is_correct) {
          consecutiveWrongCurrent++;
        } else {
          foundCorrect = true;
        }
      }
    }

    // Update streaks based on this answer
    if (isCorrect) {
      consecutiveCorrectCurrent++;
      consecutiveWrongCurrent = 0;
    } else {
      consecutiveWrongCurrent++;
      consecutiveCorrectCurrent = 0;
    }

    // Calculate success rates
    const successRates = {
      easy: performanceByDifficulty.easy.total > 0 ? Math.round((performanceByDifficulty.easy.correct / performanceByDifficulty.easy.total) * 100) : null,
      medium: performanceByDifficulty.medium.total > 0 ? Math.round((performanceByDifficulty.medium.correct / performanceByDifficulty.medium.total) * 100) : null,
      hard: performanceByDifficulty.hard.total > 0 ? Math.round((performanceByDifficulty.hard.correct / performanceByDifficulty.hard.total) * 100) : null,
    };

    // Enhanced difficulty progression with sub-levels
    // Sub-levels: 1 (easiest within tier), 2 (middle), 3 (hardest within tier)
    let suggestedDifficulty: 'easy' | 'medium' | 'hard' = exercise.difficulty;
    let suggestedSubLevel = currentSubLevel || 2; // Default to middle sub-level
    const currentDiff = exercise.difficulty;
    
    if (isCorrect) {
      // Student got it right - progress within tier first, then to next tier
      if (consecutiveCorrectCurrent >= 2) {
        // Ready to progress
        if (suggestedSubLevel < 3) {
          // Progress within current tier
          suggestedSubLevel = Math.min(3, suggestedSubLevel + 1);
        } else {
          // At max sub-level, move to next tier
          if (currentDiff === 'easy') {
            suggestedDifficulty = 'medium';
            suggestedSubLevel = 1; // Start at easiest of new tier
          } else if (currentDiff === 'medium') {
            suggestedDifficulty = 'hard';
            suggestedSubLevel = 1;
          }
          // If already at hard, stay at hard sub-level 3
        }
      }
    } else {
      // Student got it wrong - regress within tier first, then to previous tier
      if (consecutiveWrongCurrent >= 2) {
        // Need to regress
        if (suggestedSubLevel > 1) {
          // Regress within current tier
          suggestedSubLevel = Math.max(1, suggestedSubLevel - 1);
        } else {
          // At min sub-level, move to previous tier
          if (currentDiff === 'hard') {
            suggestedDifficulty = 'medium';
            suggestedSubLevel = 3; // Start at hardest of lower tier
          } else if (currentDiff === 'medium') {
            suggestedDifficulty = 'easy';
            suggestedSubLevel = 3;
          }
          // If already at easy, stay at easy sub-level 1
        }
      }
    }

    // Performance-based adjustments (override streak logic if performance is very clear)
    const currentDiffTyped = currentDiff as 'easy' | 'medium' | 'hard';
    const currentStats = successRates[currentDiffTyped];
    if (currentStats !== null) {
      if (currentStats >= 85 && performanceByDifficulty[currentDiffTyped].total >= 5) {
        // Very strong at this level - definitely move up
        if (currentDiffTyped === 'easy') suggestedDifficulty = 'medium';
        else if (currentDiffTyped === 'medium') suggestedDifficulty = 'hard';
        suggestedSubLevel = 2; // Start at middle of new tier
      } else if (currentStats < 30 && performanceByDifficulty[currentDiffTyped].total >= 4) {
        // Really struggling - move down
        if (currentDiffTyped === 'hard') suggestedDifficulty = 'medium';
        else if (currentDiffTyped === 'medium') suggestedDifficulty = 'easy';
        suggestedSubLevel = 2;
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

    console.log(`Answer checked for exercise ${exerciseId}: ${isCorrect ? 'correct' : 'incorrect'}, suggested: ${suggestedDifficulty} (sub-level ${suggestedSubLevel})`);

    // Generate adaptive message based on progression
    let progressionMessage = null;
    if (suggestedDifficulty !== currentDiff) {
      if ((suggestedDifficulty === 'medium' && currentDiff === 'easy') || 
          (suggestedDifficulty === 'hard' && currentDiff === 'medium')) {
        progressionMessage = "Great progress! Moving to more challenging exercises.";
      } else {
        progressionMessage = "Let's reinforce the fundamentals with some focused practice.";
      }
    }

    // Only return the correct answer and explanation AFTER submission
    return new Response(
      JSON.stringify({ 
        isCorrect,
        correctAnswer: exercise.correct_answer,
        explanation: exercise.explanation,
        suggestedDifficulty,
        suggestedSubLevel,
        consecutiveCorrect: consecutiveCorrectCurrent,
        consecutiveWrong: consecutiveWrongCurrent,
        performanceInsight: {
          currentDifficulty: exercise.difficulty,
          successRates,
          progressionMessage,
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
