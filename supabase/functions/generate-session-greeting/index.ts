import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  studentName?: string;
  tutorName: string;
  personality: string;
  currentStreak: number;
  totalXp: number;
  recentAchievements?: string[];
  weakestSubtopic?: string;
  lastSessionMood?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as RequestBody;
    const {
      studentName,
      tutorName = 'Alex',
      personality = 'patient',
      currentStreak = 0,
      totalXp = 0,
      recentAchievements = [],
      weakestSubtopic,
      lastSessionMood,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const personalityTones: Record<string, string> = {
      patient: 'gentle, warm, and reassuring',
      encouraging: 'enthusiastic, celebratory, and energetic',
      challenging: 'direct, confident, and motivating',
      humorous: 'friendly, light-hearted, with occasional gentle humor',
    };

    const tone = personalityTones[personality] || personalityTones.patient;

    const systemPrompt = `You are ${tutorName}, a ${tone} math tutor. Generate a warm, personalized greeting to start a tutoring session.

Your greeting should:
1. Be warm and welcoming - make the student feel comfortable
2. Ask genuinely how they're doing today
3. Reference their progress if relevant (streak, XP, recent achievements)
4. Subtly suggest what you could work on based on their weakest area
5. Feel natural and conversational, NOT scripted

Student context:
- Name: ${studentName || 'there'}
- Current streak: ${currentStreak} days
- Total XP: ${totalXp}
- Recent achievements: ${recentAchievements.length > 0 ? recentAchievements.join(', ') : 'None yet'}
- Suggested focus area: ${weakestSubtopic || 'Not determined yet'}
- Last session mood: ${lastSessionMood || 'Unknown'}

IMPORTANT RULES:
- Keep the greeting concise (2-4 sentences max for the greeting part)
- End with a genuine question about how they're feeling or what they'd like to focus on
- If they have a streak going, celebrate it briefly
- If they're new, be extra welcoming
- Sound human and caring, not robotic
- Use their name naturally (not forced)

Format: Return ONLY the greeting message, no JSON or formatting.`;

    console.log(`Generating greeting for ${studentName || 'student'} with ${tutorName}`);

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
          { role: "user", content: "Generate the session greeting now." }
        ],
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
    const greeting = data.choices?.[0]?.message?.content || 
      `Hi${studentName ? ` ${studentName}` : ''}! Great to see you. How are you feeling about math today?`;

    console.log(`Generated greeting for session`);

    return new Response(
      JSON.stringify({ greeting }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating greeting:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
