import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen, X, Copy, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';

interface FormulaSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (formula: string) => void;
  topicName?: string;
}

interface Formula {
  name: string;
  formula: string;
  description?: string;
}

interface FormulaCategory {
  name: string;
  formulas: Formula[];
}

const allFormulas: Record<string, FormulaCategory> = {
  algebra: {
    name: 'Algebra',
    formulas: [
      { name: 'Quadratic formula', formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', description: 'Solutions of ax² + bx + c = 0' },
      { name: 'Discriminant', formula: 'D = b^2 - 4ac', description: 'Determines number of solutions' },
      { name: 'Sum and product', formula: 'x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 \\cdot x_2 = \\frac{c}{a}' },
      { name: 'Square of sum', formula: '(a + b)^2 = a^2 + 2ab + b^2' },
      { name: 'Square of difference', formula: '(a - b)^2 = a^2 - 2ab + b^2' },
      { name: 'Difference of squares', formula: 'a^2 - b^2 = (a + b)(a - b)' },
      { name: 'Cube of sum', formula: '(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3' },
    ],
  },
  geometry: {
    name: 'Geometry',
    formulas: [
      { name: 'Area of circle', formula: 'A = \\pi r^2' },
      { name: 'Circumference of circle', formula: 'C = 2\\pi r' },
      { name: 'Area of triangle', formula: 'A = \\frac{1}{2} \\cdot b \\cdot h' },
      { name: 'Pythagorean theorem', formula: 'a^2 + b^2 = c^2' },
      { name: 'Distance formula', formula: 'd = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}' },
      { name: 'Midpoint', formula: 'M = \\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}\\right)' },
      { name: 'Area of rectangle', formula: 'A = l \\times w' },
      { name: 'Volume of sphere', formula: 'V = \\frac{4}{3}\\pi r^3' },
      { name: 'Surface area of sphere', formula: 'A = 4\\pi r^2' },
    ],
  },
  trigonometry: {
    name: 'Trigonometry',
    formulas: [
      { name: 'Sine', formula: '\\sin(\\theta) = \\frac{\\text{opposite}}{\\text{hypotenuse}}' },
      { name: 'Cosine', formula: '\\cos(\\theta) = \\frac{\\text{adjacent}}{\\text{hypotenuse}}' },
      { name: 'Tangent', formula: '\\tan(\\theta) = \\frac{\\sin(\\theta)}{\\cos(\\theta)}' },
      { name: 'Pythagorean identity', formula: '\\sin^2(\\theta) + \\cos^2(\\theta) = 1' },
      { name: 'Law of sines', formula: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}' },
      { name: 'Law of cosines', formula: 'c^2 = a^2 + b^2 - 2ab\\cos(C)' },
      { name: 'Double angle sine', formula: '\\sin(2\\theta) = 2\\sin(\\theta)\\cos(\\theta)' },
      { name: 'Double angle cosine', formula: '\\cos(2\\theta) = \\cos^2(\\theta) - \\sin^2(\\theta)' },
    ],
  },
  calculus: {
    name: 'Calculus',
    formulas: [
      { name: 'Power rule derivative', formula: '\\frac{d}{dx}(x^n) = nx^{n-1}' },
      { name: 'Chain rule', formula: '\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)' },
      { name: 'Product rule', formula: '(f \\cdot g)\' = f\' \\cdot g + f \\cdot g\'' },
      { name: 'Quotient rule', formula: '\\left(\\frac{f}{g}\\right)\' = \\frac{f\' \\cdot g - f \\cdot g\'}{g^2}' },
      { name: 'Derivative of e^x', formula: '\\frac{d}{dx}(e^x) = e^x' },
      { name: 'Derivative of ln(x)', formula: '\\frac{d}{dx}(\\ln x) = \\frac{1}{x}' },
      { name: 'Derivative of sin(x)', formula: '\\frac{d}{dx}(\\sin x) = \\cos x' },
      { name: 'Derivative of cos(x)', formula: '\\frac{d}{dx}(\\cos x) = -\\sin x' },
      { name: 'Power rule integral', formula: '\\int x^n dx = \\frac{x^{n+1}}{n+1} + C' },
    ],
  },
  exponential: {
    name: 'Exponents & Logarithms',
    formulas: [
      { name: 'Product of powers', formula: 'a^m \\cdot a^n = a^{m+n}' },
      { name: 'Quotient of powers', formula: '\\frac{a^m}{a^n} = a^{m-n}' },
      { name: 'Power of a power', formula: '(a^m)^n = a^{mn}' },
      { name: 'Logarithm definition', formula: '\\log_a(x) = y \\Leftrightarrow a^y = x' },
      { name: 'Logarithm of product', formula: '\\log(ab) = \\log(a) + \\log(b)' },
      { name: 'Logarithm of quotient', formula: '\\log\\left(\\frac{a}{b}\\right) = \\log(a) - \\log(b)' },
      { name: 'Logarithm of power', formula: '\\log(a^n) = n \\cdot \\log(a)' },
      { name: 'Change of base', formula: '\\log_a(x) = \\frac{\\log_b(x)}{\\log_b(a)}' },
    ],
  },
  statistics: {
    name: 'Statistics',
    formulas: [
      { name: 'Mean', formula: '\\bar{x} = \\frac{\\sum x_i}{n}' },
      { name: 'Standard deviation', formula: 's = \\sqrt{\\frac{\\sum(x_i - \\bar{x})^2}{n-1}}' },
      { name: 'Variance', formula: 's^2 = \\frac{\\sum(x_i - \\bar{x})^2}{n-1}' },
      { name: 'Z-score', formula: 'z = \\frac{x - \\mu}{\\sigma}' },
      { name: 'Combinations', formula: 'C(n,k) = \\binom{n}{k} = \\frac{n!}{k!(n-k)!}' },
      { name: 'Permutations', formula: 'P(n,k) = \\frac{n!}{(n-k)!}' },
    ],
  },
};

// Map topic names to formula categories
const topicToCategories: Record<string, string[]> = {
  'algebra': ['algebra', 'exponential'],
  'quadratic': ['algebra'],
  'linear': ['algebra', 'geometry'],
  'exponenti': ['exponential', 'calculus'],
  'logarit': ['exponential'],
  'trigonometr': ['trigonometry'],
  'triangle': ['geometry', 'trigonometry'],
  'circle': ['geometry'],
  'geometry': ['geometry'],
  'derivativ': ['calculus'],
  'integral': ['calculus'],
  'calculus': ['calculus'],
  'statistic': ['statistics'],
  'probability': ['statistics'],
};

function getRelevantCategories(topicName?: string): string[] {
  if (!topicName) return Object.keys(allFormulas);
  
  const lowerTopic = topicName.toLowerCase();
  const matches: string[] = [];
  
  for (const [keyword, categories] of Object.entries(topicToCategories)) {
    if (lowerTopic.includes(keyword)) {
      matches.push(...categories);
    }
  }
  
  // Return unique categories or all if no matches
  return matches.length > 0 ? [...new Set(matches)] : Object.keys(allFormulas);
}

export default function FormulaSheet({ isOpen, onClose, onInsert, topicName }: FormulaSheetProps) {
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const relevantCategories = getRelevantCategories(topicName);

  const handleCopy = (formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(formula);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  const handleInsert = (formula: Formula) => {
    if (onInsert) {
      // Convert LaTeX to a more readable format for insertion
      const simplified = formula.formula
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\pi/g, 'π')
        .replace(/\\cdot/g, '×')
        .replace(/\\pm/g, '±')
        .replace(/\^2/g, '²')
        .replace(/\^3/g, '³')
        .replace(/\\left|\\right/g, '')
        .replace(/\\/g, '');
      onInsert(simplified);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden w-80 max-h-[500px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/30">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Formuleblad</span>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        <ScrollArea className="h-[440px]">
          <div className="p-3 space-y-4">
            {relevantCategories.map((categoryKey) => {
              const category = allFormulas[categoryKey];
              if (!category) return null;
              
              return (
                <div key={categoryKey}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.formulas.map((formula, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground mb-1">{formula.name}</p>
                            <div className="text-sm overflow-x-auto">
                              <MathRenderer segments={createSegmentsFromSolution(formula.formula)} />
                            </div>
                            {formula.description && (
                              <p className="text-xs text-muted-foreground mt-1">{formula.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6"
                              onClick={() => handleCopy(formula.formula)}
                              title="Kopieer LaTeX"
                            >
                              {copiedFormula === formula.formula ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            {onInsert && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6"
                                onClick={() => handleInsert(formula)}
                                title="Voeg in"
                              >
                                <span className="text-xs">+</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}
