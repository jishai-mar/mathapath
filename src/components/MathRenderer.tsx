import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { parseContentSegments, normalizeLatex, fixMalformedLatex } from '@/lib/normalizeLatex';

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export default function MathRenderer({ latex, displayMode = false, className = '' }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !latex) return;

    // First fix any malformed LaTeX patterns
    const fixedLatex = fixMalformedLatex(latex);
    
    // Check if this is pure LaTeX (contains LaTeX commands without delimiters)
    // Also check for begin/end environments like cases/array/aligned
    // If there's clear prose + a math block (e.g. "Solve ...: \\left\\{...") we should NOT treat it as pure.
    const hasLikelyMixedText =
      /[a-zA-Z]{3,}/.test(fixedLatex) &&
      fixedLatex.includes(':') &&
      (fixedLatex.includes('\\left') || fixedLatex.includes('\\begin{'));

    const isPureLatex =
      /\\(frac|sqrt|cdot|times|div|pm|log|sin|cos|tan|int|sum|prod|lim|alpha|beta|gamma|delta|theta|pi|sigma|phi|omega|left|right|text|mathbf|mathit|mathrm|begin|end)\b/.test(
        fixedLatex
      ) &&
      !fixedLatex.includes('$') &&
      !hasLikelyMixedText;

    // Clear the container
    containerRef.current.innerHTML = '';

    if (isPureLatex) {
      // Render as pure LaTeX directly
      try {
        const normalizedLatex = normalizeLatex(fixedLatex);
        katex.render(normalizedLatex, containerRef.current, {
          displayMode:
            displayMode ||
            fixedLatex.includes('\\begin{cases}') ||
            fixedLatex.includes('\\begin{aligned}') ||
            fixedLatex.includes('\\begin{array}'),
          throwOnError: false,
          trust: true,
          strict: false,
        });

      } catch (error) {
        console.error('KaTeX render error:', error);
        containerRef.current.textContent = fixedLatex;
      }
    } else {
      // Parse into segments for mixed content
      const segments = parseContentSegments(fixedLatex);

      if (segments.length === 0) {
        // Fallback: try to render as math
        try {
          const normalizedLatex = normalizeLatex(fixedLatex);
          katex.render(normalizedLatex, containerRef.current, {
            displayMode,
            throwOnError: false,
            trust: true,
            strict: false,
          });
        } catch (error) {
          console.error('KaTeX render error:', error);
          containerRef.current.textContent = fixedLatex;
        }
      } else {
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
              const useDisplayMode =
                segment.displayMode ||
                displayMode ||
                normalizedContent.includes('\\begin{cases}') ||
                normalizedContent.includes('\\begin{aligned}') ||
                normalizedContent.includes('\\begin{array}');
              katex.render(normalizedContent, mathSpan, {
                displayMode: useDisplayMode,
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
      }
    }
  }, [latex, displayMode]);

  if (!latex) return null;

  return <div ref={containerRef} className={`math-content inline ${className}`} />;
}
