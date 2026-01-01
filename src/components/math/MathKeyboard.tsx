import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Keyboard, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MathKeyboardProps {
  onInsert: (symbol: string) => void;
  className?: string;
}

type KeyCategory = 'basic' | 'algebra' | 'greek' | 'functions' | 'comparison';

interface MathKey {
  display: string;
  insert: string;
  label?: string;
}

const keyCategories: Record<KeyCategory, { name: string; keys: MathKey[] }> = {
  basic: {
    name: 'Basis',
    keys: [
      { display: '+', insert: ' + ' },
      { display: '−', insert: ' - ' },
      { display: '×', insert: ' × ' },
      { display: '÷', insert: ' ÷ ' },
      { display: '=', insert: ' = ' },
      { display: '(', insert: '(' },
      { display: ')', insert: ')' },
      { display: ',', insert: ', ' },
      { display: '.', insert: '.' },
      { display: '±', insert: ' ± ' },
      { display: '∞', insert: '∞' },
      { display: 'π', insert: 'π' },
    ],
  },
  algebra: {
    name: 'Algebra',
    keys: [
      { display: 'x', insert: 'x' },
      { display: 'y', insert: 'y' },
      { display: 'z', insert: 'z' },
      { display: 'a', insert: 'a' },
      { display: 'b', insert: 'b' },
      { display: 'n', insert: 'n' },
      { display: 'x²', insert: 'x²', label: 'kwadraat' },
      { display: 'x³', insert: 'x³', label: 'derdemacht' },
      { display: 'xⁿ', insert: '^', label: 'macht' },
      { display: '√', insert: '√', label: 'wortel' },
      { display: '∛', insert: '∛', label: 'derdemachtswortel' },
      { display: '|x|', insert: '|', label: 'absolute waarde' },
    ],
  },
  comparison: {
    name: 'Vergelijking',
    keys: [
      { display: '<', insert: ' < ' },
      { display: '>', insert: ' > ' },
      { display: '≤', insert: ' ≤ ' },
      { display: '≥', insert: ' ≥ ' },
      { display: '≠', insert: ' ≠ ' },
      { display: '≈', insert: ' ≈ ' },
      { display: '∈', insert: ' ∈ ' },
      { display: '∉', insert: ' ∉ ' },
      { display: '⊂', insert: ' ⊂ ' },
      { display: '∪', insert: ' ∪ ' },
      { display: '∩', insert: ' ∩ ' },
      { display: '∅', insert: '∅' },
    ],
  },
  functions: {
    name: 'Functies',
    keys: [
      { display: 'sin', insert: 'sin(' },
      { display: 'cos', insert: 'cos(' },
      { display: 'tan', insert: 'tan(' },
      { display: 'log', insert: 'log(' },
      { display: 'ln', insert: 'ln(' },
      { display: 'e', insert: 'e' },
      { display: 'f(x)', insert: 'f(x)' },
      { display: "f'(x)", insert: "f'(x)" },
      { display: 'lim', insert: 'lim ' },
      { display: '∫', insert: '∫' },
      { display: 'Σ', insert: 'Σ' },
      { display: '∂', insert: '∂' },
    ],
  },
  greek: {
    name: 'Grieks',
    keys: [
      { display: 'α', insert: 'α', label: 'alpha' },
      { display: 'β', insert: 'β', label: 'beta' },
      { display: 'γ', insert: 'γ', label: 'gamma' },
      { display: 'δ', insert: 'δ', label: 'delta' },
      { display: 'θ', insert: 'θ', label: 'theta' },
      { display: 'λ', insert: 'λ', label: 'lambda' },
      { display: 'μ', insert: 'μ', label: 'mu' },
      { display: 'σ', insert: 'σ', label: 'sigma' },
      { display: 'φ', insert: 'φ', label: 'phi' },
      { display: 'ω', insert: 'ω', label: 'omega' },
      { display: 'Δ', insert: 'Δ', label: 'Delta' },
      { display: 'Ω', insert: 'Ω', label: 'Omega' },
    ],
  },
};

// Superscript and subscript numbers
const superscripts: MathKey[] = [
  { display: '⁰', insert: '⁰' },
  { display: '¹', insert: '¹' },
  { display: '²', insert: '²' },
  { display: '³', insert: '³' },
  { display: '⁴', insert: '⁴' },
  { display: '⁵', insert: '⁵' },
  { display: '⁶', insert: '⁶' },
  { display: '⁷', insert: '⁷' },
  { display: '⁸', insert: '⁸' },
  { display: '⁹', insert: '⁹' },
];

const subscripts: MathKey[] = [
  { display: '₀', insert: '₀' },
  { display: '₁', insert: '₁' },
  { display: '₂', insert: '₂' },
  { display: '₃', insert: '₃' },
  { display: '₄', insert: '₄' },
  { display: '₅', insert: '₅' },
  { display: '₆', insert: '₆' },
  { display: '₇', insert: '₇' },
  { display: '₈', insert: '₈' },
  { display: '₉', insert: '₉' },
];

const fractions: MathKey[] = [
  { display: '½', insert: '½' },
  { display: '⅓', insert: '⅓' },
  { display: '¼', insert: '¼' },
  { display: '⅕', insert: '⅕' },
  { display: '⅔', insert: '⅔' },
  { display: '¾', insert: '¾' },
  { display: '⅖', insert: '⅖' },
  { display: '⅗', insert: '⅗' },
  { display: '/', insert: '/' },
];

export function MathKeyboard({ onInsert, className }: MathKeyboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<KeyCategory>('basic');
  const [showExtras, setShowExtras] = useState(false);

  const handleKeyClick = (key: MathKey) => {
    onInsert(key.insert);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Toggle Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "gap-2 transition-colors",
          isOpen && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        <Keyboard className="w-4 h-4" />
        Wiskundetoetsenbord
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>

      {/* Keyboard Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 p-3 rounded-xl bg-card border border-border shadow-lg overflow-hidden"
          >
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1 mb-3 pb-2 border-b border-border">
              {(Object.keys(keyCategories) as KeyCategory[]).map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={activeCategory === cat ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className="text-xs h-7 px-2"
                >
                  {keyCategories[cat].name}
                </Button>
              ))}
            </div>

            {/* Active Category Keys */}
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1 mb-3">
              {keyCategories[activeCategory].keys.map((key, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleKeyClick(key)}
                  title={key.label || key.display}
                  className="h-10 w-full text-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {key.display}
                </Button>
              ))}
            </div>

            {/* Extra Options Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowExtras(!showExtras)}
              className="text-xs text-muted-foreground w-full justify-center gap-1"
            >
              {showExtras ? 'Minder opties' : 'Meer opties (machten, breuken)'}
              {showExtras ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>

            {/* Extra Keys */}
            <AnimatePresence>
              {showExtras && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-3"
                >
                  {/* Superscripts */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Machten (superscript)</p>
                    <div className="flex flex-wrap gap-1">
                      {superscripts.map((key, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleKeyClick(key)}
                          className="h-8 w-8 text-base font-medium"
                        >
                          {key.display}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Subscripts */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Subscript</p>
                    <div className="flex flex-wrap gap-1">
                      {subscripts.map((key, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleKeyClick(key)}
                          className="h-8 w-8 text-base font-medium"
                        >
                          {key.display}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Fractions */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Breuken</p>
                    <div className="flex flex-wrap gap-1">
                      {fractions.map((key, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleKeyClick(key)}
                          className="h-8 w-8 text-base font-medium"
                        >
                          {key.display}
                        </Button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close Button */}
            <div className="flex justify-end mt-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs text-muted-foreground gap-1"
              >
                <X className="w-3 h-3" />
                Sluiten
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}