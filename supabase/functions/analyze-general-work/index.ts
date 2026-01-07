import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, problemDescription } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const systemPrompt = `You are an expert math tutor analyzing a student's handwritten work. Your job is to:

1. First identify what mathematical problem the student is solving
2. Trace through each step of their work carefully
3. Check the mathematical validity at each step
4. If there's an error, identify the FIRST point where it occurred
5. Explain the error in simple, student-friendly terms
6. Never just give the answer - guide understanding

Be encouraging but honest. Focus on helping the student learn from mistakes.

You MUST respond with valid JSON in this exact format:
{
  "identified_problem": "The problem the student appears to be solving",
  "is_correct": true/false,
  "solution_analysis": [
    { "step": 1, "content": "What the student wrote", "status": "correct" },
    { "step": 2, "content": "What the student wrote", "status": "correct" or "error", "expected": "only if error - what it should be" }
  ],
  "mistake_step": null or step number where first mistake occurred,
  "mistake_type": null or one of: "sign_error", "calculation_error", "distribution_error", "order_of_operations", "fraction_error", "algebraic_error", "conceptual_error", "other",
  "mistake_explanation": null or "Clear, student-friendly explanation of what went wrong",
  "how_to_fix": null or "Step-by-step guidance on how to correct the mistake",
  "encouragement": "A brief encouraging message",
  "mini_exercise": null or { "question": "A similar practice problem", "hint": "A helpful hint" },
  "topic_detected": "The math topic this relates to",
  "difficulty_estimate": "easy", "medium", or "hard"
}`;

    const userContent: any[] = [
      {
        type: "image_url",
        image_url: {
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
        }
      },
      {
        type: "text",
        text: problemDescription 
          ? `The student says they are working on: "${problemDescription}". Please analyze their handwritten work in the image.`
          : "Please analyze the student's handwritten math work in this image. Identify the problem they're solving and check if their solution is correct."
      }
    ];

    console.log("Sending request to Lovable AI...");

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
          { role: "user", content: userContent }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response received:", content.substring(0, 200));

    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content];
      const jsonStr = jsonMatch[1] || content;
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a structured error response
      analysis = {
        identified_problem: "Unable to parse the work",
        is_correct: null,
        solution_analysis: [],
        mistake_step: null,
        mistake_type: null,
        mistake_explanation: "I had trouble reading the handwritten work. Please try taking a clearer photo with better lighting.",
        how_to_fix: null,
        encouragement: "Don't worry! Try taking another photo with clearer handwriting.",
        mini_exercise: null,
        topic_detected: "Unknown",
        difficulty_estimate: "medium"
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-general-work:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Failed to analyze work" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
