import { motion } from 'framer-motion';
import MathRenderer from '@/components/MathRenderer';
import { cn } from '@/lib/utils';

interface FormulaEntry {
  name: string;
  formula: string;
  notes?: string;
}

interface FormulaTableProps {
  topic: string;
  className?: string;
}

const formulaData: Record<string, { title: string; formulas: FormulaEntry[] }> = {
  quadratic: {
    title: 'Quadratic Formulas',
    formulas: [
      { name: 'Standard Form', formula: 'ax^2 + bx + c = 0', notes: 'a ≠ 0' },
      { name: 'Quadratic Formula', formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
      { name: 'Discriminant', formula: '\\Delta = b^2 - 4ac', notes: 'Determines # of roots' },
      { name: 'Vertex Form', formula: 'y = a(x - h)^2 + k', notes: 'Vertex at (h, k)' },
      { name: 'Vertex', formula: 'h = -\\frac{b}{2a}, \\quad k = f(h)' },
      { name: "Vieta's (sum)", formula: 'x_1 + x_2 = -\\frac{b}{a}' },
      { name: "Vieta's (product)", formula: 'x_1 \\cdot x_2 = \\frac{c}{a}' },
    ],
  },
  linear: {
    title: 'Linear Equations',
    formulas: [
      { name: 'Slope-Intercept', formula: 'y = mx + b', notes: 'm = slope, b = y-intercept' },
      { name: 'Point-Slope', formula: 'y - y_1 = m(x - x_1)' },
      { name: 'Standard Form', formula: 'Ax + By = C' },
      { name: 'Slope', formula: 'm = \\frac{y_2 - y_1}{x_2 - x_1}', notes: 'Rise over run' },
      { name: 'Distance', formula: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}' },
      { name: 'Midpoint', formula: 'M = \\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)' },
    ],
  },
  trigonometry: {
    title: 'Trigonometry',
    formulas: [
      { name: 'Pythagorean', formula: '\\sin^2\\theta + \\cos^2\\theta = 1' },
      { name: 'SOH-CAH-TOA', formula: '\\sin = \\frac{O}{H}, \\cos = \\frac{A}{H}, \\tan = \\frac{O}{A}' },
      { name: 'Tangent', formula: '\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}' },
      { name: 'Law of Sines', formula: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}' },
      { name: 'Law of Cosines', formula: 'c^2 = a^2 + b^2 - 2ab\\cos C' },
      { name: 'Double Angle (sin)', formula: '\\sin 2\\theta = 2\\sin\\theta\\cos\\theta' },
      { name: 'Double Angle (cos)', formula: '\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta' },
    ],
  },
  derivatives: {
    title: 'Derivatives',
    formulas: [
      { name: 'Power Rule', formula: '\\frac{d}{dx}x^n = nx^{n-1}' },
      { name: 'Constant', formula: '\\frac{d}{dx}c = 0' },
      { name: 'Sum Rule', formula: '(f + g)\' = f\' + g\'' },
      { name: 'Product Rule', formula: '(fg)\' = f\'g + fg\'' },
      { name: 'Quotient Rule', formula: '\\left(\\frac{f}{g}\\right)\' = \\frac{f\'g - fg\'}{g^2}' },
      { name: 'Chain Rule', formula: '\\frac{d}{dx}f(g(x)) = f\'(g(x)) \\cdot g\'(x)' },
      { name: 'Exponential', formula: '\\frac{d}{dx}e^x = e^x' },
      { name: 'Natural Log', formula: '\\frac{d}{dx}\\ln x = \\frac{1}{x}' },
    ],
  },
  integrals: {
    title: 'Integrals',
    formulas: [
      { name: 'Power Rule', formula: '\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C', notes: 'n ≠ -1' },
      { name: 'Constant', formula: '\\int k \\, dx = kx + C' },
      { name: 'Exponential', formula: '\\int e^x \\, dx = e^x + C' },
      { name: 'Natural Log', formula: '\\int \\frac{1}{x} \\, dx = \\ln|x| + C' },
      { name: 'Sine', formula: '\\int \\sin x \\, dx = -\\cos x + C' },
      { name: 'Cosine', formula: '\\int \\cos x \\, dx = \\sin x + C' },
    ],
  },
  exponents: {
    title: 'Exponent Rules',
    formulas: [
      { name: 'Product', formula: 'a^m \\cdot a^n = a^{m+n}' },
      { name: 'Quotient', formula: '\\frac{a^m}{a^n} = a^{m-n}' },
      { name: 'Power of Power', formula: '(a^m)^n = a^{mn}' },
      { name: 'Negative Exponent', formula: 'a^{-n} = \\frac{1}{a^n}' },
      { name: 'Zero Exponent', formula: 'a^0 = 1', notes: 'a ≠ 0' },
      { name: 'Fractional', formula: 'a^{\\frac{m}{n}} = \\sqrt[n]{a^m}' },
    ],
  },
  logarithms: {
    title: 'Logarithm Rules',
    formulas: [
      { name: 'Definition', formula: '\\log_a b = c \\Leftrightarrow a^c = b' },
      { name: 'Product', formula: '\\log_a(xy) = \\log_a x + \\log_a y' },
      { name: 'Quotient', formula: '\\log_a\\frac{x}{y} = \\log_a x - \\log_a y' },
      { name: 'Power', formula: '\\log_a(x^n) = n\\log_a x' },
      { name: 'Change of Base', formula: '\\log_a b = \\frac{\\log_c b}{\\log_c a}' },
      { name: 'Identity', formula: '\\log_a a = 1' },
      { name: 'Zero', formula: '\\log_a 1 = 0' },
    ],
  },
};

export function FormulaTable({ topic, className }: FormulaTableProps) {
  const data = formulaData[topic.toLowerCase()];
  
  if (!data) {
    // Fallback for unknown topics
    return (
      <div className={cn("p-4 bg-muted/30 rounded-lg border border-border/50", className)}>
        <p className="text-sm text-muted-foreground">Formula table for "{topic}" not available.</p>
      </div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("overflow-hidden rounded-lg border border-border/50", className)}
    >
      <div className="bg-primary/10 px-4 py-2 border-b border-border/50">
        <h4 className="font-semibold text-sm">{data.title}</h4>
      </div>
      <div className="divide-y divide-border/30">
        {data.formulas.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 px-4 py-2 bg-card/50 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs text-muted-foreground w-28 shrink-0">{entry.name}</span>
            <div className="flex-1 overflow-x-auto">
              <MathRenderer latex={`$${entry.formula}$`} />
            </div>
            {entry.notes && (
              <span className="text-xs text-muted-foreground italic shrink-0">{entry.notes}</span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
