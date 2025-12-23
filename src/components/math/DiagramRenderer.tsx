import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DiagramRendererProps {
  type: string;
  description?: string;
  className?: string;
}

export function DiagramRenderer({ type, description, className }: DiagramRendererProps) {
  const normalizedType = type.toLowerCase().replace(/[^a-z]/g, '');
  
  const renderDiagram = () => {
    // Right triangle
    if (normalizedType.includes('righttriangle') || normalizedType.includes('right')) {
      return (
        <svg viewBox="0 0 200 160" className="w-full max-w-[200px] h-auto">
          {/* Triangle */}
          <polygon 
            points="20,140 180,140 20,20" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-foreground"
          />
          {/* Right angle indicator */}
          <path 
            d="M 20,120 L 40,120 L 40,140" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
            className="text-primary"
          />
          {/* Labels */}
          <text x="100" y="155" textAnchor="middle" className="text-xs fill-muted-foreground">a</text>
          <text x="8" y="80" textAnchor="middle" className="text-xs fill-muted-foreground">b</text>
          <text x="110" y="75" textAnchor="middle" className="text-xs fill-muted-foreground">c</text>
        </svg>
      );
    }
    
    // Equilateral triangle
    if (normalizedType.includes('triangle') || normalizedType.includes('abc')) {
      return (
        <svg viewBox="0 0 200 180" className="w-full max-w-[200px] h-auto">
          <polygon 
            points="100,20 20,160 180,160" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-foreground"
          />
          {/* Vertices */}
          <text x="100" y="12" textAnchor="middle" className="text-xs fill-primary font-medium">A</text>
          <text x="12" y="170" textAnchor="middle" className="text-xs fill-primary font-medium">B</text>
          <text x="188" y="170" textAnchor="middle" className="text-xs fill-primary font-medium">C</text>
          {/* Side labels */}
          <text x="55" y="85" textAnchor="middle" className="text-xs fill-muted-foreground">c</text>
          <text x="145" y="85" textAnchor="middle" className="text-xs fill-muted-foreground">b</text>
          <text x="100" y="175" textAnchor="middle" className="text-xs fill-muted-foreground">a</text>
        </svg>
      );
    }
    
    // Circle
    if (normalizedType.includes('circle')) {
      return (
        <svg viewBox="0 0 200 200" className="w-full max-w-[180px] h-auto">
          <circle 
            cx="100" cy="100" r="80" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-foreground"
          />
          {/* Center point */}
          <circle cx="100" cy="100" r="3" className="fill-primary" />
          <text x="108" y="96" className="text-xs fill-primary font-medium">O</text>
          {/* Radius */}
          <line x1="100" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4" className="text-muted-foreground" />
          <text x="140" y="92" className="text-xs fill-muted-foreground">r</text>
        </svg>
      );
    }
    
    // Coordinate plane
    if (normalizedType.includes('coordinate') || normalizedType.includes('plane') || normalizedType.includes('axis')) {
      return (
        <svg viewBox="0 0 200 200" className="w-full max-w-[180px] h-auto">
          {/* Grid */}
          {[40, 80, 120, 160].map(x => (
            <line key={`v${x}`} x1={x} y1="20" x2={x} y2="180" stroke="currentColor" strokeWidth="0.5" className="text-border" />
          ))}
          {[40, 80, 120, 160].map(y => (
            <line key={`h${y}`} x1="20" y1={y} x2="180" y2={y} stroke="currentColor" strokeWidth="0.5" className="text-border" />
          ))}
          {/* Axes */}
          <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          <line x1="100" y1="180" x2="100" y2="20" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          {/* Arrows */}
          <polygon points="180,100 172,96 172,104" className="fill-foreground" />
          <polygon points="100,20 96,28 104,28" className="fill-foreground" />
          {/* Labels */}
          <text x="185" y="104" className="text-xs fill-muted-foreground">x</text>
          <text x="104" y="15" className="text-xs fill-muted-foreground">y</text>
          <text x="104" y="112" className="text-xs fill-muted-foreground">O</text>
        </svg>
      );
    }
    
    // Angle
    if (normalizedType.includes('angle')) {
      return (
        <svg viewBox="0 0 200 150" className="w-full max-w-[180px] h-auto">
          {/* Rays */}
          <line x1="30" y1="120" x2="180" y2="120" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          <line x1="30" y1="120" x2="140" y2="30" stroke="currentColor" strokeWidth="2" className="text-foreground" />
          {/* Arc */}
          <path d="M 70,120 A 40,40 0 0,1 54,95" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
          {/* Label */}
          <text x="75" y="105" className="text-xs fill-primary font-medium">θ</text>
        </svg>
      );
    }
    
    // Default: generic shape placeholder
    return (
      <div className="flex items-center justify-center w-full h-24 bg-muted/50 rounded-lg">
        <span className="text-sm text-muted-foreground">Diagram: {type}</span>
      </div>
    );
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("p-4 bg-muted/30 rounded-lg border border-border/50 flex flex-col items-center gap-2", className)}
    >
      {renderDiagram()}
      {description && (
        <p className="text-xs text-muted-foreground text-center">{description}</p>
      )}
    </motion.div>
  );
}
