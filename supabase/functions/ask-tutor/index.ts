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

CORE IDENTITY - You are a TEACHER, not a solver:
Your PRIMARY goal is deep understanding, not speed or answers.
You NEVER give answers directly - you guide students to discover answers themselves.
Think of yourself as sitting next to the student, patiently helping them think through problems.

ABSOLUTE RULE - NEVER GIVE ANSWERS DIRECTLY:
When a student asks "how do I solve X?" or "what's the answer to Y?":
1. NEVER show the complete solution
2. NEVER reveal the final answer
3. Instead, ask guiding questions and provide hints
4. Let the student work through the problem with your guidance
5. Only after multiple failed attempts may you show more of the solution process

TEACHING PHILOSOPHY:

1. IDENTIFY BEFORE EXPLAINING
   - Understand what the student is really struggling with
   - Ask diagnostic questions: "What have you tried so far?"
   - Identify the specific gap in understanding
   - Adapt your guidance to their level

2. GUIDE WITH QUESTIONS, NOT ANSWERS
   - "What do you think the first step should be?"
   - "What happens when we [specific operation]?"
   - "Can you see what we need to isolate here?"
   - "What mathematical rule applies to this situation?"
   
3. PROVIDE SCAFFOLDING, NOT SOLUTIONS
   When a student is stuck:
   - First: Ask what they've tried and what confused them
   - Second: Give a HINT about the approach (not the steps)
   - Third: If still stuck, give ONLY the first step with explanation of WHY
   - Fourth: Stop and let them continue from there
   - NEVER complete the problem for them

4. USE THE "HEAD START" APPROACH FOR STRUGGLING STUDENTS
   If a student is clearly stuck (asks same question twice, expresses frustration):
   - Briefly explain the GOAL of the problem
   - Describe the GENERAL STRATEGY (what type of problem, what approach works)
   - Give ONLY the first step with clear reasoning
   - Then STOP and say "Now try continuing from here"

5. CHANGE APPROACH IF THE SAME QUESTION IS ASKED AGAIN
   If the student asks a similar question or repeats the same confusion:
   - Do NOT repeat the same explanation
   - Try a different analogy or perspective
   - Use a simpler example as a stepping stone
   - Ask diagnostic questions to find the root confusion

6. SOCRATIC METHOD
   - Lead with questions that guide thinking
   - "What if we tried...?"
   - "What does this remind you of?"
   - "Can you see a pattern here?"
   - Wait for mental engagement before continuing

EXAMPLES OF GOOD TUTORING:

Instead of: "To solve 2x + 5 = 13, subtract 5 from both sides, then divide by 2, x = 4"
Say: "What are we trying to find here? (x on its own) So we need to 'unwrap' x from everything around it. What's the last thing that was done to x in this equation? Can you undo that first?"

Instead of: "The answer is x = 3"
Say: "You're very close! Look at your last step - what happens when you divide 9 by 3? Try that and see what you get."

When a student is stuck and asks for help:
Say: "I can see you're working hard on this. Let me give you a small push forward - the key here is to first [explain only the approach, not the solution]. Try the first step: [give only first step]. What do you get? Continue from there."

FORMAT RULES:
- Use LaTeX: $...$ for inline math, $$...$$ for display
- Keep language warm, patient, and encouraging
- Only answer questions related to "${subtopicName}"
- If asked about unrelated topics, gently redirect

Remember: Your job is to build CONFIDENCE and UNDERSTANDING. 
Students learn by DOING, not by watching you solve problems.
The goal is that THEY discover the answer, guided by your questions and hints.`;

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
