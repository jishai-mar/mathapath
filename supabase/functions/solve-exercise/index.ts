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
7. Geef ALTIJD minimaal 3 stappen en maximaal 6 stappen

BELANGRIJK: Antwoord ALLEEN met geldige JSON (geen Markdown, geen codeblokken).

ELKE OEFENING MOET EEN VOLLEDIGE UITWERKING HEBBEN:
- Stap 1: Identificeer wat er gevraagd wordt en welke methode je gaat gebruiken
- Stap 2-4: Werk de berekening stap voor stap uit
- Laatste stap: Geef het eindantwoord en controleer eventueel

MEERDERE OPLOSSINGEN - ZEER BELANGRIJK:
Wanneer een vergelijking meerdere oplossingen heeft, moet je ELKE oplossing apart tonen:
- Gebruik altijd de variabelenaam (bijv. "x =", "y =")
- Formatteer het eindantwoord als GESCHEIDEN oplossingen met " of " ertussen
- Voorbeeld: "x = 2 of x = -2" (niet "x = ±2")
- Bij kwadratische vergelijkingen: toon BEIDE wortels apart
- Bij geen reële oplossingen: schrijf "Geen reële oplossingen"

Voorbeelden van correcte finalAnswer formatting:
- x² = 4 → "x = 2 of x = -2"
- (x-1)(x+3) = 0 → "x = 1 of x = -3"
- x² - 5x + 6 = 0 → "x = 2 of x = 3"
- x² + 1 = 0 → "Geen reële oplossingen"
- 2x + 5 = 9 → "x = 2"

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
  "finalAnswer": "Het uiteindelijke antwoord met alle oplossingen gescheiden door ' of '",
  "tip": "Een handige tip die de leerling kan onthouden voor soortgelijke opgaven"
}`;
    const userPrompt = `Werk deze wiskundeoefening volledig uit met stap-voor-stap uitleg.
BELANGRIJK: Geef ALTIJD minimaal 3 stappen, ook voor eenvoudige opgaven.

ONDERWERP: ${subtopicName || 'Wiskunde'}

OPGAVE: ${question}

${correctAnswer ? `CORRECT ANTWOORD: ${correctAnswer}` : ''}

Geef een complete uitwerking met:
1. Een stap die het probleem identificeert en de aanpak beschrijft
2. Tussenstappen die de berekening uitwerken
3. Een eindstap met het antwoord (bij meerdere oplossingen: gescheiden door " of ")`;


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
        max_completion_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      const fallbackSolution = {
        steps: [{ stepNumber: 1, title: "Fout", explanation: "Er ging iets mis.", math: "", voiceover: "Probeer het later opnieuw." }],
        finalAnswer: "Niet beschikbaar",
        tip: "Probeer het later opnieuw.",
        fallback: true,
        rate_limited: response.status === 429,
        credits_depleted: response.status === 402,
      };
      
      return new Response(
        JSON.stringify(fallbackSolution),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let solution: SolutionResponse;
    try {
      // The model sometimes wraps JSON in markdown code fences; strip them.
      let jsonText = String(content).trim();

      const fenced = jsonText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
      if (fenced?.[1]) {
        jsonText = fenced[1].trim();
      } else {
        // Fallback: extract the first JSON object in the text.
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonText = jsonText.slice(firstBrace, lastBrace + 1);
        }
      }

      solution = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({
          steps: [{ stepNumber: 1, title: 'Fout', explanation: 'Het antwoord van de tutor had een onverwacht formaat.', math: '', voiceover: 'Probeer het later opnieuw.' }],
          finalAnswer: 'Niet beschikbaar',
          tip: 'Probeer het later opnieuw.',
          fallback: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
