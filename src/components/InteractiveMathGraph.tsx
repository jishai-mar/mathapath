import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { create, all } from 'mathjs';

interface InteractiveMathGraphProps {
  concept: string;
  subtopicName: string;
}

type GraphType = 'linear' | 'quadratic' | 'derivative' | 'logarithm' | 'exponential' | 'inequality' | 'fraction' | 'limit' | 'custom' | 'default';

// Create mathjs instance
const mathInstance = create(all, {});

export default function InteractiveMathGraph({ concept, subtopicName }: InteractiveMathGraphProps) {
  const [sliderValue, setSliderValue] = useState(50);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);

  // Try to extract a mathematical expression from the concept
  const extractedExpression = useMemo((): string | null => {
    // Common patterns for math expressions
    const patterns = [
      /f\s*\(\s*x\s*\)\s*=\s*([^,\n]+)/i,      // f(x) = ...
      /y\s*=\s*([^,\n]+)/i,                     // y = ...
      /g\s*\(\s*x\s*\)\s*=\s*([^,\n]+)/i,      // g(x) = ...
      /h\s*\(\s*x\s*\)\s*=\s*([^,\n]+)/i,      // h(x) = ...
    ];
    
    for (const pattern of patterns) {
      const match = concept.match(pattern);
      if (match && match[1]) {
        // Clean up the expression
        let expr = match[1].trim()
          .replace(/²/g, '^2')
          .replace(/³/g, '^3')
          .replace(/√/g, 'sqrt')
          .replace(/π/g, 'pi')
          .replace(/\|([^|]+)\|/g, 'abs($1)');
        return expr;
      }
    }
    return null;
  }, [concept]);

  // Evaluate expression using mathjs
  const evaluateExpression = useCallback((expr: string, x: number, param: number = 1): number => {
    try {
      const node = mathInstance.parse(expr);
      const compiled = node.compile();
      const result = compiled.evaluate({ x, a: param, b: param, c: 0 });
      return typeof result === 'number' ? result : NaN;
    } catch {
      return NaN;
    }
  }, []);

  // Determine graph type from concept/subtopic name
  const graphType = useMemo((): GraphType => {
    // If we found an expression, mark as custom
    if (extractedExpression) return 'custom';
    
    const lowerConcept = (concept + ' ' + subtopicName).toLowerCase();
    
    if (lowerConcept.includes('linear') || lowerConcept.includes('line')) return 'linear';
    if (lowerConcept.includes('quadratic') || lowerConcept.includes('parabola')) return 'quadratic';
    if (lowerConcept.includes('derivative') || lowerConcept.includes('tangent')) return 'derivative';
    if (lowerConcept.includes('logarithm') || lowerConcept.includes('log')) return 'logarithm';
    if (lowerConcept.includes('exponential') || lowerConcept.includes('exponent')) return 'exponential';
    if (lowerConcept.includes('inequality') || lowerConcept.includes('inequalit')) return 'inequality';
    if (lowerConcept.includes('fraction') || lowerConcept.includes('algebraic')) return 'fraction';
    if (lowerConcept.includes('limit')) return 'limit';
    return 'default';
  }, [concept, subtopicName, extractedExpression]);

  // Get the expression to graph
  const expressionToGraph = useMemo((): string => {
    if (extractedExpression) return extractedExpression;
    
    // Default expressions for each type
    const defaults: Record<GraphType, string> = {
      linear: 'a * x + b',
      quadratic: 'a * x^2',
      derivative: 'sin(a * x)',
      logarithm: 'log(x + 1)',
      exponential: 'exp(a * x / 3)',
      inequality: 'x',
      fraction: '1 / (x + 0.1)',
      limit: '1 / (x - 2)',
      custom: extractedExpression || 'x^2',
      default: 'sin(x)',
    };
    return defaults[graphType];
  }, [graphType, extractedExpression]);

  // Generate path for the graph using mathjs evaluation
  const generatePath = useCallback((param: number): string => {
    const scale = param / 50; // normalize 0-100 to 0-2
    const points: string[] = [];
    const xMin = 20;
    const xMax = 180;
    const yMin = 10;
    const yMax = 70;
    const graphCenterY = 40;
    
    // Map graph coordinates to SVG coordinates
    // x: 20-180 maps to domain -4 to 4
    // y: SVG y is inverted, 10 is top, 70 is bottom
    
    for (let svgX = xMin; svgX <= xMax; svgX += 3) {
      const mathX = ((svgX - 100) / 20); // Map to -4 to 4 range
      let mathY: number;
      
      try {
        mathY = evaluateExpression(expressionToGraph, mathX, scale);
      } catch {
        continue;
      }
      
      if (!isFinite(mathY) || Math.abs(mathY) > 100) continue;
      
      // Map math Y to SVG Y (invert and scale)
      const svgY = graphCenterY - mathY * 8;
      
      // Clamp to visible area
      const clampedY = Math.max(yMin, Math.min(yMax, svgY));
      
      points.push(`${svgX},${clampedY}`);
    }
    
    if (points.length < 2) {
      // Fallback to a simple line if parsing failed
      return `M 20 50 L 180 30`;
    }
    
    return `M ${points.join(' L ')}`;
  }, [expressionToGraph, evaluateExpression]);

  // Get label for graph type
  const getGraphLabel = (): string => {
    if (extractedExpression) {
      return `f(x) = ${extractedExpression}`;
    }
    const labels: Record<GraphType, string> = {
      linear: 'y = ax + b',
      quadratic: 'y = ax²',
      derivative: "y = sin(ax)",
      logarithm: 'y = log(x+1)',
      exponential: 'y = e^(ax/3)',
      inequality: 'y = x',
      fraction: 'y = 1/(x+0.1)',
      limit: 'y = 1/(x-2)',
      custom: `f(x) = ${extractedExpression}`,
      default: 'y = sin(x)',
    };
    return labels[graphType];
  };

  const path = generatePath(sliderValue);

  // Key points for annotations
  const keyPoints = useMemo(() => {
    switch (graphType) {
      case 'quadratic':
        return [{ x: 100, y: 40, label: 'vertex' }];
      case 'derivative':
        return [{ x: 100, y: 40, label: 'inflection' }];
      case 'limit':
        return [{ x: 100, y: 40, label: 'asymptote', isAsymptote: true }];
      default:
        return [];
    }
  }, [graphType]);

  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      {/* Window controls */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {getGraphLabel()}
        </span>
      </div>
      
      {/* Graph area */}
      <div 
        className="p-4 h-48 flex items-center justify-center relative"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 200;
          const y = ((e.clientY - rect.top) / rect.height) * 80;
          setHoverPoint({ x, y });
        }}
        onMouseLeave={() => setHoverPoint(null)}
      >
        <svg viewBox="0 0 200 80" className="w-full h-full">
          <defs>
            <linearGradient id="graphGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Grid */}
          {[20, 60, 100, 140, 180].map((x) => (
            <line 
              key={`vgrid-${x}`}
              x1={x} y1="10" x2={x} y2="70" 
              stroke="hsl(var(--border))" 
              strokeWidth="0.5" 
              strokeOpacity="0.3"
            />
          ))}
          {[20, 40, 60].map((y) => (
            <line 
              key={`hgrid-${y}`}
              x1="20" y1={y} x2="180" y2={y} 
              stroke="hsl(var(--border))" 
              strokeWidth="0.5" 
              strokeOpacity="0.3"
            />
          ))}
          
          {/* Axis */}
          <line x1="20" y1="70" x2="180" y2="70" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="20" y1="10" x2="20" y2="70" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeOpacity="0.5" />
          
          {/* Center axis lines */}
          <line x1="100" y1="10" x2="100" y2="70" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeOpacity="0.3" />
          <line x1="20" y1="40" x2="180" y2="40" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeOpacity="0.3" />
          
          {/* Axis labels */}
          <text x="180" y="78" fontSize="8" fill="hsl(var(--muted-foreground))">x</text>
          <text x="12" y="15" fontSize="8" fill="hsl(var(--muted-foreground))">y</text>
          
          {/* Asymptotes for limit graphs */}
          {graphType === 'limit' && (
            <motion.line
              x1="100" y1="10" x2="100" y2="70"
              stroke="hsl(var(--destructive))"
              strokeWidth="1"
              strokeDasharray="4 2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
            />
          )}
          
          {/* Animated Curve */}
          <motion.path
            d={path}
            fill="none"
            stroke="url(#graphGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 1 
            }}
            transition={{ 
              pathLength: { duration: 1.5, ease: "easeInOut" },
              opacity: { duration: 0.3 }
            }}
            key={`path-${sliderValue}-${expressionToGraph}`}
          />
          
          {/* Key points */}
          {keyPoints.map((point, idx) => (
            <motion.g key={idx}>
              {!point.isAsymptote && (
                <>
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="hsl(var(--primary))"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                  />
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r="8"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
                  />
                </>
              )}
              <motion.text
                x={point.x + 10}
                y={point.y - 5}
                fontSize="7"
                fill="hsl(var(--primary))"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {point.label}
              </motion.text>
            </motion.g>
          ))}
          
          {/* Hover crosshair */}
          {hoverPoint && (
            <g>
              <line 
                x1={hoverPoint.x} y1="10" x2={hoverPoint.x} y2="70" 
                stroke="hsl(var(--primary))" 
                strokeWidth="0.5" 
                strokeOpacity="0.3"
                strokeDasharray="2 2"
              />
              <line 
                x1="20" y1={hoverPoint.y} x2="180" y2={hoverPoint.y} 
                stroke="hsl(var(--primary))" 
                strokeWidth="0.5" 
                strokeOpacity="0.3"
                strokeDasharray="2 2"
              />
              <circle 
                cx={hoverPoint.x} 
                cy={hoverPoint.y} 
                r="3" 
                fill="hsl(var(--primary))"
                fillOpacity="0.5"
              />
            </g>
          )}
        </svg>
      </div>
      
      {/* Interactive slider */}
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground font-mono w-20">parameter</span>
          <input
            type="range"
            min="10"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="flex-1 h-1 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="text-[10px] text-primary font-mono w-8 text-right">
            {(sliderValue / 50).toFixed(1)}x
          </span>
        </div>
        
        <p className="text-xs text-muted-foreground text-center font-mono">
          fig 1.1: Interactive {graphType === 'custom' ? 'function' : graphType} graph
        </p>
      </div>
    </div>
  );
}
