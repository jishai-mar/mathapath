import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      studentName,
      tutorName,
      tutorPersonality,
      currentStreak,
      totalXp,
      topicProgress,
      weakSubtopics,
      recentActivity,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context about student progress
    const progressSummary =
      topicProgress
        ?.map((t: any) => `${t.name}: ${t.mastery}% mastery`)
        .join(", ") || "No progress data yet";

    const weakAreas =
      weakSubtopics?.map((s: any) => s.subtopic_name).join(", ") ||
      "None identified";

    const personalityPrompts: Record<string, string> = {
      patient:
        "Be gentle, supportive, and break down recommendations into manageable steps.",
      encouraging:
        "Be enthusiastic, celebratory, and focus on achievements while motivating improvement.",
      challenging:
        "Be direct, push for excellence, and set ambitious but achievable goals.",
      humorous:
        "Be light-hearted, use friendly humor, and make learning feel fun.",
    };

    const personalityStyle =
      personalityPrompts[tutorPersonality] || personalityPrompts.patient;

    const systemPrompt = `You are ${tutorName}, a personal AI math tutor. ${personalityStyle}

Generate 2-3 brief, personalized daily insights for ${studentName} based on their learning data. Each insight should be:
- Specific and actionable
- Based on their actual progress data
- Encouraging but honest
- Maximum 1-2 sentences each

Return a JSON object with this exact structure:
{
  "greeting": "A personalized greeting mentioning their name",
  "mainFocus": "The primary recommendation for today (which topic to focus on and why)",
  "insights": [
    {"type": "strength", "text": "Something they're doing well"},
    {"type": "improvement", "text": "An area to work on"},
    {"type": "tip", "text": "A helpful study tip or motivation"}
  ],
  "motivationalNote": "A brief encouraging closing thought"
}`;

    const userPrompt = `Student: ${studentName}
Current Streak: ${currentStreak} days
Total XP: ${totalXp}
Topic Progress: ${progressSummary}
Weak Areas: ${weakAreas}
Recent Activity: ${recentActivity || "First session today"}

Generate personalized daily insights for this student.`;

    console.log("Generating insights for:", studentName);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_completion_tokens: 900,
        }),
      },
    );

    if (!response.ok) {
      // IMPORTANT: return 200 with a fallback payload so the client SDK doesn't treat it as a hard error.
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again later.",
            fallback: true,
            rate_limited: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits depleted.",
            fallback: true,
            credits_depleted: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI gateway response:", JSON.stringify(data).slice(0, 500));
    const content = data.choices?.[0]?.message?.content;

    // If there's no content, return a fallback (don't throw – that causes 500)
    if (!content) {
      console.warn("Empty content from AI; returning fallback.");
      const fallback = {
        greeting: `Hey ${studentName}!`,
        mainFocus: weakSubtopics?.[0]
          ? `Let's work on ${weakSubtopics[0].subtopic_name} today.`
          : "Ready to keep learning?",
        insights: [{ type: "tip", text: "Small steps every day lead to mastery." }],
        motivationalNote: "You've got this!",
        fallback: true,
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the JSON response
    let insights;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      insights = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a fallback response
      insights = {
        greeting: `Good to see you, ${studentName}!`,
        mainFocus: weakSubtopics?.[0]
          ? `Based on your progress, let's focus on ${weakSubtopics[0].subtopic_name} today.`
          : "Let's continue building your math skills today!",
        insights: [
          {
            type: "tip",
            text: "Consistent practice is key to mastering mathematics.",
          },
        ],
        motivationalNote: "Every problem you solve makes you stronger!",
      };
    }

    console.log("Generated insights successfully");

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred processing your request",
        fallback: true,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

