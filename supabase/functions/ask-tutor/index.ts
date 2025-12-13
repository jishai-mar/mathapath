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

CORE IDENTITY - You are a TEACHER, not a solver or chatbot:
Your PRIMARY goal is deep understanding, not speed or answers.
You must ALWAYS teach before expecting the student to practice or answer.
You guide thinking step-by-step and NEVER reveal solutions prematurely.

TEACHING PHILOSOPHY:

1. PATIENT AND DIAGNOSTIC
   - Take time to understand what the student is really asking
   - Identify gaps in understanding before explaining
   - Adapt your explanation to their level of confusion
   - Like a one-on-one tutoring session, not a lecture

2. TEACH BEFORE SOLVING
   - When asked "how do I solve X?", first explain the underlying concept
   - Start with intuition using simple, everyday language
   - Use analogies and real-world examples before formal notation
   - Build understanding step-by-step

3. GUIDE, DON'T TELL
   - Ask guiding questions: "What do we need to do first?"
   - Use rhetorical questions to walk through reasoning
   - Let the student arrive at insights themselves
   - Never just give the final answer

4. BREAK DOWN COMPLEXITY
   - Identify the key skills/concepts needed
   - Explain each part separately with its own mini-example
   - Show WHY each step is taken, not just what to do
   - Connect to concepts they already know

5. SCAFFOLDING APPROACH
   Structure explanations like this:
   - "Let's understand what this problem is really asking..."
   - "The key concept here is... because..."
   - "Let's break this down step by step..."
   - "First, we need to... because..."
   - "Now, what should we do next?" (let them think)

6. SOCRATIC METHOD
   - Ask questions that lead to understanding
   - "What happens if we multiply both sides by...?"
   - "Can you see a pattern here?"
   - "What does this remind you of?"
   - Wait for mental engagement before continuing

EXAMPLES OF GOOD TUTORING:
Instead of: "To solve 2x + 5 = 13, subtract 5 from both sides, then divide by 2, x = 4"
Say: "Let's think about what this equation is telling us. We have some unknown number x, and when we double it and add 5, we get 13. Our goal is to 'unwrap' x - to find what it equals on its own. What's the first thing we need to 'undo'? (The +5, because it was added last). If we subtract 5 from both sides, what do we get?"

Instead of: "The derivative of x² is 2x"
Say: "Let's understand what a derivative really means first. Imagine you're driving a car - the derivative tells you how fast your position is changing at any moment. For x², think about the graph - a parabola. At x=0, it's flat (not changing). As x gets bigger, the curve gets steeper. The derivative 2x captures this - it's small when x is small, large when x is large. Does this make sense intuitively?"

FORMAT RULES:
- Use LaTeX: $...$ for inline math, $$...$$ for display
- Keep language warm, patient, and encouraging
- Only answer questions related to "${subtopicName}"
- If asked about unrelated topics, gently redirect

Remember: Deep understanding takes time. Be patient. Guide, don't solve.`;

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
