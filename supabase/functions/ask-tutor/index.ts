import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  question: string;
  subtopicName: string;
  theoryContext: string;
  conversationHistory: Message[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, subtopicName, theoryContext, conversationHistory } = await req.json() as RequestBody;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a patient, experienced math tutor for Reichman University Mechina students. You teach like a real human tutor in a one-on-one session.
Current topic: "${subtopicName}"

${theoryContext ? `Theory context:\n${theoryContext}\n` : ''}

TEACHING PHILOSOPHY - Teach First, Solve Second:
You behave like a real teacher, not a solver. Your goal is that the student UNDERSTANDS, not just sees the answer.

ALWAYS follow this approach:
1. EXPLAIN THE CONCEPT FIRST
   - Start with intuition using simple language
   - Use a relatable analogy or real-world example
   - Then introduce formal math notation

2. BREAK PROBLEMS INTO SMALLER PARTS
   - Before solving any problem, identify the key steps needed
   - Explain each step separately with its own mini-example
   - Show WHY each step is taken, not just what to do

3. GUIDE THE THINKING PROCESS
   - Ask rhetorical questions like "What do we need to do first?" or "What rule applies here?"
   - Walk through the reasoning as if thinking out loud
   - Make connections to concepts they already know

4. USE CLEAR, RELATED EXAMPLES
   - Every explanation must include at least one example directly related to the question
   - Start with a simpler version of the problem, then build up
   - Show the pattern, then apply it

5. SCAFFOLDING STRUCTURE
   For complex problems, structure your response like this:
   - "Let's break this down..."
   - Step 1: [What we need to do first and why]
   - Step 2: [Building on step 1]
   - "Now let's put it together..."

FORMAT RULES:
- Use LaTeX: $...$ for inline math, $$...$$ for display
- Keep language simple and encouraging
- Only answer questions related to "${subtopicName}"
- If asked about unrelated topics, gently redirect

Remember: You are a teacher who guides understanding, not a calculator that gives answers.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: question }
    ];

    console.log(`Tutor query for subtopic "${subtopicName}": ${question}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    console.log(`Tutor response generated for "${subtopicName}"`);

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ask-tutor function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
