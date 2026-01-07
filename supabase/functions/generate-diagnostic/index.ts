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
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!

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

    // Generate questions using AI - Using Reichman Mechina Booklet Style
    const systemPrompt = `You are a mathematics educator creating a diagnostic assessment matching the Reichman Mechina Exercise Booklet.

QUESTION FORMATTING - EXACT BOOKLET STYLE:
- Questions must match EXACTLY how they appear in the Reichman Mechina booklet
- Use ONLY these instruction phrases (and nothing else):
  • "Solve for x:" (equations)
  • "Solve:" (systems of equations)
  • "Simplify:" (expressions, fractions)
  • "Find the domain:" (functions)
  • "Calculate:" (limits, derivatives)
  • "Differentiate:" (derivative problems)
  • "Solve these inequalities:" (inequalities)
  • "Reduce the following expression:" (exponents)
  • "For each pair, determine which is greater:" (exponent comparison)
- NO motivational phrases: never use "Let's", "Try", "Can you", "Great", etc.
- NO explanatory text - just state the mathematical task directly
- Questions should be SHORT and DIRECT like textbook problems

=== MATHEMATICAL NOTATION RULES (CRITICAL) ===

Use PROPER LaTeX syntax with these rules:

FRACTIONS - Always use \\frac:
✓ CORRECT: $\\frac{3}{x-5}$, $\\frac{x^2-4}{x^2-9}$
✗ WRONG: $3/(x-5)$, rac{, f32

EXPONENTS - ALWAYS use braces for multi-character exponents:
✓ CORRECT: $5^{x+2}$, $3^{2x-1}$, $e^{2x}$
✗ WRONG: $5^x+2$, $5^x+^2$, $e^2x$

SYSTEMS OF EQUATIONS - Use cases environment:
✓ CORRECT: $\\begin{cases} 8x + 3y = 28 \\\\ 2x + y = 8 \\end{cases}$

LOGARITHMS:
✓ CORRECT: $\\log_{2}(x)$, $\\log_{10}(x)$

SQUARE ROOTS:
✓ CORRECT: $\\sqrt{x+5}$, $\\sqrt{2x-1}$

WRAP ALL MATH in $ delimiters.

=== TOPIC-SPECIFIC PATTERNS FROM BOOKLET ===

First-Degree Equations: "Solve for x: $7x + 40 = 58 - 2x$"
Two-Variable Systems: "Solve: $\\begin{cases} ... \\end{cases}$"
Fractions: "Simplify: $\\frac{2a^2}{3} \\cdot \\frac{7}{a}$"
Quadratic Equations: "Solve for x: $x^2 + 5x - 150 = 0$"
Biquadratic: "Solve for x: $x^4 - 13x^2 + 36 = 0$"
Radical Equations: "Solve for x: $\\sqrt{9-x} = 2$"
Higher Degree: "Solve for x: $x^3 + 4x^2 = 0$"
Inequalities: "Solve: $x^2 > 25$"
Exponents: "Simplify: $\\frac{3^{75}}{3^{71}}$"
Exponential Equations: "Solve for x: $3^x = 27$"
Logarithms: "Calculate: $\\log_3(9)$"
Linear Functions: "Find the equation of the line passing through (2,5) with slope 3"
Quadratic Functions: "Find the vertex of $y = x^2 - 6x + 5$"
Limits: "Calculate: $\\lim_{x \\to 2} \\frac{x^2-4}{x-2}$"
Derivatives: "Differentiate: $y = x^3 + 6x^2 + x$"
Tangent Lines: "Find the equation of the tangent line to $y = x^2$ at $x = 1$"
Chain Rule: "Differentiate: $y = (2x+1)^5$"
Rational Functions: "Find the domain and asymptotes of $y = \\frac{x-2}{x^2-9}$"

HINTS - GUIDING, NOT REVEALING:
- First hint: What concept or technique applies
- Second hint: First step approach without showing work`;

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

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
      // Only replace the problematic parentheses escapes, NOT double backslashes
      // Double backslashes (\\) are valid JSON escapes for single backslash
      jsonStr = jsonStr
        .replace(/\\\(/g, "(")   // \( -> (
        .replace(/\\\)/g, ")");  // \) -> )
      // DO NOT replace \\\\ with \\ - this corrupts LaTeX commands like \frac -> rac
      
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

    // Auto-fix function for common LaTeX corruptions
    function autoFixQuestion(question: string): string {
      let fixed = question;
      
      // Fix corrupted \neq patterns (m\neq0 where \n became newline -> "m" + newline + "eq0")
      fixed = fixed.replace(/([a-zA-Z])\s*\n\s*eq\s*(\d)/g, '$1 \\neq $2');
      fixed = fixed.replace(/([a-zA-Z])eq(\d)/g, '$1 \\neq $2');
      fixed = fixed.replace(/([a-zA-Z])\s+eq\s+(\d)/g, '$1 \\neq $2');
      
      // Fix double-prefixed commands
      fixed = fixed.replace(/\\f\\frac/g, '\\frac');
      fixed = fixed.replace(/\\s\\sqrt/g, '\\sqrt');
      
      // Fix missing backslash on commands
      fixed = fixed.replace(/(?<!\\)rac\{/g, '\\frac{');
      fixed = fixed.replace(/(?<!\\)qrt\{/g, '\\sqrt{');
      
      return fixed;
    }
    
    // Validate question has no unfixable corruption
    function isValidQuestion(question: string): boolean {
      const unfixablePatterns = [
        /\bTODO\b/i,
        /\?\?\?/,
        /\.\.\.\.+/,
        /\[INSERT\]|\[PLACEHOLDER\]/i,
      ];
      return !unfixablePatterns.some(p => p.test(question));
    }

    // Prepare questions for insertion with validation and auto-fix
    const questionsToInsert: DiagnosticQuestion[] = parsedQuestions.questions
      .map((q: any, index: number) => {
        const fixedQuestion = autoFixQuestion(q.question);
        
        if (!isValidQuestion(fixedQuestion)) {
          console.warn(`Rejecting invalid question: ${q.question.substring(0, 50)}...`);
          return null;
        }
        
        return {
          diagnostic_test_id: diagnosticTest.id,
          subtopic_id: q.subtopic_id,
          question: fixedQuestion,
          correct_answer: q.correct_answer,
          difficulty: q.difficulty || "medium",
          hints: q.hints || [],
          order_index: index,
        };
      })
      .filter((q: DiagnosticQuestion | null): q is DiagnosticQuestion => q !== null);

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
