import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =========================================================================
// MATH EQUIVALENCE ENGINE - INLINE COPY
// This is the ONLY authority for determining answer correctness
// AI may NEVER decide scoring - only provide feedback after grading
// =========================================================================

interface EquivalenceResult {
  isEquivalent: boolean;
  confidence: 'high' | 'uncertain';
  method: string;
  reason: string;
}

interface GradingResult {
  isCorrect: boolean;
  confidence: 'high' | 'uncertain';
  method: string;
  reason: string;
  needsReview: boolean;
  canProceed: boolean;
}

const NUMERIC_TOLERANCE = 0.0001;
const SAFE_SAMPLE_POINTS = [0.5, 1, 1.5, 2, 2.5, -0.5, -1, -1.5];

function normalizeMathExpression(expr: string): string {
  if (!expr || typeof expr !== 'string') return '';
  
  return expr
    .toLowerCase()
    .replace(/\$/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\pm/g, '+-')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\[a-z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .replace(/±/g, '+-')
    .trim();
}

function parseNumericValue(expr: string): number | null {
  const normalized = normalizeMathExpression(expr);
  const direct = parseFloat(normalized);
  if (!isNaN(direct) && isFinite(direct)) return direct;
  
  const fractionMatch = normalized.match(/^(-?\d+\.?\d*)\/(-?\d+\.?\d*)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]);
    const den = parseFloat(fractionMatch[2]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
  }
  
  const sqrtMatch = normalized.match(/^sqrt\((\d+\.?\d*)\)$/) || normalized.match(/^√(\d+\.?\d*)$/);
  if (sqrtMatch) {
    const val = parseFloat(sqrtMatch[1]);
    if (!isNaN(val) && val >= 0) return Math.sqrt(val);
  }
  
  const radicalMatch = normalized.match(/^(\d+)\*?sqrt\((\d+)\)$/) || normalized.match(/^(\d+)√(\d+)$/);
  if (radicalMatch) {
    const coeff = parseFloat(radicalMatch[1]);
    const radicand = parseFloat(radicalMatch[2]);
    if (!isNaN(coeff) && !isNaN(radicand) && radicand >= 0) return coeff * Math.sqrt(radicand);
  }
  
  return null;
}

function areNumericEqual(val1: number, val2: number): boolean {
  if (!isFinite(val1) || !isFinite(val2)) return false;
  return Math.abs(val1 - val2) < NUMERIC_TOLERANCE;
}

function parseSolutionSet(expr: string): Set<string> {
  const solutions = new Set<string>();
  const normalized = normalizeMathExpression(expr).replace(/[{}]/g, '');
  const parts = normalized.split(/\b(?:or|of|en|and)\b|[,;]/i);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqMatch = trimmed.match(/^[a-z]\s*=\s*(.+)$/);
    if (eqMatch) {
      solutions.add(normalizeMathExpression(eqMatch[1]));
    } else {
      solutions.add(trimmed);
    }
  }
  return solutions;
}

function areSolutionSetsEquivalent(set1: Set<string>, set2: Set<string>): boolean {
  if (set1.size !== set2.size) return false;
  
  const arr1 = Array.from(set1);
  const arr2 = Array.from(set2);
  const used = new Set<number>();
  
  for (const val1 of arr1) {
    let found = false;
    for (let i = 0; i < arr2.length; i++) {
      if (used.has(i)) continue;
      const val2 = arr2[i];
      const num1 = parseNumericValue(val1);
      const num2 = parseNumericValue(val2);
      
      if (num1 !== null && num2 !== null && areNumericEqual(num1, num2)) {
        found = true;
        used.add(i);
        break;
      }
      if (val1 === val2) {
        found = true;
        used.add(i);
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

function parseAlgebraicTerms(expr: string): Map<string, number> {
  const terms = new Map<string, number>();
  const normalized = normalizeMathExpression(expr);
  
  const numericValue = parseNumericValue(normalized);
  if (numericValue !== null && /^-?\d+\.?\d*$/.test(normalized)) {
    terms.set('_const', numericValue);
    return terms;
  }
  
  const parts = normalized.split(/(?=[+-])/);
  for (const part of parts) {
    if (!part) continue;
    const match = part.match(/^([+-]?\d*\.?\d*)([a-z]+)?(\*\*(\d+))?$/);
    if (match) {
      let coeff = 1;
      if (match[1] === '' || match[1] === '+') coeff = 1;
      else if (match[1] === '-') coeff = -1;
      else coeff = parseFloat(match[1]);
      
      const vars = match[2] || '_const';
      const power = match[4] ? parseInt(match[4]) : 1;
      const key = vars === '_const' ? '_const' : vars.split('').sort().join('') + (power > 1 ? `**${power}` : '');
      terms.set(key, (terms.get(key) || 0) + coeff);
    }
  }
  return terms;
}

function areAlgebraicTermsEquivalent(terms1: Map<string, number>, terms2: Map<string, number>): boolean {
  if (terms1.size !== terms2.size) return false;
  for (const [key, val1] of terms1) {
    const val2 = terms2.get(key);
    if (val2 === undefined || !areNumericEqual(val1, val2)) return false;
  }
  return true;
}

function extractValueFromEquation(expr: string): string {
  const normalized = normalizeMathExpression(expr);
  const eqMatch = normalized.match(/^[a-z]\s*=\s*(.+)$/);
  if (eqMatch) return eqMatch[1];
  return normalized;
}

function checkMathEquivalence(userAnswer: string, correctAnswer: string): EquivalenceResult {
  if (!userAnswer || typeof userAnswer !== 'string' || !userAnswer.trim()) {
    return { isEquivalent: false, confidence: 'high', method: 'exact_match', reason: 'No answer provided' };
  }
  
  if (!correctAnswer || typeof correctAnswer !== 'string' || !correctAnswer.trim()) {
    return { isEquivalent: false, confidence: 'uncertain', method: 'failed', reason: 'No correct answer available' };
  }
  
  const normUser = normalizeMathExpression(userAnswer);
  const normCorrect = normalizeMathExpression(correctAnswer);
  
  // Exact match
  if (normUser === normCorrect) {
    return { isEquivalent: true, confidence: 'high', method: 'exact_match', reason: 'Exact match' };
  }
  
  // Extract values from equations
  const userValue = extractValueFromEquation(userAnswer);
  const correctValue = extractValueFromEquation(correctAnswer);
  
  if (normalizeMathExpression(userValue) === normalizeMathExpression(correctValue)) {
    return { isEquivalent: true, confidence: 'high', method: 'exact_match', reason: 'Values match' };
  }
  
  // Numeric comparison
  const userNum = parseNumericValue(userValue);
  const correctNum = parseNumericValue(correctValue);
  
  if (userNum !== null && correctNum !== null) {
    if (areNumericEqual(userNum, correctNum)) {
      return { isEquivalent: true, confidence: 'high', method: 'numeric', reason: 'Numeric values equal' };
    } else {
      return { isEquivalent: false, confidence: 'high', method: 'numeric', reason: 'Numeric values different' };
    }
  }
  
  // Solution sets
  const hasMultiPattern = /\b(or|of|en|and)\b|[,;{}]/i;
  if (hasMultiPattern.test(userAnswer) || hasMultiPattern.test(correctAnswer)) {
    const userSolutions = parseSolutionSet(userAnswer);
    const correctSolutions = parseSolutionSet(correctAnswer);
    
    if (userSolutions.size > 0 && correctSolutions.size > 0) {
      if (areSolutionSetsEquivalent(userSolutions, correctSolutions)) {
        return { isEquivalent: true, confidence: 'high', method: 'solution_set', reason: 'Solution sets equivalent' };
      } else if (userSolutions.size === correctSolutions.size) {
        return { isEquivalent: false, confidence: 'high', method: 'solution_set', reason: 'Solution sets different' };
      }
    }
  }
  
  // Algebraic terms
  const userTerms = parseAlgebraicTerms(userAnswer);
  const correctTerms = parseAlgebraicTerms(correctAnswer);
  
  if (userTerms.size > 0 && correctTerms.size > 0) {
    if (areAlgebraicTermsEquivalent(userTerms, correctTerms)) {
      return { isEquivalent: true, confidence: 'high', method: 'algebraic', reason: 'Algebraic expressions equivalent' };
    }
  }
  
  // Uncertain fallback
  return { isEquivalent: false, confidence: 'uncertain', method: 'failed', reason: 'Could not verify with high confidence' };
}

function gradeAnswer(userAnswer: string, correctAnswer: string): GradingResult {
  const result = checkMathEquivalence(userAnswer, correctAnswer);
  
  if (result.confidence === 'high' && result.isEquivalent) {
    return { isCorrect: true, confidence: 'high', method: result.method, reason: result.reason, needsReview: false, canProceed: true };
  }
  
  if (result.confidence === 'high' && !result.isEquivalent) {
    return { isCorrect: false, confidence: 'high', method: result.method, reason: result.reason, needsReview: false, canProceed: true };
  }
  
  return { isCorrect: false, confidence: 'uncertain', method: result.method, reason: result.reason, needsReview: true, canProceed: false };
}

// =========================================================================
// EDGE FUNCTION HANDLER
// =========================================================================

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

interface PartGradingResult {
  questionId: string;
  partLabel: string;
  subtopicName: string;
  userAnswer: string;
  correctAnswer: string;
  maxPoints: number;
  earnedPoints: number;
  isCorrect: boolean;
  confidence: 'high' | 'uncertain';
  method: string;
  reason: string;
  needsReview: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questions, userAnswers, userId, topicId } = await req.json();

    if (!questions || !userAnswers) {
      return new Response(
        JSON.stringify({ error: "questions and userAnswers are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const partResults: PartGradingResult[] = [];
    const subtopicScores: Record<string, { earned: number; possible: number }> = {};
    let totalEarned = 0;
    let totalPossible = 0;
    let hasUncertain = false;

    // Grade each part using DETERMINISTIC equivalence checking
    for (const question of questions as ExamQuestion[]) {
      if (!subtopicScores[question.subtopicName]) {
        subtopicScores[question.subtopicName] = { earned: 0, possible: 0 };
      }

      for (const part of question.parts) {
        const userAnswer = (userAnswers as UserAnswer[]).find(
          a => a.questionId === question.id && a.partLabel === part.partLabel
        );

        const answer = userAnswer?.answer?.trim() || '';
        
        // DETERMINISTIC GRADING - No AI decides scoring
        const gradeResult = gradeAnswer(answer, part.answer);
        
        const earnedPoints = gradeResult.isCorrect && gradeResult.confidence === 'high' 
          ? part.points 
          : 0;

        if (gradeResult.confidence === 'uncertain') {
          hasUncertain = true;
        }

        totalEarned += earnedPoints;
        totalPossible += part.points;
        subtopicScores[question.subtopicName].possible += part.points;
        subtopicScores[question.subtopicName].earned += earnedPoints;

        partResults.push({
          questionId: question.id,
          partLabel: part.partLabel,
          subtopicName: question.subtopicName,
          userAnswer: answer,
          correctAnswer: part.answer,
          maxPoints: part.points,
          earnedPoints,
          isCorrect: gradeResult.isCorrect,
          confidence: gradeResult.confidence,
          method: gradeResult.method,
          reason: gradeResult.reason,
          needsReview: gradeResult.needsReview,
        });
      }
    }

    // Calculate final score
    const scorePercentage = totalPossible > 0 
      ? Math.round((totalEarned / totalPossible) * 100) 
      : 0;

    // Identify weak subtopics (below 60%)
    const weakSubtopics: string[] = [];
    for (const [subtopic, scores] of Object.entries(subtopicScores)) {
      if (scores.possible > 0 && (scores.earned / scores.possible) < 0.6) {
        weakSubtopics.push(subtopic);
      }
    }

    const isExamReady = scorePercentage >= 70;

    console.log(`Exam graded: ${scorePercentage}%, hasUncertain: ${hasUncertain}, parts: ${partResults.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        scorePercentage,
        totalEarned,
        totalPossible,
        isExamReady,
        hasUncertain,
        canSubmit: !hasUncertain, // Block submission if any part is uncertain
        partResults,
        subtopicScores,
        weakSubtopics,
        message: hasUncertain 
          ? 'Some answers could not be verified with high confidence. Please retry or rephrase your answers.'
          : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Grade exam error:", error);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred grading the exam",
        success: false,
        canSubmit: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
