import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseAndValidate, sessionWrapupSchema } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const validation = await parseAndValidate(req, sessionWrapupSchema, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }
    const body = validation.data;
    const studentName = body.studentName;
    const tutorName = body.tutorName ?? 'Alex';
    const personality = body.personality ?? 'patient';
    const sessionGoal = body.sessionGoal;
    const progress = {
      topicsCovered: body.progress.topicsCovered ?? [],
      problemsSolved: body.progress.problemsSolved ?? 0,
      hintsUsed: body.progress.hintsUsed ?? 0,
      correctAnswers: body.progress.correctAnswers ?? 0,
      totalAttempts: body.progress.totalAttempts ?? 0,
    };
    const sessionDurationMinutes = body.sessionDurationMinutes ?? 0;
    const keyBreakthroughs = body.keyBreakthroughs ?? [];
    const struggles = body.struggles ?? [];

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const personalityTones: Record<string, string> = {
      patient: 'warm, encouraging, and supportive',
      encouraging: 'enthusiastic, celebratory, and uplifting',
      challenging: 'direct, acknowledging progress, and setting high expectations',
      humorous: 'friendly, light-hearted, with a warm closing',
    };

    const tone = personalityTones[personality] || personalityTones.patient;

    const accuracy = progress.totalAttempts > 0 
      ? Math.round((progress.correctAnswers / progress.totalAttempts) * 100) 
      : 0;

    const systemPrompt = `You are ${tutorName}, a ${tone} math tutor. Generate a warm, personalized wrap-up message to end a tutoring session.

Your wrap-up should:
1. Summarize what was accomplished in a conversational way (NOT bullet points)
2. Celebrate specific wins and breakthroughs
3. Acknowledge any struggles with encouragement
4. Give ONE actionable suggestion for next time
5. End with genuine warmth and encouragement

Session data:
- Student: ${studentName || 'Student'}
- Session goal: ${sessionGoal || 'General practice'}
- Topics covered: ${progress.topicsCovered.length > 0 ? progress.topicsCovered.join(', ') : 'General review'}
- Problems solved: ${progress.problemsSolved}
- Accuracy: ${accuracy}%
- Hints used: ${progress.hintsUsed}
- Duration: ${sessionDurationMinutes} minutes
- Key breakthroughs: ${keyBreakthroughs.length > 0 ? keyBreakthroughs.join(', ') : 'None noted'}
- Struggles: ${struggles.length > 0 ? struggles.join(', ') : 'None noted'}

IMPORTANT RULES:
- Keep it concise (3-5 sentences max)
- Sound natural and human, like a real tutor saying goodbye
- Focus on the POSITIVE - what they achieved
- If accuracy was low, be encouraging about the learning process
- End with a genuine, warm farewell
- Make them feel good about coming back

Format: Return ONLY the wrap-up message, no JSON or formatting.`;

    console.log(`Generating wrap-up for ${studentName || 'student'}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the session wrap-up message now." }
        ],
        max_completion_tokens: 512,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const wrapup = data.choices?.[0]?.message?.content || 
      `Great work today${studentName ? `, ${studentName}` : ''}! You made real progress. Keep it up, and I'll see you next time!`;

    console.log(`Generated wrap-up for session`);

    return new Response(
      JSON.stringify({ wrapup }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating wrap-up:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
