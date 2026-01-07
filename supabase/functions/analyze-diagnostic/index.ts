import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiagnosticResponse {
  question_id: string;
  subtopic_id: string;
  subtopic_name: string;
  is_correct: boolean;
  user_answer: string;
  correct_answer: string;
  question: string;
  misconception_tag?: string;
}

interface SubtopicAnalysis {
  subtopic_id: string;
  subtopic_name: string;
  level: number;
  questions_answered: number;
  questions_correct: number;
  misconceptions: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { diagnosticTestId, userId, topicId } = await req.json();

    if (!diagnosticTestId || !userId || !topicId) {
      return new Response(
        JSON.stringify({ error: "diagnosticTestId, userId, and topicId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all responses for this diagnostic test
    const { data: questions, error: questionsError } = await supabase
      .from("diagnostic_questions")
      .select("id, subtopic_id, question, correct_answer")
      .eq("diagnostic_test_id", diagnosticTestId);

    if (questionsError || !questions) {
      console.error("Questions fetch error:", questionsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: responses, error: responsesError } = await supabase
      .from("diagnostic_responses")
      .select("*")
      .eq("user_id", userId)
      .in("diagnostic_question_id", questions.map(q => q.id));

    if (responsesError) {
      console.error("Responses fetch error:", responsesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch responses" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get subtopic names
    const subtopicIds = [...new Set(questions.map(q => q.subtopic_id))];
    const { data: subtopics } = await supabase
      .from("subtopics")
      .select("id, name, order_index")
      .in("id", subtopicIds);

    const subtopicMap = new Map(subtopics?.map(s => [s.id, s]) || []);

    // Build response data for AI analysis
    const responseData: DiagnosticResponse[] = questions.map(q => {
      const response = responses?.find(r => r.diagnostic_question_id === q.id);
      const subtopic = subtopicMap.get(q.subtopic_id);
      return {
        question_id: q.id,
        subtopic_id: q.subtopic_id,
        subtopic_name: subtopic?.name || "Unknown",
        is_correct: response?.is_correct || false,
        user_answer: response?.user_answer || "[no answer]",
        correct_answer: q.correct_answer,
        question: q.question,
        misconception_tag: response?.misconception_tag,
      };
    });

    // Group by subtopic for analysis
    const subtopicResults: Map<string, SubtopicAnalysis> = new Map();
    
    for (const resp of responseData) {
      if (!subtopicResults.has(resp.subtopic_id)) {
        subtopicResults.set(resp.subtopic_id, {
          subtopic_id: resp.subtopic_id,
          subtopic_name: resp.subtopic_name,
          level: 0,
          questions_answered: 0,
          questions_correct: 0,
          misconceptions: [],
        });
      }
      
      const analysis = subtopicResults.get(resp.subtopic_id)!;
      analysis.questions_answered++;
      if (resp.is_correct) {
        analysis.questions_correct++;
      }
      if (resp.misconception_tag) {
        analysis.misconceptions.push(resp.misconception_tag);
      }
    }

    // Calculate levels per subtopic (simple percentage)
    for (const analysis of subtopicResults.values()) {
      if (analysis.questions_answered > 0) {
        analysis.level = Math.round(
          (analysis.questions_correct / analysis.questions_answered) * 100
        );
      }
    }

    // Get topic name
    const { data: topic } = await supabase
      .from("topics")
      .select("name")
      .eq("id", topicId)
      .single();

    // Use AI to generate personalized insights
    const systemPrompt = `You are a supportive math tutor analyzing a diagnostic assessment.
Your goal is to create a personalized learning profile that helps the student understand:
1. What they already know well (strengths)
2. What they need to work on (weaknesses)
3. Common patterns in their thinking that might need adjustment
4. A recommended learning path

Be encouraging and supportive - this is about understanding and growth, not judgment.
Focus on actionable insights that will help the student improve.`;

    const userPrompt = `Analyze this diagnostic assessment for "${topic?.name || "Math"}":

SUBTOPIC RESULTS:
${Array.from(subtopicResults.values())
  .map(s => `- ${s.subtopic_name}: ${s.level}% (${s.questions_correct}/${s.questions_answered} correct)${s.misconceptions.length > 0 ? `, patterns: ${s.misconceptions.join(", ")}` : ""}`)
  .join("\n")}

DETAILED RESPONSES:
${responseData.map(r => `Q: ${r.question}
Correct: ${r.correct_answer}
Student answered: ${r.user_answer}
Result: ${r.is_correct ? "✓ Correct" : "✗ Incorrect"}`).join("\n\n")}

Create a personalized learning profile with this JSON structure:
{
  "overall_assessment": "Brief, encouraging summary of where the student is",
  "overall_level": 0-100,
  "strengths": [
    {"subtopic_id": "id", "subtopic_name": "name", "reason": "Why this is a strength"}
  ],
  "weaknesses": [
    {"subtopic_id": "id", "subtopic_name": "name", "reason": "What specifically needs work"}
  ],
  "misconception_patterns": [
    {"pattern": "Description of thinking pattern", "how_to_address": "Suggested approach"}
  ],
  "recommended_starting_subtopic_id": "The best subtopic to start learning with (usually a weakness that's foundational)",
  "learning_style_notes": "Observations about how this student approaches problems and how to tailor teaching"
}

Return ONLY valid JSON.`;

    console.log("Calling Lovable AI to analyze diagnostic results...");

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini-2025-04-14",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze results" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse AI analysis
    let analysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", aiContent);
      // Fallback to basic analysis
      const subtopicArray = Array.from(subtopicResults.values());
      const overallLevel = subtopicArray.length > 0
        ? Math.round(subtopicArray.reduce((sum, s) => sum + s.level, 0) / subtopicArray.length)
        : 0;
      
      analysis = {
        overall_assessment: "Based on your responses, we have a better understanding of where you are in your learning journey.",
        overall_level: overallLevel,
        strengths: subtopicArray.filter(s => s.level >= 70).map(s => ({
          subtopic_id: s.subtopic_id,
          subtopic_name: s.subtopic_name,
          reason: "You showed good understanding in this area",
        })),
        weaknesses: subtopicArray.filter(s => s.level < 50).map(s => ({
          subtopic_id: s.subtopic_id,
          subtopic_name: s.subtopic_name,
          reason: "This area could use more practice",
        })),
        misconception_patterns: [],
        recommended_starting_subtopic_id: subtopicArray.find(s => s.level < 50)?.subtopic_id || subtopicArray[0]?.subtopic_id,
        learning_style_notes: "We'll adapt exercises to your level as you practice.",
      };
    }

    // Build subtopic_levels JSON
    const subtopicLevels: Record<string, number> = {};
    for (const [id, data] of subtopicResults) {
      subtopicLevels[id] = data.level;
    }

    // Save learning profile
    const { data: existingProfile } = await supabase
      .from("learning_profiles")
      .select("id")
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      .single();

    const profileData = {
      user_id: userId,
      topic_id: topicId,
      overall_level: analysis.overall_level,
      subtopic_levels: subtopicLevels,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      misconception_patterns: analysis.misconception_patterns,
      recommended_starting_subtopic: analysis.recommended_starting_subtopic_id,
      learning_style_notes: analysis.learning_style_notes,
    };

    if (existingProfile) {
      await supabase
        .from("learning_profiles")
        .update(profileData)
        .eq("id", existingProfile.id);
    } else {
      await supabase.from("learning_profiles").insert(profileData);
    }

    // Mark diagnostic test as completed
    await supabase
      .from("diagnostic_tests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", diagnosticTestId);

    // Initialize subtopic progress based on diagnostic results
    for (const [subtopicId, data] of subtopicResults) {
      const { data: existingProgress } = await supabase
        .from("user_subtopic_progress")
        .select("id")
        .eq("user_id", userId)
        .eq("subtopic_id", subtopicId)
        .single();

      if (!existingProgress) {
        await supabase.from("user_subtopic_progress").insert({
          user_id: userId,
          subtopic_id: subtopicId,
          mastery_percentage: data.level,
          exercises_completed: data.questions_answered,
          exercises_correct: data.questions_correct,
        });
      }
    }

    console.log("Diagnostic analysis complete, learning profile saved");

    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          ...profileData,
          overall_assessment: analysis.overall_assessment,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Diagnostic analysis error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
