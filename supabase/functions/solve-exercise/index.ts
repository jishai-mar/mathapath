import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { question, subtopicName, correctAnswer, exerciseId } = await req.json();

    if (!question) {
      throw new Error('Question is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch correct answer from database if not provided but exerciseId is
    let actualCorrectAnswer = correctAnswer;
    if (!actualCorrectAnswer && exerciseId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: exercise } = await supabase
        .from('exercises')
        .select('correct_answer')
        .eq('id', exerciseId)
        .single();
      
      if (exercise?.correct_answer) {
        actualCorrectAnswer = exercise.correct_answer;
        console.log(`Fetched correct answer from DB: ${actualCorrectAnswer}`);
      }
    }

    const systemPrompt = `Je bent een vriendelijke en geduldige wiskundeleraar die stap-voor-stap uitleg geeft aan leerlingen.
Je doel is om de oefening volledig uit te werken zodat de leerling begrijpt HOE je tot het antwoord komt.

${actualCorrectAnswer ? `
=== KRITIEK: HET CORRECTE ANTWOORD IS BEKEND ===
CORRECT ANTWOORD: ${actualCorrectAnswer}

Je uitwerking MOET leiden tot dit exacte antwoord. Zorg dat elke stap correct is en uitkomt op: ${actualCorrectAnswer}
` : ''}

BELANGRIJKE REGELS:
1. Spreek de leerling direct aan (gebruik "je" en "we")
2. Gebruik Nederlandse termen voor wiskundige concepten
3. Wees bemoedigend en positief
4. Elke stap moet klein en begrijpelijk zijn
5. De voiceover moet natuurlijk klinken wanneer voorgelezen
6. Gebruik LaTeX notatie voor wiskundige formules in het "math" veld
7. Geef ALTIJD minimaal 3 stappen en maximaal 6 stappen
8. Je EINDANTWOORD moet EXACT overeenkomen met: ${actualCorrectAnswer || 'de oplossing die je berekent'}

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
  "finalAnswer": "${actualCorrectAnswer || 'Het uiteindelijke antwoord'}",
  "tip": "Een handige tip die de leerling kan onthouden voor soortgelijke opgaven"
}`;

    const userPrompt = `Werk deze wiskundeoefening volledig uit met stap-voor-stap uitleg.
BELANGRIJK: Geef ALTIJD minimaal 3 stappen, ook voor eenvoudige opgaven.

ONDERWERP: ${subtopicName || 'Wiskunde'}

OPGAVE: ${question}

${actualCorrectAnswer ? `HET CORRECTE ANTWOORD IS: ${actualCorrectAnswer}
Je uitwerking MOET uitkomen op dit antwoord.` : ''}

Geef een complete uitwerking met:
1. Een stap die het probleem identificeert en de aanpak beschrijft
2. Tussenstappen die de berekening uitwerken
3. Een eindstap met het antwoord: ${actualCorrectAnswer || '(bereken zelf)'}`;


    console.log('Generating solution for:', question, 'correct answer:', actualCorrectAnswer || 'unknown');

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
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      return new Response(
        JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, response.status)),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, 0)),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      console.error('Failed to parse AI response:', content.substring(0, 500));
      return new Response(
        JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, 0)),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate response structure
    if (!solution.steps || !Array.isArray(solution.steps) || solution.steps.length === 0) {
      console.warn('Invalid solution structure, using fallback');
      return new Response(
        JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, 0)),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure finalAnswer matches known correct answer
    if (actualCorrectAnswer) {
      solution.finalAnswer = actualCorrectAnswer;
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

/**
 * Creates a meaningful fallback solution when AI fails
 */
function createFallbackSolution(question: string, correctAnswer: string | undefined, subtopicName: string | undefined, statusCode: number) {
  const isQuadratic = question.toLowerCase().includes('x²') || question.includes('x^2');
  const isDerivative = question.toLowerCase().includes("f'") || question.toLowerCase().includes('derivative') || question.toLowerCase().includes('afgeleide');
  
  let steps: SolutionStep[];
  
  if (isDerivative) {
    steps = [
      {
        stepNumber: 1,
        title: "Identificeer de functie",
        explanation: "We bekijken welke functie we moeten afleiden.",
        math: question,
        voiceover: "Laten we eerst naar de functie kijken die we moeten afleiden."
      },
      {
        stepNumber: 2,
        title: "Pas de machtsregel toe",
        explanation: "Voor elke term xⁿ geldt: de afgeleide is n·xⁿ⁻¹",
        math: "\\frac{d}{dx}(x^n) = n \\cdot x^{n-1}",
        voiceover: "We gebruiken de machtsregel: vermenigvuldig met de exponent en verlaag de exponent met één."
      },
      {
        stepNumber: 3,
        title: "Eindantwoord",
        explanation: "Dit is de afgeleide van de oorspronkelijke functie.",
        math: correctAnswer ? `f'(x) = ${correctAnswer}` : "f'(x) = \\text{zie berekening}",
        voiceover: correctAnswer ? `De afgeleide is ${correctAnswer}` : "De afgeleide volgt uit de berekening."
      }
    ];
  } else if (isQuadratic) {
    steps = [
      {
        stepNumber: 1,
        title: "Herken het type vergelijking",
        explanation: "Dit is een kwadratische vergelijking van de vorm ax² + bx + c = 0.",
        math: question,
        voiceover: "We hebben hier een kwadratische vergelijking."
      },
      {
        stepNumber: 2,
        title: "Kies de juiste methode",
        explanation: "We kunnen factoriseren, de abc-formule gebruiken, of direct oplossen als de vorm eenvoudig is.",
        math: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        voiceover: "We kiezen de beste methode om deze vergelijking op te lossen."
      },
      {
        stepNumber: 3,
        title: "Eindantwoord",
        explanation: "De oplossing(en) van de vergelijking.",
        math: correctAnswer ? `x = ${correctAnswer}` : "x = \\text{zie berekening}",
        voiceover: correctAnswer ? `De oplossing is x is gelijk aan ${correctAnswer}` : "De oplossing volgt uit de berekening."
      }
    ];
  } else {
    steps = [
      {
        stepNumber: 1,
        title: "Analyseer de opgave",
        explanation: "We bekijken wat er gevraagd wordt en welke aanpak we nodig hebben.",
        math: question,
        voiceover: "Laten we eerst goed naar de opgave kijken."
      },
      {
        stepNumber: 2,
        title: "Werk systematisch",
        explanation: "We passen de juiste wiskundige operaties toe om tot de oplossing te komen.",
        math: "\\text{Pas inverse operaties toe}",
        voiceover: "We werken stap voor stap naar de oplossing."
      },
      {
        stepNumber: 3,
        title: "Eindantwoord",
        explanation: "Dit is de oplossing van de opgave.",
        math: correctAnswer || "\\text{Zie berekening}",
        voiceover: correctAnswer ? `Het antwoord is ${correctAnswer}` : "Het antwoord volgt uit de berekening."
      }
    ];
  }

  return {
    steps,
    finalAnswer: correctAnswer || "Zie de uitwerking hierboven",
    tip: "Controleer altijd je antwoord door het terug te substitueren in de oorspronkelijke vergelijking.",
    fallback: true,
    rate_limited: statusCode === 429,
    credits_depleted: statusCode === 402,
  };
}
