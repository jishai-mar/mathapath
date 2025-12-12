import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { parseContentSegments, normalizeLatex } from '@/lib/normalizeLatex';

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export default function MathRenderer({ latex, displayMode = false, className = '' }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !latex) return;

    // Parse the content into segments
    const segments = parseContentSegments(latex);
    
    // Clear the container
    containerRef.current.innerHTML = '';

    segments.forEach(segment => {
      if (segment.type === 'text') {
        // Create a text node for plain text
        const textSpan = document.createElement('span');
        textSpan.textContent = segment.content;
        containerRef.current?.appendChild(textSpan);
      } else {
        // Render math with KaTeX
        const mathSpan = document.createElement('span');
        mathSpan.className = 'katex-container';
        
        try {
          const normalizedContent = normalizeLatex(segment.content);
          katex.render(normalizedContent, mathSpan, {
            displayMode: segment.displayMode || displayMode,
            throwOnError: false,
            trust: true,
            strict: false,
          });
        } catch (error) {
          console.error('KaTeX render error:', error);
          mathSpan.textContent = segment.content;
        }
        
        containerRef.current?.appendChild(mathSpan);
      }
    });

    // If no segments were created but we have content, render as-is
    if (segments.length === 0 && latex && containerRef.current) {
      try {
        const normalizedLatex = normalizeLatex(latex);
        katex.render(normalizedLatex, containerRef.current, {
          displayMode,
          throwOnError: false,
          trust: true,
          strict: false,
        });
      } catch (error) {
        console.error('KaTeX render error:', error);
        containerRef.current.textContent = latex;
      }
    }
  }, [latex, displayMode]);

  if (!latex) return null;

  return <div ref={containerRef} className={`math-content inline ${className}`} />;
}
