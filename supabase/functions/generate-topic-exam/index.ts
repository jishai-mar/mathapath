import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseAndValidate, generateTopicExamSchema } from '../_shared/validation.ts';

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
    const validation = await parseAndValidate(req, generateTopicExamSchema, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }
    const { topicId, userId, questionCount = 10 } = validation.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Generating topic exam for topic: ${topicId}`);

    // Fetch topic details
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .single();

    if (topicError || !topic) {
      throw new Error("Topic not found");
    }

    // Fetch subtopics
    const { data: subtopics, error: subtopicsError } = await supabase
      .from("subtopics")
      .select("*")
      .eq("topic_id", topicId)
      .order("order_index");

    if (subtopicsError) throw subtopicsError;

    const subtopicNames = (subtopics || []).map((s: any) => s.name).join(", ");

    const systemPrompt = `You are an expert math exam creator. Generate exam-level questions that:
1. Match real exam format and difficulty
2. Use proper mathematical notation with LaTeX
3. Include multi-part questions when appropriate
4. Have clear solution steps
5. Cover a range of difficulty levels

Questions should test deep understanding, not just formula memorization.`;

    const userPrompt = `Create a ${questionCount}-question exam for the topic "${topic.name}".

Subtopics to cover: ${subtopicNames}

Requirements:
- Include 3 easy questions (20% of grade)
- Include 4 medium questions (40% of grade) 
- Include 3 hard questions (40% of grade)
- Each question should have clear parts if multi-part
- Include complete solution steps for each question
- Use proper LaTeX notation for all math expressions

Return JSON in this exact format:
{
  "examTitle": "Topic Exam: ${topic.name}",
  "totalPoints": 100,
  "timeLimit": 45,
  "questions": [
    {
      "id": "q1",
      "questionNumber": 1,
      "difficulty": "easy|medium|hard",
      "points": 10,
      "subtopicName": "Subtopic this tests",
      "context": "Any given information or context",
      "parts": [
        {
          "partLabel": "a",
          "question": "The question text with $LaTeX$",
          "points": 5,
          "solution": "Step-by-step solution",
          "answer": "Final answer"
        }
      ]
    }
  ]
}

Make this feel like a real exam that tests readiness for ${topic.name}.`;

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
    let examData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        examData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Generate fallback exam structure
      examData = {
        examTitle: `Topic Exam: ${topic.name}`,
        totalPoints: 100,
        timeLimit: 45,
        questions: [
          {
            id: "q1",
            questionNumber: 1,
            difficulty: "easy",
            points: 10,
            subtopicName: subtopics?.[0]?.name || topic.name,
            context: "",
            parts: [
              {
                partLabel: "a",
                question: `Solve a basic problem from ${topic.name}`,
                points: 10,
                solution: "Solution steps would go here",
                answer: "Answer would go here"
              }
            ]
          }
        ]
      };
    }

    // Add metadata
    examData.topicId = topicId;
    examData.topicName = topic.name;
    examData.generatedAt = new Date().toISOString();

    console.log(`Generated exam with ${examData.questions?.length || 0} questions`);

    return new Response(
      JSON.stringify(examData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating topic exam:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
