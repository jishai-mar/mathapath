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
 * Detects if a string contains LaTeX math content
 */
function containsMathContent(text: string): boolean {
  // Check for common LaTeX patterns
  const mathPatterns = [
    /\\frac\{/,
    /\\sqrt/,
    /\\pm/,
    /\\times/,
    /\\div/,
    /\^[\d{]/,
    /_[\d{]/,
    /\\[a-zA-Z]+/,
    /[=<>].*[xyz]/i,
    /\d+[xyz]/i,
    /[xyz]\s*[+\-*/^=]/i,
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
  // Fix double backslashes that aren't line breaks
  result = result.replace(/\\\\(?![\\n])/g, '\\');
  
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
  let remaining = input;
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
        content: normalizeLatex(cleanContent),
        displayMode: isDisplayMode,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < input.length) {
    const textContent = input.slice(lastIndex).trim();
    if (textContent) {
      // Check if the remaining content looks like math
      if (containsMathContent(textContent)) {
        segments.push({
          type: 'math',
          content: normalizeLatex(textContent),
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
        content: normalizeLatex(input),
        displayMode: false,
      });
    } else {
      segments.push({ type: 'text', content: input.trim() });
    }
  }

  return segments;
}

export default normalizeLatex;
