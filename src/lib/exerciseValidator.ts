/**
 * Exercise Validator - Single source of truth for exercise correctness.
 * Prevents corrupted/invalid exercises from ever being displayed to users.
 */

import katex from 'katex';

export interface ValidationResult {
  isValid: boolean;
  fixedQuestion?: string;
  reason?: string;
  corruptionType?: string;
}

/**
 * Corruption patterns to detect in exercises.
 * Patterns marked as fixable will be auto-corrected.
 */
const CORRUPTION_PATTERNS = [
  // Corrupted \neq - e.g., "meq0" from "m\neq0" where \n became newline
  { regex: /[a-zA-Z]eq\d/i, name: 'corrupted_neq', fixable: true },
  { regex: /[a-zA-Z]\s*\n\s*eq\s*\d/i, name: 'corrupted_neq_newline', fixable: true },
  { regex: /[a-zA-Z]\s+eq\s+\d/i, name: 'corrupted_neq_spaces', fixable: true },
  
  // Double-prefixed commands - e.g., "\f\frac" instead of "\frac"
  { regex: /\\f\\frac/g, name: 'double_prefix_frac', fixable: true },
  { regex: /\\s\\sqrt/g, name: 'double_prefix_sqrt', fixable: true },
  
  // Missing backslash on commands - e.g., "rac{" instead of "\frac{"
  { regex: /(?<!\\)rac\{/, name: 'missing_backslash_frac', fixable: true },
  { regex: /(?<!\\)qrt\{/, name: 'missing_backslash_sqrt', fixable: true },
  
  // Placeholder garbage - never fixable
  { regex: /\beq0\b/, name: 'placeholder_eq0', fixable: false },
  { regex: /\bTODO\b/i, name: 'placeholder_todo', fixable: false },
  { regex: /\?\?\?/, name: 'placeholder_question', fixable: false },
  { regex: /\.\.\.\.+/, name: 'placeholder_dots', fixable: false },
  { regex: /\[INSERT\]|\[PLACEHOLDER\]|\[FILL\]/i, name: 'placeholder_bracket', fixable: false },
];

/**
 * Garbage patterns that should never appear in rendered output.
 * Used for post-render validation.
 */
const GARBAGE_OUTPUT_PATTERNS = /meq\d|neq\d|xeq\d|yeq\d|\beq0\b|rac\{|qrt\{/i;

/**
 * Auto-fix common LaTeX corruptions.
 * Only fixes patterns that are mathematically safe to correct.
 */
export function autoFixLatex(latex: string): string {
  if (!latex?.trim()) return '';
  
  let result = latex;
  
  // Fix corrupted \neq patterns
  // Case 1: m\neq0 where \n became newline -> "m" + newline + "eq0"
  result = result.replace(/([a-zA-Z])\s*\n\s*eq\s*(\d)/g, '$1 \\neq $2');
  
  // Case 2: "meq0" - letter directly followed by "eq" and digit
  result = result.replace(/([a-zA-Z])eq(\d)/g, '$1 \\neq $2');
  
  // Case 3: "m eq 0" - letter, spaces, "eq", spaces, digit
  result = result.replace(/([a-zA-Z])\s+eq\s+(\d)/g, '$1 \\neq $2');
  
  // Fix double-prefixed commands
  result = result.replace(/\\f\\frac/g, '\\frac');
  result = result.replace(/\\s\\sqrt/g, '\\sqrt');
  
  // Fix missing backslash on commands (only when not already prefixed)
  result = result.replace(/(?<!\\)rac\{/g, '\\frac{');
  result = result.replace(/(?<!\\)qrt\{/g, '\\sqrt{');
  
  // Fix missing backslash on cdot
  result = result.replace(/(?<!\\)cdot(?=\s|$|[^a-zA-Z])/g, '\\cdot');
  
  // Fix single backslash line breaks in cases/aligned environments
  // This is tricky - we need to be careful not to break valid LaTeX
  result = result.replace(
    /(\\begin\{cases\})([\s\S]*?)(\\end\{cases\})/g,
    (match, begin, content, end) => {
      // Replace single \ followed by newline with \\
      const fixedContent = content.replace(/(?<!\\)\\(?=\s*\n)/g, '\\\\');
      return begin + fixedContent + end;
    }
  );
  
  return result.trim();
}

/**
 * Test if LaTeX renders correctly in KaTeX without errors.
 * Also checks that output doesn't contain garbage patterns.
 */
export function katexRenderTest(latex: string): boolean {
  if (!latex?.trim()) return true; // Empty is valid
  
  // Extract all math segments from the text
  const mathSegments: string[] = [];
  
  // Match $$...$$ (display) and $...$ (inline)
  const mathBlockRegex = /\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g;
  let match;
  
  while ((match = mathBlockRegex.exec(latex)) !== null) {
    const mathContent = (match[1] || match[2] || '').trim();
    if (mathContent) {
      mathSegments.push(mathContent);
    }
  }
  
  // If no explicit math blocks, check if the whole thing looks like LaTeX
  if (mathSegments.length === 0 && /\\[a-zA-Z]+/.test(latex)) {
    mathSegments.push(latex);
  }
  
  // Test each segment
  for (const segment of mathSegments) {
    try {
      const html = katex.renderToString(segment, {
        throwOnError: true,
        strict: 'warn', // Use warn instead of error for better compatibility
      });
      
      // Check if output still contains garbage patterns
      if (GARBAGE_OUTPUT_PATTERNS.test(html)) {
        console.warn('[exerciseValidator] KaTeX output contains garbage:', segment);
        return false;
      }
    } catch (error) {
      console.warn('[exerciseValidator] KaTeX render failed:', segment, error);
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a system of equations has valid structure.
 * Each line should contain "=" and at least one variable.
 */
function validateSystemOfEquations(latex: string): boolean {
  // Check for cases environment
  const casesMatch = latex.match(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/);
  if (!casesMatch) return true; // Not a system, skip this check
  
  const content = casesMatch[1];
  
  // Split by \\ (line breaks in cases)
  const lines = content.split(/\\\\/).filter(line => line.trim());
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip constraint lines like "m \neq 0"
    if (/\\neq|\\ne\b|\\not=/.test(trimmedLine)) continue;
    
    // Each equation line should have an equals sign
    if (!trimmedLine.includes('=') && !trimmedLine.includes('\\eq')) {
      // Exception: some lines might just be variable declarations
      if (!/[a-zA-Z]/.test(trimmedLine)) {
        console.warn('[exerciseValidator] System line has no variable:', trimmedLine);
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Check for unbalanced braces in LaTeX.
 */
function hasBalancedBraces(latex: string): boolean {
  let count = 0;
  
  for (let i = 0; i < latex.length; i++) {
    const char = latex[i];
    const prevChar = i > 0 ? latex[i - 1] : '';
    
    // Skip escaped braces
    if (prevChar === '\\') continue;
    
    if (char === '{') count++;
    else if (char === '}') count--;
    
    // More closing than opening at any point = invalid
    if (count < 0) return false;
  }
  
  return count === 0;
}

/**
 * Main validation function.
 * Returns whether the exercise is valid, and optionally a fixed version.
 */
export function validateExercise(question: string): ValidationResult {
  if (!question?.trim()) {
    return { isValid: false, reason: 'Empty question', corruptionType: 'empty' };
  }
  
  let workingQuestion = question;
  let wasFixed = false;
  
  // Step 1: Check for unfixable corruption patterns first
  for (const pattern of CORRUPTION_PATTERNS) {
    if (!pattern.fixable && pattern.regex.test(workingQuestion)) {
      console.warn(`[exerciseValidator] Unfixable corruption: ${pattern.name}`);
      return {
        isValid: false,
        reason: `Contains unfixable corruption: ${pattern.name}`,
        corruptionType: pattern.name,
      };
    }
  }
  
  // Step 2: Check for fixable patterns and apply fixes
  for (const pattern of CORRUPTION_PATTERNS) {
    if (pattern.fixable && pattern.regex.test(workingQuestion)) {
      console.log(`[exerciseValidator] Detected fixable corruption: ${pattern.name}`);
      workingQuestion = autoFixLatex(workingQuestion);
      wasFixed = true;
      break; // autoFixLatex handles all fixable patterns at once
    }
  }
  
  // Step 3: Check for unbalanced braces
  if (!hasBalancedBraces(workingQuestion)) {
    console.warn('[exerciseValidator] Unbalanced braces detected');
    return {
      isValid: false,
      reason: 'Unbalanced braces in LaTeX',
      corruptionType: 'unbalanced_braces',
    };
  }
  
  // Step 4: Validate system of equations structure
  if (!validateSystemOfEquations(workingQuestion)) {
    console.warn('[exerciseValidator] Invalid system of equations');
    return {
      isValid: false,
      reason: 'Invalid system of equations structure',
      corruptionType: 'invalid_system',
    };
  }
  
  // Step 5: KaTeX render test
  if (!katexRenderTest(workingQuestion)) {
    console.warn('[exerciseValidator] KaTeX render test failed');
    return {
      isValid: false,
      reason: 'LaTeX fails to render correctly',
      corruptionType: 'render_failure',
    };
  }
  
  // All checks passed
  return {
    isValid: true,
    fixedQuestion: wasFixed ? workingQuestion : undefined,
  };
}

/**
 * Filter an array of exercises, removing invalid ones and fixing fixable ones.
 * Returns only valid exercises with all original properties preserved.
 */
export function filterValidExercises<T extends { id?: string; question: string }>(
  exercises: T[],
  source: string = 'unknown'
): T[] {
  const result: T[] = [];
  
  for (const exercise of exercises) {
    const validation = validateExercise(exercise.question);
    
    if (validation.isValid) {
      if (validation.fixedQuestion) {
        console.log(`[${source}] Auto-fixed exercise ${exercise.id}`);
        // Create a new object with the fixed question, preserving all other properties
        result.push({ ...exercise, question: validation.fixedQuestion });
      } else {
        result.push(exercise);
      }
    } else {
      console.warn(`[${source}] Rejecting exercise ${exercise.id}: ${validation.reason}`);
    }
  }
  
  return result;
}
