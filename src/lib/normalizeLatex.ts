/**
 * Normalizes LaTeX strings for consistent rendering.
 * Handles common formatting issues like stray $ symbols, inconsistent delimiters, etc.
 */

// Common text-to-LaTeX conversions
const textToLatexMap: [RegExp, string][] = [
  [/±/g, '\\pm '],
  [/×/g, '\\times '],
  [/÷/g, '\\div '],
  [/√/g, '\\sqrt'],
  [/∞/g, '\\infty '],
  [/≤/g, '\\leq '],
  [/≥/g, '\\geq '],
  [/≠/g, '\\neq '],
  [/→/g, '\\rightarrow '],
  [/←/g, '\\leftarrow '],
  [/⇒/g, '\\Rightarrow '],
  [/∈/g, '\\in '],
  [/∉/g, '\\notin '],
  [/∪/g, '\\cup '],
  [/∩/g, '\\cap '],
  [/⊂/g, '\\subset '],
  [/⊆/g, '\\subseteq '],
  [/α/g, '\\alpha '],
  [/β/g, '\\beta '],
  [/γ/g, '\\gamma '],
  [/δ/g, '\\delta '],
  [/θ/g, '\\theta '],
  [/π/g, '\\pi '],
  [/σ/g, '\\sigma '],
  [/Σ/g, '\\Sigma '],
  [/φ/g, '\\phi '],
  [/ω/g, '\\omega '],
  // Superscript digits (x² → x^2)
  [/²/g, '^2'],
  [/³/g, '^3'],
  [/⁴/g, '^4'],
  [/⁵/g, '^5'],
  [/⁶/g, '^6'],
  [/⁷/g, '^7'],
  [/⁸/g, '^8'],
  [/⁹/g, '^9'],
  [/⁰/g, '^0'],
  [/¹/g, '^1'],
  // Subscript digits
  [/₀/g, '_0'],
  [/₁/g, '_1'],
  [/₂/g, '_2'],
  [/₃/g, '_3'],
  [/₄/g, '_4'],
  [/₅/g, '_5'],
  [/₆/g, '_6'],
  [/₇/g, '_7'],
  [/₈/g, '_8'],
  [/₉/g, '_9'],
];

/**
 * Fixes corrupted LaTeX commands where backslash was stripped
 * Examples: "rac{1}{2}" → "\\frac{1}{2}", "qrt{x}" → "\\sqrt{x}", "f32" → "\\frac{3}{2}"
 */
export function fixCorruptedLatexCommands(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  let result = input;

  // FIRST: Fix corrupted "\f" that should be "\frac" - the backslash got partially preserved
  // Pattern: \f followed by rac{ or just \f before a { → should be \frac
  result = result.replace(/\\f\\frac\{/g, '\\frac{');  // \f\frac{ → \frac{
  result = result.replace(/\\frac\{/g, '\\frac{');     // Already correct, ensure consistency
  
  // Fix "\f" followed by digits (like \f32 → \frac{3}{2})
  result = result.replace(/\\f(\d)(\d)(?![0-9{])/g, '\\frac{$1}{$2}');
  
  // Fix standalone "f" followed by two digits (like f32 → \frac{3}{2})
  result = result.replace(/(?<![\\a-zA-Z])f(\d)(\d)(?![0-9{])/g, '\\frac{$1}{$2}');

  // Fix corrupted LaTeX commands (backslash was stripped)
  // These patterns match corrupted commands that should have a backslash
  const corruptedCommands: [RegExp, string][] = [
    // Stray \f before proper commands - remove it
    [/\\f\\frac/g, '\\frac'],
    [/\\f\\sqrt/g, '\\sqrt'],
    // Fractions: rac{ → \frac{
    [/(?<!\\f)(?<!\\)rac\{/g, '\\frac{'],
    // Square roots: qrt{ or qrt[ → \sqrt{ or \sqrt[
    [/(?<!\\)qrt\{/g, '\\sqrt{'],
    [/(?<!\\)qrt\[/g, '\\sqrt['],
    // Times: imes → \times (but not "times" as a word)
    [/(?<![a-zA-Z])imes(?![a-zA-Z])/g, '\\times'],
    // Division: div → \div (but not "div" as part of word)
    [/(?<![a-zA-Z])div(?![a-zA-Z])/g, '\\div'],
    // Plus-minus: pm → \pm
    [/(?<![a-zA-Z])pm(?![a-zA-Z])/g, '\\pm'],
    // Logarithm: og_ → \log_
    [/(?<!\\l)og_/g, '\\log_'],
    // Trig functions
    [/(?<!\\|[a-zA-Z])sin\{/g, '\\sin{'],
    [/(?<!\\|[a-zA-Z])cos\{/g, '\\cos{'],
    [/(?<!\\|[a-zA-Z])tan\{/g, '\\tan{'],
    // Infinity: infty → \infty
    [/(?<!\\)infty(?![a-zA-Z])/g, '\\infty'],
    // Comparison operators
    [/(?<!\\)leq(?![a-zA-Z])/g, '\\leq'],
    [/(?<!\\)geq(?![a-zA-Z])/g, '\\geq'],
    [/(?<!\\)neq(?![a-zA-Z])/g, '\\neq'],
    // Greek letters (common ones)
    [/(?<!\\)alpha(?![a-zA-Z])/g, '\\alpha'],
    [/(?<!\\)beta(?![a-zA-Z])/g, '\\beta'],
    [/(?<!\\)gamma(?![a-zA-Z])/g, '\\gamma'],
    [/(?<!\\)delta(?![a-zA-Z])/g, '\\delta'],
    [/(?<!\\)theta(?![a-zA-Z])/g, '\\theta'],
    [/(?<!\\)cdot(?![a-zA-Z])/g, '\\cdot'],
  ];

  for (const [pattern, replacement] of corruptedCommands) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Converts inline system of equations to the booklet format:
 * an opening left brace (accolade) with two (or more) equations stacked.
 *
 * Booklet reference (see bookletExerciseTemplates.ts):
 * Solve: $\begin{cases} ... \\ ... \end{cases}$
 *
 * KaTeX is stricter about `cases` rows (often expects `&`), so we render systems as
 * `\left\{\begin{aligned} ... \\ ... \end{aligned}\right.` which matches the booklet look.
 */
export function convertSystemOfEquations(input: string): string {
  if (!input || typeof input !== 'string') return input;

  // Already formatted as a multi-line system
  if (
    input.includes('\\begin{cases}') ||
    input.includes('\\begin{aligned}') ||
    input.includes('\\left\\{')
  ) {
    return input;
  }

  const systemPrefixes = [
    /^(.*?solve\s+the\s+system\s+of\s+equations\s*:?(\s*))/i,
    /^(.*?system\s+of\s+equations\s*:?(\s*))/i,
    /^(.*?solve\s+the\s+following\s+system\s*:?(\s*))/i,
    /^(.*?solve\s*:?(\s*))/i,
  ];

  let prefix = '';
  let mathPart = input.trim();

  for (const prefixPattern of systemPrefixes) {
    const match = mathPart.match(prefixPattern);
    if (match) {
      prefix = match[1];
      mathPart = mathPart.slice(match[0].length).trim();
      break;
    }
  }

  const collectEquations = (raw: string): string[] => {
    const cleaned = raw
      .replace(/\s+/g, ' ')
      .replace(/[，؛]/g, ',')
      .trim();

    // 1) Newline-separated or semicolon-separated
    const byHardSeparators = cleaned
      .split(/(?:\s*;\s*|\s*\n\s*)/)
      .map((s) => s.trim())
      .filter(Boolean);

    const maybeEqList = byHardSeparators.some((s) => s.includes('=')) ? byHardSeparators : [cleaned];

    // 2) If still a single chunk, attempt to split where a new equation starts.
    if (maybeEqList.length === 1) {
      // Split when we see " ... = ..." and then another equation starting with a variable-like token.
      // Example: "8x+3y=28 2x+y=8" or "x+y=10, x-y=2".
      const chunk = maybeEqList[0]
        .replace(/,\s*/g, ' , ') // normalize commas as separators
        .replace(/\s+,\s+/g, ' , ');

      const parts = chunk
        .split(/\s+,\s+|(?<==[^=]{1,20})\s+(?=[a-zA-Z]\w*\s*[+\-]=?|[0-9]*[a-zA-Z]\w*\s*[+\-])/)
        .map((s) => s.trim())
        .filter(Boolean);

      const eqs = parts.filter((p) => p.includes('='));
      return eqs.length >= 2 ? eqs : [];
    }

    const eqs = maybeEqList.filter((p) => p.includes('='));
    return eqs.length >= 2 ? eqs : [];
  };

  const equations = collectEquations(mathPart);
  if (equations.length < 2) return input;

  const alignedBody = equations.map((eq) => eq.trim()).join(' \\\\ ');
  const systemLatex = `$\\left\\{\\begin{aligned} ${alignedBody} \\end{aligned}\\right.$`;

  return prefix ? `${prefix}${systemLatex}` : systemLatex;
}


export function fixMalformedLatex(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }

  // First fix any corrupted commands (missing backslashes)
  let result = fixCorruptedLatexCommands(input);
  
  // Convert system of equations to cases environment
  result = convertSystemOfEquations(result);

  // Fix patterns like "^x+^2" or "^x-^3" → "^{x+2}" or "^{x-3}"
  // This catches malformed exponents where the AI incorrectly split the exponent
  result = result.replace(/\^([a-z])\+\^(\d+)/gi, '^{$1+$2}');
  result = result.replace(/\^([a-z])-\^(\d+)/gi, '^{$1-$2}');

  // Fix patterns already inside braces: "^{x+^2}" → "^{x+2}"
  result = result.replace(/\^\{\s*([a-z])\+\^(\d+)\s*\}/gi, '^{$1+$2}');
  result = result.replace(/\^\{\s*([a-z])-\^(\d+)\s*\}/gi, '^{$1-$2}');
  // Fix patterns like "^x+2" at end of expression or before = → "^{x+2}"
  // Match: base^variable+number followed by space, =, or end
  result = result.replace(/\^([a-z])([+\-])(\d+)(\s*[=\s]|$)/gi, '^{$1$2$3}$4');
  
  // Fix patterns like "^2x" (number before variable in exponent) → "^{2x}"
  result = result.replace(/\^(\d)([a-z])(\s*[=\s]|$)/gi, '^{$1$2}$3');
  
  // Fix patterns like "^x-1" or "^2x+1" → "^{x-1}" or "^{2x+1}"
  result = result.replace(/\^(\d*[a-z][+\-]\d+)(?!\})/gi, '^{$1}');
  
  // Fix log notation: "log_2(x)" or "log_2 x" → "\\log_{2}(x)"
  // But don't double-fix if already has backslash
  result = result.replace(/(?<!\\)log_(\d+)\s*\(/gi, '\\log_{$1}(');
  result = result.replace(/(?<!\\)log_(\d+)\s+/gi, '\\log_{$1} ');
  
  // Fix subscript notation without braces: a_10 → a_{10}
  result = result.replace(/_(\d{2,})(?!\})/g, '_{$1}');
  
  // Fix simple numeric fractions like 1/25 → \frac{1}{25}
  // Only applies when surrounded by non-word characters (avoids breaking expressions like x/2)
  result = result.replace(/(?<![a-z\d])(\d+)\s*\/\s*(\d+)(?![a-z\d])/gi, '\\frac{$1}{$2}');
  
  // Ensure square root has proper braces: √x+5 → √{x+5} when followed by operation
  result = result.replace(/√([a-z])([+\-])(\d+)/gi, '\\sqrt{$1$2$3}');
  result = result.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
  
  // Clean up any double braces that might have been created
  result = result.replace(/\{\{/g, '{');
  result = result.replace(/\}\}/g, '}');

  return result;
}

/**
 * Detects if a string is primarily math content (not mixed text with some variables)
 */
function containsMathContent(text: string): boolean {
  // Check for LaTeX commands first - these definitely indicate math
  const latexCommandPatterns = [
    /\\forall/,
    /\\exists/,
    /\\varepsilon/,
    /\\epsilon/,
    /\\delta/,
    /\\alpha/,
    /\\beta/,
    /\\gamma/,
    /\\theta/,
    /\\phi/,
    /\\omega/,
    /\\pi/,
    /\\sigma/,
    /\\Sigma/,
    /\\lim/,
    /\\sum/,
    /\\int/,
    /\\frac\{/,
    /\\sqrt/,
    /\\pm/,
    /\\times/,
    /\\div/,
    /\\leq/,
    /\\geq/,
    /\\neq/,
    /\\Rightarrow/,
    /\\rightarrow/,
    /\\Leftarrow/,
    /\\leftarrow/,
    /\\text\{/,
    /\\mathrm\{/,
    /\\mathbf\{/,
    /\\begin\{/,
    /\\end\{/,
  ];
  
  if (latexCommandPatterns.some(pattern => pattern.test(text))) {
    return true;
  }

  // If the text is mostly words (has multiple consecutive letters forming words), it's text
  const wordPattern = /[a-zA-Z]{4,}/g;
  const words = text.match(wordPattern);
  if (words && words.length > 2) {
    // More than 2 words of 4+ letters = likely prose text, not math
    return false;
  }

  // Check for common math patterns
  const mathPatterns = [
    /\^[\d{]/,
    /_[\d{]/,
    /\\[a-zA-Z]+\{/,   // LaTeX commands with braces
    /^\s*[xyz]\s*[=<>]/i,  // Equations starting with variable
    /[=<>]\s*[xyz]\s*$/i,  // Equations ending with variable
    /\d+\s*[+\-*/]\s*\d+/, // Numeric operations
    /^\s*[\d\-+*/^()xyz\s=<>]+\s*$/i, // Pure math expression (only math chars)
  ];
  return mathPatterns.some(pattern => pattern.test(text));
}

/**
 * Normalizes a LaTeX string by:
 * 1. Removing redundant/nested $ delimiters
 * 2. Converting Unicode math symbols to LaTeX commands
 * 3. Cleaning up whitespace
 * 4. Ensuring proper LaTeX syntax
 */
export function normalizeLatex(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let result = input.trim();

  // Step 1: Convert Unicode symbols to LaTeX
  for (const [pattern, replacement] of textToLatexMap) {
    result = result.replace(pattern, replacement);
  }

  // Step 2: Remove stray dollar signs that aren't proper delimiters
  // First, handle properly formatted $$...$$ (display mode) - extract content
  const displayMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const displayMatches: string[] = [];
  result = result.replace(displayMathRegex, (_, content) => {
    displayMatches.push(content.trim());
    return `__DISPLAY_MATH_${displayMatches.length - 1}__`;
  });

  // Handle properly formatted $...$ (inline mode) - extract content
  const inlineMathRegex = /\$([^$]+)\$/g;
  const inlineMatches: string[] = [];
  result = result.replace(inlineMathRegex, (_, content) => {
    inlineMatches.push(content.trim());
    return `__INLINE_MATH_${inlineMatches.length - 1}__`;
  });

  // Remove any remaining stray $ signs
  result = result.replace(/\$/g, '');

  // Restore display math without delimiters (we render via KaTeX directly)
  displayMatches.forEach((content, i) => {
    result = result.replace(`__DISPLAY_MATH_${i}__`, content);
  });

  // Restore inline math without delimiters
  inlineMatches.forEach((content, i) => {
    result = result.replace(`__INLINE_MATH_${i}__`, content);
  });

  // Step 3: Clean up common issues
  // IMPORTANT: preserve multiline environments that rely on `\\` for line breaks.
  const hasMultilineEnv =
    result.includes('\\begin{cases}') ||
    result.includes('\\begin{array}') ||
    result.includes('\\begin{aligned}') ||
    result.includes('\\left\\{');

  if (!hasMultilineEnv) {
    // Fix double backslashes that aren't line breaks
    result = result.replace(/\\\\(?![\\n])/g, '\\');
  }

  
  // Fix spacing around operators
  result = result.replace(/\s*=\s*/g, ' = ');
  result = result.replace(/\s+/g, ' ');

  // Step 4: Handle mixed text and math content
  // If the string has clear text parts, don't wrap those
  if (!containsMathContent(result)) {
    // This is plain text, return as-is
    return result;
  }

  return result.trim();
}

/**
 * Splits a string into segments of plain text and math content
 * Useful for rendering mixed content
 */
export interface ContentSegment {
  type: 'text' | 'math';
  content: string;
  displayMode?: boolean;
}

export function parseContentSegments(input: string): ContentSegment[] {
  if (!input) return [];

  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  // Pattern to match math delimiters: $$...$$ or $...$
  const mathPattern = /(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g;
  let match;

  while ((match = mathPattern.exec(input)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textContent = input.slice(lastIndex, match.index).trim();
      if (textContent) {
        segments.push({ type: 'text', content: textContent });
      }
    }

    // Add the math content
    const mathContent = match[1];
    const isDisplayMode = mathContent.startsWith('$$');
    const cleanContent = isDisplayMode
      ? mathContent.slice(2, -2).trim()
      : mathContent.slice(1, -1).trim();

    if (cleanContent) {
      segments.push({
        type: 'math',
        content: normalizeLatex(fixMalformedLatex(cleanContent)),
        displayMode: isDisplayMode,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Heuristic: textbook-style prompts like "Solve for x: ..." without $ delimiters
  // Split at first ":" and treat the RHS as math if it looks like a math expression.
  if (segments.length === 0) {
    const colonIdx = input.indexOf(':');
    if (colonIdx !== -1) {
      const left = input.slice(0, colonIdx + 1).trim();
      const right = input.slice(colonIdx + 1).trim();

      // RHS looks like math if it contains operators/digits/caret/root/log
      const looksMath = /[=^\\/\d√±≤≥≠]|\blog\b|\bexp\b/i.test(right);
      if (right && looksMath) {
        if (left) segments.push({ type: 'text', content: left });
        segments.push({
          type: 'math',
          content: normalizeLatex(fixMalformedLatex(right)),
          displayMode: false,
        });
        return segments;
      }
    }
  }

  // Add remaining text
  if (lastIndex < input.length) {
    const textContent = input.slice(lastIndex).trim();
    if (textContent) {
      // Check if the remaining content looks like math
      if (containsMathContent(textContent)) {
        segments.push({
          type: 'math',
          content: normalizeLatex(fixMalformedLatex(textContent)),
          displayMode: false,
        });
      } else {
        segments.push({ type: 'text', content: textContent });
      }
    }
  }

  // If no segments were created, treat the whole thing as potential math
  if (segments.length === 0 && input.trim()) {
    if (containsMathContent(input)) {
      segments.push({
        type: 'math',
        content: normalizeLatex(fixMalformedLatex(input)),
        displayMode: false,
      });
    } else {
      segments.push({ type: 'text', content: input.trim() });
    }
  }

  return segments;
}

export default normalizeLatex;
