import { cn } from '@/lib/utils';

interface TheoryProseProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A consistent prose wrapper for theory content.
 * Provides proper typography, line-height, and spacing for readable text.
 */
export function TheoryProse({ children, className }: TheoryProseProps) {
  return (
    <div className={cn(
      "text-foreground leading-relaxed",
      "[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2",
      "[&_.katex]:font-normal",
      "break-words",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Normalize narration text that may have missing spaces.
 * Used for audio/video playback segments.
 */
export function normalizeNarrationText(text: string): string {
  if (!text) return '';
  
  return text
    // Add space between lowercase and uppercase (camelCase splitting)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Add space after punctuation if followed by letter
    .replace(/([.,!?:;])([a-zA-Z])/g, '$1 $2')
    // Add space before opening parenthesis if preceded by letter
    .replace(/([a-zA-Z])\(/g, '$1 (')
    // Add space after closing parenthesis if followed by letter
    .replace(/\)([a-zA-Z])/g, ') $1')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}
