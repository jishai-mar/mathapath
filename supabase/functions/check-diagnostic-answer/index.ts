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
    const { questionId, userAnswer, userId } = await req.json();

    if (!questionId || !userId) {
      return new Response(
        JSON.stringify({ error: "questionId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the question with correct answer (only accessible via service role)
    const { data: question, error: questionError } = await supabase
      .from("diagnostic_questions")
      .select("id, correct_answer, diagnostic_test_id")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      console.error("Question fetch error:", questionError);
      return new Response(
        JSON.stringify({ error: "Question not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify this question belongs to a test owned by the user
    const { data: test, error: testError } = await supabase
      .from("diagnostic_tests")
      .select("id, user_id, status")
      .eq("id", question.diagnostic_test_id)
      .eq("user_id", userId)
      .single();

    if (testError || !test) {
      console.error("Test verification error:", testError);
      return new Response(
        JSON.stringify({ error: "Unauthorized access to this question" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize answers for comparison
    const normalize = (s: string) => 
      s.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/,/g, '')
        .trim();

    const isCorrect = userAnswer 
      ? normalize(userAnswer) === normalize(question.correct_answer)
      : false;

    // Save the response
    const { error: insertError } = await supabase
      .from("diagnostic_responses")
      .insert({
        diagnostic_question_id: questionId,
        user_id: userId,
        user_answer: userAnswer || null,
        is_correct: isCorrect,
      });

    if (insertError) {
      console.error("Insert response error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Answer checked for question ${questionId}: ${isCorrect ? 'correct' : 'incorrect'}`);

    return new Response(
      JSON.stringify({ 
        isCorrect,
        // Never return the correct answer to the client
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
