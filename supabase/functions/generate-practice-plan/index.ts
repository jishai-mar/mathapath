import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PracticePlan {
  recommendation: string;
  totalExercises: number;
  breakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  targetMastery: number;
  estimatedMinutes: number;
  focusAreas: string[];
  motivationalNote: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subtopicId, subtopicName, topicName, userId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch student performance data
    let studentContext = '';
    let currentMastery = 0;
    let exercisesCompleted = 0;

    if (userId && subtopicId) {
      // Get subtopic progress
      const { data: progress } = await supabase
        .from('user_subtopic_progress')
        .select('mastery_percentage, exercises_completed, exercises_correct, hints_used')
        .eq('user_id', userId)
        .eq('subtopic_id', subtopicId)
        .single();

      if (progress) {
        currentMastery = progress.mastery_percentage || 0;
        exercisesCompleted = progress.exercises_completed || 0;
        const accuracy = progress.exercises_completed > 0 
          ? Math.round((progress.exercises_correct / progress.exercises_completed) * 100) 
          : 0;
        
        studentContext += `
CURRENT PERFORMANCE ON THIS SUBTOPIC:
- Mastery: ${currentMastery}%
- Exercises completed: ${exercisesCompleted}
- Accuracy: ${accuracy}%
- Hints used: ${progress.hints_used || 0}
`;
      }

      // Get recent attempts for this subtopic
      const { data: recentAttempts } = await supabase
        .from('exercise_attempts')
        .select(`
          is_correct,
          misconception_tag,
          exercises!inner(difficulty, subtopic_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      const subtopicAttempts = (recentAttempts || []).filter(
        (a: any) => a.exercises?.subtopic_id === subtopicId
      );

      if (subtopicAttempts.length > 0) {
        const recentCorrect = subtopicAttempts.filter((a: any) => a.is_correct).length;
        const recentAccuracy = Math.round((recentCorrect / subtopicAttempts.length) * 100);
        const misconceptions = subtopicAttempts
          .filter((a: any) => a.misconception_tag)
          .map((a: any) => a.misconception_tag)
          .slice(0, 3);
        
        studentContext += `
RECENT PERFORMANCE (last ${subtopicAttempts.length} attempts):
- Recent accuracy: ${recentAccuracy}%
${misconceptions.length > 0 ? `- Common mistakes: ${misconceptions.join(', ')}` : ''}
`;
      }

      // Get learning profile if exists
      const { data: learningProfile } = await supabase
        .from('learning_profiles')
        .select('overall_level, strengths, weaknesses, subtopic_levels')
        .eq('user_id', userId)
        .single();

      if (learningProfile) {
        studentContext += `
LEARNING PROFILE:
- Overall level: ${learningProfile.overall_level}/5
- Strengths: ${JSON.stringify(learningProfile.strengths)}
- Areas to improve: ${JSON.stringify(learningProfile.weaknesses)}
`;
      }
    }

    const systemPrompt = `You are an expert AI math tutor creating a personalized practice plan for a student.

Based on the student's performance data, create a practice recommendation that:
1. Is appropriate for their current level
2. Challenges them appropriately without overwhelming
3. Focuses on areas where they need improvement
4. Sets realistic, achievable goals

${studentContext || 'No prior data available - this is a new student. Start with a balanced introduction.'}

TOPIC: ${topicName || 'Mathematics'}
SUBTOPIC: ${subtopicName}

Generate a JSON practice plan with:
- recommendation: A conversational explanation of why you're recommending this plan (2-3 sentences, address the student directly)
- totalExercises: Number of exercises to do (typically 4-8)
- breakdown: { easy: X, medium: Y, hard: Z } - must sum to totalExercises
- targetMastery: Target mastery percentage to aim for (50-90)
- estimatedMinutes: Estimated time in minutes (5-25)
- focusAreas: Array of 1-3 specific things to focus on
- motivationalNote: A short encouraging message

RULES:
- New students or low mastery (<30%): More easy exercises (3-4), fewer hard (0-1)
- Medium mastery (30-70%): Balanced approach (2 easy, 2-3 medium, 1 hard)
- High mastery (>70%): Challenge them (1 easy, 2 medium, 2-3 hard)
- If student has shown specific misconceptions, mention them in focusAreas
- Keep recommendations warm, encouraging, and specific

Return only valid JSON matching the structure described.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a practice plan for: ${subtopicName}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    let plan: PracticePlan;
    try {
      plan = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response as JSON");
      }
    }

    // Validate and ensure proper structure
    const validatedPlan: PracticePlan = {
      recommendation: plan.recommendation || `Let's practice ${subtopicName} together. I've prepared some exercises tailored to your level.`,
      totalExercises: plan.totalExercises || 5,
      breakdown: {
        easy: plan.breakdown?.easy || 2,
        medium: plan.breakdown?.medium || 2,
        hard: plan.breakdown?.hard || 1,
      },
      targetMastery: plan.targetMastery || 70,
      estimatedMinutes: plan.estimatedMinutes || 15,
      focusAreas: plan.focusAreas || ['Understanding the core concept', 'Applying the method correctly'],
      motivationalNote: plan.motivationalNote || "You've got this! Let's build your confidence step by step.",
    };

    // Ensure breakdown sums to total
    const breakdownSum = validatedPlan.breakdown.easy + validatedPlan.breakdown.medium + validatedPlan.breakdown.hard;
    if (breakdownSum !== validatedPlan.totalExercises) {
      validatedPlan.totalExercises = breakdownSum;
    }

    console.log(`Generated practice plan for "${subtopicName}": ${validatedPlan.totalExercises} exercises`);

    return new Response(
      JSON.stringify(validatedPlan),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating practice plan:", error);
    
    // Return a default plan on error
    const defaultPlan: PracticePlan = {
      recommendation: "Let's practice together! I've prepared a balanced set of exercises to help you learn.",
      totalExercises: 5,
      breakdown: { easy: 2, medium: 2, hard: 1 },
      targetMastery: 70,
      estimatedMinutes: 15,
      focusAreas: ['Understanding the concept', 'Applying the method'],
      motivationalNote: "Every problem you solve makes you stronger. Let's do this!",
    };
    
    return new Response(
      JSON.stringify(defaultPlan),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
