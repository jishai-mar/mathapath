import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Keyboard, X, ChevronDown, ChevronUp, Calculator, LineChart, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import MathCalculator from '@/components/tools/MathCalculator';
import AdvancedGraphCalculator from '@/components/tools/AdvancedGraphCalculator';
import FormulaSheet from '@/components/tools/FormulaSheet';

interface MathKeyboardProps {
  onInsert: (symbol: string) => void;
  className?: string;
  topicName?: string;
  currentQuestion?: string;
}

type KeyCategory = 'basic' | 'algebra' | 'greek' | 'functions' | 'comparison' | 'fractions' | 'arrows';

interface MathKey {
  display: string;
  insert: string;
  label?: string;
  wide?: boolean;
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
      { display: '[', insert: '[' },
      { display: ']', insert: ']' },
      { display: '{', insert: '{' },
      { display: '}', insert: '}' },
      { display: ',', insert: ', ' },
      { display: '.', insert: '.' },
      { display: '±', insert: ' ± ' },
      { display: '∞', insert: '∞' },
      { display: 'π', insert: 'π' },
      { display: '!', insert: '!', label: 'faculteit' },
      { display: '%', insert: '%' },
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
      { display: 'c', insert: 'c' },
      { display: 'n', insert: 'n' },
      { display: 'm', insert: 'm' },
      { display: 'x²', insert: 'x²', label: 'kwadraat' },
      { display: 'x³', insert: 'x³', label: 'derdemacht' },
      { display: 'xⁿ', insert: '^', label: 'macht' },
      { display: '√', insert: '√(', label: 'wortel' },
      { display: '∛', insert: '∛(', label: 'derdemachtswortel' },
      { display: 'ⁿ√', insert: 'ⁿ√(', label: 'n-de machtswortel' },
      { display: '|x|', insert: '|', label: 'absolute waarde' },
      { display: 'log₁₀', insert: 'log₁₀(', label: 'logaritme basis 10' },
      { display: 'logₐ', insert: 'log_', label: 'logaritme basis a' },
    ],
  },
  fractions: {
    name: 'Breuken',
    keys: [
      { display: '/', insert: '/', label: 'deelstreep' },
      { display: '½', insert: '½' },
      { display: '⅓', insert: '⅓' },
      { display: '⅔', insert: '⅔' },
      { display: '¼', insert: '¼' },
      { display: '¾', insert: '¾' },
      { display: '⅕', insert: '⅕' },
      { display: '⅖', insert: '⅖' },
      { display: '⅗', insert: '⅗' },
      { display: '⅘', insert: '⅘' },
      { display: '⅙', insert: '⅙' },
      { display: '⅚', insert: '⅚' },
      { display: '⅛', insert: '⅛' },
      { display: '⅜', insert: '⅜' },
      { display: '⅝', insert: '⅝' },
      { display: '⅞', insert: '⅞' },
      { display: 'a/b', insert: '/b', label: 'breuk invoeren', wide: true },
      { display: '(a+b)/c', insert: '()/c', label: 'breuk met teller', wide: true },
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
      { display: '≡', insert: ' ≡ ', label: 'identiek aan' },
      { display: '∝', insert: ' ∝ ', label: 'evenredig met' },
      { display: '∈', insert: ' ∈ ' },
      { display: '∉', insert: ' ∉ ' },
      { display: '⊂', insert: ' ⊂ ' },
      { display: '⊃', insert: ' ⊃ ' },
      { display: '⊆', insert: ' ⊆ ' },
      { display: '⊇', insert: ' ⊇ ' },
      { display: '∪', insert: ' ∪ ' },
      { display: '∩', insert: ' ∩ ' },
      { display: '∅', insert: '∅' },
      { display: '∴', insert: ' ∴ ', label: 'daarom' },
    ],
  },
  functions: {
    name: 'Functies',
    keys: [
      { display: 'sin', insert: 'sin(' },
      { display: 'cos', insert: 'cos(' },
      { display: 'tan', insert: 'tan(' },
      { display: 'sin⁻¹', insert: 'arcsin(', label: 'arcsinus' },
      { display: 'cos⁻¹', insert: 'arccos(', label: 'arccosinus' },
      { display: 'tan⁻¹', insert: 'arctan(', label: 'arctangens' },
      { display: 'log', insert: 'log(' },
      { display: 'ln', insert: 'ln(' },
      { display: 'e', insert: 'e' },
      { display: 'eˣ', insert: 'e^', label: 'e tot de macht' },
      { display: 'f(x)', insert: 'f(x)' },
      { display: 'g(x)', insert: 'g(x)' },
      { display: "f'(x)", insert: "f'(x)", label: 'afgeleide' },
      { display: "f''(x)", insert: "f''(x)", label: 'tweede afgeleide' },
      { display: 'lim', insert: 'lim ', label: 'limiet' },
      { display: '∫', insert: '∫', label: 'integraal' },
      { display: '∫ᵃᵇ', insert: '∫ᵃᵇ', label: 'bepaalde integraal' },
      { display: 'Σ', insert: 'Σ', label: 'som' },
      { display: '∏', insert: '∏', label: 'product' },
      { display: '∂', insert: '∂', label: 'partiële afgeleide' },
      { display: 'd/dx', insert: 'd/dx ', label: 'differentiatie' },
      { display: '∇', insert: '∇', label: 'nabla/gradiënt' },
    ],
  },
  arrows: {
    name: 'Pijlen',
    keys: [
      { display: '→', insert: ' → ', label: 'naar' },
      { display: '←', insert: ' ← ' },
      { display: '↔', insert: ' ↔ ', label: 'als en slechts als' },
      { display: '⇒', insert: ' ⇒ ', label: 'impliceert' },
      { display: '⇐', insert: ' ⇐ ' },
      { display: '⇔', insert: ' ⇔ ', label: 'equivalent' },
      { display: '↑', insert: '↑' },
      { display: '↓', insert: '↓' },
      { display: '∧', insert: ' ∧ ', label: 'en (logisch)' },
      { display: '∨', insert: ' ∨ ', label: 'of (logisch)' },
      { display: '¬', insert: '¬', label: 'niet (logisch)' },
      { display: '∀', insert: '∀', label: 'voor alle' },
      { display: '∃', insert: '∃', label: 'er bestaat' },
    ],
  },
  greek: {
    name: 'Grieks',
    keys: [
      { display: 'α', insert: 'α', label: 'alpha' },
      { display: 'β', insert: 'β', label: 'beta' },
      { display: 'γ', insert: 'γ', label: 'gamma' },
      { display: 'δ', insert: 'δ', label: 'delta' },
      { display: 'ε', insert: 'ε', label: 'epsilon' },
      { display: 'ζ', insert: 'ζ', label: 'zeta' },
      { display: 'η', insert: 'η', label: 'eta' },
      { display: 'θ', insert: 'θ', label: 'theta' },
      { display: 'λ', insert: 'λ', label: 'lambda' },
      { display: 'μ', insert: 'μ', label: 'mu' },
      { display: 'ξ', insert: 'ξ', label: 'xi' },
      { display: 'ρ', insert: 'ρ', label: 'rho' },
      { display: 'σ', insert: 'σ', label: 'sigma' },
      { display: 'τ', insert: 'τ', label: 'tau' },
      { display: 'φ', insert: 'φ', label: 'phi' },
      { display: 'ψ', insert: 'ψ', label: 'psi' },
      { display: 'ω', insert: 'ω', label: 'omega' },
      { display: 'Δ', insert: 'Δ', label: 'Delta' },
      { display: 'Γ', insert: 'Γ', label: 'Gamma' },
      { display: 'Θ', insert: 'Θ', label: 'Theta' },
      { display: 'Λ', insert: 'Λ', label: 'Lambda' },
      { display: 'Σ', insert: 'Σ', label: 'Sigma' },
      { display: 'Φ', insert: 'Φ', label: 'Phi' },
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
  { display: '⁺', insert: '⁺', label: 'plus' },
  { display: '⁻', insert: '⁻', label: 'min (negatief)' },
  { display: '⁼', insert: '⁼', label: 'gelijk aan' },
  { display: '⁽', insert: '⁽', label: 'haakje openen' },
  { display: '⁾', insert: '⁾', label: 'haakje sluiten' },
  { display: '⁄', insert: '⁄', label: 'breukstreep' },
  { display: '·', insert: '·', label: 'decimaalpunt' },
  { display: 'ⁿ', insert: 'ⁿ' },
  { display: 'ˣ', insert: 'ˣ' },
  { display: 'ʸ', insert: 'ʸ' },
  { display: 'ᵃ', insert: 'ᵃ' },
  { display: 'ᵇ', insert: 'ᵇ' },
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
  { display: '₊', insert: '₊', label: 'plus' },
  { display: '₋', insert: '₋', label: 'min' },
  { display: '₌', insert: '₌', label: 'gelijk aan' },
  { display: '₍', insert: '₍', label: 'haakje openen' },
  { display: '₎', insert: '₎', label: 'haakje sluiten' },
  { display: 'ₓ', insert: 'ₓ' },
  { display: 'ₙ', insert: 'ₙ' },
  { display: 'ₐ', insert: 'ₐ' },
  { display: 'ₑ', insert: 'ₑ' },
  { display: 'ₘ', insert: 'ₘ' },
];

export function MathKeyboard({ onInsert, className, topicName, currentQuestion }: MathKeyboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<KeyCategory>('basic');
  const [showExtras, setShowExtras] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);

  const handleKeyClick = (key: MathKey) => {
    onInsert(key.insert);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Tool Buttons Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Math Keyboard Toggle */}
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
          Math Keyboard
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>

        {/* Calculator Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCalculator(!showCalculator)}
          className={cn(
            "gap-2 transition-colors",
            showCalculator && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Calculator className="w-4 h-4" />
          Calculator
        </Button>

        {/* Graph Calculator Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowGraph(!showGraph)}
          className={cn(
            "gap-2 transition-colors",
            showGraph && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <LineChart className="w-4 h-4" />
          Graph
        </Button>

        {/* Formula Sheet Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowFormulas(!showFormulas)}
          className={cn(
            "gap-2 transition-colors",
            showFormulas && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Formulas
        </Button>
      </div>

      {/* Calculator Component */}
      <div className="fixed bottom-20 right-4 z-50">
        <MathCalculator
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
          onInsertResult={(result) => {
            onInsert(result);
            setShowCalculator(false);
          }}
        />
      </div>

      {/* Graph Calculator Component */}
      <div className="fixed bottom-20 left-4 z-50">
        <AdvancedGraphCalculator
          isOpen={showGraph}
          onClose={() => setShowGraph(false)}
          initialFunctions={['x^2']}
          currentQuestion={currentQuestion}
        />
      </div>

      {/* Formula Sheet Component */}
      <div className="fixed bottom-20 right-80 z-50">
        <FormulaSheet
          isOpen={showFormulas}
          onClose={() => setShowFormulas(false)}
          onInsert={(formula) => {
            onInsert(formula);
            setShowFormulas(false);
          }}
          topicName={topicName}
        />
      </div>

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

                  {/* Common separators */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Leestekens</p>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onInsert(',')}
                        className="h-8 px-4 text-base font-medium"
                      >
                        ,
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onInsert('.')}
                        className="h-8 px-4 text-base font-medium"
                      >
                        .
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onInsert(';')}
                        className="h-8 px-4 text-base font-medium"
                      >
                        ;
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onInsert(':')}
                        className="h-8 px-4 text-base font-medium"
                      >
                        :
                      </Button>
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