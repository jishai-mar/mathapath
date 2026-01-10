/**
 * Utility for sanitizing and segmenting solution content.
 * Ensures raw LaTeX is NEVER visible to users.
 */

import type { ContentSegment } from '@/lib/normalizeLatex';

/**
 * LaTeX trigger patterns to detect math content
 */
const LATEX_TRIGGER = /\\left|\\right|\\begin\{|\\end\{|\\frac|\\sqrt|\\pm|\\times|\\cdot|\\div|\\\\/;

/**
 * Sanitizes math content to fix common LaTeX malformations.
 * Applied to every math segment before passing to KaTeX.
 */
export function sanitizeMath(math: string): string {
  if (!math?.trim()) return '';
  
  let result = math.trim();
  
  // Fix corrupted LaTeX commands: \f\frac → \frac, \f\sqrt → \sqrt
  result = result.replace(/\\f\\frac/g, '\\frac');
  result = result.replace(/\\f\\sqrt/g, '\\sqrt');
  
  // Handle standalone \f followed by subscript/superscript (malformed fraction notation)
  result = result.replace(/\\f\^(\d+)_\{([^}]+)\}/g, '\\frac{$1}{$2}');
  result = result.replace(/\\f\^(\d+)_([a-zA-Z0-9])/g, '\\frac{$1}{$2}');
  result = result.replace(/\\f_\{([^}]+)\}\^(\d+)/g, '\\frac{$2}{$1}');
  result = result.replace(/\\f_([a-zA-Z0-9])\^(\d+)/g, '\\frac{$2}{$1}');
  
  // 1. Collapse nested/duplicated aligned environments
  // Handle aligned + alignedat combinations
  result = result.replace(/\\begin\{aligned\}\s*\\begin\{alignedat\}\{[^}]*\}/g, '\\begin{aligned}');
  result = result.replace(/\\end\{alignedat\}\s*\\end\{aligned\}/g, '\\end{aligned}');
  // Collapse multiple consecutive \begin{aligned} into one
  result = result.replace(/(\\begin\{aligned\}\s*)+/g, '\\begin{aligned}');
  // Collapse multiple consecutive \end{aligned} into one
  result = result.replace(/(\\end\{aligned\}\s*)+/g, '\\end{aligned}');
  
  // 2. Fix brace escaping: \left{ -> \left\{
  result = result.replace(/\\left\{/g, '\\left\\{');
  result = result.replace(/\\right\{/g, '\\right\\{');
  
  // 3. Ensure \right has a delimiter (if missing)
  // Match \right NOT followed by a delimiter character
  result = result.replace(/\\right(?![.\)\]\}\\|])/g, '\\right.');
  
  // 4. Fix double alignment markers
  result = result.replace(/&&=/g, '&=');
  
  // 5. Reduce excessive backslashes (\\\\+ -> \\) but preserve single \\
  result = result.replace(/\\\\\\\\+/g, '\\\\');
  
  return result.trim();
}

/**
 * Parses solution content into typed segments for MathRenderer.
 * Handles $$...$$ (display), $...$ (inline), and raw LaTeX blocks.
 * NEVER returns math-looking content as a text segment.
 */
export function createSegmentsFromSolution(content: string): ContentSegment[] {
  if (!content?.trim()) return [];
  
  const segments: ContentSegment[] = [];
  const remaining = content.trim();
  
  // Multiline-safe regex for $$...$$ (display) and $...$ (inline)
  const mathBlockRegex = /\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g;
  let lastIndex = 0;
  let match;
  
  while ((match = mathBlockRegex.exec(remaining)) !== null) {
    // Add text/math before this match
    if (match.index > lastIndex) {
      const textPart = remaining.slice(lastIndex, match.index).trim();
      if (textPart) {
        // Check if this "text" actually contains LaTeX triggers
        if (LATEX_TRIGGER.test(textPart)) {
          const sanitized = sanitizeMath(textPart);
          if (sanitized) {
            segments.push({
              type: 'math',
              content: sanitized,
              displayMode: /\\begin|\\left/.test(textPart)
            });
          }
        } else {
          segments.push({ type: 'text', content: textPart });
        }
      }
    }
    
    // Add math segment (strip $ or $$ delimiters)
    const isDisplayMode = !!match[1]; // $$...$$ = display
    const mathContent = (match[1] || match[2] || '').trim();
    
    if (mathContent) {
      const sanitized = sanitizeMath(mathContent);
      if (sanitized) {
        segments.push({
          type: 'math',
          content: sanitized,
          displayMode: isDisplayMode
        });
      }
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Handle remaining content after last match
  if (lastIndex < remaining.length) {
    const leftover = remaining.slice(lastIndex).trim();
    if (leftover) {
      if (LATEX_TRIGGER.test(leftover)) {
        // It's raw LaTeX without $ delimiters
        const sanitized = sanitizeMath(leftover);
        if (sanitized) {
          segments.push({
            type: 'math',
            content: sanitized,
            displayMode: /\\begin|\\left/.test(leftover)
          });
        }
      } else {
        segments.push({ type: 'text', content: leftover });
      }
    }
  }
  
  // If no segments created from regex, process the whole string
  if (segments.length === 0 && remaining) {
    if (LATEX_TRIGGER.test(remaining)) {
      const sanitized = sanitizeMath(remaining);
      if (sanitized) {
        segments.push({
          type: 'math',
          content: sanitized,
          displayMode: /\\begin|\\left/.test(remaining)
        });
      } else {
        // Fallback: couldn't produce safe math
        segments.push({ 
          type: 'text', 
          content: "We couldn't render this step as an equation. Please try again." 
        });
        console.warn('[solutionSegments] Failed to sanitize math:', remaining);
      }
    } else {
      segments.push({ type: 'text', content: remaining });
    }
  }
  
  return segments;
}
