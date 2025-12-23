import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SolutionStep {
  stepNumber: number;
  title: string;
  explanation: string;
  math: string;
  voiceover: string;
}

interface SolutionResponse {
  steps: SolutionStep[];
  finalAnswer: string;
  tip: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, subtopicName, correctAnswer } = await req.json();

    if (!question) {
      throw new Error('Question is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Je bent een vriendelijke en geduldige wiskundeleraar die stap-voor-stap uitleg geeft aan leerlingen.
Je doel is om de oefening volledig uit te werken zodat de leerling begrijpt HOE je tot het antwoord komt.

BELANGRIJKE REGELS:
1. Spreek de leerling direct aan (gebruik "je" en "we")
2. Gebruik Nederlandse termen voor wiskundige concepten
3. Wees bemoedigend en positief
4. Elke stap moet klein en begrijpelijk zijn
5. De voiceover moet natuurlijk klinken wanneer voorgelezen
6. Gebruik LaTeX notatie voor wiskundige formules in het "math" veld
7. Geef 3-6 stappen, afhankelijk van de complexiteit

RESPONSE FORMAT (JSON):
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Korte titel van deze stap",
      "explanation": "Uitleg in gewone woorden wat we gaan doen",
      "math": "LaTeX formule die hoort bij deze stap",
      "voiceover": "Dit is de tekst die wordt voorgelezen. Schrijf getallen uit (bijv. 'twee x plus vijf' in plaats van '2x + 5')"
    }
  ],
  "finalAnswer": "Het uiteindelijke antwoord",
  "tip": "Een handige tip die de leerling kan onthouden voor soortgelijke opgaven"
}`;

    const userPrompt = `Werk deze wiskundeoefening volledig uit met stap-voor-stap uitleg:

ONDERWERP: ${subtopicName || 'Wiskunde'}

OPGAVE: ${question}

${correctAnswer ? `CORRECT ANTWOORD: ${correctAnswer}` : ''}

Geef een complete uitwerking die de leerling helpt begrijpen hoe je tot het antwoord komt.`;

    console.log('Generating solution for:', question);

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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Te veel verzoeken, probeer het later opnieuw.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Geen credits meer, neem contact op met support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let solution: SolutionResponse;
    try {
      solution = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    // Validate response structure
    if (!solution.steps || !Array.isArray(solution.steps) || solution.steps.length === 0) {
      throw new Error('Invalid solution structure');
    }

    console.log('Generated solution with', solution.steps.length, 'steps');

    return new Response(
      JSON.stringify(solution),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('solve-exercise error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
