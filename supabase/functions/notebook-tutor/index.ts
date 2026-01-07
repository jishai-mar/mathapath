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
    const { message, selectedEntry, allEntries, conversationHistory } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Build context about the student's notebook
    const entrySummary = allEntries ? `
Student's Notebook Summary:
- Total entries: ${allEntries.length}
- Breakthroughs: ${allEntries.filter((e: any) => e.note_type === 'breakthrough').length}
- Struggles: ${allEntries.filter((e: any) => e.note_type === 'struggle').length}
- Interests: ${allEntries.filter((e: any) => e.note_type === 'interest').length}

Recent struggles to address:
${allEntries.filter((e: any) => e.note_type === 'struggle').slice(0, 5).map((e: any) => `- ${e.content} ${e.subtopic_name ? `(${e.subtopic_name})` : ''}`).join('\n')}

Recent breakthroughs:
${allEntries.filter((e: any) => e.note_type === 'breakthrough').slice(0, 3).map((e: any) => `- ${e.content}`).join('\n')}
` : '';

    const selectedContext = selectedEntry ? `
Currently selected entry:
Type: ${selectedEntry.note_type}
Topic: ${selectedEntry.subtopic_name || 'General'}
Content: ${selectedEntry.content}
` : '';

    const systemPrompt = `You are a supportive AI math tutor helping a student review their learning notebook. You have access to their past breakthroughs, struggles, and interests.

${entrySummary}

${selectedContext}

Your role in the notebook:
1. **Analyze patterns**: Identify recurring struggles or successful learning moments
2. **Suggest exercises**: When a student wants to practice, generate a targeted problem based on their struggles
3. **Explain connections**: Help them see how past learnings connect
4. **Turn struggles into breakthroughs**: Guide them to overcome challenges they've recorded
5. **Celebrate progress**: Acknowledge their growth when reviewing breakthroughs

=== PRECISION IN MATH LANGUAGE ===

MANDATORY - Use precise mathematical notation:
- Square roots: $\\sqrt{x}$, NEVER "square root of x"
- Exponents: $x^2$, $x^3$, $x^n$ in LaTeX
- Fractions: $\\frac{a}{b}$, NEVER "a divided by b"
- Inequalities: $\\leq$, $\\geq$, $\\neq$
- ALL math in LaTeX: inline $...$ or display $$...$$

BANNED - NO conversational filler:
❌ "Let's try this one!"
✅ State problems directly: "Solve: $\\sqrt{x} = 5$"

=== VISUAL DEMONSTRATION MANDATE ===

NEVER explain only in words. Include visuals:
- Number comparisons → [NUMBER-LINE: min=-5, max=5, points=[2, -1]]
- Formulas by topic → [FORMULA-TABLE: quadratic]
- Functions → [GRAPH: y = function]
- Geometry → [GEOMETRY: ΔABC] or [DIAGRAM: right-triangle]

=== EMBEDDED TOOL TRIGGERS ===

- Algebraic work → [CALCULATE: expression]
- Graphable content → [GRAPH: y = ...]
- Geometric concepts → [GEOMETRY: shape-description]

=== TOPIC-SPECIFIC GRAPHS ===

When graphing, include features:
- Quadratics: [GRAPH: y=x²-4, highlight: vertex, axis of symmetry, roots]
- Systems: [GRAPH: y=2x+1, y=-x+4, highlight: intersection]
- Absolute values: [GRAPH: y=|x-2|, highlight: vertex, V-shape]

Response guidelines:
- Keep responses concise but helpful (2-4 sentences unless explaining a concept)
- When suggesting an exercise, format it clearly:

[EXERCISE]
Solve for $x$: $2x^2 - 8 = 0$
[/EXERCISE]

When the notebook first opens, give a brief, warm greeting mentioning any patterns you notice (e.g., "I see you've been working hard on quadratics - you had 2 breakthroughs this week!").`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    console.log('Calling Lovable AI for notebook tutor...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages,
        stream: true,
        max_completion_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      const fallbackResponse = {
        content: "I'm temporarily unavailable. Please try again in a moment.",
        fallback: true,
        rate_limited: response.status === 429,
        credits_depleted: response.status === 402,
      };
      
      return new Response(JSON.stringify(fallbackResponse), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in notebook-tutor:', error);
    return new Response(JSON.stringify({ error: 'An error occurred processing your request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
