import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Topic {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}

interface Subtopic {
  id: string;
  name: string;
  topic_id: string;
  order_index: number;
}

interface DiagnosticQuestion {
  subtopic_id: string;
  topic_id: string;
  question: string;
  correct_answer: string;
  difficulty: "easy" | "medium" | "hard";
  hints: string[];
  order_index: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has any diagnostic test (comprehensive uses first topic as placeholder)
    // First get topics to know the first topic id
    const { data: allTopics, error: allTopicsError } = await supabase
      .from("topics")
      .select("id, name, description, order_index")
      .order("order_index");

    if (allTopicsError || !allTopics || allTopics.length === 0) {
      console.error("Topics error:", allTopicsError);
      return new Response(
        JSON.stringify({ error: "No topics found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstTopicId = allTopics[0].id;

    // Check for existing comprehensive diagnostic test (uses first topic as placeholder)
    const { data: existingTest } = await supabase
      .from("diagnostic_tests")
      .select("*, diagnostic_questions(*)")
      .eq("user_id", userId)
      .eq("topic_id", firstTopicId)
      .single();

    if (existingTest) {
      if (existingTest.status === "completed") {
        return new Response(
          JSON.stringify({ 
            alreadyCompleted: true,
            test: existingTest,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Return existing in-progress test with questions
      if (existingTest.diagnostic_questions && existingTest.diagnostic_questions.length > 0) {
        const { data: questions } = await supabase
          .from("diagnostic_questions")
          .select("*")
          .eq("diagnostic_test_id", existingTest.id)
          .order("order_index");

        return new Response(
          JSON.stringify({
            test: existingTest,
            questions: questions || [],
            topics: allTopics,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Use already fetched topics
    const topics = allTopics;

    // Get all subtopics
    const { data: subtopics, error: subtopicsError } = await supabase
      .from("subtopics")
      .select("id, name, topic_id, order_index")
      .order("order_index");

    if (subtopicsError || !subtopics || subtopics.length === 0) {
      console.error("Subtopics error:", subtopicsError);
      return new Response(
        JSON.stringify({ error: "No subtopics found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group subtopics by topic
    const topicSubtopics = new Map<string, Subtopic[]>();
    for (const subtopic of subtopics) {
      if (!topicSubtopics.has(subtopic.topic_id)) {
        topicSubtopics.set(subtopic.topic_id, []);
      }
      topicSubtopics.get(subtopic.topic_id)!.push(subtopic);
    }

    console.log(`Generating comprehensive diagnostic covering ${topics.length} topics, ${subtopics.length} subtopics`);

    // Create or reuse diagnostic test record
    let diagnosticTest;
    if (existingTest) {
      diagnosticTest = existingTest;
    } else {
      // Use upsert to handle race conditions - use first topic as placeholder
      const { data: newTest, error: createError } = await supabase
        .from("diagnostic_tests")
        .upsert({
          user_id: userId,
          topic_id: firstTopicId,
          status: "not_started",
          total_questions: subtopics.length,
        }, {
          onConflict: "user_id,topic_id",
        })
        .select()
        .single();

      if (createError) {
        console.error("Create test error:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create diagnostic test" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      diagnosticTest = newTest;
    }

    // Build curriculum structure for AI
    const curriculumStructure = topics.map((topic: Topic) => {
      const subs = topicSubtopics.get(topic.id) || [];
      return {
        topic_id: topic.id,
        topic_name: topic.name,
        topic_description: topic.description,
        subtopics: subs.map(s => ({
          subtopic_id: s.id,
          subtopic_name: s.name,
        })),
      };
    });

    // Generate questions using AI - one per subtopic for efficient sampling
    const systemPrompt = `You are a mathematics educator creating a comprehensive diagnostic assessment in the style of a high-quality printed textbook.

This assessment samples ONE question per subtopic across the entire curriculum to understand a student's overall level and identify gaps.

CRITICAL FORMATTING RULES:
- Write questions exactly as they would appear in a printed mathematics textbook
- Use formal, neutral language with imperative statements: "Solve for x:", "Find:", "Simplify:", "Determine:", "Calculate:", "Evaluate:"
- NO motivational phrases, commentary, or casual language (never "Let's", "Try this", "Can you", etc.)
- NO styling cues, colors, or emphasis markers in the text
- Questions must be direct and professional

=== MATHEMATICAL NOTATION RULES (CRITICAL) ===
- Use PROPER LaTeX syntax for all math expressions
- Wrap ALL math in $ delimiters

EXPONENTS (no ambiguity):
✓ $5^{x+2}$, $3^{2x-1}$
✗ $5^x+2$, $5^x+^2$, 5ˣ⁺²

FRACTIONS:
✓ $\\frac{1}{25}$

LOGARITHMS:
✓ $\\log_{2}(x)$

SQUARE ROOTS:
✓ $\\sqrt{x+5}$

EXAMPLES OF CORRECT FORMAT:
- "Solve for x: $\\sqrt{x} = 5$"
- "Find all real solutions: $x^2 - 9 = 0$"
- "Simplify: $(3x + 2)(x - 4)$"

HINTS:
- Write as clear, instructional guidance
- Use proper LaTeX as well
- No casual or enthusiastic language

DIFFICULTY BALANCE:
- For each subtopic, generate a question that tests core understanding
- Mix difficulties across the assessment (roughly 40% easy, 40% medium, 20% hard)`;

    const userPrompt = `Create a comprehensive diagnostic assessment covering the entire math curriculum.

Generate EXACTLY ONE question for each subtopic listed below. Questions should sample key concepts efficiently.

CURRICULUM STRUCTURE:
${curriculumStructure.map(t => 
  `TOPIC: ${t.topic_name}
${t.subtopics.map(s => `  - ${s.subtopic_name} (subtopic_id: ${s.subtopic_id})`).join("\n")}`
).join("\n\n")}

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "topic_id": "uuid-of-topic",
      "topic_name": "Topic Name",
      "subtopic_id": "uuid-of-subtopic",
      "subtopic_name": "Subtopic Name",
      "question": "Solve for x: $2x + 5 = 13$",
      "correct_answer": "4",
      "difficulty": "easy",
      "hints": ["Subtract 5 from both sides.", "Divide both sides by the coefficient of x."]
    }
  ]
}

STRICT REQUIREMENTS:
- Generate exactly ONE question per subtopic (${subtopics.length} total questions)
- Each question must read exactly like a printed textbook question
- Use PROPER LaTeX with $ delimiters for math
- Use BRACES for multi-character exponents: $5^{x+2}$ NOT $5^x+2$ or $5^x+^2$
- NO motivational or conversational phrases
- Answers in simplified form
- Return ONLY valid JSON, no markdown code blocks`;

    console.log("Calling OpenAI to generate comprehensive diagnostic questions...");

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 4096,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    console.log("AI response received, parsing...");

    // Parse AI response
    let parsedQuestions;
    try {
      let cleanContent = aiContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      let jsonStr = jsonMatch[0];
      jsonStr = jsonStr
        .replace(/\\+\(/g, "(")
        .replace(/\\+\)/g, ")")
        .replace(/\\\\/g, "\\");
      
      parsedQuestions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", aiContent.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare questions for insertion - add topic_id to metadata
    const questionsToInsert = parsedQuestions.questions.map(
      (q: any, index: number) => ({
        diagnostic_test_id: diagnosticTest.id,
        subtopic_id: q.subtopic_id,
        question: q.question,
        correct_answer: q.correct_answer,
        difficulty: q.difficulty || "medium",
        hints: q.hints || [],
        order_index: index,
      })
    );

    // Insert questions
    const { data: insertedQuestions, error: insertError } = await supabase
      .from("diagnostic_questions")
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error("Insert questions error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update test total_questions count
    await supabase
      .from("diagnostic_tests")
      .update({ total_questions: insertedQuestions.length })
      .eq("id", diagnosticTest.id);

    console.log(`Successfully created ${insertedQuestions.length} comprehensive diagnostic questions`);

    // Strip correct_answer from response - answers should only be checked server-side
    const safeQuestions = insertedQuestions.map((q: any) => ({
      id: q.id,
      diagnostic_test_id: q.diagnostic_test_id,
      subtopic_id: q.subtopic_id,
      question: q.question,
      difficulty: q.difficulty,
      hints: q.hints,
      order_index: q.order_index,
      created_at: q.created_at,
    }));

    return new Response(
      JSON.stringify({
        test: { ...diagnosticTest, total_questions: insertedQuestions.length },
        questions: safeQuestions,
        topics: topics,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Comprehensive diagnostic generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
