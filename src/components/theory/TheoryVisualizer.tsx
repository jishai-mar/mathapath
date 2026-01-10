import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { VisualizerConfig } from './types';
import { create, all } from 'mathjs';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface TheoryVisualizerProps {
  config: VisualizerConfig;
  onControlChange?: (controlId: string, value: number) => void;
}

// Create a mathjs instance
const mathInstance = create(all, {});

export function TheoryVisualizer({ config, onControlChange }: TheoryVisualizerProps) {
  // Initialize control values
  const [controlValues, setControlValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    config.controls?.forEach(control => {
      initial[control.id] = control.defaultValue;
    });
    return initial;
  });

  const handleControlChange = useCallback((controlId: string, value: number[]) => {
    const newValue = value[0];
    setControlValues(prev => ({ ...prev, [controlId]: newValue }));
    onControlChange?.(controlId, newValue);
  }, [onControlChange]);

  // Parse and evaluate mathematical expression
  const evaluateExpression = useCallback((expr: string, x: number, vars: Record<string, number> = {}): number => {
    try {
      // Normalize the expression for mathjs
      let normalizedExpr = expr
        .replace(/\^/g, '^') // already correct
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/√/g, 'sqrt')
        .replace(/π/g, 'pi')
        .replace(/\|([^|]+)\|/g, 'abs($1)'); // |x| -> abs(x)
      
      const node = mathInstance.parse(normalizedExpr);
      const compiled = node.compile();
      const result = compiled.evaluate({ x, ...vars });
      return typeof result === 'number' ? result : NaN;
    } catch {
      return NaN;
    }
  }, []);

  // Generate graph data based on config
  const graphData = useMemo(() => {
    if (!config.graphConfig) return [];
    
    const { domain, function: funcExpr } = config.graphConfig;
    const expression = funcExpr || 'x^2'; // fallback to simple parabola
    const points: Array<{ x: number; y: number }> = [];
    const step = (domain[1] - domain[0]) / 100;
    
    for (let x = domain[0]; x <= domain[1]; x += step) {
      const y = evaluateExpression(expression, x, controlValues);
      
      // Only include valid, finite points within reasonable range
      if (isFinite(y) && Math.abs(y) < 1000) {
        points.push({ 
          x: parseFloat(x.toFixed(3)), 
          y: parseFloat(y.toFixed(3)) 
        });
      }
    }
    
    return points;
  }, [config.graphConfig, controlValues, evaluateExpression]);

  // Get display expression
  const displayExpression = config.graphConfig?.function || 'x²';

  const badgeVariantClass = config.badgeVariant === 'success' 
    ? 'bg-secondary/20 text-secondary border-secondary/30'
    : config.badgeVariant === 'warning'
    ? 'bg-warning/20 text-warning border-warning/30'
    : 'bg-primary/20 text-primary border-primary/30';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Visualizer
          </span>
          {config.badge && (
            <Badge variant="outline" className={badgeVariantClass}>
              {config.badge}
            </Badge>
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
        {config.description && (
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        )}
        {/* Show the function being graphed */}
        <div className="mt-2 px-2 py-1 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
          f(x) = {displayExpression}
        </div>
      </div>

      {/* Graph area */}
      <div className="px-4 py-6 h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.4} 
            />
            <XAxis 
              dataKey="x" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              domain={config.graphConfig?.range || ['auto', 'auto']}
            />
            {/* Reference lines at origin */}
            <ReferenceLine 
              x={0} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="4 4" 
              opacity={0.6}
            />
            <ReferenceLine 
              y={0} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="4 4" 
              opacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#graphGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Controls */}
      {config.controls && config.controls.length > 0 && (
        <div className="px-5 py-4 border-t border-border/50 space-y-4">
          {config.controls.map(control => (
            <div key={control.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {control.label}
                  {control.symbol && (
                    <span className="ml-1 text-foreground">({control.symbol})</span>
                  )}
                </span>
                <span className="text-sm font-mono text-foreground">
                  {controlValues[control.id]?.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[controlValues[control.id] ?? control.defaultValue]}
                onValueChange={(value) => handleControlChange(control.id, value)}
                min={control.min}
                max={control.max}
                step={control.step}
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
