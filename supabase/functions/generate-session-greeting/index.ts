import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SessionNote {
  note_type: string;
  content: string;
  subtopic_name?: string;
  detected_at: string;
}

interface RequestBody {
  studentName?: string;
  tutorName?: string;
  personality?: string;
  currentStreak?: number;
  totalXp?: number;
  recentAchievements?: string[];
  weakestSubtopic?: string;
  lastSessionMood?: string;
  userId?: string;

  // Used by GuidedTutoringSession
  subtopicName?: string;
  exerciseGoal?: number;
}

function buildFallbackGreeting({
  studentName,
  tutorName,
  weakestSubtopic,
}: {
  studentName?: string;
  tutorName?: string;
  weakestSubtopic?: string;
}) {
  const namePart = studentName ? ` ${studentName}` : "";
  const tutorPart = tutorName ? `I'm ${tutorName}. ` : "";
  const focusPart = weakestSubtopic
    ? `What do you want to focus on in ${weakestSubtopic} today?`
    : "What would you like to work on today?";

  return `Hi${namePart}! ${tutorPart}${focusPart}`.replace(/\s+/g, " ").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;

    const studentName = body.studentName;
    const tutorName = body.tutorName ?? "Alex";
    const personality = body.personality ?? "patient";
    const currentStreak = body.currentStreak ?? 0;
    const totalXp = body.totalXp ?? 0;
    const recentAchievements = body.recentAchievements ?? [];
    const weakestSubtopic = body.weakestSubtopic ?? body.subtopicName;
    const lastSessionMood = body.lastSessionMood;
    const userId = body.userId;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Fetch past session notes for memory/recall
    let sessionMemory = "";
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: notes, error: notesError } = await supabase
        .from("student_session_notes")
        .select("note_type, content, subtopic_name, detected_at")
        .eq("user_id", userId)
        .order("detected_at", { ascending: false })
        .limit(20);

      if (notesError) {
        console.warn("Failed to fetch session notes:", notesError.message);
      }

      if (notes && notes.length > 0) {
        const interests = notes
          .filter((n: SessionNote) => n.note_type === "interest")
          .slice(0, 3);
        const breakthroughs = notes
          .filter((n: SessionNote) => n.note_type === "breakthrough")
          .slice(0, 3);
        const struggles = notes
          .filter((n: SessionNote) => n.note_type === "struggle")
          .slice(0, 3);

        const memoryParts: string[] = [];
        if (interests.length > 0) {
          memoryParts.push(
            `Student interests/personal details: ${interests
              .map((n: SessionNote) => n.content)
              .join("; ")}`,
          );
        }
        if (breakthroughs.length > 0) {
          memoryParts.push(
            `Recent breakthroughs to celebrate: ${breakthroughs
              .map((n: SessionNote) => n.content)
              .join("; ")}`,
          );
        }
        if (struggles.length > 0) {
          memoryParts.push(
            `Past struggles to be aware of: ${struggles
              .map((n: SessionNote) => n.content)
              .join("; ")}`,
          );
        }

        sessionMemory = memoryParts.join("\n");
      }
    }

    const personalityTones: Record<string, string> = {
      patient: "gentle, warm, and reassuring",
      encouraging: "enthusiastic, celebratory, and energetic",
      challenging: "direct, confident, and motivating",
      humorous: "friendly, light-hearted, with occasional gentle humor",
    };

    const tone = personalityTones[personality] || personalityTones.patient;

    const systemPrompt = `You are ${tutorName}, a ${tone} math tutor. Generate a warm, personalized greeting to start a tutoring session.

Your greeting should:
1. Be warm and welcoming (make the student feel comfortable)
2. Ask genuinely how they're doing today
3. Reference their progress if relevant (streak, XP, achievements)
4. If you have MEMORY of past sessions, reference it naturally (1-2 things max)
5. Subtly suggest what you could work on based on their weakest/suggested area
6. Feel natural and conversational, NOT scripted

Student context:
- Name: ${studentName || "there"}
- Current streak: ${currentStreak} days
- Total XP: ${totalXp}
- Recent achievements: ${recentAchievements.length > 0 ? recentAchievements.join(", ") : "None yet"}
- Suggested focus area: ${weakestSubtopic || "Not determined yet"}
- Last session mood: ${lastSessionMood || "Unknown"}

${sessionMemory ? `=== MEMORY FROM PAST SESSIONS ===\n${sessionMemory}\n\nUse this memory NATURALLY - don't force it.` : ""}

IMPORTANT RULES:
- Keep it concise (2-4 sentences max)
- End with a genuine question
- Sound human and caring
- Return ONLY the greeting text (no JSON, no markdown).`;

    console.log(
      `Generating session greeting for ${studentName || "student"} (${personality})`,
    );

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate the session greeting now." },
          ],
          max_completion_tokens: 300,
        }),
      },
    );

    // IMPORTANT: return 200 with a fallback payload so the client SDK doesn't treat it as a hard error.
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        const greeting = buildFallbackGreeting({
          studentName,
          tutorName,
          weakestSubtopic,
        });
        return new Response(
          JSON.stringify({
            greeting,
            fallback: true,
            rate_limited: true,
            error: "Rate limit exceeded. Please try again.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        const greeting = buildFallbackGreeting({
          studentName,
          tutorName,
          weakestSubtopic,
        });
        return new Response(
          JSON.stringify({
            greeting,
            fallback: true,
            credits_depleted: true,
            error: "AI credits depleted.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      const greeting = buildFallbackGreeting({
        studentName,
        tutorName,
        weakestSubtopic,
      });
      return new Response(
        JSON.stringify({ greeting, fallback: true, error: "AI gateway error" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    const greeting =
      typeof raw === "string" && raw.trim().length > 0
        ? raw.trim()
        : buildFallbackGreeting({ studentName, tutorName, weakestSubtopic });

    return new Response(JSON.stringify({ greeting }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating session greeting:", error);
    const greeting = buildFallbackGreeting({ tutorName: "Alex" });
    return new Response(
      JSON.stringify({
        greeting,
        fallback: true,
        error: "An error occurred processing your request",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
