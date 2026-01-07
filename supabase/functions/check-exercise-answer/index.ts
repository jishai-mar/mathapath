import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Emotional state type for personalized feedback
type StudentEmotionalState = 'neutral' | 'struggling' | 'frustrated' | 'confident' | 'anxious';

// Generate tutor-style feedback using AI with emotional awareness
async function generateTutorFeedback(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  subtopicName: string,
  consecutiveWrong: number = 0,
  hintsUsed: number = 0
): Promise<{
  what_went_well: string;
  where_it_breaks: string;
  what_to_focus_on_next: string;
  emotional_support?: string;
}> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not configured");
    return {
      what_went_well: "You attempted the problem.",
      where_it_breaks: "Review your solution steps carefully.",
      what_to_focus_on_next: "Try breaking down the problem into smaller steps.",
    };
  }

  // Detect emotional state based on performance
  let emotionalState: StudentEmotionalState = 'neutral';
  if (consecutiveWrong >= 3) {
    emotionalState = 'frustrated';
  } else if (consecutiveWrong >= 2 || hintsUsed >= 2) {
    emotionalState = 'struggling';
  } else if (hintsUsed >= 1) {
    emotionalState = 'anxious';
  }

  // Emotional adaptation instructions
  const emotionalGuidance: Record<StudentEmotionalState, string> = {
    neutral: 'Provide balanced, encouraging feedback.',
    struggling: 'Be EXTRA supportive. Emphasize what they did right. Break the hint into smaller pieces. Use phrases like "You are on the right track" and "This part takes practice."',
    frustrated: 'Be VERY gentle and empathetic. First acknowledge their effort: "This is a challenging problem, and you are showing real persistence." Focus on what went well. Suggest they might benefit from reviewing a simpler example first. Do NOT repeat the same type of hint that has not worked.',
    confident: 'Provide clear, direct feedback. They can handle constructive criticism.',
    anxious: 'Be calm and reassuring. Use phrases like "It is okay to make mistakes - that is how we learn" and "You are making progress." Keep the feedback very simple and actionable.',
  };

  const systemPrompt = `You are a patient, supportive math tutor helping a student understand their mistake.
Your role is to guide them toward understanding WITHOUT revealing the correct answer directly.

STUDENT EMOTIONAL STATE: ${emotionalState}
ADAPTATION: ${emotionalGuidance[emotionalState]}

Core Guidelines:
- Be encouraging and acknowledge any correct thinking
- Identify the likely error or misconception without giving away the answer
- Provide a guiding hint that helps them think through the problem
- Use simple, clear language - like a top-quality coursebook would explain
- Keep responses concise (1-2 sentences each)
- If you need to reference math, use plain text notation (e.g., x², √x)

IMPORTANT FOR ${emotionalState.toUpperCase()} STATE:
${emotionalState === 'frustrated' ? '- First validate their effort before any correction\n- Suggest a simpler approach or breaking the problem down\n- Consider if a completely different explanation approach might help' : ''}
${emotionalState === 'struggling' ? '- Extra encouragement on what they did correctly\n- Make the next step very clear and small\n- Remind them that this concept takes practice' : ''}
${emotionalState === 'anxious' ? '- Reassure them that mistakes are part of learning\n- Keep feedback very simple and clear\n- Focus on one small thing to fix' : ''}`;

  const userPrompt = `Topic: ${subtopicName}
Question: ${question}
Student's Answer: ${userAnswer}
(The correct answer is: ${correctAnswer} - but do NOT reveal this to the student)
Consecutive wrong attempts: ${consecutiveWrong}
Hints used: ${hintsUsed}

Analyze the student's answer and provide supportive, emotionally-aware feedback:
1. what_went_well: Acknowledge any correct thinking or approach (even partial). Be specific and genuine.
2. where_it_breaks: Identify where the mistake likely occurred WITHOUT revealing the answer. Give a gentle hint about what to check.
3. what_to_focus_on_next: A brief, actionable tip for solving this type of problem.
${emotionalState === 'frustrated' || emotionalState === 'struggling' ? '4. emotional_support: A brief encouraging message acknowledging their effort and persistence.' : ''}

Return ONLY valid JSON in this exact format:
{
  "what_went_well": "...",
  "where_it_breaks": "...",
  "what_to_focus_on_next": "..."${emotionalState === 'frustrated' || emotionalState === 'struggling' ? ',\n  "emotional_support": "..."' : ''}
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
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
      console.error("AI API error:", response.status);
      // Return fallback instead of throwing
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON in response");
  } catch (error) {
    console.error("Error generating feedback:", error);
    // Provide emotionally-aware fallback
    const fallbacks: Record<StudentEmotionalState, { what_went_well: string; where_it_breaks: string; what_to_focus_on_next: string; emotional_support?: string }> = {
      neutral: {
        what_went_well: "You attempted the problem.",
        where_it_breaks: "Check your calculation steps carefully.",
        what_to_focus_on_next: "Try working through the problem step by step.",
      },
      struggling: {
        what_went_well: "You are putting in effort, and that matters.",
        where_it_breaks: "Let's slow down and check each step carefully.",
        what_to_focus_on_next: "Try breaking this into smaller pieces.",
        emotional_support: "This concept takes practice - you are making progress.",
      },
      frustrated: {
        what_went_well: "You are showing real persistence by continuing to try.",
        where_it_breaks: "Sometimes a fresh approach helps - let's try a different angle.",
        what_to_focus_on_next: "Consider reviewing a simpler example first.",
        emotional_support: "It is completely okay to find this challenging. Many students do.",
      },
      confident: {
        what_went_well: "You attempted the problem.",
        where_it_breaks: "Check your calculation steps carefully.",
        what_to_focus_on_next: "Try working through the problem step by step.",
      },
      anxious: {
        what_went_well: "You are doing well by trying.",
        where_it_breaks: "Just one small thing to adjust.",
        what_to_focus_on_next: "Take it one step at a time.",
        emotional_support: "Mistakes are how we learn - you are on the right track.",
      },
    };
    return fallbacks[emotionalState];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseId, userAnswer, userId, hintsUsed, timeSpentSeconds, currentSubLevel, subtopicName } = await req.json();

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
      .select("id, correct_answer, explanation, subtopic_id, difficulty, question")
      .eq("id", exerciseId)
      .single();

    if (exerciseError || !exercise) {
      console.error("Exercise fetch error:", exerciseError);
      return new Response(
        JSON.stringify({ error: "Exercise not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        .replace(/±/g, "+-")
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

    // Check if two expressions are mathematically equivalent
    const areExpressionsEquivalent = (expr1: string, expr2: string): boolean => {
      const norm1 = normalizeMathAnswer(expr1);
      const norm2 = normalizeMathAnswer(expr2);
      
      // Direct string match after normalization
      if (norm1 === norm2) return true;
      
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
      const num1 = parseFloat(norm1);
      const num2 = parseFloat(norm2);
      if (!isNaN(num1) && !isNaN(num2) && Math.abs(num1 - num2) < 0.0001) return true;
      
      // Handle fraction equivalence: "1/2" == "0.5"
      const evalFraction = (s: string): number | null => {
        const fractionMatch = s.match(/^(-?\d+)\/(\d+)$/);
        if (fractionMatch) {
          return parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2]);
        }
        return null;
      };
      const frac1 = evalFraction(norm1);
      const frac2 = evalFraction(norm2);
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
      ? areExpressionsEquivalent(userAnswer, exercise.correct_answer)
      : false;

    // We'll calculate consecutive wrong before generating feedback
    // First, fetch recent attempts to get the context
    let consecutiveWrongForFeedback = 0;

    // Fetch student's recent performance on this subtopic for personalization
    const { data: recentAttempts } = await supabase
      .from("exercise_attempts")
      .select(`
        is_correct,
        hints_used,
        exercises!inner(difficulty, subtopic_id)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    // Calculate performance stats by difficulty
    const performanceByDifficulty = { 
      easy: { correct: 0, total: 0, streak: 0 }, 
      medium: { correct: 0, total: 0, streak: 0 }, 
      hard: { correct: 0, total: 0, streak: 0 } 
    };
    
    const subtopicAttempts = (recentAttempts || []).filter((a: any) => a.exercises?.subtopic_id === exercise.subtopic_id);
    
    // Track consecutive correct answers for current difficulty
    let consecutiveCorrectCurrent = 0;
    let consecutiveWrongCurrent = 0;
    let foundWrong = false;
    let foundCorrect = false;

    for (const attempt of subtopicAttempts) {
      const exerciseData = (attempt as any).exercises;
      const diff = exerciseData?.difficulty as 'easy' | 'medium' | 'hard' | undefined;
      if (diff && performanceByDifficulty[diff]) {
        performanceByDifficulty[diff].total++;
        if (attempt.is_correct) performanceByDifficulty[diff].correct++;
      }
      
      // Count consecutive for current difficulty (before this attempt)
      if (diff === exercise.difficulty) {
        if (!foundWrong && attempt.is_correct) {
          consecutiveCorrectCurrent++;
        } else {
          foundWrong = true;
        }
        
        if (!foundCorrect && !attempt.is_correct) {
          consecutiveWrongCurrent++;
        } else {
          foundCorrect = true;
        }
      }
    }

    // Update streaks based on this answer
    if (isCorrect) {
      consecutiveCorrectCurrent++;
      consecutiveWrongCurrent = 0;
    } else {
      consecutiveWrongCurrent++;
      consecutiveCorrectCurrent = 0;
    }

    // Generate AI tutor feedback for incorrect answers with emotional awareness
    let tutorFeedback = null;
    if (!isCorrect && userAnswer) {
      tutorFeedback = await generateTutorFeedback(
        exercise.question,
        userAnswer,
        exercise.correct_answer,
        subtopicName || "Mathematics",
        consecutiveWrongCurrent,
        hintsUsed || 0
      );
    }

    // Calculate success rates
    const successRates = {
      easy: performanceByDifficulty.easy.total > 0 ? Math.round((performanceByDifficulty.easy.correct / performanceByDifficulty.easy.total) * 100) : null,
      medium: performanceByDifficulty.medium.total > 0 ? Math.round((performanceByDifficulty.medium.correct / performanceByDifficulty.medium.total) * 100) : null,
      hard: performanceByDifficulty.hard.total > 0 ? Math.round((performanceByDifficulty.hard.correct / performanceByDifficulty.hard.total) * 100) : null,
    };

    // Enhanced difficulty progression with sub-levels
    let suggestedDifficulty: 'easy' | 'medium' | 'hard' = exercise.difficulty;
    let suggestedSubLevel = currentSubLevel || 2;
    const currentDiff = exercise.difficulty;
    
    if (isCorrect) {
      if (consecutiveCorrectCurrent >= 2) {
        if (suggestedSubLevel < 3) {
          suggestedSubLevel = Math.min(3, suggestedSubLevel + 1);
        } else {
          if (currentDiff === 'easy') {
            suggestedDifficulty = 'medium';
            suggestedSubLevel = 1;
          } else if (currentDiff === 'medium') {
            suggestedDifficulty = 'hard';
            suggestedSubLevel = 1;
          }
        }
      }
    } else {
      if (consecutiveWrongCurrent >= 2) {
        if (suggestedSubLevel > 1) {
          suggestedSubLevel = Math.max(1, suggestedSubLevel - 1);
        } else {
          if (currentDiff === 'hard') {
            suggestedDifficulty = 'medium';
            suggestedSubLevel = 3;
          } else if (currentDiff === 'medium') {
            suggestedDifficulty = 'easy';
            suggestedSubLevel = 3;
          }
        }
      }
    }

    // Performance-based adjustments
    const currentDiffTyped = currentDiff as 'easy' | 'medium' | 'hard';
    const currentStats = successRates[currentDiffTyped];
    if (currentStats !== null) {
      if (currentStats >= 85 && performanceByDifficulty[currentDiffTyped].total >= 5) {
        if (currentDiffTyped === 'easy') suggestedDifficulty = 'medium';
        else if (currentDiffTyped === 'medium') suggestedDifficulty = 'hard';
        suggestedSubLevel = 2;
      } else if (currentStats < 30 && performanceByDifficulty[currentDiffTyped].total >= 4) {
        if (currentDiffTyped === 'hard') suggestedDifficulty = 'medium';
        else if (currentDiffTyped === 'medium') suggestedDifficulty = 'easy';
        suggestedSubLevel = 2;
      }
    }

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
        ai_feedback: tutorFeedback ? JSON.stringify(tutorFeedback) : null,
      });

    if (insertError) {
      console.error("Insert attempt error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save attempt" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Answer checked for exercise ${exerciseId}: ${isCorrect ? 'correct' : 'incorrect'}, suggested: ${suggestedDifficulty} (sub-level ${suggestedSubLevel})`);

    // Generate adaptive message based on progression
    let progressionMessage = null;
    if (suggestedDifficulty !== currentDiff) {
      if ((suggestedDifficulty === 'medium' && currentDiff === 'easy') || 
          (suggestedDifficulty === 'hard' && currentDiff === 'medium')) {
        progressionMessage = "Great progress! Moving to more challenging exercises.";
      } else {
        progressionMessage = "Let's reinforce the fundamentals with some focused practice.";
      }
    }

    return new Response(
      JSON.stringify({ 
        isCorrect,
        correctAnswer: exercise.correct_answer,
        explanation: exercise.explanation,
        tutorFeedback,
        suggestedDifficulty,
        suggestedSubLevel,
        consecutiveCorrect: consecutiveCorrectCurrent,
        consecutiveWrong: consecutiveWrongCurrent,
        performanceInsight: {
          currentDifficulty: exercise.difficulty,
          successRates,
          progressionMessage,
          recommendation: suggestedDifficulty !== exercise.difficulty 
            ? `Based on your performance, ${suggestedDifficulty} exercises are recommended next.`
            : null,
        },
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
