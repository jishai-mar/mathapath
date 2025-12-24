import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionNote {
  note_type: string;
  content: string;
  subtopic_name?: string;
  detected_at: string;
}

interface RequestBody {
  studentName?: string;
  tutorName: string;
  personality: string;
  currentStreak: number;
  totalXp: number;
  recentAchievements?: string[];
  weakestSubtopic?: string;
  lastSessionMood?: string;
  userId?: string;
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
      userId,
    } = body;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Fetch past session notes for memory/recall
    let sessionMemory = '';
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: notes } = await supabase
        .from('student_session_notes')
        .select('note_type, content, subtopic_name, detected_at')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(20);

      if (notes && notes.length > 0) {
        const interests = notes.filter((n: SessionNote) => n.note_type === 'interest').slice(0, 3);
        const breakthroughs = notes.filter((n: SessionNote) => n.note_type === 'breakthrough').slice(0, 3);
        const struggles = notes.filter((n: SessionNote) => n.note_type === 'struggle').slice(0, 3);

        const memoryParts = [];
        if (interests.length > 0) {
          memoryParts.push(`Student interests/personal details: ${interests.map((n: SessionNote) => n.content).join('; ')}`);
        }
        if (breakthroughs.length > 0) {
          memoryParts.push(`Recent breakthroughs to celebrate: ${breakthroughs.map((n: SessionNote) => n.content).join('; ')}`);
        }
        if (struggles.length > 0) {
          memoryParts.push(`Past struggles to be aware of: ${struggles.map((n: SessionNote) => n.content).join('; ')}`);
        }
        sessionMemory = memoryParts.join('\n');
      }
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
4. If you have MEMORY of past sessions, reference it naturally (e.g., "How did that soccer game go?" or "Last time you finally cracked completing the square - that was awesome!")
5. Subtly suggest what you could work on based on their weakest area
6. Feel natural and conversational, NOT scripted

Student context:
- Name: ${studentName || 'there'}
- Current streak: ${currentStreak} days
- Total XP: ${totalXp}
- Recent achievements: ${recentAchievements.length > 0 ? recentAchievements.join(', ') : 'None yet'}
- Suggested focus area: ${weakestSubtopic || 'Not determined yet'}
- Last session mood: ${lastSessionMood || 'Unknown'}

${sessionMemory ? `=== MEMORY FROM PAST SESSIONS ===\n${sessionMemory}\n\nUse this memory NATURALLY - don't force it. Reference 1-2 things that feel relevant.` : ''}

IMPORTANT RULES:
- Keep the greeting concise (2-4 sentences max for the greeting part)
- End with a genuine question about how they're feeling or what they'd like to focus on
- If they have a streak going, celebrate it briefly
- If they're new, be extra welcoming
- Sound human and caring, not robotic
- Use their name naturally (not forced)
- If you have memory of past sessions, weave it in naturally (don't mention you have a "database" or "notes")

Format: Return ONLY the greeting message, no JSON or formatting.`;

    console.log(`Generating greeting for ${studentName || 'student'} with ${tutorName}`);

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
          { role: "user", content: "Generate the session greeting now." }
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
