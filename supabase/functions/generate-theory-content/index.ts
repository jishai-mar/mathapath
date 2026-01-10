import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseAndValidate, generateTheoryContentSchema } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const validation = await parseAndValidate(req, generateTheoryContentSchema, corsHeaders);
    if (!validation.success) {
      return validation.response;
    }
    const { subtopicName, topicName } = validation.data;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating plain-text theory content for: ${subtopicName} (Topic: ${topicName})`);

    const systemPrompt = `You are an expert math tutor creating static lesson content.

CRITICAL FORMATTING RULES:
- Use PLAIN TEXT ONLY
- Do NOT use Markdown (no **, ##, -, bullets, or italics)
- Do NOT use LaTeX or math delimiters (no $, $$, or backslash commands)
- Write fractions as "a/b" or "a divided by b"
- Write exponents as "x squared" or "x to the power of 3"
- Write square roots as "the square root of x"
- Separate sections with clear labels followed by blank lines

OUTPUT FORMAT (plain text only):

TITLE:
[One-line lesson title]

EXPLANATION:
[Clear explanation of the concept in 2-3 short paragraphs. Use simple language. No symbols.]

METHOD:
[Step-by-step description of how to solve this type of problem. Write each step as a numbered sentence. Example:
1. First, identify the variable you need to solve for.
2. Then, move all terms with the variable to one side.
3. Finally, divide both sides by the coefficient.]

EXAMPLE 1:
Problem: [Write the problem in plain words and numbers]
Step 1: [Explain what to do first]
Step 2: [Explain the next action]
Step 3: [Continue until solved]
Answer: [The final answer]

EXAMPLE 2:
Problem: [A different problem]
Step 1: [Explanation]
Step 2: [Explanation]
Answer: [The final answer]

EXAMPLE 3:
Problem: [Another variation]
Step 1: [Explanation]
Step 2: [Explanation]
Answer: [The final answer]

SUMMARY:
[One short paragraph summarizing what the student learned and can now do.]

RULES:
- NO personalization or references to student progress
- NO motivational filler text
- Content must be factual and curriculum-based
- Assume knowledge only from earlier topics
- Keep language clear and beginner-friendly`;

    const userPrompt = `Create plain-text theory content for the lesson: "${subtopicName}" which is part of the topic: "${topicName}".

Follow the exact format specified. Use only plain text with no special formatting.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', fallback: true }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'API credits depleted.', fallback: true }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Failed to generate content', 
        fallback: true 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the plain text content into structured sections
    const parseTheoryContent = (text: string) => {
      const sections: Record<string, string> = {};
      const examples: Array<{ problem: string; steps: string[]; answer: string }> = [];
      
      // Split by section headers
      const lines = text.split('\n');
      let currentSection = '';
      let currentContent: string[] = [];
      let currentExample: { problem: string; steps: string[]; answer: string } | null = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check for section headers
        if (trimmedLine === 'TITLE:' || trimmedLine === 'EXPLANATION:' || 
            trimmedLine === 'METHOD:' || trimmedLine === 'SUMMARY:') {
          // Save previous section
          if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
          }
          currentSection = trimmedLine.replace(':', '');
          currentContent = [];
          currentExample = null;
        } else if (trimmedLine.match(/^EXAMPLE \d+:$/)) {
          // Save previous section or example
          if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
          }
          if (currentExample) {
            examples.push(currentExample);
          }
          currentSection = '';
          currentContent = [];
          currentExample = { problem: '', steps: [], answer: '' };
        } else if (currentExample !== null) {
          // Parse example content
          if (trimmedLine.toLowerCase().startsWith('problem:')) {
            currentExample.problem = trimmedLine.substring(8).trim();
          } else if (trimmedLine.toLowerCase().startsWith('answer:')) {
            currentExample.answer = trimmedLine.substring(7).trim();
          } else if (trimmedLine.match(/^step \d+:/i)) {
            currentExample.steps.push(trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim());
          } else if (trimmedLine && !trimmedLine.match(/^(problem|answer|step)/i)) {
            // Continuation of previous element
            if (currentExample.steps.length > 0) {
              currentExample.steps[currentExample.steps.length - 1] += ' ' + trimmedLine;
            } else if (currentExample.problem) {
              currentExample.problem += ' ' + trimmedLine;
            }
          }
        } else if (currentSection) {
          currentContent.push(line);
        }
      }
      
      // Save last section/example
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      if (currentExample && currentExample.problem) {
        examples.push(currentExample);
      }
      
      return { sections, examples };
    };
    
    const { sections, examples } = parseTheoryContent(content);
    
    // Build the explanation from parsed sections
    const explanationParts: string[] = [];
    if (sections.TITLE) {
      explanationParts.push(sections.TITLE);
    }
    if (sections.EXPLANATION) {
      explanationParts.push('', sections.EXPLANATION);
    }
    if (sections.METHOD) {
      explanationParts.push('', 'How to solve:', '', sections.METHOD);
    }
    if (sections.SUMMARY) {
      explanationParts.push('', 'Summary:', '', sections.SUMMARY);
    }
    
    const explanation = explanationParts.join('\n');
    
    // Convert examples to worked examples format
    const workedExamples = examples.map((ex, idx) => ({
      title: `Example ${idx + 1}`,
      problem: ex.problem,
      solution: ex.steps.length > 0 
        ? ex.steps.map((s, i) => `Step ${i + 1}: ${s}`).join('\n') + '\n\nAnswer: ' + ex.answer
        : 'Answer: ' + ex.answer
    }));

    console.log('Generated plain-text theory content successfully');
    console.log(`Parsed ${workedExamples.length} examples`);

    return new Response(JSON.stringify({
      explanation,
      workedExamples,
      rawContent: content
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-theory-content:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request', fallback: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
