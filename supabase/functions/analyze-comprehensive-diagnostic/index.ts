import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiagnosticResponse {
  question_id: string;
  topic_id: string;
  topic_name: string;
  subtopic_id: string;
  subtopic_name: string;
  is_correct: boolean;
  user_answer: string;
  correct_answer: string;
  question: string;
}

interface TopicAnalysis {
  topic_id: string;
  topic_name: string;
  level: number;
  questions_answered: number;
  questions_correct: number;
  subtopics: SubtopicAnalysis[];
}

interface SubtopicAnalysis {
  subtopic_id: string;
  subtopic_name: string;
  level: number;
  is_correct: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { diagnosticTestId, userId } = await req.json();

    if (!diagnosticTestId || !userId) {
      return new Response(
        JSON.stringify({ error: "diagnosticTestId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all questions for this diagnostic test
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

    // Get responses
    const { data: responses, error: responsesError } = await supabase
      .from("diagnostic_responses")
      .select("*")
      .eq("user_id", userId)
      .in("diagnostic_question_id", questions.map(q => q.id));

    if (responsesError) {
      console.error("Responses fetch error:", responsesError);
    }

    // Get subtopic info with topics
    const subtopicIds = [...new Set(questions.map(q => q.subtopic_id))];
    const { data: subtopics } = await supabase
      .from("subtopics")
      .select("id, name, topic_id")
      .in("id", subtopicIds);

    const subtopicMap = new Map(subtopics?.map(s => [s.id, s]) || []);

    // Get topics
    const topicIds = [...new Set(subtopics?.map(s => s.topic_id) || [])];
    const { data: topics } = await supabase
      .from("topics")
      .select("id, name")
      .in("id", topicIds);

    const topicMap = new Map(topics?.map(t => [t.id, t]) || []);

    // Build response data for analysis
    const responseData: DiagnosticResponse[] = questions.map(q => {
      const response = responses?.find(r => r.diagnostic_question_id === q.id);
      const subtopic = subtopicMap.get(q.subtopic_id);
      const topic = subtopic ? topicMap.get(subtopic.topic_id) : null;
      
      return {
        question_id: q.id,
        topic_id: subtopic?.topic_id || "",
        topic_name: topic?.name || "Unknown",
        subtopic_id: q.subtopic_id,
        subtopic_name: subtopic?.name || "Unknown",
        is_correct: response?.is_correct || false,
        user_answer: response?.user_answer || "[no answer]",
        correct_answer: q.correct_answer,
        question: q.question,
      };
    });

    // Aggregate by topic
    const topicResults: Map<string, TopicAnalysis> = new Map();
    
    for (const resp of responseData) {
      if (!topicResults.has(resp.topic_id)) {
        topicResults.set(resp.topic_id, {
          topic_id: resp.topic_id,
          topic_name: resp.topic_name,
          level: 0,
          questions_answered: 0,
          questions_correct: 0,
          subtopics: [],
        });
      }
      
      const topicAnalysis = topicResults.get(resp.topic_id)!;
      topicAnalysis.questions_answered++;
      if (resp.is_correct) {
        topicAnalysis.questions_correct++;
      }
      topicAnalysis.subtopics.push({
        subtopic_id: resp.subtopic_id,
        subtopic_name: resp.subtopic_name,
        level: resp.is_correct ? 100 : 0,
        is_correct: resp.is_correct,
      });
    }

    // Calculate levels per topic
    for (const analysis of topicResults.values()) {
      if (analysis.questions_answered > 0) {
        analysis.level = Math.round(
          (analysis.questions_correct / analysis.questions_answered) * 100
        );
      }
    }

    // Calculate overall level
    const topicArray = Array.from(topicResults.values());
    const overallLevel = topicArray.length > 0
      ? Math.round(topicArray.reduce((sum, t) => sum + t.level, 0) / topicArray.length)
      : 0;

    // Use AI to generate personalized insights
    const systemPrompt = `You are a patient, experienced math tutor analyzing a comprehensive diagnostic assessment.
You just met a new student and gave them an initial assessment to understand how they think about math.

YOUR GOAL is not to grade them, but to UNDERSTAND them:
- What concepts have they mastered?
- Where are the gaps in understanding?
- Are there patterns in how they approach problems?
- What misconceptions might they have?
- Where should we start learning together?

Be warm, supportive, and encouraging. This student is about to embark on a learning journey with you.
Focus on building confidence while being honest about areas for growth.
Frame weaknesses as "opportunities" or "areas we'll work on together", not failures.`;

    const userPrompt = `Analyze this comprehensive diagnostic assessment and create a personalized learning profile:

OVERALL STATISTICS:
- Topics covered: ${topicArray.length}
- Overall performance: ${overallLevel}%

TOPIC-BY-TOPIC RESULTS:
${topicArray
  .sort((a, b) => b.level - a.level)
  .map(t => 
    `${t.topic_name}: ${t.level}% (${t.questions_correct}/${t.questions_answered} correct)
   Subtopics: ${t.subtopics.map(s => `${s.subtopic_name}: ${s.is_correct ? "✓" : "✗"}`).join(", ")}`
  ).join("\n\n")}

SAMPLE OF DETAILED RESPONSES (showing how the student thinks):
${responseData.slice(0, 15).map(r => `[${r.topic_name} / ${r.subtopic_name}]
Q: ${r.question}
Correct Answer: ${r.correct_answer}
Student's Answer: ${r.user_answer}
Result: ${r.is_correct ? "✓ Correct" : "✗ Incorrect"}`).join("\n\n")}

Create a comprehensive, personalized learning profile. Write as if you're summarizing your observations to plan this student's learning journey.

Return JSON with this structure:
{
  "overall_assessment": "A warm, personalized 2-3 sentence summary addressed to the student. Start with something positive, acknowledge their current level honestly but encouragingly, and express enthusiasm about working together.",
  "overall_level": ${overallLevel},
  "topic_levels": {
    "${topicArray[0]?.topic_id || 'topic_id'}": {
      "topic_name": "Topic Name",
      "level": 0-100,
      "status": "strong" | "developing" | "needs_attention"
    }
  },
  "strengths": [
    {"topic_id": "id", "topic_name": "name", "reason": "Specific observation about what they did well"}
  ],
  "weaknesses": [
    {"topic_id": "id", "topic_name": "name", "reason": "What specifically we'll work on together"}
  ],
  "misconception_patterns": [
    {"pattern": "Specific thinking pattern observed (e.g., 'Tends to forget to distribute the negative sign')", "how_to_address": "How we'll address this in learning"}
  ],
  "recommended_starting_topic_id": "The most strategic topic to start with",
  "recommended_starting_topic_name": "Name of that topic",
  "learning_path_suggestion": "A brief, encouraging description of the suggested learning journey (2-3 sentences)",
  "learning_style_notes": "Any observations about how this student approaches problems (e.g., 'Shows careful work on algebra but may rush through basic arithmetic')"
}

IMPORTANT:
- Use the actual topic_ids provided above
- Be specific in your observations, not generic
- The overall_assessment should feel personal and encouraging
- Weaknesses should be framed constructively
- Return ONLY valid JSON, no markdown`;

    console.log("Calling Lovable AI to analyze comprehensive diagnostic results...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
    }

    let analysis;
    try {
      const aiData = await aiResponse.json();
      const aiContent = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Parse error, using fallback analysis");
      
      // Fallback analysis
      const strongTopics = topicArray.filter(t => t.level >= 70);
      const weakTopics = topicArray.filter(t => t.level < 50);
      const weakestTopic = topicArray.sort((a, b) => a.level - b.level)[0];
      
      analysis = {
        overall_assessment: `Based on your responses across ${topicArray.length} topics, we've built a clear picture of your current level and where to focus.`,
        overall_level: overallLevel,
        topic_levels: Object.fromEntries(
          topicArray.map(t => [t.topic_id, {
            topic_name: t.topic_name,
            level: t.level,
            status: t.level >= 70 ? "strong" : t.level >= 40 ? "developing" : "needs_attention",
          }])
        ),
        strengths: strongTopics.map(t => ({
          topic_id: t.topic_id,
          topic_name: t.topic_name,
          reason: "You showed good understanding in this area",
        })),
        weaknesses: weakTopics.map(t => ({
          topic_id: t.topic_id,
          topic_name: t.topic_name,
          reason: "This area could use more practice",
        })),
        misconception_patterns: [],
        recommended_starting_topic_id: weakestTopic?.topic_id,
        recommended_starting_topic_name: weakestTopic?.topic_name,
        learning_path_suggestion: "Start with foundational topics before moving to more advanced ones.",
        learning_style_notes: "We'll adapt exercises to your level as you practice.",
      };
    }

    // Create learning profiles for each topic
    for (const topicAnalysis of topicResults.values()) {
      const subtopicLevels: Record<string, number> = {};
      for (const sub of topicAnalysis.subtopics) {
        subtopicLevels[sub.subtopic_id] = sub.level;
      }

      const { data: existingProfile } = await supabase
        .from("learning_profiles")
        .select("id")
        .eq("user_id", userId)
        .eq("topic_id", topicAnalysis.topic_id)
        .single();

      const topicStrengths = topicAnalysis.subtopics
        .filter(s => s.is_correct)
        .map(s => ({
          subtopic_id: s.subtopic_id,
          subtopic_name: s.subtopic_name,
          reason: "Answered correctly in diagnostic",
        }));

      const topicWeaknesses = topicAnalysis.subtopics
        .filter(s => !s.is_correct)
        .map(s => ({
          subtopic_id: s.subtopic_id,
          subtopic_name: s.subtopic_name,
          reason: "Needs practice",
        }));

      const profileData = {
        user_id: userId,
        topic_id: topicAnalysis.topic_id,
        overall_level: topicAnalysis.level,
        subtopic_levels: subtopicLevels,
        strengths: topicStrengths,
        weaknesses: topicWeaknesses,
        misconception_patterns: [],
        recommended_starting_subtopic: topicWeaknesses[0]?.subtopic_id || topicAnalysis.subtopics[0]?.subtopic_id,
        learning_style_notes: analysis.learning_style_notes || "",
      };

      if (existingProfile) {
        await supabase
          .from("learning_profiles")
          .update(profileData)
          .eq("id", existingProfile.id);
      } else {
        await supabase.from("learning_profiles").insert(profileData);
      }

      // Initialize subtopic progress
      for (const sub of topicAnalysis.subtopics) {
        const { data: existingProgress } = await supabase
          .from("user_subtopic_progress")
          .select("id")
          .eq("user_id", userId)
          .eq("subtopic_id", sub.subtopic_id)
          .single();

        if (!existingProgress) {
          await supabase.from("user_subtopic_progress").insert({
            user_id: userId,
            subtopic_id: sub.subtopic_id,
            mastery_percentage: sub.level,
            exercises_completed: 1,
            exercises_correct: sub.is_correct ? 1 : 0,
          });
        }
      }

      // Initialize topic progress
      const { data: existingTopicProgress } = await supabase
        .from("user_topic_progress")
        .select("id")
        .eq("user_id", userId)
        .eq("topic_id", topicAnalysis.topic_id)
        .single();

      if (!existingTopicProgress) {
        await supabase.from("user_topic_progress").insert({
          user_id: userId,
          topic_id: topicAnalysis.topic_id,
          mastery_percentage: topicAnalysis.level,
          exercises_completed: topicAnalysis.questions_answered,
          exercises_correct: topicAnalysis.questions_correct,
        });
      }
    }

    // Mark diagnostic test as completed
    await supabase
      .from("diagnostic_tests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", diagnosticTestId);

    // Mark comprehensive diagnostic as completed in profile
    await supabase
      .from("profiles")
      .update({
        comprehensive_diagnostic_completed: true,
        comprehensive_diagnostic_completed_at: new Date().toISOString(),
      })
      .eq("id", userId);

    console.log("Comprehensive diagnostic analysis complete");

    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          overall_assessment: analysis.overall_assessment,
          overall_level: analysis.overall_level || overallLevel,
          topic_levels: analysis.topic_levels,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          misconception_patterns: analysis.misconception_patterns,
          recommended_starting_topic_id: analysis.recommended_starting_topic_id,
          recommended_starting_topic_name: analysis.recommended_starting_topic_name,
          learning_path_suggestion: analysis.learning_path_suggestion,
          learning_style_notes: analysis.learning_style_notes,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Comprehensive diagnostic analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
