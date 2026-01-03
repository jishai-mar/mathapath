import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calculator, X, Minimize2, Maximize2 } from 'lucide-react';
import { create, all } from 'mathjs';

interface MathCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onInsertResult?: (result: string) => void;
}

const buttons = [
  ['C', '(', ')', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '±', '='],
];

const scientificButtons = [
  ['sin', 'cos', 'tan', 'π'],
  ['√', 'x²', 'xⁿ', 'ln'],
  ['log', 'e', '|x|', '%'],
];

export default function MathCalculator({ isOpen, onClose, isMinimized, onToggleMinimize, onInsertResult }: MathCalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [showScientific, setShowScientific] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Create a restricted math.js instance for safe expression evaluation
  const mathInstance = useMemo(() => create(all, {}), []);

  const handleButton = useCallback((value: string) => {
    switch (value) {
      case 'C':
        setDisplay('0');
        setExpression('');
        break;
      case '=':
        try {
          // Prepare expression for mathjs evaluation
          const evalExpr = expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, 'pi')
            .replace(/√\(/g, 'sqrt(')
            .replace(/²/g, '^2')
            // Convert trig functions to use degrees
            .replace(/sin\(([^)]+)\)/g, 'sin($1 deg)')
            .replace(/cos\(([^)]+)\)/g, 'cos($1 deg)')
            .replace(/tan\(([^)]+)\)/g, 'tan($1 deg)');
          
          // Use mathjs for safe evaluation
          const result = mathInstance.evaluate(evalExpr);
          const resultStr = Number.isFinite(result) ? String(parseFloat(Number(result).toFixed(10))) : 'Error';
          setDisplay(resultStr);
          if (resultStr !== 'Error') {
            setLastResult(resultStr);
          }
        } catch {
          setDisplay('Error');
        }
        break;
      case '±':
        if (display !== '0') {
          setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
          setExpression(expression.startsWith('-') ? expression.slice(1) : '-' + expression);
        }
        break;
      case 'sin':
      case 'cos':
      case 'tan':
      case 'ln':
      case 'log':
        setExpression(prev => prev + value + '(');
        setDisplay(value + '(');
        break;
      case '√':
        setExpression(prev => prev + '√(');
        setDisplay('√(');
        break;
      case 'x²':
        setExpression(prev => prev + '²');
        setDisplay(prev => prev + '²');
        break;
      case 'xⁿ':
        setExpression(prev => prev + '^');
        setDisplay('^');
        break;
      case '|x|':
        setExpression(prev => 'Math.abs(' + prev + ')');
        setDisplay('|' + display + '|');
        break;
      default:
        if (display === '0' && !['(', ')'].includes(value)) {
          setDisplay(value);
          setExpression(value);
        } else {
          setDisplay(prev => prev + value);
          setExpression(prev => prev + value);
        }
    }
  }, [display, expression]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Calculator</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={() => setShowScientific(!showScientific)}
            >
              <span className="text-xs">fx</span>
            </Button>
            {onToggleMinimize && (
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onToggleMinimize}>
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onClose}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Display */}
            <div className="p-4 bg-muted/10">
              <div className="text-xs text-muted-foreground h-4 overflow-hidden text-right font-mono">
                {expression || ' '}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-2xl font-mono text-right text-foreground truncate flex-1">
                  {display}
                </div>
                {lastResult && onInsertResult && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 text-primary hover:bg-primary/10"
                    onClick={() => onInsertResult(lastResult)}
                    title="Voeg resultaat in antwoord"
                  >
                    Invoegen →
                  </Button>
                )}
              </div>
            </div>

            {/* Scientific buttons */}
            <AnimatePresence>
              {showScientific && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-4 gap-1 p-2 bg-muted/20"
                >
                  {scientificButtons.flat().map((btn) => (
                    <button
                      key={btn}
                      onClick={() => handleButton(btn)}
                      className="h-10 rounded-lg bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors"
                    >
                      {btn}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main buttons */}
            <div className="grid grid-cols-4 gap-1 p-2">
              {buttons.flat().map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleButton(btn)}
                  className={`h-12 rounded-lg font-medium text-lg transition-colors ${
                    btn === '=' 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : btn === 'C'
                      ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                      : ['÷', '×', '-', '+'].includes(btn)
                      ? 'bg-accent/50 hover:bg-accent'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
