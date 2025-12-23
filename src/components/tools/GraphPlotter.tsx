import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, X, Minimize2, Maximize2, Plus, Trash2 } from 'lucide-react';

interface GraphPlotterProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  initialFunction?: string;
  initialFunctions?: string[];
}

interface FunctionEntry {
  id: string;
  expression: string;
  color: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function GraphPlotter({ 
  isOpen, 
  onClose, 
  isMinimized, 
  onToggleMinimize,
  initialFunction,
  initialFunctions = []
}: GraphPlotterProps) {
  // Build initial functions list
  const buildInitialFunctions = useCallback((): FunctionEntry[] => {
    if (initialFunctions.length > 0) {
      return initialFunctions.map((expr, i) => ({
        id: `init-${i}`,
        expression: expr.replace(/^y\s*=\s*/i, '').trim(),
        color: COLORS[i % COLORS.length]
      }));
    }
    return [{ id: '1', expression: initialFunction || 'x^2', color: COLORS[0] }];
  }, [initialFunctions, initialFunction]);

  const [functions, setFunctions] = useState<FunctionEntry[]>(buildInitialFunctions);
  const [newFunc, setNewFunc] = useState('');
  const [xRange, setXRange] = useState({ min: -10, max: 10 });
  const [yRange, setYRange] = useState({ min: -10, max: 10 });
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);

  // Update functions when initialFunctions changes
  useEffect(() => {
    if (initialFunctions.length > 0) {
      setFunctions(buildInitialFunctions());
    }
  }, [initialFunctions, buildInitialFunctions]);

  const width = 320;
  const height = 240;
  const padding = 30;

  const parseExpression = useCallback((expr: string, x: number): number => {
    try {
      const parsed = expr
        .replace(/\^/g, '**')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/pi/g, 'Math.PI')
        .replace(/e(?![a-z])/g, 'Math.E')
        .replace(/(\d)x/g, '$1*x')
        .replace(/x(\d)/g, 'x*$1')
        .replace(/\)x/g, ')*x')
        .replace(/x\(/g, 'x*(');
      return Function('x', `"use strict"; return ${parsed}`)(x);
    } catch {
      return NaN;
    }
  }, []);

  const paths = useMemo(() => {
    return functions.map(func => {
      const points: string[] = [];
      const step = (xRange.max - xRange.min) / 200;
      
      for (let x = xRange.min; x <= xRange.max; x += step) {
        const y = parseExpression(func.expression, x);
        if (isFinite(y) && y >= yRange.min - 5 && y <= yRange.max + 5) {
          const px = padding + ((x - xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding);
          const py = height - padding - ((y - yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding);
          points.push(`${px},${py}`);
        }
      }
      
      return { ...func, path: points.length > 1 ? `M ${points.join(' L ')}` : '' };
    });
  }, [functions, xRange, yRange, parseExpression]);

  const addFunction = () => {
    if (newFunc.trim()) {
      const colorIndex = functions.length % COLORS.length;
      setFunctions([...functions, { 
        id: Date.now().toString(), 
        expression: newFunc, 
        color: COLORS[colorIndex] 
      }]);
      setNewFunc('');
    }
  };

  const removeFunction = (id: string) => {
    if (functions.length > 1) {
      setFunctions(functions.filter(f => f.id !== id));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    if (px >= padding && px <= width - padding && py >= padding && py <= height - padding) {
      const x = xRange.min + ((px - padding) / (width - 2 * padding)) * (xRange.max - xRange.min);
      const y = yRange.max - ((py - padding) / (height - 2 * padding)) * (yRange.max - yRange.min);
      setHoverPoint({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    } else {
      setHoverPoint(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden w-[360px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/30">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Graph Plotter</span>
          </div>
          <div className="flex items-center gap-1">
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
            {/* Graph */}
            <div className="p-3 bg-muted/10">
              <svg
                width={width}
                height={height}
                className="bg-background rounded-lg"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverPoint(null)}
              >
                {/* Grid */}
                {Array.from({ length: 11 }).map((_, i) => {
                  const x = padding + (i / 10) * (width - 2 * padding);
                  const y = padding + (i / 10) * (height - 2 * padding);
                  return (
                    <g key={i} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3">
                      <line x1={x} y1={padding} x2={x} y2={height - padding} />
                      <line x1={padding} y1={y} x2={width - padding} y2={y} />
                    </g>
                  );
                })}

                {/* Axes */}
                <g stroke="hsl(var(--muted-foreground))" strokeWidth="1">
                  {/* X-axis */}
                  {yRange.min <= 0 && yRange.max >= 0 && (
                    <line
                      x1={padding}
                      y1={height - padding - (-yRange.min / (yRange.max - yRange.min)) * (height - 2 * padding)}
                      x2={width - padding}
                      y2={height - padding - (-yRange.min / (yRange.max - yRange.min)) * (height - 2 * padding)}
                    />
                  )}
                  {/* Y-axis */}
                  {xRange.min <= 0 && xRange.max >= 0 && (
                    <line
                      x1={padding + (-xRange.min / (xRange.max - xRange.min)) * (width - 2 * padding)}
                      y1={padding}
                      x2={padding + (-xRange.min / (xRange.max - xRange.min)) * (width - 2 * padding)}
                      y2={height - padding}
                    />
                  )}
                </g>

                {/* Function curves */}
                {paths.map(func => (
                  <motion.path
                    key={func.id}
                    d={func.path}
                    fill="none"
                    stroke={func.color}
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                  />
                ))}

                {/* Hover crosshairs */}
                {hoverPoint && (
                  <g>
                    <line
                      x1={padding + ((hoverPoint.x - xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding)}
                      y1={padding}
                      x2={padding + ((hoverPoint.x - xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding)}
                      y2={height - padding}
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="4"
                      opacity="0.5"
                    />
                    <text
                      x={width - padding - 5}
                      y={padding + 12}
                      fill="hsl(var(--muted-foreground))"
                      fontSize="10"
                      textAnchor="end"
                    >
                      ({hoverPoint.x}, {hoverPoint.y})
                    </text>
                  </g>
                )}

                {/* Axis labels */}
                <text x={width / 2} y={height - 5} fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="middle">x</text>
                <text x={10} y={height / 2} fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="middle" transform={`rotate(-90, 10, ${height / 2})`}>y</text>
              </svg>
            </div>

            {/* Functions list */}
            <div className="p-3 space-y-2 border-t border-border/30">
              {functions.map(func => (
                <div key={func.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: func.color }} />
                  <span className="flex-1 font-mono text-sm">y = {func.expression}</span>
                  {functions.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-6 h-6"
                      onClick={() => removeFunction(func.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Input
                  value={newFunc}
                  onChange={(e) => setNewFunc(e.target.value)}
                  placeholder="e.g., 2x + 1"
                  className="flex-1 h-8 text-sm font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && addFunction()}
                />
                <Button size="sm" onClick={addFunction} className="h-8">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground">
                Use: x^2, sqrt(x), sin(x), cos(x), ln(x), pi, e
              </p>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
