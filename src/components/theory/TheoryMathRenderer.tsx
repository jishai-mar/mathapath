import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { parseTheoryContent, FormattedSegment } from '@/lib/formatMathContent';
import { cn } from '@/lib/utils';

interface TheoryMathRendererProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

/**
 * Renders theory content with proper math (KaTeX) and markdown (bold/italic) formatting.
 * Specifically designed for theory pages to eliminate raw LaTeX/markdown display.
 */
export function TheoryMathRenderer({ content, className, displayMode = false }: TheoryMathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    const segments = parseTheoryContent(content);
    containerRef.current.innerHTML = '';

    segments.forEach((segment, index) => {
      if (segment.type === 'text') {
        const textSpan = document.createElement('span');
        textSpan.style.display = 'inline';
        textSpan.textContent = segment.content;
        containerRef.current?.appendChild(textSpan);
      } else if (segment.type === 'formatted') {
        // Markdown-processed HTML
        const formattedSpan = document.createElement('span');
        formattedSpan.style.display = 'inline';
        formattedSpan.innerHTML = segment.html || segment.content;
        containerRef.current?.appendChild(formattedSpan);
      } else if (segment.type === 'math') {
        const mathSpan = document.createElement('span');
        mathSpan.style.display = segment.displayMode ? 'block' : 'inline';
        if (segment.displayMode) {
          mathSpan.style.textAlign = 'center';
          mathSpan.style.margin = '0.75rem 0';
        }
        try {
          katex.render(segment.content, mathSpan, {
            displayMode: segment.displayMode ?? displayMode,
            throwOnError: false,
            trust: true,
            strict: false,
          });
        } catch (error) {
          console.error('KaTeX render error:', error);
          // Fallback: just show the content without red error styling
          mathSpan.textContent = segment.content;
          mathSpan.style.fontStyle = 'italic';
        }
        containerRef.current?.appendChild(mathSpan);
      }

      // Add space between segments if needed
      if (index < segments.length - 1) {
        const nextSegment = segments[index + 1];
        const needsSpace = 
          segment.content && 
          !segment.content.endsWith(' ') && 
          nextSegment && 
          !nextSegment.content?.startsWith(' ') &&
          segment.type !== 'math' &&
          nextSegment.type !== 'math';
        
        if (needsSpace) {
          const spaceSpan = document.createElement('span');
          spaceSpan.textContent = ' ';
          containerRef.current?.appendChild(spaceSpan);
        }
      }
    });
  }, [content, displayMode]);

  if (!content) return null;

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "theory-content leading-relaxed",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic",
        className
      )} 
    />
  );
}

export default TheoryMathRenderer;
