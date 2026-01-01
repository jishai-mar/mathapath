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
  theoryReview?: string;  // Brief theory explanation relevant to this problem
  commonMistakes?: string[];  // List of common mistakes students make
  diagramType?: string;  // Type of visual diagram to show (e.g., 'quadratic-graph', 'chain-rule', 'number-line')
  diagramData?: Record<string, unknown>;  // Data for the diagram
  steps: SolutionStep[];
  finalAnswer: string;
  tip: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, subtopicName, correctAnswer, exerciseId, diagnosticQuestionId } = await req.json();

    if (!question) {
      throw new Error('Question is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch correct answer from database if not provided
    let actualCorrectAnswer = correctAnswer;
    
    if (!actualCorrectAnswer && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Try exercises table first
      if (exerciseId) {
        const { data: exercise } = await supabase
          .from('exercises')
          .select('correct_answer')
          .eq('id', exerciseId)
          .single();
        
        if (exercise?.correct_answer) {
          actualCorrectAnswer = exercise.correct_answer;
          console.log(`Fetched correct answer from exercises: ${actualCorrectAnswer}`);
        }
      }
      
      // Try diagnostic_questions table if still no answer
      if (!actualCorrectAnswer && diagnosticQuestionId) {
        const { data: diagQuestion } = await supabase
          .from('diagnostic_questions')
          .select('correct_answer')
          .eq('id', diagnosticQuestionId)
          .single();
        
        if (diagQuestion?.correct_answer) {
          actualCorrectAnswer = diagQuestion.correct_answer;
          console.log(`Fetched correct answer from diagnostic_questions: ${actualCorrectAnswer}`);
        }
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
4. Elke stap moet klein en begrijpelijk zijn - LEG ELKE BEREKENING VOLLEDIG UIT
5. De voiceover moet natuurlijk klinken wanneer voorgelezen
6. Gebruik LaTeX notatie voor wiskundige formules in het "math" veld
7. Geef ALTIJD minimaal 4 stappen en maximaal 7 stappen
8. Je EINDANTWOORD moet EXACT overeenkomen met: ${actualCorrectAnswer || 'de oplossing die je berekent'}

KRITIEK - UITGEBREIDE UITLEG:
- Elke stap MOET een volledige uitleg hebben (minimaal 2-3 zinnen)
- Leg uit WAAROM je elke stap doet, niet alleen WAT je doet
- Toon de volledige berekening, niet alleen de formule
- Bij afgeleiden: laat zien hoe je de regel toepast op ELKE term
- Bij vergelijkingen: toon elke omvorming expliciet

THEORIE SECTIE:
Begin ALTIJD met een theoryReview die kort de relevante theorie/regels uitlegt die nodig zijn voor dit type opgave. Dit helpt de leerling begrijpen welke kennis nodig is.

VEELGEMAAKTE FOUTEN:
Voeg ALTIJD een commonMistakes array toe met 2-3 veelgemaakte fouten die leerlingen maken bij dit type opgave. Dit helpt hen valkuilen te vermijden.
Voorbeelden: "Vergeten de kettingregel toe te passen", "Minteken verkeerd overnemen", "Discriminant verkeerd berekenen"

VISUEEL DIAGRAM:
Voeg een diagramType toe om aan te geven welk type diagram nuttig is:
- "quadratic-graph" voor kwadratische vergelijkingen (parabool)
- "chain-rule" voor kettingregel (geneste functies)
- "number-line" voor ongelijkheden
- "derivative-slope" voor afgeleiden (raaklijn)
- "formula-breakdown" voor formules uitleggen

MEERDERE OPLOSSINGEN - ZEER BELANGRIJK:
Wanneer een vergelijking meerdere oplossingen heeft, moet je ELKE oplossing apart tonen:
- Gebruik altijd de variabelenaam (bijv. "x =", "y =")
- Formatteer het eindantwoord als GESCHEIDEN oplossingen met " of " ertussen
- Voorbeeld: "x = 2 of x = -2" (niet "x = ±2")
- Bij kwadratische vergelijkingen: toon BEIDE wortels apart
- Bij geen reële oplossingen: schrijf "Geen reële oplossingen"

RESPONSE FORMAT (JSON):
{
  "theoryReview": "Een korte uitleg van de theorie/regels die je nodig hebt voor dit type opgave (2-4 zinnen). Bijvoorbeeld: 'Voor het differentiëren gebruiken we de kettingregel. Deze regel stelt dat...'",
  "commonMistakes": [
    "Eerste veelgemaakte fout die leerlingen maken",
    "Tweede veelgemaakte fout",
    "Derde veelgemaakte fout (optioneel)"
  ],
  "diagramType": "quadratic-graph | chain-rule | number-line | derivative-slope | formula-breakdown",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Korte titel van deze stap",
      "explanation": "UITGEBREIDE uitleg (minimaal 2-3 zinnen) die uitlegt wat we doen en WAAROM. Gebruik concrete getallen uit de opgave.",
      "math": "g'(x) = \\\\frac{1}{2}(4x^2 + 1)^{-\\\\frac{1}{2}} \\\\cdot 8x",
      "voiceover": "Dit is de tekst die wordt voorgelezen. Schrijf getallen uit (bijv. 'twee x plus vijf' in plaats van '2x + 5')"
    }
  ],
  
LATEX FORMULES - ZEER BELANGRIJK:
In het "math" veld gebruik je CORRECTE LaTeX syntax met dubbele backslashes voor JSON escaping:
- Breuken: "\\\\frac{teller}{noemer}" geeft een echte breuk
- Vermenigvuldiging: "\\\\cdot" voor een puntje, "\\\\times" voor een kruisje  
- Wortels: "\\\\sqrt{x}" voor vierkantswortels
- Machten: "x^{2}" of "x^{-\\\\frac{1}{2}}" voor negatieve of breuk exponenten
- Gelijk aan: "=" werkt gewoon
- Grieks: "\\\\alpha", "\\\\beta", etc.

VOORBEELD goede math formule voor kettingregel:
"math": "g'(x) = \\\\frac{1}{2}(4x^2 + 1)^{-\\\\frac{1}{2}} \\\\cdot 8x = \\\\frac{8x}{2\\\\sqrt{4x^2 + 1}} = \\\\frac{4x}{\\\\sqrt{4x^2 + 1}}"
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
        tools: [
          {
            type: 'function',
            function: {
              name: 'return_solution',
              description: 'Return a step-by-step math solution with theory review, common mistakes, diagram type, detailed explanation steps, final answer, and a study tip.',
              parameters: {
                type: 'object',
                properties: {
                  theoryReview: { 
                    type: 'string',
                    description: 'A brief explanation of the relevant theory/rules needed for this type of problem (2-4 sentences)'
                  },
                  commonMistakes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of 2-3 common mistakes students make with this type of problem'
                  },
                  diagramType: {
                    type: 'string',
                    enum: ['quadratic-graph', 'chain-rule', 'number-line', 'derivative-slope', 'formula-breakdown'],
                    description: 'Type of visual diagram to display for this problem'
                  },
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        stepNumber: { type: 'number' },
                        title: { type: 'string' },
                        explanation: { 
                          type: 'string',
                          description: 'Detailed explanation (2-3 sentences minimum) explaining WHAT we do and WHY'
                        },
                        math: { type: 'string' },
                        voiceover: { type: 'string' },
                      },
                      required: ['stepNumber', 'title', 'explanation', 'math', 'voiceover'],
                      additionalProperties: false,
                    },
                  },
                  finalAnswer: { type: 'string' },
                  tip: { type: 'string' },
                },
                required: ['theoryReview', 'commonMistakes', 'diagramType', 'steps', 'finalAnswer', 'tip'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'return_solution' } },
        max_completion_tokens: 2000,
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
    const msg = aiResponse.choices?.[0]?.message;

    // Preferred: tool-calling (guarantees structured JSON)
    const toolArgs = msg?.tool_calls?.[0]?.function?.arguments as string | undefined;

    let solution: SolutionResponse;
    if (toolArgs) {
      try {
        solution = JSON.parse(toolArgs);
      } catch (e) {
        console.error('Failed to parse tool arguments:', toolArgs.substring(0, 500));
        return new Response(
          JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, 0)),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Fallback: parse content (legacy)
      const content = msg?.content;
      if (!content) {
        console.error('No content in AI response');
        return new Response(
          JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, 0)),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        let jsonText = String(content).trim();

        const fenced = jsonText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
        if (fenced?.[1]) {
          jsonText = fenced[1].trim();
        } else {
          const firstBrace = jsonText.indexOf('{');
          const lastBrace = jsonText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonText = jsonText.slice(firstBrace, lastBrace + 1);
          }
        }

        solution = JSON.parse(jsonText);
      } catch {
        console.error('Failed to parse AI response:', String(content).substring(0, 500));
        return new Response(
          JSON.stringify(createFallbackSolution(question, actualCorrectAnswer, subtopicName, 0)),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
  const hasChainRule = question.includes('(') && (question.includes('^') || question.includes('²'));
  
  let steps: SolutionStep[];
  let theoryReview: string;
  let commonMistakes: string[];
  let diagramType: string;
  
  if (isDerivative) {
    theoryReview = hasChainRule 
      ? "Bij het differentiëren van samengestelde functies gebruiken we de kettingregel. De kettingregel stelt dat als je f(g(x)) wilt differentiëren, je eerst de buitenste functie differentieert en dan vermenigvuldigt met de afgeleide van de binnenste functie. Dit schrijven we als: [f(g(x))]' = f'(g(x)) · g'(x)."
      : "Bij het differentiëren gebruiken we de machtsregel: als f(x) = xⁿ, dan is f'(x) = n·xⁿ⁻¹. Dit betekent dat je de exponent naar voren haalt als coëfficiënt en de exponent met 1 verlaagt. Voor constanten geldt dat de afgeleide altijd 0 is.";
    
    commonMistakes = hasChainRule 
      ? [
          "Vergeten de binnenste functie te differentiëren (de kettingregel niet volledig toepassen)",
          "De volgorde van vermenigvuldiging omdraaien",
          "Tekens verkeerd overnemen bij negatieve coëfficiënten"
        ]
      : [
          "De exponent niet met 1 verlagen na differentiëren",
          "Vergeten dat de afgeleide van een constante 0 is",
          "Coëfficiënten niet correct vermenigvuldigen met de exponent"
        ];
    
    diagramType = hasChainRule ? "chain-rule" : "derivative-slope";
    
    steps = [
      {
        stepNumber: 1,
        title: "Identificeer de functie en bepaal de aanpak",
        explanation: "Eerst bekijken we de structuur van de functie die we moeten differentiëren. We identificeren alle termen en bepalen welke regels we nodig hebben. Let op samengestelde functies waarbij de kettingregel nodig is, en op producten of quotiënten die speciale regels vereisen.",
        math: question,
        voiceover: "Laten we eerst goed naar de functie kijken. We analyseren de structuur om te bepalen welke differentiatieregels we nodig hebben."
      },
      {
        stepNumber: 2,
        title: hasChainRule ? "Pas de kettingregel toe" : "Pas de machtsregel toe",
        explanation: hasChainRule 
          ? "We herkennen een samengestelde functie, dus we gebruiken de kettingregel. Dit betekent dat we eerst de buitenste functie differentiëren, en dan vermenigvuldigen met de afgeleide van de binnenste functie. Vergeet niet om de coëfficiënten correct mee te nemen in je berekening."
          : "Nu passen we de machtsregel toe op elke term. Voor xⁿ geldt: de afgeleide is n·xⁿ⁻¹. We halen de exponent naar voren als coëfficiënt en verlagen de exponent met 1. Als er al een coëfficiënt is, vermenigvuldigen we die met de nieuwe coëfficiënt.",
        math: hasChainRule 
          ? "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)"
          : "\\frac{d}{dx}(x^n) = n \\cdot x^{n-1}",
        voiceover: hasChainRule
          ? "We passen de kettingregel toe. Eerst differentiëren we de buitenste functie, en dan vermenigvuldigen we met de afgeleide van wat erin staat."
          : "We gebruiken de machtsregel: vermenigvuldig met de exponent en verlaag de exponent met één. Dit doen we voor elke term."
      },
      {
        stepNumber: 3,
        title: "Voer de berekeningen uit",
        explanation: "Nu werken we de berekening stap voor stap uit. We passen de regel(s) toe op elke term en combineren de resultaten. Let goed op de tekens en coëfficiënten, want hier worden vaak fouten gemaakt.",
        math: correctAnswer ? `f'(x) = ${correctAnswer}` : "f'(x) = \\text{werk stap voor stap uit}",
        voiceover: "We werken nu de berekening volledig uit. We letten goed op alle coëfficiënten en tekens."
      },
      {
        stepNumber: 4,
        title: "Vereenvoudig en controleer",
        explanation: "Tot slot vereenvoudigen we het resultaat zo veel mogelijk. Combineer gelijke termen, haal eventueel gemeenschappelijke factoren buiten haakjes, en schrijf het antwoord op de neatste manier. Je kunt controleren door te kijken of de graad van de afgeleide één lager is dan de oorspronkelijke functie.",
        math: correctAnswer ? `f'(x) = ${correctAnswer}` : "f'(x) = \\text{eindantwoord}",
        voiceover: correctAnswer ? `Na vereenvoudiging krijgen we de afgeleide: ${correctAnswer}` : "We vereenvoudigen tot het eindantwoord."
      }
    ];
  } else if (isQuadratic) {
    theoryReview = "Een kwadratische vergelijking heeft de vorm ax² + bx + c = 0. Om deze op te lossen gebruiken we de abc-formule (ook wel de discriminant-formule): x = (-b ± √(b² - 4ac)) / 2a. De discriminant D = b² - 4ac bepaalt het aantal oplossingen: D > 0 geeft twee oplossingen, D = 0 geeft één oplossing, en D < 0 betekent geen reële oplossingen.";
    
    commonMistakes = [
      "De discriminant verkeerd berekenen (let op: b² - 4ac, niet b² + 4ac)",
      "Vergeten dat -b betekent dat je het teken van b omdraait",
      "Slechts één oplossing geven terwijl er twee zijn (vergeet de ±)"
    ];
    
    diagramType = "quadratic-graph";
    
    steps = [
      {
        stepNumber: 1,
        title: "Herken het type vergelijking en schrijf in standaardvorm",
        explanation: "Dit is een kwadratische vergelijking. We schrijven deze eerst in de standaardvorm ax² + bx + c = 0, waarbij a, b en c de coëfficiënten zijn. Zorg dat alle termen aan één kant van het = teken staan en dat de vergelijking gelijk is aan nul.",
        math: question,
        voiceover: "We hebben hier een kwadratische vergelijking. Laten we deze in de standaardvorm schrijven zodat we a, b en c kunnen aflezen."
      },
      {
        stepNumber: 2,
        title: "Bepaal de coëfficiënten a, b en c",
        explanation: "Nu lezen we de waarden van a, b en c af uit de vergelijking. a is de coëfficiënt voor x², b is de coëfficiënt voor x, en c is de constante term. Let goed op de tekens: als er een minteken voor staat, is de waarde negatief.",
        math: "ax^2 + bx + c = 0",
        voiceover: "We identificeren de coëfficiënten: a is het getal voor x kwadraat, b is het getal voor x, en c is het losse getal."
      },
      {
        stepNumber: 3,
        title: "Bereken de discriminant",
        explanation: "De discriminant D = b² - 4ac vertelt ons hoeveel oplossingen de vergelijking heeft en helpt ons bij de berekening. Als D positief is, zijn er twee verschillende oplossingen. Als D nul is, is er één oplossing. Als D negatief is, zijn er geen reële oplossingen.",
        math: "D = b^2 - 4ac",
        voiceover: "We berekenen de discriminant door b kwadraat min vier maal a maal c uit te rekenen. Dit getal vertelt ons hoeveel oplossingen er zijn."
      },
      {
        stepNumber: 4,
        title: "Pas de abc-formule toe",
        explanation: "Nu vullen we alles in de abc-formule in: x = (-b ± √D) / 2a. Het ± teken betekent dat we twee berekeningen doen: één keer met plus en één keer met min. Dit geeft ons (als D > 0) twee oplossingen.",
        math: "x = \\frac{-b \\pm \\sqrt{D}}{2a}",
        voiceover: "We vullen alles in de abc-formule in. Het plus-min teken geeft ons twee mogelijke antwoorden."
      },
      {
        stepNumber: 5,
        title: "Schrijf de oplossingen op",
        explanation: "De oplossing(en) van de vergelijking. Bij twee oplossingen schrijven we beide waarden op, gescheiden door 'of'. Controleer je antwoord door de waarden terug te substitueren in de oorspronkelijke vergelijking.",
        math: correctAnswer ? `x = ${correctAnswer}` : "x = \\text{zie berekening}",
        voiceover: correctAnswer ? `De oplossingen zijn x is gelijk aan ${correctAnswer}` : "We noteren de oplossingen van de vergelijking."
      }
    ];
  } else {
    theoryReview = "Bij het oplossen van vergelijkingen werken we naar de onbekende toe door inverse operaties uit te voeren. De basisregel is: wat je aan de ene kant van de vergelijking doet, moet je ook aan de andere kant doen. Zo houd je de vergelijking in balans terwijl je de onbekende isoleert.";
    
    commonMistakes = [
      "Vergeten beide kanten van de vergelijking aan te passen",
      "Tekens verkeerd overnemen bij het verplaatsen van termen",
      "Delen door een negatief getal zonder het teken om te draaien"
    ];
    
    diagramType = "formula-breakdown";
    
    steps = [
      {
        stepNumber: 1,
        title: "Analyseer de opgave",
        explanation: "We bekijken eerst goed wat er gevraagd wordt en welke operaties we moeten uitvoeren. We identificeren de onbekende en bepalen welke stappen nodig zijn om deze te isoleren. Dit helpt ons een plan te maken voor de oplossing.",
        math: question,
        voiceover: "Laten we eerst goed naar de opgave kijken en bepalen wat we moeten doen om tot de oplossing te komen."
      },
      {
        stepNumber: 2,
        title: "Vereenvoudig beide kanten",
        explanation: "Als er haakjes of gelijksoortige termen zijn, werken we deze eerst uit. We combineren gelijke termen aan elke kant van het = teken apart. Dit maakt de vergelijking overzichtelijker voor de volgende stappen.",
        math: "\\text{Combineer gelijke termen}",
        voiceover: "We vereenvoudigen de vergelijking door haakjes weg te werken en gelijke termen bij elkaar op te tellen."
      },
      {
        stepNumber: 3,
        title: "Isoleer de onbekende",
        explanation: "Nu verplaatsen we alle termen met de onbekende naar één kant en alle getallen naar de andere kant. We doen dit door de inverse operatie toe te passen aan beide kanten: optelling wordt aftrekking, en vermenigvuldiging wordt deling.",
        math: "\\text{Pas inverse operaties toe}",
        voiceover: "We brengen alle termen met de onbekende naar één kant door de tegengestelde bewerking uit te voeren."
      },
      {
        stepNumber: 4,
        title: "Bereken het antwoord",
        explanation: "Dit is de oplossing van de opgave. We hebben de onbekende geïsoleerd en kunnen nu de waarde aflezen. Het is altijd goed om je antwoord te controleren door het terug te substitueren in de oorspronkelijke vergelijking.",
        math: correctAnswer || "\\text{Zie berekening}",
        voiceover: correctAnswer ? `Het antwoord is ${correctAnswer}` : "Het antwoord volgt uit de berekening."
      }
    ];
  }

  return {
    theoryReview,
    commonMistakes,
    diagramType,
    steps,
    finalAnswer: correctAnswer || "Zie de uitwerking hierboven",
    tip: "Controleer altijd je antwoord door het terug te substitueren in de oorspronkelijke vergelijking.",
    fallback: true,
    rate_limited: statusCode === 429,
    credits_depleted: statusCode === 402,
  };
}
