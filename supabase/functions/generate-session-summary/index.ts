import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionSummary {
  overallFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  nextSteps: string;
  encouragement: string;
  recommendedAction: 'retry' | 'next-topic' | 'review-theory' | 'take-break';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userId, 
      subtopicId, 
      subtopicName, 
      topicName,
      correctAnswers, 
      totalQuestions, 
      timeSpentSeconds,
      difficultiesAttempted 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Calculate accuracy
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Fetch recent exercise attempts for this session to understand mistakes
    let mistakeContext = '';
    if (userId && subtopicId) {
      const { data: recentAttempts } = await supabase
        .from('exercise_attempts')
        .select(`
          is_correct,
          misconception_tag,
          ai_feedback,
          exercises!inner(question, difficulty)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(totalQuestions + 5);

      if (recentAttempts && recentAttempts.length > 0) {
        const incorrectAttempts = recentAttempts.filter((a: any) => !a.is_correct);
        const misconceptions = incorrectAttempts
          .filter((a: any) => a.misconception_tag)
          .map((a: any) => a.misconception_tag);
        
        const uniqueMisconceptions = [...new Set(misconceptions)];
        
        if (uniqueMisconceptions.length > 0) {
          mistakeContext = `
IDENTIFIED MISCONCEPTIONS FROM THIS SESSION:
${uniqueMisconceptions.map((m, i) => `${i + 1}. ${m}`).join('\n')}
`;
        }

        // Check difficulty distribution
        const easyCorrect = recentAttempts.filter((a: any) => a.is_correct && a.exercises?.difficulty === 'easy').length;
        const mediumCorrect = recentAttempts.filter((a: any) => a.is_correct && a.exercises?.difficulty === 'medium').length;
        const hardCorrect = recentAttempts.filter((a: any) => a.is_correct && a.exercises?.difficulty === 'hard').length;
        
        mistakeContext += `
PERFORMANCE BY DIFFICULTY:
- Easy: ${easyCorrect} correct
- Medium: ${mediumCorrect} correct
- Hard: ${hardCorrect} correct
`;
      }
    }

    // Get subtopic progress history
    let progressContext = '';
    if (userId && subtopicId) {
      const { data: progress } = await supabase
        .from('user_subtopic_progress')
        .select('mastery_percentage, exercises_completed, exercises_correct')
        .eq('user_id', userId)
        .eq('subtopic_id', subtopicId)
        .single();

      if (progress) {
        progressContext = `
OVERALL PROGRESS ON THIS SUBTOPIC:
- Total mastery: ${progress.mastery_percentage}%
- Total exercises completed: ${progress.exercises_completed}
- Total correct: ${progress.exercises_correct}
`;
      }
    }

    const systemPrompt = `You are an expert AI math tutor providing a personalized session summary for a student who just finished practicing.

SESSION DATA:
- Topic: ${topicName || 'Mathematics'}
- Subtopic: ${subtopicName}
- Correct answers: ${correctAnswers} out of ${totalQuestions}
- Accuracy: ${accuracy}%
- Time spent: ${Math.round(timeSpentSeconds / 60)} minutes
${mistakeContext}
${progressContext}

Generate a JSON session summary with:
- overallFeedback: A warm, personalized 2-3 sentence summary of their performance (address the student directly as "you")
- strengths: Array of 1-3 specific things they did well (be specific, not generic)
- areasToImprove: Array of 1-3 specific areas to focus on (based on misconceptions if available)
- nextSteps: A single actionable recommendation for what to do next (1-2 sentences)
- encouragement: A short motivational message (1 sentence)
- recommendedAction: One of "retry" (accuracy < 50%), "review-theory" (accuracy 50-65%), "next-topic" (accuracy > 75%), or "take-break" (if time > 20 min)

RULES:
- Be warm, encouraging, and specific - avoid generic feedback
- Reference actual mistakes/misconceptions if available
- Make strengths and areas to improve specific to what they practiced
- The feedback should feel like it's from a real tutor who watched them work
- Keep everything concise but meaningful

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
          { role: "user", content: `Generate a session summary for this practice session on ${subtopicName}` }
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

    let summary: SessionSummary;
    try {
      summary = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response as JSON");
      }
    }

    // Validate and ensure proper structure
    const validatedSummary: SessionSummary = {
      overallFeedback: summary.overallFeedback || `You completed ${correctAnswers} out of ${totalQuestions} exercises. ${accuracy >= 70 ? 'Great work!' : 'Keep practicing!'}`,
      strengths: summary.strengths || ['Completed the practice session'],
      areasToImprove: summary.areasToImprove || ['Continue practicing to build mastery'],
      nextSteps: summary.nextSteps || 'Try the next topic when you feel ready.',
      encouragement: summary.encouragement || 'Every problem you solve makes you stronger!',
      recommendedAction: summary.recommendedAction || (accuracy >= 75 ? 'next-topic' : accuracy >= 50 ? 'review-theory' : 'retry'),
    };

    console.log(`Generated session summary for "${subtopicName}": ${accuracy}% accuracy`);

    return new Response(
      JSON.stringify(validatedSummary),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating session summary:", error);
    
    // Return a default summary on error
    const defaultSummary: SessionSummary = {
      overallFeedback: "Great effort on completing this practice session! Keep up the good work.",
      strengths: ["Showed persistence", "Completed the session"],
      areasToImprove: ["Continue practicing to reinforce concepts"],
      nextSteps: "Review any concepts that felt challenging and try again when ready.",
      encouragement: "Every step forward is progress!",
      recommendedAction: 'retry',
    };
    
    return new Response(
      JSON.stringify(defaultSummary),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
