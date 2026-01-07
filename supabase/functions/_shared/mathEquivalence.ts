/**
 * Deterministic Math Equivalence Engine
 * SINGLE SOURCE OF TRUTH for all answer correctness checking.
 * 
 * AI may NEVER decide correctness - only this module may.
 * AI is allowed only for explanation and feedback AFTER deterministic grading.
 */

export interface EquivalenceResult {
  isEquivalent: boolean;
  confidence: 'high' | 'uncertain';
  method: 'exact_match' | 'numeric' | 'fraction' | 'algebraic' | 'solution_set' | 'interval' | 'sampling' | 'failed';
  reason: string;
}

export interface GradingResult {
  isCorrect: boolean;
  confidence: 'high' | 'uncertain';
  method: string;
  reason: string;
  needsReview: boolean;
  canProceed: boolean;
}

// Numeric tolerance for floating point comparisons
const NUMERIC_TOLERANCE = 0.0001;

// Safe sampling points for numeric evaluation (avoid singularities)
const SAFE_SAMPLE_POINTS = [0.5, 1, 1.5, 2, 2.5, -0.5, -1, -1.5];

/**
 * Normalize a mathematical string for comparison
 * Removes whitespace, standardizes operators, handles LaTeX
 */
export function normalizeMathExpression(expr: string): string {
  if (!expr || typeof expr !== 'string') return '';
  
  return expr
    .toLowerCase()
    .replace(/\$/g, '')           // Remove LaTeX delimiters
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')  // Convert LaTeX fractions
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')              // Convert LaTeX sqrt
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\pm/g, '+-')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\[a-z]+/g, '')     // Remove remaining LaTeX commands
    .replace(/[{}]/g, '')         // Remove braces
    .replace(/\s+/g, '')          // Remove whitespace
    .replace(/,/g, '.')           // Standardize decimal separator
    .replace(/−/g, '-')           // Unicode minus to ASCII
    .replace(/×/g, '*')           // Unicode multiply
    .replace(/÷/g, '/')           // Unicode divide
    .replace(/\^/g, '**')         // Convert caret to power
    .replace(/±/g, '+-')          // Plus-minus
    .trim();
}

/**
 * Parse a numeric value, handling fractions and simple expressions
 */
export function parseNumericValue(expr: string): number | null {
  const normalized = normalizeMathExpression(expr);
  
  // Try direct parse
  const direct = parseFloat(normalized);
  if (!isNaN(direct) && isFinite(direct)) {
    return direct;
  }
  
  // Try fraction: a/b
  const fractionMatch = normalized.match(/^(-?\d+\.?\d*)\/(-?\d+\.?\d*)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]);
    const den = parseFloat(fractionMatch[2]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return num / den;
    }
  }
  
  // Try mixed number: a b/c (normalized to a+b/c)
  const mixedMatch = normalized.match(/^(-?\d+)\+(-?\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]);
    if (!isNaN(whole) && !isNaN(num) && !isNaN(den) && den !== 0) {
      return whole + num / den;
    }
  }
  
  // Try sqrt: sqrt(n) or √n
  const sqrtMatch = normalized.match(/^sqrt\((\d+\.?\d*)\)$/) || 
                    normalized.match(/^√(\d+\.?\d*)$/);
  if (sqrtMatch) {
    const val = parseFloat(sqrtMatch[1]);
    if (!isNaN(val) && val >= 0) {
      return Math.sqrt(val);
    }
  }
  
  // Try simplified radical: a√b or a*sqrt(b)
  const radicalMatch = normalized.match(/^(\d+)\*?sqrt\((\d+)\)$/) ||
                       normalized.match(/^(\d+)√(\d+)$/);
  if (radicalMatch) {
    const coeff = parseFloat(radicalMatch[1]);
    const radicand = parseFloat(radicalMatch[2]);
    if (!isNaN(coeff) && !isNaN(radicand) && radicand >= 0) {
      return coeff * Math.sqrt(radicand);
    }
  }
  
  return null;
}

/**
 * Check numeric equivalence with tolerance
 */
export function areNumericEqual(val1: number, val2: number): boolean {
  if (!isFinite(val1) || !isFinite(val2)) return false;
  return Math.abs(val1 - val2) < NUMERIC_TOLERANCE;
}

/**
 * Parse solution set from various formats:
 * "x=2 or x=-3", "x=2, x=-3", "{2, -3}", "2 or -3"
 */
export function parseSolutionSet(expr: string): Set<string> {
  const solutions = new Set<string>();
  const normalized = normalizeMathExpression(expr);
  
  // Remove set braces
  const withoutBraces = normalized.replace(/[{}]/g, '');
  
  // Split by common separators
  const parts = withoutBraces.split(/\b(?:or|of|en|and)\b|[,;]/i);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    // Extract value from "x=value" format
    const eqMatch = trimmed.match(/^[a-z]\s*=\s*(.+)$/);
    if (eqMatch) {
      solutions.add(normalizeMathExpression(eqMatch[1]));
    } else {
      solutions.add(trimmed);
    }
  }
  
  return solutions;
}

/**
 * Check if two solution sets are equivalent (order-independent)
 */
export function areSolutionSetsEquivalent(set1: Set<string>, set2: Set<string>): boolean {
  if (set1.size !== set2.size) return false;
  if (set1.size === 0) return true;
  
  const arr1 = Array.from(set1);
  const arr2 = Array.from(set2);
  
  // For each element in set1, try to find a matching element in set2
  const used = new Set<number>();
  
  for (const val1 of arr1) {
    let found = false;
    for (let i = 0; i < arr2.length; i++) {
      if (used.has(i)) continue;
      
      const val2 = arr2[i];
      
      // Try numeric comparison
      const num1 = parseNumericValue(val1);
      const num2 = parseNumericValue(val2);
      
      if (num1 !== null && num2 !== null && areNumericEqual(num1, num2)) {
        found = true;
        used.add(i);
        break;
      }
      
      // Try direct string match
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

/**
 * Parse interval notation: "(a, b]", "[a, b)", "x < 5", "x ≤ 3"
 */
export function parseInterval(expr: string): { lower: number | null; upper: number | null; lowerInclusive: boolean; upperInclusive: boolean } | null {
  const normalized = normalizeMathExpression(expr);
  
  // Standard interval notation: (a, b], [a, b), etc.
  const intervalMatch = normalized.match(/^([(\[])(-?(?:\d+\.?\d*|inf|∞))\s*[,;]\s*(-?(?:\d+\.?\d*|inf|∞))([)\]])$/);
  if (intervalMatch) {
    const lowerInclusive = intervalMatch[1] === '[';
    const upperInclusive = intervalMatch[4] === ']';
    const lowerStr = intervalMatch[2].replace(/inf|∞/i, 'Infinity');
    const upperStr = intervalMatch[3].replace(/inf|∞/i, 'Infinity');
    
    const lower = lowerStr === '-Infinity' ? null : parseFloat(lowerStr);
    const upper = upperStr === 'Infinity' ? null : parseFloat(upperStr);
    
    return { lower, upper, lowerInclusive, upperInclusive };
  }
  
  // Inequality notation: x < 5, x >= 3, etc.
  const ineqMatch = normalized.match(/^[a-z]\s*(<=?|>=?|<|>)\s*(-?\d+\.?\d*)$/);
  if (ineqMatch) {
    const op = ineqMatch[1];
    const val = parseFloat(ineqMatch[2]);
    
    if (op === '<' || op === '<=') {
      return { lower: null, upper: val, lowerInclusive: false, upperInclusive: op === '<=' };
    } else {
      return { lower: val, upper: null, lowerInclusive: op === '>=', upperInclusive: false };
    }
  }
  
  return null;
}

/**
 * Check if two intervals are equivalent
 */
export function areIntervalsEquivalent(int1: ReturnType<typeof parseInterval>, int2: ReturnType<typeof parseInterval>): boolean {
  if (!int1 || !int2) return false;
  
  const lowerMatch = (int1.lower === null && int2.lower === null) || 
    (int1.lower !== null && int2.lower !== null && areNumericEqual(int1.lower, int2.lower));
  const upperMatch = (int1.upper === null && int2.upper === null) || 
    (int1.upper !== null && int2.upper !== null && areNumericEqual(int1.upper, int2.upper));
  
  return lowerMatch && upperMatch && 
         int1.lowerInclusive === int2.lowerInclusive && 
         int1.upperInclusive === int2.upperInclusive;
}

/**
 * Parse algebraic expression into coefficient-variable map
 */
export function parseAlgebraicTerms(expr: string): Map<string, number> {
  const terms = new Map<string, number>();
  const normalized = normalizeMathExpression(expr);
  
  // Handle pure numeric
  const numericValue = parseNumericValue(normalized);
  if (numericValue !== null && /^-?\d+\.?\d*$/.test(normalized)) {
    terms.set('_const', numericValue);
    return terms;
  }
  
  // Split by + or - while keeping the sign
  const parts = normalized.split(/(?=[+-])/);
  
  for (const part of parts) {
    if (!part) continue;
    
    // Match coefficient and variable(s): "2x", "-3xy", "x", "-y", "5"
    const match = part.match(/^([+-]?\d*\.?\d*)([a-z]+)?(\*\*(\d+))?$/);
    if (match) {
      let coeff = 1;
      if (match[1] === '' || match[1] === '+') {
        coeff = 1;
      } else if (match[1] === '-') {
        coeff = -1;
      } else {
        coeff = parseFloat(match[1]);
      }
      
      const vars = match[2] || '_const';
      const power = match[4] ? parseInt(match[4]) : 1;
      
      // Sort variables alphabetically for canonical form
      const key = vars === '_const' ? '_const' : vars.split('').sort().join('') + (power > 1 ? `**${power}` : '');
      terms.set(key, (terms.get(key) || 0) + coeff);
    }
  }
  
  return terms;
}

/**
 * Check if two algebraic term maps are equivalent
 */
export function areAlgebraicTermsEquivalent(terms1: Map<string, number>, terms2: Map<string, number>): boolean {
  if (terms1.size !== terms2.size) return false;
  
  for (const [key, val1] of terms1) {
    const val2 = terms2.get(key);
    if (val2 === undefined || !areNumericEqual(val1, val2)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Evaluate a simple algebraic expression at a given x value
 * Handles basic operations: +, -, *, /, **
 */
export function evaluateAtPoint(expr: string, x: number): number | null {
  try {
    const normalized = normalizeMathExpression(expr);
    
    // Replace x with the value
    const withValue = normalized.replace(/x/g, `(${x})`);
    
    // Very simple and safe evaluation - only allow specific characters
    if (!/^[0-9+\-*/().]+$/.test(withValue.replace(/\*\*/g, '^'))) {
      return null;
    }
    
    // Convert ** to Math.pow for evaluation
    let evalExpr = withValue;
    
    // Handle exponents: convert a**b to Math.pow(a,b)
    // This is a simplified handler for basic cases
    while (evalExpr.includes('**')) {
      evalExpr = evalExpr.replace(/\(([^()]+)\)\*\*(\d+)/, 'Math.pow($1,$2)');
      evalExpr = evalExpr.replace(/(-?\d+\.?\d*)\*\*(\d+)/, 'Math.pow($1,$2)');
      
      // Safety: prevent infinite loop
      if (evalExpr === withValue) break;
    }
    
    // Safe evaluation using Function constructor (isolated scope)
    const fn = new Function('Math', `return ${evalExpr}`);
    const result = fn(Math);
    
    if (typeof result === 'number' && isFinite(result)) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check expression equivalence using numeric sampling
 */
export function checkBySampling(expr1: string, expr2: string): { equivalent: boolean; confidence: 'high' | 'uncertain' } {
  let matchCount = 0;
  let testedCount = 0;
  
  for (const x of SAFE_SAMPLE_POINTS) {
    const val1 = evaluateAtPoint(expr1, x);
    const val2 = evaluateAtPoint(expr2, x);
    
    if (val1 !== null && val2 !== null) {
      testedCount++;
      if (areNumericEqual(val1, val2)) {
        matchCount++;
      } else {
        // If any point doesn't match, expressions are definitely different
        return { equivalent: false, confidence: 'high' };
      }
    }
  }
  
  // Need at least 3 successful evaluations for high confidence
  if (testedCount >= 3 && matchCount === testedCount) {
    return { equivalent: true, confidence: 'high' };
  }
  
  return { equivalent: false, confidence: 'uncertain' };
}

/**
 * Extract value from equation format "x = value" or "y = value"
 */
export function extractValueFromEquation(expr: string): string {
  const normalized = normalizeMathExpression(expr);
  const eqMatch = normalized.match(/^[a-z]\s*=\s*(.+)$/);
  if (eqMatch) {
    return eqMatch[1];
  }
  return normalized;
}

/**
 * MAIN FUNCTION: Check if two mathematical expressions are equivalent
 * 
 * This is the ONLY function that should be used for grading decisions.
 * Returns explicit confidence levels - only 'high' confidence can determine correctness.
 */
export function checkMathEquivalence(userAnswer: string, correctAnswer: string): EquivalenceResult {
  // Handle empty or invalid input
  if (!userAnswer || typeof userAnswer !== 'string' || !userAnswer.trim()) {
    return {
      isEquivalent: false,
      confidence: 'high',
      method: 'exact_match',
      reason: 'No answer provided'
    };
  }
  
  if (!correctAnswer || typeof correctAnswer !== 'string' || !correctAnswer.trim()) {
    return {
      isEquivalent: false,
      confidence: 'uncertain',
      method: 'failed',
      reason: 'No correct answer available for comparison'
    };
  }
  
  const normUser = normalizeMathExpression(userAnswer);
  const normCorrect = normalizeMathExpression(correctAnswer);
  
  // 1. EXACT STRING MATCH (highest confidence)
  if (normUser === normCorrect) {
    return {
      isEquivalent: true,
      confidence: 'high',
      method: 'exact_match',
      reason: 'Exact match after normalization'
    };
  }
  
  // 2. EXTRACT VALUES FROM EQUATIONS (x=5 vs 5)
  const userValue = extractValueFromEquation(userAnswer);
  const correctValue = extractValueFromEquation(correctAnswer);
  
  if (normalizeMathExpression(userValue) === normalizeMathExpression(correctValue)) {
    return {
      isEquivalent: true,
      confidence: 'high',
      method: 'exact_match',
      reason: 'Values match after extracting from equation format'
    };
  }
  
  // 3. NUMERIC COMPARISON (handles decimals, fractions)
  const userNum = parseNumericValue(userValue);
  const correctNum = parseNumericValue(correctValue);
  
  if (userNum !== null && correctNum !== null) {
    if (areNumericEqual(userNum, correctNum)) {
      return {
        isEquivalent: true,
        confidence: 'high',
        method: 'numeric',
        reason: 'Numeric values are equal within tolerance'
      };
    } else {
      return {
        isEquivalent: false,
        confidence: 'high',
        method: 'numeric',
        reason: 'Numeric values are different'
      };
    }
  }
  
  // 4. FRACTION EQUIVALENCE (1/2 = 0.5)
  const userFrac = parseNumericValue(userAnswer);
  const correctFrac = parseNumericValue(correctAnswer);
  
  if (userFrac !== null && correctFrac !== null) {
    if (areNumericEqual(userFrac, correctFrac)) {
      return {
        isEquivalent: true,
        confidence: 'high',
        method: 'fraction',
        reason: 'Fraction/decimal equivalence confirmed'
      };
    }
  }
  
  // 5. SOLUTION SET COMPARISON (for quadratics, etc.)
  const hasMultiSolutionPattern = /\b(or|of|en|and)\b|[,;{}]/i;
  if (hasMultiSolutionPattern.test(userAnswer) || hasMultiSolutionPattern.test(correctAnswer)) {
    const userSolutions = parseSolutionSet(userAnswer);
    const correctSolutions = parseSolutionSet(correctAnswer);
    
    if (userSolutions.size > 0 && correctSolutions.size > 0) {
      if (areSolutionSetsEquivalent(userSolutions, correctSolutions)) {
        return {
          isEquivalent: true,
          confidence: 'high',
          method: 'solution_set',
          reason: 'Solution sets are equivalent'
        };
      } else if (userSolutions.size === correctSolutions.size) {
        // Same size but not equivalent = definitely wrong
        return {
          isEquivalent: false,
          confidence: 'high',
          method: 'solution_set',
          reason: 'Solution sets have different values'
        };
      }
    }
  }
  
  // 6. INTERVAL COMPARISON
  const userInterval = parseInterval(userAnswer);
  const correctInterval = parseInterval(correctAnswer);
  
  if (userInterval && correctInterval) {
    if (areIntervalsEquivalent(userInterval, correctInterval)) {
      return {
        isEquivalent: true,
        confidence: 'high',
        method: 'interval',
        reason: 'Intervals are equivalent'
      };
    } else {
      return {
        isEquivalent: false,
        confidence: 'high',
        method: 'interval',
        reason: 'Intervals are different'
      };
    }
  }
  
  // 7. ALGEBRAIC TERM COMPARISON (2x = x+x = x*2)
  const userTerms = parseAlgebraicTerms(userAnswer);
  const correctTerms = parseAlgebraicTerms(correctAnswer);
  
  if (userTerms.size > 0 && correctTerms.size > 0) {
    if (areAlgebraicTermsEquivalent(userTerms, correctTerms)) {
      return {
        isEquivalent: true,
        confidence: 'high',
        method: 'algebraic',
        reason: 'Algebraic expressions are equivalent'
      };
    }
  }
  
  // 8. NUMERIC SAMPLING (for more complex expressions)
  const samplingResult = checkBySampling(userValue, correctValue);
  if (samplingResult.confidence === 'high') {
    return {
      isEquivalent: samplingResult.equivalent,
      confidence: 'high',
      method: 'sampling',
      reason: samplingResult.equivalent 
        ? 'Expressions evaluate to same values at multiple test points'
        : 'Expressions evaluate to different values'
    };
  }
  
  // 9. FALLBACK: UNCERTAIN
  // We could not determine equivalence with high confidence
  // This MUST block any grading decision
  return {
    isEquivalent: false,
    confidence: 'uncertain',
    method: 'failed',
    reason: 'Could not determine equivalence with high confidence. Manual review required.'
  };
}

/**
 * GRADING FUNCTION: Determine if answer is correct with proper safety checks
 * 
 * This wraps checkMathEquivalence with the safety rules:
 * - Only 'high' confidence can mark correct
 * - 'uncertain' must block progression
 * - Returns explicit canProceed flag
 */
export function gradeAnswer(userAnswer: string, correctAnswer: string): GradingResult {
  const result = checkMathEquivalence(userAnswer, correctAnswer);
  
  // Only high confidence correct answers can proceed
  if (result.confidence === 'high' && result.isEquivalent) {
    return {
      isCorrect: true,
      confidence: 'high',
      method: result.method,
      reason: result.reason,
      needsReview: false,
      canProceed: true
    };
  }
  
  // High confidence incorrect - can proceed (they got it wrong)
  if (result.confidence === 'high' && !result.isEquivalent) {
    return {
      isCorrect: false,
      confidence: 'high',
      method: result.method,
      reason: result.reason,
      needsReview: false,
      canProceed: true
    };
  }
  
  // Uncertain - MUST BLOCK, cannot grade
  return {
    isCorrect: false,
    confidence: 'uncertain',
    method: result.method,
    reason: result.reason,
    needsReview: true,
    canProceed: false // CRITICAL: Cannot proceed when uncertain
  };
}

/**
 * Batch grade multiple parts of an exam question
 */
export function gradeExamParts(
  parts: Array<{ userAnswer: string; correctAnswer: string; points: number }>
): {
  results: Array<GradingResult & { earnedPoints: number; maxPoints: number }>;
  hasUncertain: boolean;
  totalEarned: number;
  totalPossible: number;
} {
  const results: Array<GradingResult & { earnedPoints: number; maxPoints: number }> = [];
  let hasUncertain = false;
  let totalEarned = 0;
  let totalPossible = 0;
  
  for (const part of parts) {
    const gradeResult = gradeAnswer(part.userAnswer, part.correctAnswer);
    
    const earnedPoints = gradeResult.isCorrect && gradeResult.confidence === 'high' 
      ? part.points 
      : 0;
    
    if (gradeResult.confidence === 'uncertain') {
      hasUncertain = true;
    }
    
    totalEarned += earnedPoints;
    totalPossible += part.points;
    
    results.push({
      ...gradeResult,
      earnedPoints,
      maxPoints: part.points
    });
  }
  
  return {
    results,
    hasUncertain,
    totalEarned,
    totalPossible
  };
}
