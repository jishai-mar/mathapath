import { useEffect, useRef, memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import { fixMalformedLatex, normalizeLatex } from '@/lib/normalizeLatex';

interface MathContentRendererProps {
  content: string;
  className?: string;
  /**
   * If true, render block math centered with margin.
   * If false or undefined, detect automatically from content.
   */
  displayMode?: boolean;
}

/**
 * A unified math content renderer for all theory pages.
 * 
 * Features:
 * - Renders both inline ($...$) and display ($$...$$) math
 * - Handles raw LaTeX without delimiters
 * - Processes markdown bold (**) and italic (*)
 * - Never shows raw LaTeX/backslash commands to users
 * - Eliminates "red code" styling on errors
 */
function MathContentRendererComponent({ content, className, displayMode }: MathContentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Clear container
    containerRef.current.innerHTML = '';

    try {
      // Parse and render the content
      const segments = parseContent(content);
      
      segments.forEach((segment) => {
        const el = document.createElement(segment.displayMode ? 'div' : 'span');
        
        if (segment.type === 'text') {
          el.textContent = segment.content;
          el.style.display = 'inline';
        } else if (segment.type === 'formatted') {
          el.innerHTML = segment.html || segment.content;
          el.style.display = 'inline';
        } else if (segment.type === 'math') {
          if (segment.displayMode) {
            el.style.display = 'block';
            el.style.textAlign = 'center';
            el.style.margin = '0.75rem 0';
          } else {
            el.style.display = 'inline';
          }
          
          try {
            // Normalize and fix any LaTeX issues before rendering
            const normalized = normalizeLatex(fixMalformedLatex(segment.content));
            katex.render(normalized, el, {
              displayMode: segment.displayMode ?? displayMode ?? false,
              throwOnError: false,
              trust: true,
              strict: false,
              output: 'html',
            });
          } catch (error) {
            console.error('KaTeX render error:', error, segment.content);
            // Fallback: show content without red error styling
            el.textContent = segment.content;
            el.style.fontStyle = 'normal';
            el.style.color = 'inherit';
          }
        }
        
        containerRef.current?.appendChild(el);
      });
    } catch (error) {
      console.error('Content rendering error:', error);
      // Fallback to plain text
      containerRef.current.textContent = content;
    }
  }, [content, displayMode]);

  if (!content) return null;

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "math-content-renderer leading-relaxed",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic",
        "[&_.katex]:font-normal",
        className
      )} 
    />
  );
}

// Memoize to prevent unnecessary re-renders
export const MathContentRenderer = memo(MathContentRendererComponent);

// ============ Internal helpers ============

interface ContentSegment {
  type: 'text' | 'math' | 'formatted';
  content: string;
  displayMode?: boolean;
  html?: string;
}

// LaTeX command patterns that indicate math content
const LATEX_COMMANDS = /\\(frac|sqrt|cdot|times|div|pm|left|right|begin|end|text|mathbf|mathrm|alpha|beta|gamma|delta|theta|pi|sigma|phi|omega|log|sin|cos|tan|lim|sum|int|prod|leq|geq|neq|infty|Rightarrow|rightarrow|quad)\b/;

/**
 * Process markdown formatting into HTML
 */
function processMarkdown(text: string): { hasMarkdown: boolean; html: string } {
  let result = text;
  let hasMarkdown = false;
  
  // Bold: **text**
  if (/\*\*[^*]+\*\*/.test(result)) {
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    hasMarkdown = true;
  }
  
  // Italic: *text* (not preceded by *)
  if (/(?<!\*)\*([^*]+)\*(?!\*)/.test(result)) {
    result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    hasMarkdown = true;
  }
  
  return { hasMarkdown, html: result };
}

/**
 * Parse content into segments for rendering
 */
function parseContent(content: string): ContentSegment[] {
  if (!content?.trim()) return [];
  
  const segments: ContentSegment[] = [];
  let remaining = content.trim();
  
  // Find all math delimiters
  type MathMatch = { start: number; end: number; content: string; isDisplay: boolean };
  const mathMatches: MathMatch[] = [];
  
  // Display math: $$...$$
  const displayRegex = /\$\$([\s\S]*?)\$\$/g;
  let match;
  while ((match = displayRegex.exec(remaining)) !== null) {
    mathMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1].trim(),
      isDisplay: true
    });
  }
  
  // Inline math: $...$
  const inlineRegex = /\$([^$]+)\$/g;
  while ((match = inlineRegex.exec(remaining)) !== null) {
    // Skip if inside a display math block
    const isInside = mathMatches.some(m => match!.index >= m.start && match!.index < m.end);
    if (!isInside) {
      mathMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1].trim(),
        isDisplay: false
      });
    }
  }
  
  // Sort by position
  mathMatches.sort((a, b) => a.start - b.start);
  
  // If no delimiters found, check for raw LaTeX
  if (mathMatches.length === 0) {
    return handleRawContent(remaining);
  }
  
  // Process content around math blocks
  let lastIndex = 0;
  
  for (const m of mathMatches) {
    // Text before this math block
    if (m.start > lastIndex) {
      const textPart = remaining.slice(lastIndex, m.start);
      if (textPart.trim()) {
        segments.push(...handleRawContent(textPart.trim()));
      }
    }
    
    // The math content
    if (m.content) {
      segments.push({
        type: 'math',
        content: m.content,
        displayMode: m.isDisplay
      });
    }
    
    lastIndex = m.end;
  }
  
  // Remaining content after last match
  if (lastIndex < remaining.length) {
    const leftover = remaining.slice(lastIndex).trim();
    if (leftover) {
      segments.push(...handleRawContent(leftover));
    }
  }
  
  return segments;
}

/**
 * Handle content without $ delimiters
 * Detects raw LaTeX or processes as text/markdown
 */
function handleRawContent(text: string): ContentSegment[] {
  if (!text.trim()) return [];
  
  // Check if content contains LaTeX commands
  if (LATEX_COMMANDS.test(text)) {
    // Check if it's mixed prose + math (e.g., "Solve: \frac{1}{2}")
    const colonIndex = text.indexOf(':');
    const latexStart = text.search(LATEX_COMMANDS);
    
    // If there's prose before the LaTeX, split it
    if (colonIndex !== -1 && colonIndex < latexStart) {
      const prosePart = text.slice(0, colonIndex + 1).trim();
      const mathPart = text.slice(colonIndex + 1).trim();
      
      const segments: ContentSegment[] = [];
      
      // Process prose part (might have markdown)
      const { hasMarkdown, html } = processMarkdown(prosePart);
      if (hasMarkdown) {
        segments.push({ type: 'formatted', content: prosePart, html });
      } else {
        segments.push({ type: 'text', content: prosePart });
      }
      
      // Math part
      if (mathPart) {
        const isDisplay = /\\begin|\\left\s*[{\\[]/.test(mathPart);
        segments.push({
          type: 'math',
          content: mathPart,
          displayMode: isDisplay
        });
      }
      
      return segments;
    }
    
    // Pure LaTeX - detect if display mode
    const isDisplay = /\\begin|\\left\s*[{\\[]/.test(text);
    return [{
      type: 'math',
      content: text,
      displayMode: isDisplay
    }];
  }
  
  // Check for markdown
  const { hasMarkdown, html } = processMarkdown(text);
  if (hasMarkdown) {
    return [{ type: 'formatted', content: text, html }];
  }
  
  // Plain text
  return [{ type: 'text', content: text }];
}

export default MathContentRenderer;
