import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Topic-specific difficulty matrices with precise criteria
const DIFFICULTY_MATRICES: Record<string, {
  easy: { description: string; maxSteps: number; criteria: string[] };
  medium: { description: string; maxSteps: number; criteria: string[] };
  hard: { description: string; maxSteps: number; criteria: string[] };
}> = {
  "Linear Equations": {
    easy: {
      description: "Single variable, positive integers, one operation",
      maxSteps: 2,
      criteria: ["Only positive whole numbers (1-20)", "Single operation to solve", "Form: ax = b or x + a = b", "No negative results"]
    },
    medium: {
      description: "Variable on both sides, simple fractions, negatives allowed",
      maxSteps: 4,
      criteria: ["Variables on both sides allowed", "Simple fractions (halves, thirds)", "Negative numbers allowed", "May require distribution once"]
    },
    hard: {
      description: "Nested expressions, multiple distribution, complex setup",
      maxSteps: 6,
      criteria: ["Nested parentheses", "Multiple distributions", "Word problems requiring equation setup", "Complex fractions"]
    }
  },
  "Quadratic Equations": {
    easy: {
      description: "Perfect squares, direct square roots",
      maxSteps: 2,
      criteria: ["Form: x² = a (perfect squares)", "Direct factoring like x² - 4 = 0", "Integer solutions only", "No middle term (b=0)"]
    },
    medium: {
      description: "Factoring with middle term, completing the square",
      maxSteps: 4,
      criteria: ["Standard form with middle term", "Factoring required", "Completing the square prep", "Integer or simple fraction solutions"]
    },
    hard: {
      description: "Quadratic formula required, discriminant analysis",
      maxSteps: 6,
      criteria: ["Quadratic formula needed", "Irrational or complex solutions", "Discriminant analysis", "Setting up from word problems"]
    }
  },
  "Fractions & Algebraic Expressions": {
    easy: {
      description: "Simple fraction operations, single variable",
      maxSteps: 2,
      criteria: ["Single fraction simplification", "Adding fractions with same denominator", "No variables in denominator", "Small integers"]
    },
    medium: {
      description: "Different denominators, polynomial numerators",
      maxSteps: 4,
      criteria: ["Finding common denominators", "Polynomial expressions", "Simplifying by factoring", "Variables in one term"]
    },
    hard: {
      description: "Complex rational expressions, multiple variables",
      maxSteps: 6,
      criteria: ["Variables in denominators", "Multiple operations combined", "Partial fractions", "Complex factoring needed"]
    }
  },
  "Radical Equations": {
    easy: {
      description: "Single radical, direct solving",
      maxSteps: 2,
      criteria: ["Form: √x = a", "Perfect square results", "Single radical only", "No extraneous solutions"]
    },
    medium: {
      description: "Radical with linear expression inside",
      maxSteps: 4,
      criteria: ["Form: √(ax + b) = c", "Squaring both sides once", "May have extraneous solution", "Simple linear under radical"]
    },
    hard: {
      description: "Multiple radicals, nested expressions",
      maxSteps: 6,
      criteria: ["Multiple radicals", "Radicals on both sides", "Nested radicals", "Multiple squaring needed"]
    }
  },
  "Exponents & Exponential Equations": {
    easy: {
      description: "Same base, direct comparison",
      maxSteps: 2,
      criteria: ["Same base on both sides", "Simple exponent rules", "Integer exponents only", "Direct solve"]
    },
    medium: {
      description: "Converting to same base, negative exponents",
      maxSteps: 4,
      criteria: ["Different bases (convertible)", "Negative exponents", "Exponent rules application", "One conversion step"]
    },
    hard: {
      description: "Logarithms needed, complex expressions",
      maxSteps: 6,
      criteria: ["Bases not easily convertible", "Requires logarithms", "Multiple exponent rules", "Complex expressions"]
    }
  },
  "Logarithms & Logarithmic Equations": {
    easy: {
      description: "Direct evaluation, simple equations",
      maxSteps: 2,
      criteria: ["Direct log evaluation", "Form: log_a(x) = b", "Common bases (10, 2, e)", "Integer results"]
    },
    medium: {
      description: "Log rules application, combining logs",
      maxSteps: 4,
      criteria: ["Product/quotient rules", "Combining multiple logs", "Change of base formula", "One variable"]
    },
    hard: {
      description: "Complex log equations, multiple variables",
      maxSteps: 6,
      criteria: ["Multiple log terms", "Quadratic in log form", "Nested logarithms", "Domain restrictions matter"]
    }
  },
  "Inequalities": {
    easy: {
      description: "Simple linear inequalities",
      maxSteps: 2,
      criteria: ["Form: ax + b < c", "No sign flipping needed", "Positive coefficients", "Integer endpoints"]
    },
    medium: {
      description: "Compound inequalities, sign changes",
      maxSteps: 4,
      criteria: ["Dividing by negatives", "Compound inequalities", "Interval notation", "Simple absolute value"]
    },
    hard: {
      description: "Quadratic inequalities, rational inequalities",
      maxSteps: 6,
      criteria: ["Quadratic inequalities", "Rational expressions", "Multiple intervals", "Sign analysis needed"]
    }
  },
  "Linear Functions & Lines": {
    easy: {
      description: "Identify slope/intercept, plot points",
      maxSteps: 2,
      criteria: ["Given y = mx + b form", "Identify slope and intercept", "Plot two points", "Integer values"]
    },
    medium: {
      description: "Find equation from points, parallel/perpendicular",
      maxSteps: 4,
      criteria: ["Find equation from two points", "Parallel and perpendicular lines", "Convert between forms", "Intercept calculations"]
    },
    hard: {
      description: "Systems context, distance/midpoint applications",
      maxSteps: 6,
      criteria: ["Word problems", "Distance and midpoint", "Systems of lines", "Area calculations with lines"]
    }
  },
  "Quadratic Functions & Parabolas": {
    easy: {
      description: "Identify vertex from standard form",
      maxSteps: 2,
      criteria: ["Vertex form given", "Find axis of symmetry", "Identify direction", "Simple graphing"]
    },
    medium: {
      description: "Convert forms, find vertex from standard",
      maxSteps: 4,
      criteria: ["Standard to vertex form", "Find x-intercepts", "Completing the square", "Range/domain"]
    },
    hard: {
      description: "Word problems, optimization",
      maxSteps: 6,
      criteria: ["Optimization problems", "Projectile motion", "Multiple parabolas", "System with parabola and line"]
    }
  },
  "Limits": {
    easy: {
      description: "Direct substitution",
      maxSteps: 2,
      criteria: ["Direct substitution works", "Polynomial limits", "No indeterminate forms", "Finite results"]
    },
    medium: {
      description: "Factor and cancel, simple indeterminate",
      maxSteps: 4,
      criteria: ["0/0 form requiring factoring", "Conjugate multiplication", "Simple rational functions", "One-sided limits"]
    },
    hard: {
      description: "L'Hôpital's rule, limits at infinity",
      maxSteps: 6,
      criteria: ["L'Hôpital's rule", "Limits at infinity", "Complex indeterminate forms", "Trigonometric limits"]
    }
  },
  "Derivatives & Applications": {
    easy: {
      description: "Power rule, basic derivatives",
      maxSteps: 2,
      criteria: ["Power rule only", "Polynomial functions", "Basic differentiation", "No chain rule"]
    },
    medium: {
      description: "Product/quotient rule, chain rule intro",
      maxSteps: 4,
      criteria: ["Product or quotient rule", "Simple chain rule", "Finding critical points", "Basic slope problems"]
    },
    hard: {
      description: "Implicit differentiation, optimization",
      maxSteps: 6,
      criteria: ["Implicit differentiation", "Related rates", "Optimization problems", "Multiple rules combined"]
    }
  }
};

// Difficulty-specific instructions for AI
const DIFFICULTY_INSTRUCTIONS = {
  easy: `
EASY DIFFICULTY - For students who need confidence building:
- Use ONLY positive whole numbers under 20 (no negatives, no fractions, no decimals)
- Maximum 2 steps to solve
- Single operation type per problem
- Pattern should be obvious and direct
- Numbers should be "friendly" (multiples of 2, 5, 10)
- Answer should be a clean whole number
- No hidden tricks or edge cases
GOAL: Build confidence with guaranteed success. Student should feel "I can do this!"
`,
  medium: `
MEDIUM DIFFICULTY - For students with basic understanding:
- Negative numbers and simple fractions (halves, thirds, quarters) allowed
- Maximum 4 steps to solve
- May combine 2 concepts (but not more)
- May require one distribution or collecting like terms
- Numbers can be larger but answers should still be clean
- One small challenge or decision point
GOAL: Reinforce concepts with moderate challenge. Student should think but not struggle.
`,
  hard: `
HARD DIFFICULTY - For advanced students seeking challenge:
- Complex expressions, nested parentheses, multiple operations
- 5-6 steps typically required
- Requires insight or non-obvious first step
- May combine multiple topic concepts
- Answers may involve radicals, fractions, or multiple solutions
- May require strategic approach selection
GOAL: Push critical thinking. Student should feel accomplished after solving.
`
};

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get subtopic info
    const { data: subtopic } = await supabase
      .from('subtopics')
      .select('name, topics(name)')
      .eq('id', subtopicId)
      .single();

    const topicName = (subtopic as any)?.topics?.name || 'Mathematics';
    const subtopicName = subtopic?.name || 'General';

    // Get topic-specific difficulty matrix
    const topicMatrix = DIFFICULTY_MATRICES[topicName] || DIFFICULTY_MATRICES["Linear Equations"];
    const difficultySpec = topicMatrix[difficulty as keyof typeof topicMatrix];

    // Fetch student's performance data if userId provided
    let studentContext = '';
    let misconceptions: string[] = [];
    
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
        .limit(30);

      const subtopicAttempts = (recentAttempts || []).filter((a: any) => a.exercises?.subtopic_id === subtopicId);
      
      if (subtopicAttempts.length > 0) {
        const stats = { easy: { c: 0, t: 0 }, medium: { c: 0, t: 0 }, hard: { c: 0, t: 0 } };
        
        subtopicAttempts.forEach((a: any) => {
          const d = a.exercises?.difficulty;
          if (d && stats[d as keyof typeof stats]) {
            stats[d as keyof typeof stats].t++;
            if (a.is_correct) stats[d as keyof typeof stats].c++;
          }
          if (a.misconception_tag && !misconceptions.includes(a.misconception_tag)) {
            misconceptions.push(a.misconception_tag);
          }
        });

        const successRates = Object.entries(stats)
          .filter(([_, v]) => v.t > 0)
          .map(([k, v]) => `${k}: ${Math.round((v.c / v.t) * 100)}%`)
          .join(', ');

        // Calculate if student is struggling or excelling
        const currentStats = stats[difficulty as keyof typeof stats];
        const isStruggling = currentStats.t >= 3 && (currentStats.c / currentStats.t) < 0.4;
        const isExcelling = currentStats.t >= 3 && (currentStats.c / currentStats.t) > 0.8;

        studentContext = `
STUDENT PERFORMANCE ANALYSIS:
- Success rates: ${successRates || 'No data yet'}
- Attempts in this subtopic: ${subtopicAttempts.length}
- Current difficulty (${difficulty}) performance: ${currentStats.t > 0 ? Math.round((currentStats.c / currentStats.t) * 100) + '%' : 'new'}
${isStruggling ? `
⚠️ STUDENT IS STRUGGLING at ${difficulty} level:
- Create a SIMPLER exercise within this difficulty tier
- Use more obvious patterns and smaller numbers
- Provide clearer structure with fewer steps
- Focus on ONE concept only
` : ''}
${isExcelling ? `
✓ STUDENT IS EXCELLING at ${difficulty} level:
- Create a slightly more challenging exercise within this tier
- Can include minor additional complexity
- Push toward the upper bound of this difficulty
` : ''}
`;
      }

      // Add misconception targeting
      if (misconceptions.length > 0) {
        studentContext += `
CRITICAL - TARGET THESE SPECIFIC WEAKNESSES:
${misconceptions.slice(0, 3).map((m, i) => `${i + 1}. ${m}`).join('\n')}

Generate an exercise that DIRECTLY addresses one of these misconceptions.
The exercise should help the student practice the exact skill they're missing.
For example:
- If misconception is "forgets to distribute negative sign" → create: "Solve: 5 - 2(x + 3) = 1"
- If misconception is "sign errors with negatives" → use problems with negative coefficients
- If misconception is "fraction operations" → include simple fractions
`;
      }
    }

    // Add sub-level guidance for finer difficulty tuning
    const subLevelGuidance = subLevel 
      ? `\nSUB-LEVEL TUNING: This is sub-level ${subLevel} of 3 within ${difficulty}. ${
          subLevel === 1 ? 'Use the EASIEST variant within this difficulty tier.' :
          subLevel === 2 ? 'Use a MIDDLE variant within this difficulty tier.' :
          'Use the HARDER variant within this difficulty tier (but still within the tier).'
        }`
      : '';

    const examplesText = existingExercises && existingExercises.length > 0
      ? existingExercises.map((ex: any, i: number) => 
          `Example ${i + 1}:\nQuestion: ${ex.question}\nAnswer: ${ex.correct_answer}`
        ).join('\n\n')
      : 'No examples available - create a typical exercise for this topic.';

    const systemPrompt = `You are a mathematics educator creating exercises for the Reichman Mechina curriculum.

Topic: ${topicName}
Subtopic: ${subtopicName}
Difficulty: ${difficulty}

TOPIC-SPECIFIC DIFFICULTY CRITERIA FOR ${topicName.toUpperCase()} (${difficulty.toUpperCase()}):
${difficultySpec.description}
Maximum steps: ${difficultySpec.maxSteps}
Requirements:
${difficultySpec.criteria.map(c => `• ${c}`).join('\n')}

${DIFFICULTY_INSTRUCTIONS[difficulty as keyof typeof DIFFICULTY_INSTRUCTIONS]}
${subLevelGuidance}
${studentContext}

EXERCISE DESIGN PHILOSOPHY:
Exercises must reinforce deep understanding, not just test mechanics.
Each exercise should require the student to apply concepts from the theory, not just follow procedures.

QUESTION FORMATTING - STRICT TEXTBOOK STYLE:
- Write questions EXACTLY as they would appear in a professional mathematics textbook
- Use ONLY formal, neutral command language:
  • "Solve for x:"
  • "Find all real solutions:"
  • "Simplify:"
  • "Determine the value of:"
  • "Calculate:"
  • "Factor completely:"
  • "Evaluate:"
- ABSOLUTELY NO motivational phrases: never use "Let's", "Try", "Can you", "Here's", "Now", "Great", etc.
- ABSOLUTELY NO commentary or context: just state the mathematical task directly
- ABSOLUTELY NO styling cues, colors, emphasis markers, or UI hints
- Questions must be concise, direct, and unambiguous

MATHEMATICAL NOTATION - CLEAN UNICODE (CRITICAL):
- Use ONLY clean Unicode symbols, NEVER LaTeX syntax
- Square root: √ (not \\sqrt, not sqrt, not ^(1/2))
- Exponents: ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ (e.g., x² not x^2, not x**2)
- Plus-minus: ± (not +/-, not +-) 
- Multiplication: × or · when explicit (not *, not x as multiply)
- Division in expressions: use fraction form a/b
- Inequality: ≤ ≥ ≠ < > (proper symbols)
- REMOVE all dollar signs ($), backslashes (\\), LaTeX commands
- REMOVE unnecessary parentheses around single variables: write x not (x)
- REMOVE extra spaces and formatting artifacts

FORBIDDEN PATTERNS (never include these):
- "Let's solve...", "Try to...", "Can you find..."
- "Here is a problem...", "Consider the following..."
- Any emoji or decorative characters
- $...$ or $$...$$ delimiters
- \\frac, \\sqrt, \\pm, or any LaTeX command
- Explanatory text before the actual question
- Multiple questions in one exercise

CORRECT EXAMPLES:
✓ "Solve for x: 3x² − 12 = 0"
✓ "Find all real solutions: √(x + 5) = 3"
✓ "Simplify: (2x³ + 6x²) ÷ 2x"
✓ "Factor completely: x² − 9"

INCORRECT EXAMPLES (never do this):
✗ "Let's solve this equation: $3x^2 - 12 = 0$"
✗ "Try to find x in: \\sqrt{x+5} = 3"
✗ "Here's a challenge! Can you simplify (2x^3 + 6x^2) / 2x?"

EXPLANATION - TEACH THE REASONING:
- Start by identifying what the problem is asking
- Explain WHY each step is taken, not just what to do
- Connect steps to underlying mathematical concepts
- Use phrases like "Notice that...", "This works because...", "The key insight is..."

HINTS - GUIDE WITHOUT REVEALING:
- First hint: Identify what type of problem this is or what concept applies
- Second hint: Suggest a starting strategy without showing steps
- Hints should make the student think, not just follow instructions

CORRECT ANSWER FORMAT:
- Use clean Unicode: "±3" not "+/-3" or "\\pm 3"
- Use proper fractions: "3/4" not "0.75" (unless decimals are appropriate)
- Multiple solutions: "2, −5" not "x = 2 or x = -5"

You MUST respond with valid JSON in exactly this format:
{
  "question": "Solve for x: 2x + 5 = 13",
  "correct_answer": "4",
  "explanation": "Step-by-step solution that teaches the reasoning",
  "hints": ["What operation undoes addition?", "After isolating the term with x, what operation isolates x itself?"]
}`;

    const userPrompt = `Generate a NEW ${difficulty} exercise for ${subtopicName}.

${examplesText}

Create a similar but DIFFERENT exercise appropriate for ${difficulty} difficulty.
Remember: ${difficulty === 'easy' ? 'Keep it simple with small positive numbers and obvious patterns.' : 
           difficulty === 'medium' ? 'Include moderate complexity with some challenge.' : 
           'Create a challenging problem requiring insight.'}

CRITICAL REQUIREMENTS:
1. Question must use ONLY Unicode math symbols (√, ², ³, ±, ≤, ≥)
2. NO LaTeX syntax ($, \\, \\frac, \\sqrt, ^)
3. NO motivational phrases - just the mathematical task
4. Formal textbook language only (e.g., "Solve for x:", "Find all solutions:")
5. Clean, unambiguous mathematical notation
6. MUST match the difficulty criteria provided above`;

    console.log('Generating new exercise with AI...');
    console.log(`Topic: ${topicName}, Subtopic: ${subtopicName}, Difficulty: ${difficulty}, SubLevel: ${subLevel || 'none'}`);

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
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI generated exercise:', content);

    // Parse the JSON response
    let exercise;
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

    console.log('New exercise created:', newExercise.id);

    return new Response(
      JSON.stringify(newExercise),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-exercise:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
