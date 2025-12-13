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
      .select("id, correct_answer, explanation, subtopic_id")
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

    console.log(`Answer checked for exercise ${exerciseId}: ${isCorrect ? 'correct' : 'incorrect'}`);

    // Only return the correct answer and explanation AFTER submission
    return new Response(
      JSON.stringify({ 
        isCorrect,
        // Only reveal answer after attempt is recorded
        correctAnswer: exercise.correct_answer,
        explanation: exercise.explanation,
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
