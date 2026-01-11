import { motion } from 'framer-motion';
import { TrendingUp, GitBranch, ArrowRight, Minus, Plus, Target } from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { createSegmentsFromSolution } from '@/lib/solutionSegments';

interface TheoryDiagramProps {
  type: string;
}

export function TheoryDiagram({ type }: TheoryDiagramProps) {
  switch (type) {
    case 'quadratic-graph':
      return <QuadraticGraphDiagram />;
    case 'chain-rule':
      return <ChainRuleDiagram />;
    case 'derivative-slope':
      return <DerivativeSlopeDiagram />;
    case 'number-line':
      return <NumberLineDiagram />;
    case 'formula-breakdown':
      return <FormulaBreakdownDiagram />;
    default:
      return null;
  }
}

function QuadraticGraphDiagram() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-accent-foreground" />
        <p className="text-sm font-semibold text-accent-foreground">Visual: Parabola and Roots</p>
      </div>
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 200 120" className="w-full max-w-xs h-32">
          {/* Grid */}
          <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
          <line x1="100" y1="10" x2="100" y2="110" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
          
          {/* Axis labels */}
          <text x="175" y="95" className="text-[8px] fill-muted-foreground">x</text>
          <text x="103" y="18" className="text-[8px] fill-muted-foreground">y</text>
          
          {/* Parabola */}
          <motion.path 
            d="M 30,20 Q 100,120 170,20" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          
          {/* Roots (x-intercepts) */}
          <motion.circle 
            cx="50" cy="100" r="5" 
            fill="hsl(var(--destructive))"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 }}
          />
          <motion.circle 
            cx="150" cy="100" r="5" 
            fill="hsl(var(--destructive))"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 }}
          />
          
          {/* Root labels */}
          <motion.text 
            x="45" y="115" 
            className="text-[9px] fill-destructive font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            x₁
          </motion.text>
          <motion.text 
            x="145" y="115" 
            className="text-[9px] fill-destructive font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            x₂
          </motion.text>
          
          {/* Vertex */}
          <motion.circle 
            cx="100" cy="70" r="4" 
            fill="hsl(var(--primary))"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.4 }}
          />
        </svg>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        The roots (x₁ and x₂) are the solutions of the equation
      </p>
    </div>
  );
}

function ChainRuleDiagram() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-accent-foreground" />
        <p className="text-sm font-semibold text-accent-foreground">Visual: Chain Rule</p>
      </div>
      <div className="flex items-center justify-center gap-2">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-16 h-16 rounded-xl bg-primary/20 border-2 border-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary">f</span>
          </div>
          <span className="text-xs text-muted-foreground mt-1">Outer</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </motion.div>
        
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="w-16 h-16 rounded-xl bg-secondary/50 border-2 border-secondary flex items-center justify-center">
            <span className="text-sm font-bold text-secondary-foreground">g</span>
          </div>
          <span className="text-xs text-muted-foreground mt-1">Inner</span>
        </motion.div>
      </div>
      
      <motion.div 
        className="text-center p-3 rounded-lg bg-muted/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <MathRenderer segments={createSegmentsFromSolution("[f(g(x))]' = f'(g(x)) \\cdot g'(x)")} />
      </motion.div>
      
      <p className="text-xs text-muted-foreground text-center">
        Differentiate the outer function and multiply by the derivative of the inner
      </p>
    </div>
  );
}

function DerivativeSlopeDiagram() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-accent-foreground" />
        <p className="text-sm font-semibold text-accent-foreground">Visual: Derivative as Slope</p>
      </div>
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 200 120" className="w-full max-w-xs h-32">
          {/* Grid */}
          <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
          <line x1="30" y1="10" x2="30" y2="110" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
          
          {/* Curve */}
          <motion.path 
            d="M 30,90 Q 80,80 100,50 T 170,20" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
          
          {/* Point on curve */}
          <motion.circle 
            cx="100" cy="50" r="5" 
            fill="hsl(var(--destructive))"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 }}
          />
          
          {/* Tangent line */}
          <motion.line 
            x1="60" y1="70" x2="140" y2="30" 
            stroke="hsl(var(--secondary))" 
            strokeWidth="2"
            strokeDasharray="5,3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          />
          
          {/* Label */}
          <motion.text 
            x="145" y="35" 
            className="text-[9px] fill-secondary-foreground font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            tangent
          </motion.text>
          
          <motion.text 
            x="105" y="45" 
            className="text-[9px] fill-destructive font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            f'(a)
          </motion.text>
        </svg>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        The derivative f'(a) gives the slope of the tangent line at point (a, f(a))
      </p>
    </div>
  );
}

function NumberLineDiagram() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Minus className="w-4 h-4 text-accent-foreground" />
        <p className="text-sm font-semibold text-accent-foreground">Visual: Number Line</p>
      </div>
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 200 60" className="w-full max-w-xs h-16">
          {/* Main line */}
          <line x1="10" y1="30" x2="190" y2="30" stroke="currentColor" strokeWidth="2" />
          
          {/* Arrow heads */}
          <polygon points="185,25 195,30 185,35" fill="currentColor" />
          <polygon points="15,25 5,30 15,35" fill="currentColor" />
          
          {/* Tick marks */}
          {[30, 60, 100, 140, 170].map((x, i) => (
            <line key={i} x1={x} y1="25" x2={x} y2="35" stroke="currentColor" strokeWidth="1.5" />
          ))}
          
          {/* Labels */}
          <text x="27" y="50" className="text-[10px] fill-muted-foreground">-2</text>
          <text x="57" y="50" className="text-[10px] fill-muted-foreground">-1</text>
          <text x="98" y="50" className="text-[10px] fill-muted-foreground">0</text>
          <text x="138" y="50" className="text-[10px] fill-muted-foreground">1</text>
          <text x="168" y="50" className="text-[10px] fill-muted-foreground">2</text>
          
          {/* Highlighted region example */}
          <motion.line 
            x1="60" y1="30" x2="140" y2="30" 
            stroke="hsl(var(--primary))" 
            strokeWidth="4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
          
          {/* Endpoint markers */}
          <motion.circle 
            cx="60" cy="30" r="4" 
            fill="hsl(var(--primary))"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.3 }}
          />
          <motion.circle 
            cx="140" cy="30" r="4" 
            fill="hsl(var(--primary))"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5 }}
          />
        </svg>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Mark the solutions on the number line
      </p>
    </div>
  );
}

function FormulaBreakdownDiagram() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-accent-foreground" />
        <p className="text-sm font-semibold text-accent-foreground">Visual: Equation in Balance</p>
      </div>
      <div className="flex items-center justify-center gap-4">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-20 h-12 rounded-lg bg-primary/20 border-2 border-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary">Left side</span>
          </div>
        </motion.div>
        
        <motion.div
          className="text-2xl font-bold text-muted-foreground"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          =
        </motion.div>
        
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="w-20 h-12 rounded-lg bg-secondary/50 border-2 border-secondary flex items-center justify-center">
            <span className="text-xs font-bold text-secondary-foreground">Right side</span>
          </div>
        </motion.div>
      </div>
      
      <motion.div 
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <ArrowRight className="w-3 h-3" />
        <span>What you do on the left, do on the right</span>
        <ArrowRight className="w-3 h-3 rotate-180" />
      </motion.div>
      
      <p className="text-xs text-muted-foreground text-center">
        Keep the equation balanced by performing the same operation on both sides
      </p>
    </div>
  );
}