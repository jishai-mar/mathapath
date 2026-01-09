/**
 * Formats content containing both markdown and LaTeX for proper rendering.
 * Handles:
 * - Bold text: **text** → <strong>text</strong>
 * - Inline math: $...$ → KaTeX rendered
 * - Display math: $$...$$ → KaTeX rendered (block)
 * - Raw LaTeX commands → KaTeX rendered
 */

import type { ContentSegment } from '@/lib/normalizeLatex';
import { sanitizeMath } from './solutionSegments';

/**
 * LaTeX trigger patterns to detect math content
 */
const LATEX_TRIGGER = /\\left|\\right|\\begin\{|\\end\{|\\frac|\\sqrt|\\pm|\\times|\\cdot|\\div|\\text\{|\\quad|\\\\/;

/**
 * Extended content segment that can also be "formatted" (markdown-processed text)
 */
export interface FormattedSegment {
  type: 'text' | 'math' | 'formatted';
  content: string;
  displayMode?: boolean;
  html?: string; // For formatted segments with HTML
}

/**
 * Converts markdown bold (**text**) and italic (*text*) to HTML
 */
function processMarkdown(text: string): string {
  // Process bold: **text** → <strong>text</strong>
  let result = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Process italic: *text* (but not ** which is bold)
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  return result;
}

/**
 * Checks if a string contains markdown formatting
 */
function hasMarkdown(text: string): boolean {
  return /\*\*[^*]+\*\*|\*[^*]+\*/.test(text);
}

/**
 * Parses content into segments: text, formatted (markdown), and math.
 * Designed specifically for theory content that mixes prose, markdown, and LaTeX.
 */
export function parseTheoryContent(content: string): FormattedSegment[] {
  if (!content?.trim()) return [];

  const segments: FormattedSegment[] = [];
  let remaining = content.trim();

  // First, extract all $$ display math blocks
  const displayMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const displayMatches: { start: number; end: number; content: string }[] = [];
  let match;

  while ((match = displayMathRegex.exec(remaining)) !== null) {
    displayMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1].trim()
    });
  }

  // Then extract all $ inline math
  const inlineMathRegex = /\$([^$]+)\$/g;
  const inlineMatches: { start: number; end: number; content: string }[] = [];

  while ((match = inlineMathRegex.exec(remaining)) !== null) {
    // Check if this is not inside a display math block
    const isInsideDisplay = displayMatches.some(
      dm => match!.index >= dm.start && match!.index < dm.end
    );
    if (!isInsideDisplay) {
      inlineMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1].trim()
      });
    }
  }

  // Combine and sort all matches
  const allMatches = [
    ...displayMatches.map(m => ({ ...m, type: 'display' as const })),
    ...inlineMatches.map(m => ({ ...m, type: 'inline' as const }))
  ].sort((a, b) => a.start - b.start);

  if (allMatches.length === 0) {
    // No $ delimiters - check for raw LaTeX or just text/markdown
    if (LATEX_TRIGGER.test(remaining)) {
      // It's raw LaTeX
      const sanitized = sanitizeMath(remaining);
      segments.push({
        type: 'math',
        content: sanitized,
        displayMode: /\\begin|\\left/.test(remaining)
      });
    } else if (hasMarkdown(remaining)) {
      // Has markdown formatting
      segments.push({
        type: 'formatted',
        content: remaining,
        html: processMarkdown(remaining)
      });
    } else {
      // Plain text
      segments.push({ type: 'text', content: remaining });
    }
    return segments;
  }

  // Process content around matches
  let lastIndex = 0;

  for (const m of allMatches) {
    // Text before this match
    if (m.start > lastIndex) {
      const textPart = remaining.slice(lastIndex, m.start);
      if (textPart.trim()) {
        // Check if this text has LaTeX triggers (shouldn't, but safety check)
        if (LATEX_TRIGGER.test(textPart)) {
          const sanitized = sanitizeMath(textPart.trim());
          segments.push({
            type: 'math',
            content: sanitized,
            displayMode: /\\begin|\\left/.test(textPart)
          });
        } else if (hasMarkdown(textPart)) {
          segments.push({
            type: 'formatted',
            content: textPart.trim(),
            html: processMarkdown(textPart.trim())
          });
        } else {
          segments.push({ type: 'text', content: textPart.trim() });
        }
      }
    }

    // The math content
    const sanitized = sanitizeMath(m.content);
    if (sanitized) {
      segments.push({
        type: 'math',
        content: sanitized,
        displayMode: m.type === 'display'
      });
    }

    lastIndex = m.end;
  }

  // Handle remaining content after last match
  if (lastIndex < remaining.length) {
    const leftover = remaining.slice(lastIndex).trim();
    if (leftover) {
      if (LATEX_TRIGGER.test(leftover)) {
        const sanitized = sanitizeMath(leftover);
        segments.push({
          type: 'math',
          content: sanitized,
          displayMode: /\\begin|\\left/.test(leftover)
        });
      } else if (hasMarkdown(leftover)) {
        segments.push({
          type: 'formatted',
          content: leftover,
          html: processMarkdown(leftover)
        });
      } else {
        segments.push({ type: 'text', content: leftover });
      }
    }
  }

  return segments;
}
