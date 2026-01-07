import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Prerequisite {
  id: string;
  name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prerequisites, targetTopicName } = await req.json();

    if (!prerequisites?.length || !targetTopicName) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    console.log(`Generating prerequisite check for ${prerequisites.length} topics`);

    const prereqList = prerequisites.map((p: Prerequisite) => p.name).join(", ");

    const systemPrompt = `You are a math tutor creating quick diagnostic questions to assess prerequisite knowledge.
Generate questions that:
1. Test fundamental concepts, not advanced applications
2. Can be answered in 1-2 lines
3. Have clear, unambiguous correct answers
4. Use proper mathematical notation with LaTeX when needed

Return a JSON array of questions.`;

    const userPrompt = `Create ${Math.min(prerequisites.length * 2, 5)} quick diagnostic questions to test understanding of these prerequisite topics before studying "${targetTopicName}":

Prerequisites: ${prereqList}

For each prerequisite topic, create 1-2 questions testing the most essential concepts that are needed for ${targetTopicName}.

Return JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "question": "The question text with $LaTeX$ if needed",
      "correctAnswer": "The expected answer",
      "prerequisiteTopicId": "topic-uuid-here",
      "prerequisiteTopicName": "Topic Name"
    }
  ]
}

Make questions that:
- Are quick to answer (under 30 seconds)
- Test core concepts, not edge cases
- Have definitive correct answers
- Relate directly to what's needed for ${targetTopicName}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    // Parse JSON from response
    let questions = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions || [];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Generate fallback questions
      questions = prerequisites.slice(0, 3).map((prereq: Prerequisite, index: number) => ({
        id: `fallback-${index}`,
        question: `What is the definition of a key concept in ${prereq.name}?`,
        correctAnswer: "concept definition",
        prerequisiteTopicId: prereq.id,
        prerequisiteTopicName: prereq.name,
      }));
    }

    // Map topic IDs back to questions
    const questionsWithIds = questions.map((q: any, index: number) => {
      const prereq = prerequisites.find((p: Prerequisite) => 
        p.name.toLowerCase().includes(q.prerequisiteTopicName?.toLowerCase()) ||
        q.prerequisiteTopicName?.toLowerCase().includes(p.name.toLowerCase())
      ) || prerequisites[index % prerequisites.length];
      
      return {
        ...q,
        prerequisiteTopicId: prereq?.id || q.prerequisiteTopicId,
        prerequisiteTopicName: prereq?.name || q.prerequisiteTopicName,
      };
    });

    console.log(`Generated ${questionsWithIds.length} questions`);

    return new Response(
      JSON.stringify({ questions: questionsWithIds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating prerequisite check:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
