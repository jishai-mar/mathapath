import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface InteractiveMathGraphProps {
  concept: string;
  subtopicName: string;
}

type GraphType = 'linear' | 'quadratic' | 'derivative' | 'logarithm' | 'exponential' | 'inequality' | 'fraction' | 'limit' | 'default';

export default function InteractiveMathGraph({ concept, subtopicName }: InteractiveMathGraphProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [sliderValue, setSliderValue] = useState(50);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);

  // Determine graph type from concept/subtopic name
  const graphType = useMemo((): GraphType => {
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
  }, [concept, subtopicName]);

  // Generate path for different graph types
  const generatePath = (type: GraphType, param: number): string => {
    const scale = param / 50; // normalize 0-100 to 0-2
    
    switch (type) {
      case 'linear': {
        const slope = scale * 0.6;
        return `M 20 ${70 - 20 * slope} L 180 ${70 - 60 * slope}`;
      }
      case 'quadratic': {
        const a = 0.01 * scale;
        const points: string[] = [];
        for (let x = 20; x <= 180; x += 5) {
          const normalX = (x - 100) / 10;
          const y = 50 - a * normalX * normalX * 40;
          points.push(`${x},${Math.max(10, Math.min(70, y))}`);
        }
        return `M ${points.join(' L ')}`;
      }
      case 'derivative': {
        const points: string[] = [];
        for (let x = 20; x <= 180; x += 3) {
          const normalX = (x - 100) / 50;
          const y = 40 - Math.sin(normalX * Math.PI * scale) * 25;
          points.push(`${x},${y}`);
        }
        return `M ${points.join(' L ')}`;
      }
      case 'logarithm': {
        const points: string[] = [];
        for (let x = 25; x <= 180; x += 5) {
          const normalX = (x - 20) / 160;
          const y = 65 - Math.log(normalX * 5 + 0.1) * 15 * scale;
          points.push(`${x},${Math.max(10, Math.min(70, y))}`);
        }
        return `M ${points.join(' L ')}`;
      }
      case 'exponential': {
        const points: string[] = [];
        for (let x = 20; x <= 180; x += 5) {
          const normalX = (x - 20) / 160;
          const y = 65 - Math.exp(normalX * 2 * scale) * 3;
          points.push(`${x},${Math.max(10, Math.min(70, y))}`);
        }
        return `M ${points.join(' L ')}`;
      }
      case 'limit': {
        const points: string[] = [];
        const asymptote = 100;
        for (let x = 20; x <= 180; x += 3) {
          if (Math.abs(x - asymptote) < 5) continue;
          const normalX = (x - asymptote) / 50;
          const y = 40 + (1 / normalX) * 10 * scale;
          points.push(`${x},${Math.max(10, Math.min(70, y))}`);
        }
        return `M ${points.slice(0, points.length / 2).join(' L ')} M ${points.slice(points.length / 2).join(' L ')}`;
      }
      case 'inequality': {
        return `M 20 40 L 100 40 M 100 40 L 180 ${40 - 20 * scale}`;
      }
      default: {
        const points: string[] = [];
        for (let x = 20; x <= 180; x += 5) {
          const y = 40 + Math.sin((x - 20) / 25 + scale) * 20;
          points.push(`${x},${y}`);
        }
        return `M ${points.join(' L ')}`;
      }
    }
  };

  // Get label for graph type
  const getGraphLabel = (type: GraphType): string => {
    const labels: Record<GraphType, string> = {
      linear: 'y = mx + b',
      quadratic: 'y = ax² + bx + c',
      derivative: "f'(x) = lim[h→0] (f(x+h) - f(x))/h",
      logarithm: 'y = log_a(x)',
      exponential: 'y = aˣ',
      inequality: 'x > a',
      fraction: '(a/b) · (c/d)',
      limit: 'lim[x→a] f(x)',
      default: 'f(x)',
    };
    return labels[type];
  };

  const path = generatePath(graphType, sliderValue);

  // Key points for annotations
  const keyPoints = useMemo(() => {
    switch (graphType) {
      case 'quadratic':
        return [{ x: 100, y: 50 - (sliderValue / 50) * 0.01 * 0 * 40, label: 'vertex' }];
      case 'derivative':
        return [
          { x: 100, y: 40, label: 'inflection' },
        ];
      case 'limit':
        return [{ x: 100, y: 40, label: 'asymptote', isAsymptote: true }];
      default:
        return [];
    }
  }, [graphType, sliderValue]);

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
          {getGraphLabel(graphType)}
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
              pathLength: isAnimating ? 1 : 1, 
              opacity: 1 
            }}
            transition={{ 
              pathLength: { duration: 1.5, ease: "easeInOut" },
              opacity: { duration: 0.3 }
            }}
            key={`path-${sliderValue}`}
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
          fig 1.1: Interactive {graphType} function
        </p>
      </div>
    </div>
  );
}
