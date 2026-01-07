import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExamPart {
  partLabel: string;
  question: string;
  points: number;
  solution: string;
  answer: string;
}

interface ExamQuestion {
  id: string;
  questionNumber: number;
  difficulty: string;
  points: number;
  subtopicName: string;
  context: string;
  parts: ExamPart[];
}

interface UserAnswer {
  questionId: string;
  partLabel: string;
  answer: string;
}

interface MistakePattern {
  type: string;
  description: string;
  frequency: number;
  subtopics: string[];
}

interface PartAnalysis {
  questionId: string;
  partLabel: string;
  subtopicName: string;
  userAnswer: string;
  correctAnswer: string;
  points: number;
  earnedPoints: number;
  isCorrect: boolean;
  isPartialCredit: boolean;
  feedback: string;
  conceptGap?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questions, userAnswers, userId, topicId } = await req.json();

    if (!questions || !userAnswers) {
      throw new Error('Questions and userAnswers are required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Analyze each answer
    const partAnalyses: PartAnalysis[] = [];
    const subtopicPerformance: Record<string, { correct: number; total: number; gaps: string[] }> = {};
    const mistakePatterns: MistakePattern[] = [];

    for (const question of questions as ExamQuestion[]) {
      for (const part of question.parts) {
        const userAnswer = (userAnswers as UserAnswer[]).find(
          a => a.questionId === question.id && a.partLabel === part.partLabel
        );

        const answer = userAnswer?.answer?.trim() || '';
        
        // Initialize subtopic tracking
        if (!subtopicPerformance[question.subtopicName]) {
          subtopicPerformance[question.subtopicName] = { correct: 0, total: 0, gaps: [] };
        }
        subtopicPerformance[question.subtopicName].total += part.points;

        // Use AI to analyze the answer
        const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an expert mathematics examiner. Analyze student answers and provide:
1. Whether the answer is correct, partially correct, or incorrect
2. Points to award (0 to max points, with partial credit)
3. Brief feedback explaining what was right/wrong
4. The underlying conceptual gap if incorrect

Be fair but strict. Award partial credit for:
- Correct method with calculation error
- Partially complete solution
- Correct intermediate steps

Response format (JSON):
{
  "isCorrect": boolean,
  "isPartialCredit": boolean,
  "earnedPoints": number,
  "feedback": "Brief explanation",
  "conceptGap": "Specific concept that needs review (if incorrect)"
}`
              },
              {
                role: 'user',
                content: `Question: ${part.question}
Correct answer: ${part.answer}
Solution approach: ${part.solution}
Max points: ${part.points}
Student's answer: ${answer || '(no answer provided)'}

Analyze this answer.`
              }
            ],
            max_completion_tokens: 500,
          }),
        });

        let analysis = {
          isCorrect: false,
          isPartialCredit: false,
          earnedPoints: 0,
          feedback: 'Unable to analyze',
          conceptGap: undefined as string | undefined,
        };

        if (analysisResponse.ok) {
          const aiResponse = await analysisResponse.json();
          const content = aiResponse.choices?.[0]?.message?.content;
          
          if (content) {
            try {
              // Extract JSON from response
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
              }
            } catch (e) {
              console.error('Failed to parse analysis:', e);
            }
          }
        }

        // Update subtopic performance
        subtopicPerformance[question.subtopicName].correct += analysis.earnedPoints;
        if (analysis.conceptGap) {
          subtopicPerformance[question.subtopicName].gaps.push(analysis.conceptGap);
        }

        partAnalyses.push({
          questionId: question.id,
          partLabel: part.partLabel,
          subtopicName: question.subtopicName,
          userAnswer: answer,
          correctAnswer: part.answer,
          points: part.points,
          earnedPoints: analysis.earnedPoints,
          isCorrect: analysis.isCorrect,
          isPartialCredit: analysis.isPartialCredit,
          feedback: analysis.feedback,
          conceptGap: analysis.conceptGap,
        });
      }
    }

    // Calculate overall statistics
    const totalPoints = partAnalyses.reduce((sum, p) => sum + p.points, 0);
    const earnedPoints = partAnalyses.reduce((sum, p) => sum + p.earnedPoints, 0);
    const scorePercentage = Math.round((earnedPoints / totalPoints) * 100);

    // Identify weak subtopics
    const weakSubtopics: string[] = [];
    const subtopicBreakdown: Record<string, { percentage: number; gaps: string[] }> = {};
    
    for (const [subtopic, data] of Object.entries(subtopicPerformance)) {
      const percentage = Math.round((data.correct / data.total) * 100);
      subtopicBreakdown[subtopic] = {
        percentage,
        gaps: [...new Set(data.gaps)], // Unique gaps
      };
      
      if (percentage < 60) {
        weakSubtopics.push(subtopic);
      }
    }

    // Aggregate mistake patterns
    const gapCounts: Record<string, { count: number; subtopics: Set<string> }> = {};
    for (const analysis of partAnalyses) {
      if (analysis.conceptGap) {
        if (!gapCounts[analysis.conceptGap]) {
          gapCounts[analysis.conceptGap] = { count: 0, subtopics: new Set() };
        }
        gapCounts[analysis.conceptGap].count++;
        gapCounts[analysis.conceptGap].subtopics.add(analysis.subtopicName);
      }
    }

    for (const [gap, data] of Object.entries(gapCounts)) {
      if (data.count >= 2) { // Only report patterns appearing 2+ times
        mistakePatterns.push({
          type: 'concept_gap',
          description: gap,
          frequency: data.count,
          subtopics: Array.from(data.subtopics),
        });
      }
    }

    // Generate remediation recommendations
    const recommendations: string[] = [];
    
    if (weakSubtopics.length > 0) {
      recommendations.push(`Focus on reviewing: ${weakSubtopics.join(', ')}`);
    }
    
    for (const pattern of mistakePatterns.slice(0, 3)) {
      recommendations.push(`Address recurring issue: ${pattern.description}`);
    }

    if (scorePercentage < 50) {
      recommendations.push('Consider reviewing foundational concepts before attempting another exam');
    } else if (scorePercentage >= 70) {
      recommendations.push('Strong performance! Focus on remaining weak areas for exam mastery');
    }

    const result = {
      scorePercentage,
      earnedPoints,
      totalPoints,
      isExamReady: scorePercentage >= 70,
      partAnalyses,
      subtopicBreakdown,
      weakSubtopics,
      mistakePatterns: mistakePatterns.slice(0, 5),
      recommendations,
    };

    console.log('Exam analysis complete:', {
      score: scorePercentage,
      weakAreas: weakSubtopics.length,
      patterns: mistakePatterns.length,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('analyze-practice-exam error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
