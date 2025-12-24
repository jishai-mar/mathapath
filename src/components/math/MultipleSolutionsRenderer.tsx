import MathRenderer from '@/components/MathRenderer';

interface MultipleSolutionsRendererProps {
  answer: string;
  className?: string;
}

/**
 * Renders multiple solutions on separate lines for better readability.
 * Splits answers like "x = 2 or x = -2" or "x = 2 \text{ of } x = -2" into separate lines.
 */
export function MultipleSolutionsRenderer({ answer, className = '' }: MultipleSolutionsRendererProps) {
  if (!answer) return null;

  // Check if the answer contains multiple solutions
  // Match patterns like: "or", "of", "\text{ of }", "\text{of}"
  const orPatterns = [
    /\s+or\s+/i,
    /\s+of\s+/i,
    /\\text\{\s*of\s*\}/i,
    /\\text\{\s*or\s*\}/i,
  ];

  let solutions: string[] = [];
  let hasMultiple = false;

  for (const pattern of orPatterns) {
    if (pattern.test(answer)) {
      hasMultiple = true;
      // Split by the pattern
      solutions = answer.split(pattern).map(s => s.trim()).filter(Boolean);
      break;
    }
  }

  // If no multiple solutions found, render as single answer
  if (!hasMultiple || solutions.length <= 1) {
    return (
      <div className={className}>
        <MathRenderer latex={answer} displayMode />
      </div>
    );
  }

  // Render each solution on its own line
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {solutions.map((solution, index) => (
        <div 
          key={index} 
          className="flex items-center gap-2"
        >
          <span className="text-primary font-semibold text-sm">
            {index + 1}.
          </span>
          <div className="flex-1 p-2 rounded-lg bg-muted/30">
            <MathRenderer latex={solution} displayMode />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground mt-1 text-center">
        Beide oplossingen zijn correct
      </p>
    </div>
  );
}
