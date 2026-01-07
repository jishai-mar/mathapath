import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * REICHMAN MECHINA BOOKLET - EXERCISE TEMPLATES
 * These are the EXACT question styles from the official exam preparation booklet.
 * ALL generated exercises MUST match these patterns precisely.
 */
const BOOKLET_TOPIC_TEMPLATES: Record<string, {
  examples: string[];
  patterns: string[];
  easy: string;
  medium: string;
  hard: string;
}> = {
  // ==========================================
  // FIRST-DEGREE EQUATIONS (ONE VARIABLE)
  // ==========================================
  "Linear Equations": {
    examples: [
      "Solve for x: 7x + 40 = 58 − 2x",
      "Solve for x: x + 6 = 46 − 7x",
      "Solve for x: 7(x + 2) + 4(x + 6) = 137",
      "Solve for x: 9x − 5(x + 2) = 18",
      "Solve for x: 4(x − 3) − 2(x + 5) = 6",
      "Solve for x: (3x − 1)/4 = (x + 5)/2",
    ],
    patterns: [
      "ax + b = c − dx (variable on both sides)",
      "a(x + b) + c(x + d) = e (distribution)",
      "ax − b(x + c) = d (negative distribution)",
      "(ax + b)/c = (dx + e)/f (cross multiply)",
    ],
    easy: "Coefficients 1-10, single operation like 2x + 5 = 11, answer is positive integer 1-10",
    medium: "Variables on both sides, one distribution, coefficients up to 20, answer may be fraction",
    hard: "Multiple distributions, nested parentheses, coefficients up to 50, complex fraction answers",
  },

  // ==========================================
  // QUADRATIC EQUATIONS
  // ==========================================
  "Quadratic Equations": {
    examples: [
      "Solve for x: 2x² − 72 = 0",
      "Solve for x: 18x² − 50 = 0",
      "Solve for x: x² + 5x − 150 = 0",
      "Solve for x: x² − 7x + 12 = 0",
      "Solve for x: 3x² − 7x + 2 = 0",
      "Solve for x: (x − 3)² = 16",
    ],
    patterns: [
      "ax² − b = 0 (direct square root)",
      "x² + bx + c = 0 (factoring)",
      "ax² + bx + c = 0 (quadratic formula)",
      "(x − a)² = b (square root method)",
    ],
    easy: "Form ax² = b with perfect squares like 2x² = 72, or simple factoring x² − 9 = 0",
    medium: "Standard form requiring factoring or formula, integer solutions",
    hard: "Requires formula, may have irrational roots or need simplification",
  },

  // ==========================================
  // HIGHER-DEGREE (BIQUADRATIC)
  // ==========================================
  "Higher-Degree Equations": {
    examples: [
      "Solve for x: x⁴ − 13x² + 36 = 0",
      "Solve for x: x⁴ − 5x² + 4 = 0",
      "Solve for x: x⁴ − 81 = 0",
      "Solve for x: x⁴ + 7x² − 18 = 0",
    ],
    patterns: [
      "x⁴ + bx² + c = 0 (substitute u = x²)",
      "x⁴ − a = 0 (fourth roots)",
    ],
    easy: "x⁴ = a where a is a perfect fourth power",
    medium: "Biquadratic with nice substitution, integer roots",
    hard: "Biquadratic requiring careful analysis, may have some real and some excluded roots",
  },

  // ==========================================
  // FRACTIONS / ALGEBRAIC EXPRESSIONS
  // ==========================================
  "Fractions & Algebraic Expressions": {
    examples: [
      "Solve for x: (2x + 1)/(x − 3) = 5/2",
      "Solve for x: 3/x + 2/(x − 1) = 5",
      "Simplify: (x² − 4)/(x + 2)",
      "Simplify: (3a²b)/(6ab²)",
      "Solve for x: (x + 4)/(x − 2) = 3",
    ],
    patterns: [
      "(ax + b)/(cx + d) = e/f (cross multiply)",
      "a/x + b/(x + c) = d (common denominator)",
      "Simplify algebraic fractions (factor and cancel)",
    ],
    easy: "Single fraction equation or simple simplification",
    medium: "Cross multiplication or LCD with linear expressions",
    hard: "Multiple rational terms, requires careful domain checking",
  },

  // ==========================================
  // RADICAL EQUATIONS
  // ==========================================
  "Radical Equations": {
    examples: [
      "Solve for x: √(2x + 3) = 5",
      "Solve for x: √(x + 5) = √(2x − 1)",
      "Solve for x: √(x + 7) = x − 5",
      "Solve for x: √(3x − 2) = 4",
    ],
    patterns: [
      "√(ax + b) = c (square both sides)",
      "√(ax + b) = √(cx + d) (equal radicals)",
      "√(ax + b) = x + c (isolate and square)",
    ],
    easy: "Single radical, direct squaring gives integer answer",
    medium: "Radical equals linear expression, check for extraneous",
    hard: "May have extraneous solution, requires verification",
  },

  // ==========================================
  // EXPONENTS
  // ==========================================
  "Exponents & Exponential Equations": {
    examples: [
      "Solve for x: $2^x = 32$",
      "Solve for x: $3^{x+1} = 81$",
      "Simplify: $(2^3)^4 \\times 2^2 \\div 2^5$",
      "Solve for x: $4^x = 8$",
      "Simplify: $(a^3 b^2)^2 \\div (ab)^3$",
      "Solve for x: $9^x = 27$",
      "Solve for x: $5^{x+2} = \\frac{1}{25}$",
    ],
    patterns: [
      "$a^x = b$ where $b = a^n$ (same base)",
      "$a^x = b$ where a, b are powers of same number",
      "Simplify using exponent rules",
      "$a^{x+c} = \\frac{1}{a^n}$ (negative exponent)",
    ],
    easy: "Same base both sides, like $2^x = 16$",
    medium: "Convert to same base ($4^x = 8$ becomes $2^{2x} = 2^3$)",
    hard: "Requires multiple rule applications or fractional exponents in answer",
  },

  // ==========================================
  // LOGARITHMS
  // ==========================================
  "Logarithms & Logarithmic Equations": {
    examples: [
      "Evaluate: log₂ 64",
      "Solve for x: log₃ x = 4",
      "Simplify: log₂ 8 + log₂ 4",
      "Solve for x: log x + log(x − 3) = 1",
      "Evaluate: log₅ 125",
      "Solve for x: log₂(x − 1) = 3",
    ],
    patterns: [
      "logₐ b = ? (direct evaluation)",
      "logₐ x = b (convert to exponential)",
      "logₐ x + logₐ y = c (product rule)",
      "logₐ x − logₐ y = c (quotient rule)",
    ],
    easy: "Direct evaluation of logₐ b where b is a power of a",
    medium: "Solve logₐ x = b or use one log rule",
    hard: "Multiple log terms, may lead to quadratic, check domain",
  },

  // ==========================================
  // INEQUALITIES
  // ==========================================
  "Inequalities": {
    examples: [
      "Solve: 2x + 5 < 13",
      "Solve: x² − 5x + 6 > 0",
      "Solve: (x − 2)(x + 3) ≤ 0",
      "Solve: (x + 1)/(x − 2) > 0",
      "Solve: 3x − 7 ≥ 2x + 1",
    ],
    patterns: [
      "ax + b < c (linear)",
      "ax² + bx + c > 0 (quadratic)",
      "(x − a)(x − b) ≤ 0 (factored form)",
      "(ax + b)/(cx + d) > 0 (rational)",
    ],
    easy: "Linear inequality, no sign flip needed",
    medium: "Quadratic or factored quadratic, find intervals",
    hard: "Rational inequality with sign analysis",
  },

  // ==========================================
  // LIMITS
  // ==========================================
  "Limits": {
    examples: [
      "Evaluate: lim(x→2) (x² − 4)/(x − 2)",
      "Evaluate: lim(x→∞) (3x² + 2x)/(x² − 1)",
      "Evaluate: lim(x→0) (x² + 3x)/x",
      "Evaluate: lim(x→4) (√x − 2)/(x − 4)",
      "Evaluate: lim(x→1) (x³ − 1)/(x − 1)",
    ],
    patterns: [
      "lim(x→a) where direct substitution works",
      "lim(x→a) with 0/0 requiring factoring",
      "lim(x→∞) polynomial/polynomial",
      "lim with radical (conjugate method)",
    ],
    easy: "Direct substitution gives answer",
    medium: "Factor numerator/denominator to cancel, or conjugate",
    hard: "Complex factoring or multiple techniques",
  },

  // ==========================================
  // DERIVATIVES
  // ==========================================
  "Derivatives & Applications": {
    examples: [
      "Find f'(x) if f(x) = x³ + 6x² + x",
      "Find f'(x) if f(x) = 5x⁴ − 2x² + 7",
      "Find f'(x) if f(x) = √x",
      "Find f'(2) if f(x) = x² − 3x + 1",
      "Find f'(x) if f(x) = 1/x²",
      "Find the equation of the tangent line to y = x² at x = 3",
    ],
    patterns: [
      "f(x) = polynomial → power rule",
      "f(x) = xⁿ where n is fraction or negative",
      "Find f'(a) for specific value",
      "Tangent line at a point",
    ],
    easy: "Power rule on simple polynomial like x³ + 2x",
    medium: "Polynomial with multiple terms, or fractional exponents",
    hard: "Find derivative and evaluate, or tangent line equation",
  },

  // ==========================================
  // LINEAR FUNCTIONS
  // ==========================================
  "Linear Functions & Lines": {
    examples: [
      "Find the equation of the line through (2, 3) with slope 4",
      "Find the slope of the line through (1, 2) and (4, 8)",
      "Find the intersection of y = 2x + 1 and y = −x + 7",
      "Find a line parallel to y = 3x − 1 through (0, 5)",
    ],
    patterns: [
      "Point-slope form: y − y₁ = m(x − x₁)",
      "Slope from two points: m = (y₂ − y₁)/(x₂ − x₁)",
      "Intersection of two lines (substitution)",
      "Parallel/perpendicular lines",
    ],
    easy: "Given slope and y-intercept, or find slope from two points",
    medium: "Point-slope form, or find intersection",
    hard: "Parallel/perpendicular through given point",
  },

  // ==========================================
  // QUADRATIC FUNCTIONS / PARABOLAS
  // ==========================================
  "Quadratic Functions & Parabolas": {
    examples: [
      "Find the vertex of y = x² − 6x + 5",
      "Find the x-intercepts of y = x² − 5x + 6",
      "Write in vertex form: y = x² + 4x + 7",
      "Find the axis of symmetry for y = 2x² − 8x + 3",
    ],
    patterns: [
      "Vertex: x = −b/(2a), then find y",
      "x-intercepts: solve ax² + bx + c = 0",
      "Vertex form: y = a(x − h)² + k",
    ],
    easy: "Find vertex or axis of symmetry using formula",
    medium: "Convert to vertex form by completing square",
    hard: "Multiple properties of same parabola",
  },
};

/**
 * FORBIDDEN CONTENT - NEVER GENERATE THESE
 * The Reichman Mechina booklet does NOT include these topics
 */
const FORBIDDEN_CONTENT = `
ABSOLUTELY FORBIDDEN - NEVER include these in any exercise:

FORBIDDEN TOPICS:
- Trigonometry: sin, cos, tan, cot, sec, csc
- Trigonometric equations of any kind
- Inverse trig: arcsin, arccos, arctan
- Radians with π (like π/4, 2π)
- Unit circle
- θ (theta), α (alpha), β (beta) as variables
- Degrees notation (°)
- Epsilon-delta proofs
- L'Hôpital's rule (don't mention by name)
- Integration or integrals
- Complex numbers (i = √−1)
- Matrices
- Vectors
- Series and sequences
- Probability
- Statistics

FORBIDDEN QUESTION STYLES:
- Word problems with real-world context
- Story problems ("A train leaves...")
- Multiple choice
- True/False
- Proof questions ("Prove that...")
- "Find all values in [0, 2π)"

IF YOU GENERATE ANY FORBIDDEN CONTENT, THE EXERCISE WILL BE REJECTED.
`;

/**
 * Get the booklet-style template for a topic
 */
function getTopicTemplate(topicName: string) {
  // Direct match
  if (BOOKLET_TOPIC_TEMPLATES[topicName]) {
    return BOOKLET_TOPIC_TEMPLATES[topicName];
  }
  
  // Try partial matching
  const normalized = topicName.toLowerCase();
  for (const [key, template] of Object.entries(BOOKLET_TOPIC_TEMPLATES)) {
    const keyLower = key.toLowerCase();
    if (normalized.includes(keyLower.split(' ')[0]) || 
        keyLower.includes(normalized.split(' ')[0])) {
      return template;
    }
  }
  
  // Default to linear equations style
  return BOOKLET_TOPIC_TEMPLATES["Linear Equations"];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subtopicId, difficulty, existingExercises, userId, performanceData, subLevel } = await req.json();

    if (!subtopicId || !difficulty) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: subtopicId, difficulty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get subtopic info
    const { data: subtopic } = await supabase
      .from('subtopics')
      .select('name, topics(name)')
      .eq('id', subtopicId)
      .single();

    const topicName = (subtopic as any)?.topics?.name || 'Linear Equations';
    const subtopicName = subtopic?.name || 'General';

    // Get booklet-style template for this topic
    const template = getTopicTemplate(topicName);
    const difficultyGuide = template[difficulty as keyof typeof template] || template.medium;

    // Fetch student performance context
    let studentContext = '';
    if (userId) {
      const { data: recentAttempts } = await supabase
        .from('exercise_attempts')
        .select(`
          is_correct,
          hints_used,
          misconception_tag,
          exercises!inner(difficulty, subtopic_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      const subtopicAttempts = (recentAttempts || []).filter((a: any) => a.exercises?.subtopic_id === subtopicId);
      
      if (subtopicAttempts.length > 0) {
        const correct = subtopicAttempts.filter((a: any) => a.is_correct).length;
        const total = subtopicAttempts.length;
        const successRate = Math.round((correct / total) * 100);
        
        const isStruggling = total >= 3 && successRate < 40;
        const isExcelling = total >= 3 && successRate > 80;

        if (isStruggling) {
          studentContext = `\n⚠️ Student is STRUGGLING (${successRate}% success rate). Create a SIMPLER exercise within the ${difficulty} tier.`;
        } else if (isExcelling) {
          studentContext = `\n✓ Student is EXCELLING (${successRate}% success rate). Create a slightly more challenging exercise within the ${difficulty} tier.`;
        }

        // Add misconception targeting
        const misconceptions = [...new Set(subtopicAttempts
          .filter((a: any) => a.misconception_tag)
          .map((a: any) => a.misconception_tag))];
        
        if (misconceptions.length > 0) {
          studentContext += `\n\nTARGET THESE WEAKNESSES:\n${misconceptions.slice(0, 3).map((m, i) => `${i + 1}. ${m}`).join('\n')}`;
        }
      }
    }

    // Format examples from template
    const templateExamples = template.examples.slice(0, 4).map((ex, i) => `${i + 1}. "${ex}"`).join('\n');
    
    // Format existing exercises to avoid duplicates
    const existingText = existingExercises && existingExercises.length > 0
      ? `\n\nDO NOT REPEAT these recent exercises:\n${existingExercises.map((ex: any) => `- ${ex.question}`).join('\n')}`
      : '';

    const systemPrompt = `You are generating exercises for the REICHMAN MECHINA exam preparation course.
Your exercises must EXACTLY match the style of the official booklet.

TOPIC: ${topicName}
SUBTOPIC: ${subtopicName}
DIFFICULTY: ${difficulty.toUpperCase()}

=== BOOKLET-STYLE EXAMPLES FOR THIS TOPIC ===
${templateExamples}

=== QUESTION PATTERNS ===
${template.patterns.map(p => `• ${p}`).join('\n')}

=== DIFFICULTY SPECIFICATION ===
${difficultyGuide}
${studentContext}

${FORBIDDEN_CONTENT}

=== MATHEMATICAL NOTATION RULES (CRITICAL) ===

You MUST use PROPER LaTeX syntax with these rules:

EXPONENTS - ALWAYS use braces for multi-character exponents:
✓ CORRECT: $5^{x+2}$, $3^{2x-1}$, $2^{x+1}$
✗ WRONG: $5^x+2$, $5^x+^2$, 5ˣ⁺²

FRACTIONS:
✓ CORRECT: $\\frac{1}{25}$, $\\frac{3}{4}$
✗ WRONG: 1/25 without LaTeX

LOGARITHMS:
✓ CORRECT: $\\log_{2}(x)$, $\\log_{10}(x)$
✗ WRONG: log_2(x), log₂x

SQUARE ROOTS:
✓ CORRECT: $\\sqrt{x+5}$, $\\sqrt{2x-1}$
✗ WRONG: √(x+5), sqrt(x+5)

WRAP ALL MATH in $ delimiters:
✓ CORRECT: "Solve for x: $5^{x+2} = \\frac{1}{25}$"
✗ WRONG: "Solve for x: 5^x+2 = 1/25"

=== QUESTION FORMAT RULES ===

REQUIRED FORMAT:
- Start with command: "Solve for x:", "Evaluate:", "Simplify:", "Find f'(x):", etc.
- Wrap ALL mathematical expressions in $ delimiters
- Use proper LaTeX notation with braces
- NO motivational phrases ("Let's", "Try to", "Can you")
- NO explanatory text before the mathematical task

CORRECT EXAMPLES:
✓ "Solve for x: $2x^2 - 8 = 0$"
✓ "Solve for x: $5^{x+2} = \\frac{1}{25}$"
✓ "Evaluate: $\\log_{2}(32)$"
✓ "Find f'(x) if $f(x) = x^3 + 2x$"

WRONG EXAMPLES (NEVER DO THIS):
✗ "Solve for x: 5^x+^2 = 1/25" (malformed exponent)
✗ "Solve for x: 5^x+2 = 1/25" (missing braces)
✗ "Solve for x: 5ˣ⁺² = 1/25" (Unicode superscripts don't render properly)
✗ Any trigonometry question

=== ANSWER FORMAT ===
- Use LaTeX: "$\\pm 4$" not "+/-4"
- Fractions: "$\\frac{3}{4}$" or "3/4"
- Multiple solutions: "$2, -3$"
- Keep answers simple and exact

=== OUTPUT FORMAT ===
Return ONLY valid JSON:
{
  "question": "Solve for x: $5^{x+2} = \\frac{1}{25}$",
  "correct_answer": "-4",
  "explanation": "Step-by-step solution explaining the reasoning",
  "hints": ["Hint 1 that guides without revealing", "Hint 2"]
}`;

    const userPrompt = `Generate a NEW ${difficulty} exercise for "${subtopicName}" in the "${topicName}" topic.

REQUIREMENTS:
1. Match the booklet style shown in examples above
2. Be different from any existing exercises
3. Follow the ${difficulty} difficulty specification exactly
4. Use PROPER LaTeX notation with $ delimiters
5. Use BRACES for multi-character exponents: $5^{x+2}$ NOT $5^x+2$
6. NO trigonometry, NO word problems, NO forbidden content
${existingText}

Generate the exercise now:`;

    console.log(`Generating booklet-style exercise: Topic=${topicName}, Subtopic=${subtopicName}, Difficulty=${difficulty}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Return a booklet-style fallback
      const fallbackExercise = {
        question: "Solve for x: 3x + 7 = 22",
        correct_answer: "5",
        explanation: "Subtract 7 from both sides: 3x = 15. Divide by 3: x = 5.",
        hints: ["What operation undoes +7?", "After isolating 3x, divide both sides by 3"],
        difficulty,
        fallback: true,
      };
      
      return new Response(
        JSON.stringify(fallbackExercise),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI generated exercise:', content);

    // Parse the JSON response
    let exercise: { question: string; correct_answer: string; explanation?: string; hints?: string[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        exercise = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to generate valid exercise');
    }

    // Validate: reject if contains forbidden content
    const questionLower = exercise.question.toLowerCase();
    const forbiddenPatterns = ['sin', 'cos', 'tan', 'theta', 'θ', 'π', 'arcsin', 'arccos', 'arctan'];
    const hasForbidden = forbiddenPatterns.some(p => questionLower.includes(p));
    
    // Validate: reject corrupted LaTeX patterns
    const corruptionPatterns = [
      /[a-zA-Z]eq\d/i,                    // meq0, neq0 (corrupted \neq)
      /[a-zA-Z]\s+eq\s+\d/i,              // m eq 0 (corrupted \neq)
      /\\f\\frac|\\s\\sqrt/i,             // double-prefixed commands
      /(?<!\\)rac\{|(?<!\\)qrt\{/i,       // missing backslash
      /\bTODO\b|\?\?\?|\.\.\.\.+/i,       // placeholder garbage
    ];
    const hasCorruption = corruptionPatterns.some(p => p.test(exercise.question));
    
    // Auto-fix common corruptions
    if (hasCorruption) {
      console.log('Detected corruption in generated exercise, attempting auto-fix...');
      let fixedQuestion = exercise.question;
      
      // Fix corrupted \neq patterns
      fixedQuestion = fixedQuestion.replace(/([a-zA-Z])\s*\n\s*eq\s*(\d)/g, '$1 \\neq $2');
      fixedQuestion = fixedQuestion.replace(/([a-zA-Z])eq(\d)/g, '$1 \\neq $2');
      fixedQuestion = fixedQuestion.replace(/([a-zA-Z])\s+eq\s+(\d)/g, '$1 \\neq $2');
      
      // Fix double-prefixed commands
      fixedQuestion = fixedQuestion.replace(/\\f\\frac/g, '\\frac');
      fixedQuestion = fixedQuestion.replace(/\\s\\sqrt/g, '\\sqrt');
      
      // Fix missing backslash on commands
      fixedQuestion = fixedQuestion.replace(/(?<!\\)rac\{/g, '\\frac{');
      fixedQuestion = fixedQuestion.replace(/(?<!\\)qrt\{/g, '\\sqrt{');
      
      exercise.question = fixedQuestion;
      console.log('Auto-fixed exercise question:', exercise.question);
    }
    
    if (hasForbidden) {
      console.warn('Generated exercise contains forbidden content, using fallback');
      exercise = {
        question: "Solve for x: 2x − 5 = 11",
        correct_answer: "8",
        explanation: "Add 5 to both sides: 2x = 16. Divide by 2: x = 8.",
        hints: ["Add 5 to both sides first", "Then divide by the coefficient of x"],
      };
    }

    // Insert into database
    const { data: newExercise, error: insertError } = await supabase
      .from('exercises')
      .insert({
        subtopic_id: subtopicId,
        question: exercise.question,
        correct_answer: exercise.correct_answer,
        explanation: exercise.explanation,
        hints: exercise.hints || [],
        difficulty: difficulty,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert exercise:', insertError);
      throw new Error('Failed to save generated exercise');
    }

    console.log('New booklet-style exercise created:', newExercise.id);

    return new Response(
      JSON.stringify(newExercise),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-exercise:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
