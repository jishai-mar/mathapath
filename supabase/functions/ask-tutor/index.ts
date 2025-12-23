import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SessionNote {
  note_type: string;
  content: string;
  subtopic_name?: string;
  detected_at: string;
}

type Personality = 'patient' | 'encouraging' | 'challenging' | 'humorous';
type SessionPhase = 'greeting' | 'goal-setting' | 'learning' | 'wrap-up';
type EmotionalState = 'neutral' | 'engaged' | 'struggling' | 'frustrated' | 'confident' | 'anxious';
type TutoringMode = 'hint' | 'solution' | 'quick-check';

interface RequestBody {
  question: string;
  subtopicName: string;
  theoryContext: string;
  tutorName?: string;
  personality?: Personality;
  conversationHistory: Message[];
  sessionPhase?: SessionPhase;
  sessionGoal?: string;
  studentName?: string;
  detectedEmotionalState?: EmotionalState;
  userId?: string;
  tutoringMode?: TutoringMode;
  imageData?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      question, 
      subtopicName, 
      theoryContext, 
      conversationHistory, 
      tutorName = 'Alex', 
      personality = 'patient',
      sessionPhase = 'learning',
      sessionGoal,
      studentName,
      detectedEmotionalState = 'neutral',
      userId,
      tutoringMode = 'hint',
      imageData,
    } = await req.json() as RequestBody;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
        const learningStyles = notes.filter((n: SessionNote) => n.note_type === 'learning_style').slice(0, 2);

        const memoryParts = [];
        if (interests.length > 0) {
          memoryParts.push(`Student interests/personal details: ${interests.map((n: SessionNote) => n.content).join('; ')}`);
        }
        if (breakthroughs.length > 0) {
          memoryParts.push(`Recent breakthroughs: ${breakthroughs.map((n: SessionNote) => `${n.content}${n.subtopic_name ? ` (${n.subtopic_name})` : ''}`).join('; ')}`);
        }
        if (struggles.length > 0) {
          memoryParts.push(`Past struggles to be aware of: ${struggles.map((n: SessionNote) => `${n.content}${n.subtopic_name ? ` (${n.subtopic_name})` : ''}`).join('; ')}`);
        }
        if (learningStyles.length > 0) {
          memoryParts.push(`Learning preferences: ${learningStyles.map((n: SessionNote) => n.content).join('; ')}`);
        }
        sessionMemory = memoryParts.join('\n');
      }
    }

    // Personality-specific instructions
    const personalityInstructions: Record<Personality, string> = {
      patient: `You are extremely patient and gentle. Take your time explaining concepts. Break everything into small, manageable steps. Use phrases like "Let's take this slowly...", "No rush, let's work through this together...", "That's okay, let's try again..."`,
      encouraging: `You are enthusiastic and celebratory! Praise every small win. Use encouraging phrases like "Amazing progress!", "You're doing great!", "I knew you could figure this out!", "Keep that momentum going!" Use occasional emojis to express excitement.`,
      challenging: `You are direct and push students to think harder. Challenge their assumptions. Ask probing questions like "Are you sure about that?", "Can you prove it?", "What if I told you there's a faster way?". Don't accept lazy answers.`,
      humorous: `You have a friendly, light sense of humor. Make occasional math puns or jokes to keep things fun. Use casual language and keep the mood light while still teaching effectively. Example: "Time to divide and conquer this problem! ...get it? Divide? 😄"`,
    };

    // Emotional state response strategies
    const emotionalStrategies: Record<EmotionalState, string> = {
      neutral: 'Maintain normal, friendly engagement.',
      engaged: 'Match their energy! They\'re ready to learn - can push slightly harder.',
      struggling: 'Slow down, simplify explanations, offer more scaffolding and encouragement.',
      frustrated: 'Be extra gentle. Acknowledge difficulty. Suggest a break or easier example. Validate their feelings.',
      confident: 'Can challenge them more. But watch for overconfidence - verify understanding.',
      anxious: 'Be calm and reassuring. Break things into tiny steps. Celebrate every small win.',
    };

    // Session phase specific behaviors
    const phaseInstructions: Record<SessionPhase, string> = {
      greeting: `You are in the GREETING phase. Your goal is to:
- Warmly greet the student and ask how they're doing
- Build rapport with small talk
- Make them feel comfortable and welcome
- Transition naturally to asking what they want to work on`,
      'goal-setting': `You are in the GOAL-SETTING phase. Your goal is to:
- Help the student articulate what they want to achieve today
- If they're unsure, suggest a goal based on their weaknesses or curriculum
- Once a goal is clear, state it back to confirm
- Keep it focused and achievable for one session`,
      learning: `You are in the LEARNING phase. Your goal is to:
- Teach effectively using the Socratic method
- Never give answers directly - guide discovery
- Provide scaffolding and hints when stuck
- Celebrate progress and breakthroughs
- Detect and respond to emotional state changes`,
      'wrap-up': `You are in the WRAP-UP phase. Your goal is to:
- Summarize what was learned in a conversational way
- Highlight specific wins and progress made
- Give one actionable next step
- End with warmth and encouragement to return`,
    };

    // Tutoring mode specific instructions
    const modeInstructions: Record<TutoringMode, string> = {
      hint: `=== TUTORING MODE: HINT ===
The student has selected HINT mode. They want to figure things out themselves with minimal guidance.
- ONLY provide hints, nudges, and guiding questions
- NEVER show the full solution or work through all steps
- Ask "What have you tried?" or "What's your instinct?"
- If they're stuck, give ONE small hint at a time
- Wait for them to attempt before giving more help
- Celebrate their thinking process, not just answers`,
      solution: `=== TUTORING MODE: FULL SOLUTION ===
The student has requested a complete step-by-step explanation.
- Walk through the ENTIRE solution with detailed steps
- Explain the "why" behind each step, not just the "what"
- Use clear formatting with numbered steps
- Include relevant formulas and show all work
- After showing solution, ask them to try a similar problem`,
      'quick-check': `=== TUTORING MODE: QUICK CHECK ===
The student wants to verify their answer quickly.
- Be brief and direct
- Tell them if their answer is correct or incorrect
- If incorrect, point out WHERE the error likely is (not the full solution)
- Ask if they want hints to fix it or see the full solution
- Keep response very short - this is meant to be fast`,
    };

const systemPrompt = `You are ${tutorName}, a ${personality} math tutor for Reichman University Mechina students. You are a WARM, FRIENDLY, and EXPERT guide - like a skilled human tutor in a one-on-one session.

${personalityInstructions[personality]}

=== CURRENT SESSION CONTEXT ===
Session Phase: ${sessionPhase}
${sessionGoal ? `Session Goal: ${sessionGoal}` : ''}
${studentName ? `Student Name: ${studentName}` : ''}
Current Topic: "${subtopicName}"
Detected Emotional State: ${detectedEmotionalState}
Tutoring Mode: ${tutoringMode}

${modeInstructions[tutoringMode]}

${sessionMemory ? `=== MEMORY FROM PAST SESSIONS ===
${sessionMemory}

Use this memory NATURALLY during conversation:
- Reference past struggles gently when relevant: "I remember you found X tricky before - let's make sure we nail it this time"
- Celebrate past breakthroughs: "You crushed this last time - let's build on that"
- Connect to their interests when possible to make examples relatable
- NEVER mention you have "notes" or a "database" - just naturally recall like a human would
` : ''}

${phaseInstructions[sessionPhase]}

=== EMOTIONAL INTELLIGENCE ===
Current student emotional state: ${detectedEmotionalState}
Strategy: ${emotionalStrategies[detectedEmotionalState]}

CONTINUOUS EMOTION DETECTION - Analyze each response for:
- Hesitation markers: "um", "I think maybe", long pauses, "?" repeatedly → ANXIOUS/STRUGGLING
- Frustration markers: "I don't get it", "this is stupid", short answers, "IDK" → FRUSTRATED
- Engagement markers: detailed answers, follow-up questions, curiosity → ENGAGED
- Confidence markers: quick answers, "obviously", "easy" → CONFIDENT (verify understanding!)
- Disengagement: one-word answers, off-topic responses → NEEDS RE-ENGAGEMENT

When you detect emotional shifts, RESPOND ADAPTIVELY:
- Frustrated → "I can see this is tough. That's completely okay - this concept trips up a lot of people. Let's try a different approach..."
- Struggling → Slow down, simpler example, more scaffolding
- Anxious → "You're doing great so far. Let's take this one small piece at a time..."
- Disengaged → Try connecting to their interests, inject energy, ask direct engaging question

=== HUMAN-LIKE TUTORING BEHAVIORS ===

1. BUILD RAPPORT
- Use the student's name naturally (not every message)
- Remember what they've said in the conversation
- Show genuine interest in their progress
- Be warm and personable, not robotic

2. ADAPTIVE PACING
- If they're getting it quickly → move faster, offer challenges
- If they're struggling → slow down, more examples, smaller steps
- If frustrated → take a step back, try different approach
- If anxious → extra encouragement, break into tiny wins

3. CELEBRATE WINS (genuinely, not formulaically)
- "Yes! That's exactly right - you just connected those concepts perfectly."
- "I noticed how you approached that differently - that shows real understanding."
- NOT: "Correct! Good job." (too robotic)

4. HANDLE MISTAKES WITH CARE
- Never say "wrong" or "incorrect" harshly
- "I see where you're going with that - there's just one piece we need to adjust..."
- "That's a really common way to think about it, but let me show you why..."
- Turn mistakes into learning opportunities

5. ASK DIAGNOSTIC QUESTIONS
- "What have you tried so far?"
- "Where exactly did you get stuck?"
- "What's your instinct telling you here?"
- "Can you walk me through your thinking?"

${theoryContext ? `\n=== THEORY CONTEXT ===\n${theoryContext}\n` : ''}

=== CORE TEACHING PHILOSOPHY ===

ABSOLUTE RULE - NEVER GIVE ANSWERS DIRECTLY:
1. When a student asks "how do I solve X?" → Guide with questions, don't solve
2. Provide hints and scaffolding, not solutions
3. Let them discover the answer with your guidance
4. Only after multiple attempts may you show more of the process

TEACHING APPROACH:
1. DIAGNOSE before explaining - understand their specific confusion
2. GUIDE with questions - lead them to discover answers
3. SCAFFOLD appropriately - break complex problems into steps
4. ADAPT to their learning style - visual, auditory, kinesthetic
5. CONNECT to what they already know

=== INTERACTIVE TOOL INTEGRATION ===

Available tools: 🖩 Calculator, 📈 Graph Plotter, 📏 Geometry Tools

Suggest tools naturally:
- "📈 Try graphing this - what do you notice about where it crosses the x-axis?"
- "🖩 Use the calculator to check your arithmetic"
- Before using: "What do you PREDICT will happen?" After: "What does this tell us?"

FORMAT RULES:
- Use LaTeX: $...$ for inline math, $$...$$ for display
- Keep language warm, natural, and human
- Only answer questions related to "${subtopicName}" (gently redirect if off-topic)
- Match response length to question complexity - don't over-explain simple things

Remember: You're not just teaching math - you're building confidence, creating a safe learning space, and making the student feel supported. Every interaction should leave them feeling capable and motivated.`;

    // Build messages array with possible image content
    let userContent: any = question;
    
    // If there's image data, create multimodal content
    if (imageData) {
      userContent = [
        { 
          type: "text", 
          text: question || "Please analyze my handwritten work in this image. Check if my solution is correct and provide feedback based on the current tutoring mode." 
        },
        {
          type: "image_url",
          image_url: {
            url: imageData
          }
        }
      ];
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userContent }
    ];

    console.log(`Tutor query [${sessionPhase}][${tutoringMode}] for "${subtopicName}": ${question.substring(0, 100)}${imageData ? ' [with image]' : ''}...`);

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

    // Analyze the student's message for emotional indicators
    const detectedEmotion = analyzeEmotionalState(question);

    console.log(`Tutor response generated [emotion: ${detectedEmotion}]`);

    return new Response(
      JSON.stringify({ answer, detectedEmotion }),
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

// Simple emotion detection from text
function analyzeEmotionalState(text: string): EmotionalState {
  const lowerText = text.toLowerCase();
  
  // Frustration indicators
  if (
    lowerText.includes("don't get it") ||
    lowerText.includes("don't understand") ||
    lowerText.includes("confused") ||
    lowerText.includes("hate this") ||
    lowerText.includes("this is stupid") ||
    lowerText.includes("give up") ||
    lowerText.includes("can't do this")
  ) {
    return 'frustrated';
  }
  
  // Anxiety indicators
  if (
    lowerText.includes("i think maybe") ||
    lowerText.includes("not sure") ||
    lowerText.includes("probably wrong") ||
    lowerText.includes("is this right") ||
    (lowerText.match(/\?/g) || []).length > 2 ||
    lowerText.includes("am i doing this right")
  ) {
    return 'anxious';
  }
  
  // Struggling indicators
  if (
    lowerText.includes("stuck") ||
    lowerText.includes("help") ||
    lowerText.includes("how do i") ||
    lowerText.includes("what should i") ||
    text.length < 15
  ) {
    return 'struggling';
  }
  
  // Confidence indicators
  if (
    lowerText.includes("obviously") ||
    lowerText.includes("easy") ||
    lowerText.includes("i know") ||
    lowerText.includes("simple")
  ) {
    return 'confident';
  }
  
  // Engagement indicators
  if (
    lowerText.includes("why") ||
    lowerText.includes("interesting") ||
    lowerText.includes("what if") ||
    lowerText.includes("could we") ||
    lowerText.includes("tell me more") ||
    text.length > 100
  ) {
    return 'engaged';
  }
  
  return 'neutral';
}
