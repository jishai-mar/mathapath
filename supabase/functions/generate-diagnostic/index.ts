import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Subtopic {
  id: string;
  name: string;
  order_index: number;
}

interface DiagnosticQuestion {
  subtopic_id: string;
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
    const { topicId, userId } = await req.json();

    if (!topicId || !userId) {
      return new Response(
        JSON.stringify({ error: "topicId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get topic info
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("id, name, description")
      .eq("id", topicId)
      .single();

    if (topicError || !topic) {
      console.error("Topic error:", topicError);
      return new Response(
        JSON.stringify({ error: "Topic not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all subtopics for this topic
    const { data: subtopics, error: subtopicsError } = await supabase
      .from("subtopics")
      .select("id, name, order_index")
      .eq("topic_id", topicId)
      .order("order_index");

    if (subtopicsError || !subtopics || subtopics.length === 0) {
      console.error("Subtopics error:", subtopicsError);
      return new Response(
        JSON.stringify({ error: "No subtopics found for this topic" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating diagnostic test for topic: ${topic.name} with ${subtopics.length} subtopics`);

    // Create or get existing diagnostic test
    let diagnosticTest;
    const { data: existingTest } = await supabase
      .from("diagnostic_tests")
      .select("*")
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      .single();

    if (existingTest) {
      // If test exists and is completed, return it
      if (existingTest.status === "completed") {
        const { data: existingQuestions } = await supabase
          .from("diagnostic_questions")
          .select("*")
          .eq("diagnostic_test_id", existingTest.id)
          .order("order_index");

        return new Response(
          JSON.stringify({
            test: existingTest,
            questions: existingQuestions || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // If in progress, check if questions exist
      const { data: existingQuestions } = await supabase
        .from("diagnostic_questions")
        .select("*")
        .eq("diagnostic_test_id", existingTest.id)
        .order("order_index");

      if (existingQuestions && existingQuestions.length > 0) {
        return new Response(
          JSON.stringify({
            test: existingTest,
            questions: existingQuestions,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      diagnosticTest = existingTest;
    } else {
      // Create new diagnostic test
      const { data: newTest, error: createError } = await supabase
        .from("diagnostic_tests")
        .insert({
          user_id: userId,
          topic_id: topicId,
          status: "not_started",
          total_questions: subtopics.length * 2, // 2 questions per subtopic
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

    // Generate questions using AI
    const systemPrompt = `You are a mathematics educator creating a diagnostic assessment in the style of a high-quality printed textbook.

QUESTION FORMATTING - STRICT TEXTBOOK STYLE:
- Write questions EXACTLY as they would appear in a professional printed mathematics textbook
- Use ONLY formal, neutral command language:
  • "Solve for x:"
  • "Find all real solutions:"
  • "Simplify:"
  • "Determine the value of:"
  • "Calculate:"
  • "Factor completely:"
  • "Evaluate:"
- ABSOLUTELY NO motivational phrases: never use "Let's", "Try", "Can you", "Here's", "Now", "Great", etc.
- ABSOLUTELY NO commentary or context: just state the mathematical task directly
- ABSOLUTELY NO styling cues, colors, emphasis markers, or UI hints
- Questions must be concise, direct, and unambiguous

=== MATHEMATICAL NOTATION RULES (CRITICAL) ===

You MUST use PROPER LaTeX syntax with these rules:

EXPONENTS - ALWAYS use braces for multi-character exponents:
✓ CORRECT: $5^{x+2}$, $3^{2x-1}$, $2^{x+1}$
✗ WRONG: $5^x+2$, $5^x+^2$, 5ˣ⁺², $5^x+^2$

FRACTIONS:
✓ CORRECT: $\\frac{1}{25}$, $\\frac{3}{4}$
✓ ALSO OK: Simple inline like 1/25
✗ WRONG: mixing notations inconsistently

LOGARITHMS:
✓ CORRECT: $\\log_{2}(x)$, $\\log_{10}(x)$
✗ WRONG: log_2(x), log₂x

SQUARE ROOTS:
✓ CORRECT: $\\sqrt{x+5}$, $\\sqrt{2x-1}$
✗ WRONG: √(x+5), sqrt(x+5)

WRAP ALL MATH in $ delimiters:
✓ CORRECT: "Solve for x: $5^{x+2} = \\frac{1}{25}$"
✗ WRONG: "Solve for x: 5^x+2 = 1/25"

FORBIDDEN PATTERNS (never include these):
- "Let's solve...", "Try to...", "Can you find..."
- "Here is a problem...", "Consider the following..."
- Any emoji or decorative characters
- Malformed exponents like $5^x+^2$ or $5^x+2$ (should be $5^{x+2}$)
- Unicode superscripts like ˣ⁺² (use proper LaTeX)

CORRECT EXAMPLES:
✓ "Solve for x: $3x^2 - 12 = 0$"
✓ "Solve for x: $5^{x+2} = \\frac{1}{25}$"
✓ "Find all real solutions: $\\sqrt{x + 5} = 3$"
✓ "Simplify: $\\frac{2x^3 + 6x^2}{2x}$"
✓ "Evaluate: $\\log_{2}(32)$"

INCORRECT EXAMPLES (never do this):
✗ "Let's solve this equation: $3x^2 - 12 = 0$"
✗ "Try to find x in: $\\sqrt{x+5} = 3$"
✗ "Solve for x: $5^x+^2 = 1/25$" (malformed exponent!)
✗ "Solve for x: 5ˣ⁺² = 1/25" (Unicode won't render)

HINTS - GUIDING, NOT REVEALING:
- Hints should guide thinking, NOT give away the answer
- First hint: Identify what type of problem or what concept applies
- Second hint: Suggest a starting approach without showing steps
- Use proper LaTeX in hints as well`;

    const userPrompt = `Create a diagnostic assessment for the topic "${topic.name}" (${topic.description || ""}).

For each of these subtopics, generate exactly 2 questions (one easy, one medium difficulty):
${subtopics.map((s: Subtopic, i: number) => `${i + 1}. ${s.name} (ID: ${s.id})`).join("\n")}

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "subtopic_id": "uuid-here",
      "subtopic_name": "Name for reference",
      "question": "Solve for x: $2x + 5 = 13$",
      "correct_answer": "4",
      "difficulty": "easy",
      "hints": ["Subtract 5 from both sides.", "Divide both sides by the coefficient of x."]
    }
  ]
}

STRICT REQUIREMENTS:
- Each question must read exactly like a printed textbook question
- Use PROPER LaTeX syntax with $ delimiters
- Use BRACES for multi-character exponents: $5^{x+2}$ NOT $5^x+2$ or $5^x+^2$
- NO motivational or conversational phrases
- Answers in simplified form
- Return ONLY valid JSON, no markdown code blocks`;

    console.log("Calling Lovable AI to generate diagnostic questions...");

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
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      // Return fallback with empty questions instead of 500
      if (aiResponse.status === 429 || aiResponse.status === 402) {
        return new Response(
          JSON.stringify({
            test: diagnosticTest,
            questions: [],
            fallback: true,
            rate_limited: aiResponse.status === 429,
            credits_depleted: aiResponse.status === 402,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    console.log("AI response received, parsing...");

    // Parse AI response - handle LaTeX escaping issues
    let parsedQuestions;
    try {
      // Remove markdown code blocks if present
      let cleanContent = aiContent.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      
      // Extract the JSON object
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      
      let jsonStr = jsonMatch[0];
      
      // Fix common LaTeX escaping issues in JSON
      // The AI often uses \( and \) for inline math which breaks JSON
      // Replace problematic escape sequences
      jsonStr = jsonStr
        .replace(/\\+\(/g, "(")  // \( or \\( -> (
        .replace(/\\+\)/g, ")")  // \) or \\) -> )
        .replace(/\\\\/g, "\\"); // \\\\ -> \\ (normalize double escapes)
      
      parsedQuestions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", aiContent);
      
      // Fallback: try to extract and rebuild manually
      try {
        const questionsArray: any[] = [];
        const questionRegex = /"subtopic_id"\s*:\s*"([^"]+)"[\s\S]*?"question"\s*:\s*"([^"]*(?:\\.[^"]*)*)"[\s\S]*?"correct_answer"\s*:\s*"([^"]*(?:\\.[^"]*)*)"[\s\S]*?"difficulty"\s*:\s*"([^"]+)"/g;
        
        let match;
        while ((match = questionRegex.exec(aiContent)) !== null) {
          questionsArray.push({
            subtopic_id: match[1],
            question: match[2].replace(/\\\\/g, "\\"),
            correct_answer: match[3],
            difficulty: match[4],
            hints: []
          });
        }
        
        if (questionsArray.length > 0) {
          parsedQuestions = { questions: questionsArray };
          console.log("Used fallback parsing, extracted", questionsArray.length, "questions");
        } else {
          throw new Error("Fallback parsing failed");
        }
      } catch (fallbackError) {
        console.error("Fallback parse error:", fallbackError);
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Prepare questions for insertion
    const questionsToInsert: DiagnosticQuestion[] = parsedQuestions.questions.map(
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

    console.log(`Successfully created ${insertedQuestions.length} diagnostic questions`);

    return new Response(
      JSON.stringify({
        test: { ...diagnosticTest, total_questions: insertedQuestions.length },
        questions: insertedQuestions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Diagnostic generation error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
