import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_completion_tokens: 512,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      // Return fallback instead of throwing
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

    // Advanced math answer comparison that handles equivalent expressions
    const normalizeMathAnswer = (s: string): string => {
      return String(s)
        .toLowerCase()
        .replace(/\$/g, "")
        .replace(/\\/g, "")
        .replace(/[{}]/g, "")
        .replace(/\s+/g, "")
        .replace(/,/g, ".")  // Standardize decimal separator
        .replace(/−/g, "-")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\^/g, "**")
        .trim();
    };

    // Parse and normalize algebraic expressions for equivalence
    const parseAlgebraicTerms = (expr: string): Map<string, number> => {
      const terms = new Map<string, number>();
      const normalized = normalizeMathAnswer(expr);
      
      // Handle simple numeric answers
      const numericValue = parseFloat(normalized);
      if (!isNaN(numericValue) && normalized === String(numericValue)) {
        terms.set("_numeric", numericValue);
        return terms;
      }
      
      // Split by + or - while keeping the sign
      const parts = normalized.split(/(?=[+-])/);
      
      for (const part of parts) {
        if (!part) continue;
        
        // Match coefficient and variable(s): e.g., "2x", "-3xy", "x", "-y"
        const match = part.match(/^([+-]?\d*\.?\d*)([a-z]+)?(\*\*(\d+))?$/);
        if (match) {
          let coeff = match[1] === "" || match[1] === "+" ? 1 : match[1] === "-" ? -1 : parseFloat(match[1]);
          const vars = match[2] || "_const";
          const power = match[4] ? parseInt(match[4]) : 1;
          const key = vars === "_const" ? "_const" : vars.split("").sort().join("") + (power > 1 ? `**${power}` : "");
          terms.set(key, (terms.get(key) || 0) + coeff);
        }
      }
      
      return terms;
    };

    // Parse multi-solution answers like "x=2 or x=-3" or "x=2, x=-3"
    const parseMultiSolutions = (expr: string): Set<string> => {
      const solutions = new Set<string>();
      const normalized = normalizeMathAnswer(expr);
      
      // Split by common separators: "or", "of", "en", ",", ";"
      const parts = normalized.split(/\b(?:or|of|en)\b|[,;]/i);
      
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        
        // Extract value from "x=value" format
        const eqMatch = trimmed.match(/^[a-z]\s*=\s*(.+)$/);
        if (eqMatch) {
          solutions.add(normalizeMathAnswer(eqMatch[1]));
        } else {
          // Just a value
          solutions.add(trimmed);
        }
      }
      
      return solutions;
    };

    // Check if two solution sets are equivalent
    const areSolutionSetsEquivalent = (set1: Set<string>, set2: Set<string>): boolean => {
      if (set1.size !== set2.size) return false;
      
      for (const val of set1) {
        let found = false;
        for (const val2 of set2) {
          // Compare numerically if possible
          const num1 = parseFloat(val);
          const num2 = parseFloat(val2);
          if (!isNaN(num1) && !isNaN(num2) && Math.abs(num1 - num2) < 0.0001) {
            found = true;
            break;
          }
          // Direct string match
          if (val === val2) {
            found = true;
            break;
          }
        }
        if (!found) return false;
      }
      return true;
    };

    // Extract just the value from "x=5" or "y = 3" format
    const extractValueFromEquation = (expr: string): string => {
      const normalized = normalizeMathAnswer(expr);
      // Match patterns like "x=5", "y=-3", "a=1/2"
      const eqMatch = normalized.match(/^[a-z]\s*=\s*(.+)$/);
      if (eqMatch) {
        return eqMatch[1];
      }
      return normalized;
    };

    // Check if two expressions are mathematically equivalent
    const areExpressionsEquivalent = (expr1: string, expr2: string): boolean => {
      const norm1 = normalizeMathAnswer(expr1);
      const norm2 = normalizeMathAnswer(expr2);
      
      // Direct string match after normalization
      if (norm1 === norm2) return true;
      
      // Extract values from equations (x=5 -> 5)
      const val1 = extractValueFromEquation(expr1);
      const val2 = extractValueFromEquation(expr2);
      
      // Compare extracted values
      if (val1 === val2) return true;
      
      // Also try comparing extracted vs original (handles "x=5" vs "5")
      if (val1 === norm2 || val2 === norm1) return true;
      
      // Check for multi-solution answers (quadratic equations, etc.)
      // Patterns: "x=2 or x=-3", "x=2, x=-3", "2 or -3", "2 en -3"
      const hasMultiSolutionPattern = /\b(or|of|en)\b|[,;]/i;
      if (hasMultiSolutionPattern.test(expr1) || hasMultiSolutionPattern.test(expr2)) {
        const solutions1 = parseMultiSolutions(expr1);
        const solutions2 = parseMultiSolutions(expr2);
        if (solutions1.size > 0 && solutions2.size > 0 && areSolutionSetsEquivalent(solutions1, solutions2)) {
          return true;
        }
      }
      
      // Try numeric comparison (handles "2.0" == "2", fractions, etc.)
      const num1 = parseFloat(val1);
      const num2 = parseFloat(val2);
      if (!isNaN(num1) && !isNaN(num2) && Math.abs(num1 - num2) < 0.0001) return true;
      
      // Handle fraction equivalence: "1/2" == "0.5"
      const evalFraction = (s: string): number | null => {
        const fractionMatch = s.match(/^(-?\d+)\/(\d+)$/);
        if (fractionMatch) {
          return parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2]);
        }
        return null;
      };
      const frac1 = evalFraction(val1);
      const frac2 = evalFraction(val2);
      if (frac1 !== null && !isNaN(num2) && Math.abs(frac1 - num2) < 0.0001) return true;
      if (frac2 !== null && !isNaN(num1) && Math.abs(frac2 - num1) < 0.0001) return true;
      if (frac1 !== null && frac2 !== null && Math.abs(frac1 - frac2) < 0.0001) return true;
      
      // Algebraic equivalence: "2x" == "x*2" == "x+x"
      const terms1 = parseAlgebraicTerms(expr1);
      const terms2 = parseAlgebraicTerms(expr2);
      
      if (terms1.size === terms2.size) {
        let allMatch = true;
        for (const [key, val] of terms1) {
          if (Math.abs((terms2.get(key) || 0) - val) > 0.0001) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) return true;
      }
      
      // Handle common equivalent forms
      const equivalentForms: [RegExp, RegExp][] = [
        [/^(\d+)([a-z])$/, /^([a-z])\*?(\d+)$/],  // "2x" == "x*2"
        [/^([a-z])\+([a-z])$/, /^2([a-z])$/],     // "x+x" == "2x"
      ];
      
      for (const [pattern1, pattern2] of equivalentForms) {
        const m1 = norm1.match(pattern1);
        const m2 = norm2.match(pattern2);
        if (m1 && m2) {
          if (pattern1.source.includes("(\\d+)([a-z])")) {
            if (m1[2] === m2[1] && m1[1] === m2[2]) return true;
          }
        }
        const m1r = norm1.match(pattern2);
        const m2r = norm2.match(pattern1);
        if (m1r && m2r) {
          if (pattern1.source.includes("(\\d+)([a-z])")) {
            if (m1r[1] === m2r[2] && m1r[2] === m2r[1]) return true;
          }
        }
      }
      
      return false;
    };

    const isCorrect = userAnswer
      ? areExpressionsEquivalent(userAnswer, question.correct_answer)
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
        correctAnswer: question.correct_answer,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check answer error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
