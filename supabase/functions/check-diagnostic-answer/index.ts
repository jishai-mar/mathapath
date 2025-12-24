import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateTutorFeedback(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  subtopicName: string
): Promise<{ what_went_well: string; where_it_breaks: string; what_to_focus_on_next: string }> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not configured");
    return {
      what_went_well: "You attempted the problem.",
      where_it_breaks: "Your answer wasn't quite right. Let's review the approach.",
      what_to_focus_on_next: "Try working through the problem step by step."
    };
  }

  const systemPrompt = `You are a supportive, patient math tutor helping a student understand where they went wrong.
Your role is to guide, NOT to solve. Never reveal the correct answer directly.

Respond in JSON with exactly these three fields:
- "what_went_well": Acknowledge any correct thinking or approach (1 sentence, encouraging)
- "where_it_breaks": Identify the likely error without revealing the answer. Ask a guiding question or point to the step that needs review (2-3 sentences max)
- "what_to_focus_on_next": Give a hint or concept to remember for similar problems (1-2 sentences)

Keep your tone warm and encouraging - this is a diagnostic test, not an exam.`;

  const userPrompt = `Topic: ${subtopicName}
Question: ${question}
Student's answer: ${userAnswer}
(The correct answer is "${correctAnswer}" but DO NOT reveal this to the student)

Analyze what likely went wrong and provide guiding feedback.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_completion_tokens: 512,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        what_went_well: parsed.what_went_well || "You made a good attempt.",
        where_it_breaks: parsed.where_it_breaks || "Let's review your approach.",
        what_to_focus_on_next: parsed.what_to_focus_on_next || "Try the problem again step by step."
      };
    }
    throw new Error("Could not parse AI response");
  } catch (error) {
    console.error("AI feedback error:", error);
    return {
      what_went_well: "You attempted the problem.",
      where_it_breaks: "Your answer wasn't quite right. Let's review the approach.",
      what_to_focus_on_next: "Try working through the problem step by step."
    };
  }
}

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

    // Fetch the question with correct answer and subtopic info
    const { data: question, error: questionError } = await supabase
      .from("diagnostic_questions")
      .select("id, correct_answer, diagnostic_test_id, question, subtopic_id")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      console.error("Question fetch error:", questionError);
      return new Response(
        JSON.stringify({ error: "Question not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get subtopic name for context
    const { data: subtopic } = await supabase
      .from("subtopics")
      .select("name")
      .eq("id", question.subtopic_id)
      .single();

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

    // Generate AI feedback if incorrect
    let feedback = null;
    if (!isCorrect && userAnswer) {
      feedback = await generateTutorFeedback(
        question.question,
        userAnswer,
        question.correct_answer,
        subtopic?.name || "Mathematics"
      );
    }

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
        feedback,
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
