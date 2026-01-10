import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LineChart, X, Minimize2, Maximize2, Plus, Trash2, 
  Target, TrendingUp, Circle, Minus, ZoomIn, ZoomOut,
  RotateCcw, Info, ChevronDown, ChevronUp, Eye, AlertCircle
} from 'lucide-react';
import { create, all, MathNode } from 'mathjs';
import MathRenderer from '@/components/MathRenderer';

interface AdvancedGraphCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  initialFunctions?: string[];
  showTangentAt?: { functionIndex: number; x: number };
  currentQuestion?: string;
}

interface FunctionEntry {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
}

interface KeyPoint {
  x: number;
  y: number;
  type: 'zero' | 'maximum' | 'minimum' | 'inflection' | 'asymptote' | 'intersection';
  label: string;
}

interface TangentLine {
  functionId: string;
  x: number;
  slope: number;
  yIntercept: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdvancedGraphCalculator({ 
  isOpen, 
  onClose, 
  isMinimized, 
  onToggleMinimize,
  initialFunctions = ['x^2'],
  showTangentAt,
  currentQuestion
}: AdvancedGraphCalculatorProps) {
  const [functions, setFunctions] = useState<FunctionEntry[]>(() => 
    initialFunctions.map((expr, i) => ({
      id: `init-${i}`,
      expression: expr.replace(/^y\s*=\s*/i, '').trim(),
      color: COLORS[i % COLORS.length],
      visible: true
    }))
  );
  
  const [newFunc, setNewFunc] = useState('');
  const [xRange, setXRange] = useState({ min: -10, max: 10 });
  const [yRange, setYRange] = useState({ min: -10, max: 10 });
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; funcValues: { color: string; y: number }[] } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<KeyPoint | null>(null);
  const [tangentLines, setTangentLines] = useState<TangentLine[]>([]);
  const [showKeyPoints, setShowKeyPoints] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [tangentX, setTangentX] = useState('');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  
  const width = 400;
  const height = 300;
  const padding = 40;
  
  // Create mathjs instance
  const mathInstance = useMemo(() => create(all, {}), []);
  
  // Parse and evaluate expression
  const parseExpression = useCallback((expr: string, x: number): number => {
    try {
      const node = mathInstance.parse(expr);
      const compiled = node.compile();
      return compiled.evaluate({ x });
    } catch {
      return NaN;
    }
  }, [mathInstance]);
  
  // Compute derivative numerically
  const computeDerivative = useCallback((expr: string, x: number, h = 0.0001): number => {
    const f1 = parseExpression(expr, x + h);
    const f2 = parseExpression(expr, x - h);
    return (f1 - f2) / (2 * h);
  }, [parseExpression]);
  
  // Compute second derivative
  const computeSecondDerivative = useCallback((expr: string, x: number, h = 0.001): number => {
    const f1 = parseExpression(expr, x + h);
    const f0 = parseExpression(expr, x);
    const f2 = parseExpression(expr, x - h);
    return (f1 - 2 * f0 + f2) / (h * h);
  }, [parseExpression]);
  
  // Find zeros using Newton-Raphson
  const findZeros = useCallback((expr: string): number[] => {
    const zeros: number[] = [];
    const step = (xRange.max - xRange.min) / 100;
    
    for (let x = xRange.min; x < xRange.max; x += step) {
      const y1 = parseExpression(expr, x);
      const y2 = parseExpression(expr, x + step);
      
      // Sign change indicates zero
      if (isFinite(y1) && isFinite(y2) && y1 * y2 < 0) {
        // Newton-Raphson refinement
        let xn = (x + x + step) / 2;
        for (let i = 0; i < 20; i++) {
          const fn = parseExpression(expr, xn);
          const fpn = computeDerivative(expr, xn);
          if (Math.abs(fpn) < 1e-10) break;
          const xnew = xn - fn / fpn;
          if (Math.abs(xnew - xn) < 1e-10) break;
          xn = xnew;
        }
        
        const yCheck = parseExpression(expr, xn);
        if (Math.abs(yCheck) < 0.01 && !zeros.some(z => Math.abs(z - xn) < 0.1)) {
          zeros.push(Math.round(xn * 1000) / 1000);
        }
      }
    }
    
    return zeros;
  }, [xRange, parseExpression, computeDerivative]);
  
  // Find extrema
  const findExtrema = useCallback((expr: string): { maxima: number[]; minima: number[] } => {
    const maxima: number[] = [];
    const minima: number[] = [];
    const step = (xRange.max - xRange.min) / 200;
    
    for (let x = xRange.min + step; x < xRange.max - step; x += step) {
      const d1 = computeDerivative(expr, x - step);
      const d2 = computeDerivative(expr, x + step);
      
      if (isFinite(d1) && isFinite(d2)) {
        // Sign change in derivative
        if (d1 > 0 && d2 < 0) {
          // Local maximum
          let xn = x;
          for (let i = 0; i < 20; i++) {
            const fpn = computeDerivative(expr, xn);
            const fppn = computeSecondDerivative(expr, xn);
            if (Math.abs(fppn) < 1e-10) break;
            const xnew = xn - fpn / fppn;
            if (Math.abs(xnew - xn) < 1e-10) break;
            xn = xnew;
          }
          if (!maxima.some(m => Math.abs(m - xn) < 0.1)) {
            maxima.push(Math.round(xn * 1000) / 1000);
          }
        } else if (d1 < 0 && d2 > 0) {
          // Local minimum
          let xn = x;
          for (let i = 0; i < 20; i++) {
            const fpn = computeDerivative(expr, xn);
            const fppn = computeSecondDerivative(expr, xn);
            if (Math.abs(fppn) < 1e-10) break;
            const xnew = xn - fpn / fppn;
            if (Math.abs(xnew - xn) < 1e-10) break;
            xn = xnew;
          }
          if (!minima.some(m => Math.abs(m - xn) < 0.1)) {
            minima.push(Math.round(xn * 1000) / 1000);
          }
        }
      }
    }
    
    return { maxima, minima };
  }, [xRange, computeDerivative, computeSecondDerivative]);
  
  // Detect vertical asymptotes
  const findAsymptotes = useCallback((expr: string): number[] => {
    const asymptotes: number[] = [];
    const step = (xRange.max - xRange.min) / 500;
    
    for (let x = xRange.min; x < xRange.max; x += step) {
      const y1 = parseExpression(expr, x);
      const y2 = parseExpression(expr, x + step);
      
      // Large discontinuity suggests asymptote
      if (isFinite(y1) && isFinite(y2) && Math.abs(y2 - y1) > 50) {
        const xAsym = x + step / 2;
        if (!asymptotes.some(a => Math.abs(a - xAsym) < 0.2)) {
          asymptotes.push(Math.round(xAsym * 100) / 100);
        }
      }
    }
    
    return asymptotes;
  }, [xRange, parseExpression]);
  
  // Generate key points for all functions
  const keyPoints = useMemo((): KeyPoint[] => {
    const points: KeyPoint[] = [];
    
    functions.filter(f => f.visible).forEach(func => {
      // Find zeros
      const zeros = findZeros(func.expression);
      zeros.forEach(x => {
        const y = parseExpression(func.expression, x);
        points.push({ x, y: Math.round(y * 1000) / 1000, type: 'zero', label: `(${x}, 0)` });
      });
      
      // Find extrema
      const { maxima, minima } = findExtrema(func.expression);
      maxima.forEach(x => {
        const y = parseExpression(func.expression, x);
        if (isFinite(y)) {
          points.push({ x, y: Math.round(y * 1000) / 1000, type: 'maximum', label: `max (${x}, ${Math.round(y * 100) / 100})` });
        }
      });
      minima.forEach(x => {
        const y = parseExpression(func.expression, x);
        if (isFinite(y)) {
          points.push({ x, y: Math.round(y * 1000) / 1000, type: 'minimum', label: `min (${x}, ${Math.round(y * 100) / 100})` });
        }
      });
      
      // Find asymptotes
      const asymptotes = findAsymptotes(func.expression);
      asymptotes.forEach(x => {
        points.push({ x, y: 0, type: 'asymptote', label: `x = ${x}` });
      });
    });
    
    return points;
  }, [functions, findZeros, findExtrema, findAsymptotes, parseExpression]);
  
  // Generate paths for functions
  const paths = useMemo(() => {
    return functions.filter(f => f.visible).map(func => {
      const segments: string[][] = [];
      let currentSegment: string[] = [];
      const step = (xRange.max - xRange.min) / 400;
      let prevY: number | null = null;
      
      for (let x = xRange.min; x <= xRange.max; x += step) {
        const y = parseExpression(func.expression, x);
        
        // Check for discontinuity
        const isDiscontinuous = prevY !== null && isFinite(y) && isFinite(prevY) && Math.abs(y - prevY) > (yRange.max - yRange.min) * 2;
        
        if (isFinite(y) && y >= yRange.min - 50 && y <= yRange.max + 50 && !isDiscontinuous) {
          const px = padding + ((x - xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding);
          const py = height - padding - ((y - yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding);
          currentSegment.push(`${px},${py}`);
        } else {
          if (currentSegment.length > 1) {
            segments.push(currentSegment);
          }
          currentSegment = [];
        }
        
        prevY = y;
      }
      
      if (currentSegment.length > 1) {
        segments.push(currentSegment);
      }
      
      const path = segments.map(seg => `M ${seg.join(' L ')}`).join(' ');
      return { ...func, path };
    });
  }, [functions, xRange, yRange, parseExpression]);
  
  // Generate tangent line paths
  const tangentPaths = useMemo(() => {
    return tangentLines.map(tangent => {
      const func = functions.find(f => f.id === tangent.functionId);
      if (!func) return null;
      
      const y1 = tangent.slope * xRange.min + tangent.yIntercept;
      const y2 = tangent.slope * xRange.max + tangent.yIntercept;
      
      const px1 = padding;
      const py1 = height - padding - ((y1 - yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding);
      const px2 = width - padding;
      const py2 = height - padding - ((y2 - yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding);
      
      // Point of tangency
      const yTangent = parseExpression(func.expression, tangent.x);
      const ptx = padding + ((tangent.x - xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding);
      const pty = height - padding - ((yTangent - yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding);
      
      return {
        path: `M ${px1},${py1} L ${px2},${py2}`,
        point: { x: ptx, y: pty },
        color: func.color,
        label: `y = ${tangent.slope.toFixed(3)}x + ${tangent.yIntercept.toFixed(3)}`
      };
    }).filter(Boolean);
  }, [tangentLines, functions, xRange, yRange, parseExpression]);
  
  // Add tangent line
  const addTangentLine = useCallback((funcId: string, x: number) => {
    const func = functions.find(f => f.id === funcId);
    if (!func) return;
    
    const slope = computeDerivative(func.expression, x);
    const y = parseExpression(func.expression, x);
    const yIntercept = y - slope * x;
    
    setTangentLines(prev => [...prev, { functionId: funcId, x, slope, yIntercept }]);
  }, [functions, computeDerivative, parseExpression]);
  
  // Track if tangent from prop has been processed
  const processedTangentRef = useRef<string | null>(null);
  
  // Handle tangent from prop - fixed to prevent infinite loop
  useEffect(() => {
    if (showTangentAt && functions[showTangentAt.functionIndex]) {
      const tangentKey = `${showTangentAt.functionIndex}-${showTangentAt.x}`;
      if (processedTangentRef.current !== tangentKey) {
        processedTangentRef.current = tangentKey;
        const func = functions[showTangentAt.functionIndex];
        const slope = computeDerivative(func.expression, showTangentAt.x);
        const y = parseExpression(func.expression, showTangentAt.x);
        const yIntercept = y - slope * showTangentAt.x;
        setTangentLines(prev => [...prev, { 
          functionId: func.id, 
          x: showTangentAt.x, 
          slope, 
          yIntercept 
        }]);
      }
    }
  }, [showTangentAt, functions, computeDerivative, parseExpression]);
  
  // Reset processed tangent ref when component closes
  useEffect(() => {
    if (!isOpen) {
      processedTangentRef.current = null;
    }
  }, [isOpen]);
  
  // Convert screen to graph coordinates
  const screenToGraph = useCallback((px: number, py: number) => {
    const x = xRange.min + ((px - padding) / (width - 2 * padding)) * (xRange.max - xRange.min);
    const y = yRange.max - ((py - padding) / (height - 2 * padding)) * (yRange.max - yRange.min);
    return { x, y };
  }, [xRange, yRange]);
  
  // Convert graph to screen coordinates
  const graphToScreen = useCallback((x: number, y: number) => {
    const px = padding + ((x - xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding);
    const py = height - padding - ((y - yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding);
    return { px, py };
  }, [xRange, yRange]);
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (width / rect.width);
    const py = (e.clientY - rect.top) * (height / rect.height);
    
    if (px >= padding && px <= width - padding && py >= padding && py <= height - padding) {
      const { x, y } = screenToGraph(px, py);
      
      // Calculate function values at this x
      const funcValues = functions.filter(f => f.visible).map(func => ({
        color: func.color,
        y: parseExpression(func.expression, x)
      }));
      
      setHoverPoint({ 
        x: Math.round(x * 100) / 100, 
        y: Math.round(y * 100) / 100,
        funcValues
      });
    } else {
      setHoverPoint(null);
    }
  };
  
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!hoverPoint) return;
    
    // Check if clicked near a key point
    const nearPoint = keyPoints.find(kp => {
      const { px, py } = graphToScreen(kp.x, kp.y);
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPx = (e.clientX - rect.left) * (width / rect.width);
      const clickPy = (e.clientY - rect.top) * (height / rect.height);
      return Math.abs(px - clickPx) < 10 && Math.abs(py - clickPy) < 10;
    });
    
    setSelectedPoint(nearPoint || null);
  };
  
  const addFunction = () => {
    if (newFunc.trim()) {
      const colorIndex = functions.length % COLORS.length;
      setFunctions(prev => [...prev, { 
        id: Date.now().toString(), 
        expression: newFunc.replace(/^y\s*=\s*/i, '').trim(), 
        color: COLORS[colorIndex],
        visible: true
      }]);
      setNewFunc('');
    }
  };
  
  const removeFunction = (id: string) => {
    if (functions.length > 1) {
      setFunctions(prev => prev.filter(f => f.id !== id));
      setTangentLines(prev => prev.filter(t => t.functionId !== id));
    }
  };
  
  const toggleFunction = (id: string) => {
    setFunctions(prev => prev.map(f => 
      f.id === id ? { ...f, visible: !f.visible } : f
    ));
  };
  
  const zoom = (factor: number) => {
    const cx = (xRange.min + xRange.max) / 2;
    const cy = (yRange.min + yRange.max) / 2;
    const xHalf = (xRange.max - xRange.min) / 2 * factor;
    const yHalf = (yRange.max - yRange.min) / 2 * factor;
    setXRange({ min: cx - xHalf, max: cx + xHalf });
    setYRange({ min: cy - yHalf, max: cy + yHalf });
  };
  
  const resetView = () => {
    setXRange({ min: -10, max: 10 });
    setYRange({ min: -10, max: 10 });
    setTangentLines([]);
  };
  
  // Extract function from question text
  const extractFunctionFromQuestion = useCallback((question: string): string | null => {
    if (!question) return null;
    
    // Clean up the question
    let text = question.trim();
    
    // Common patterns for functions in math questions
    const patterns = [
      // y = f(x) format
      /y\s*=\s*([^\n,;]+)/i,
      // f(x) = ... format
      /f\s*\(\s*x\s*\)\s*=\s*([^\n,;]+)/i,
      // g(x) = ... format
      /g\s*\(\s*x\s*\)\s*=\s*([^\n,;]+)/i,
      // h(x) = ... format
      /h\s*\(\s*x\s*\)\s*=\s*([^\n,;]+)/i,
      // Explicit function expressions like "2x^2 + 3x - 5"
      /(?:grafiek|graph|functie|function|plot)\s*(?:van|of)?\s*:?\s*([^\n,;]+)/i,
      // Polynomial patterns like "x² + 2x - 3" or "x^2 + 2x - 3"
      /(?:^|\s)([-+]?\s*\d*\s*x\s*[²³⁴⁵⁶⁷⁸⁹](?:\s*[-+]\s*\d*x?\s*)*)/i,
      /(?:^|\s)([-+]?\s*\d*\s*x\s*\^\s*\d+(?:\s*[-+]\s*\d*x?\s*)*)/i,
      // Exponential: e^x, 2^x, etc.
      /(?:^|\s)(\d*\s*[eE]\s*\^\s*[^\n,;]+)/i,
      /(?:^|\s)(\d+\s*\^\s*x[^\n,;]*)/i,
      // Trigonometric functions
      /(?:^|\s)((?:sin|cos|tan|arcsin|arccos|arctan)\s*\([^\)]+\)[^\n,;]*)/i,
      // Logarithmic functions
      /(?:^|\s)((?:log|ln|log_\d+)\s*\([^\)]+\)[^\n,;]*)/i,
      // Square root
      /(?:^|\s)(√\s*\([^\)]+\)[^\n,;]*)/i,
      /(?:^|\s)(sqrt\s*\([^\)]+\)[^\n,;]*)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let expression = match[1].trim();
        
        // Clean up the expression
        expression = expression
          .replace(/\s+/g, '')  // Remove spaces
          .replace(/²/g, '^2')  // Convert superscript 2
          .replace(/³/g, '^3')  // Convert superscript 3
          .replace(/⁴/g, '^4')
          .replace(/⁵/g, '^5')
          .replace(/⁶/g, '^6')
          .replace(/⁷/g, '^7')
          .replace(/⁸/g, '^8')
          .replace(/⁹/g, '^9')
          .replace(/×/g, '*')   // Convert multiplication
          .replace(/÷/g, '/')   // Convert division
          .replace(/−/g, '-')   // Convert minus
          .replace(/√/g, 'sqrt'); // Convert square root
        
        // Add implicit multiplication for cases like "2x" -> "2*x"
        expression = expression.replace(/(\d)([a-zA-Z])/g, '$1*$2');
        expression = expression.replace(/([a-zA-Z])(\d)/g, '$1*$2');
        
        // Validate by trying to parse
        try {
          const testNode = mathInstance.parse(expression);
          testNode.compile().evaluate({ x: 1 });
          return expression;
        } catch {
          // Try with parentheses
          try {
            const withParens = `(${expression})`;
            const testNode = mathInstance.parse(withParens);
            testNode.compile().evaluate({ x: 1 });
            return withParens;
          } catch {
            continue; // Try next pattern
          }
        }
      }
    }
    
    return null;
  }, [mathInstance]);
  
  // Handle "Show in Graph" button click
  const handleShowInGraph = useCallback(() => {
    setExtractionError(null);
    
    if (!currentQuestion) {
      setExtractionError('No question available.');
      return;
    }
    
    const extractedFunc = extractFunctionFromQuestion(currentQuestion);
    
    if (extractedFunc) {
      const colorIndex = functions.length % COLORS.length;
      setFunctions(prev => [...prev, { 
        id: `extracted-${Date.now()}`, 
        expression: extractedFunc, 
        color: COLORS[colorIndex],
        visible: true
      }]);
      setExtractionError(null);
    } else {
      setExtractionError('No valid function found in the question.');
    }
  }, [currentQuestion, extractFunctionFromQuestion, functions.length]);
  
  // Generate axis tick marks
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const range = xRange.max - xRange.min;
    const step = Math.pow(10, Math.floor(Math.log10(range))) / 2;
    for (let x = Math.ceil(xRange.min / step) * step; x <= xRange.max; x += step) {
      if (Math.abs(x) > 0.001 || x === 0) ticks.push(x);
    }
    return ticks;
  }, [xRange]);
  
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const range = yRange.max - yRange.min;
    const step = Math.pow(10, Math.floor(Math.log10(range))) / 2;
    for (let y = Math.ceil(yRange.min / step) * step; y <= yRange.max; y += step) {
      if (Math.abs(y) > 0.001 || y === 0) ticks.push(y);
    }
    return ticks;
  }, [yRange]);
  
  const getPointColor = (type: KeyPoint['type']) => {
    switch (type) {
      case 'zero': return 'hsl(var(--destructive))';
      case 'maximum': return '#10b981';
      case 'minimum': return '#3b82f6';
      case 'asymptote': return '#f59e0b';
      default: return 'hsl(var(--primary))';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden w-[460px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/30">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Graphing Calculator</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => zoom(0.8)} title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => zoom(1.25)} title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={resetView} title="Reset View">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            {onToggleMinimize && (
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onToggleMinimize}>
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Show in Graph Button */}
            {currentQuestion && (
              <div className="px-3 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowInGraph}
                  className="w-full gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Show in Graph
                </Button>
                {extractionError && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {extractionError}
                  </div>
                )}
              </div>
            )}
            
            {/* Graph */}
            <div className="p-3 bg-muted/10">
              <svg
                ref={svgRef}
                width="100%"
                viewBox={`0 0 ${width} ${height}`}
                className="bg-background rounded-lg cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverPoint(null)}
                onClick={handleClick}
              >
                <defs>
                  <pattern id="grid" width={40} height={40} patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
                  </pattern>
                </defs>
                
                {/* Background grid */}
                <rect x={padding} y={padding} width={width - 2 * padding} height={height - 2 * padding} fill="url(#grid)" />
                
                {/* Axis lines */}
                <g stroke="hsl(var(--muted-foreground))" strokeWidth="1.5">
                  {/* X-axis */}
                  {yRange.min <= 0 && yRange.max >= 0 && (
                    <line
                      x1={padding}
                      y1={height - padding - ((-yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding)}
                      x2={width - padding}
                      y2={height - padding - ((-yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding)}
                    />
                  )}
                  {/* Y-axis */}
                  {xRange.min <= 0 && xRange.max >= 0 && (
                    <line
                      x1={padding + ((-xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding)}
                      y1={padding}
                      x2={padding + ((-xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding)}
                      y2={height - padding}
                    />
                  )}
                </g>
                
                {/* X-axis ticks and labels */}
                {xTicks.map(x => {
                  const px = padding + ((x - xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding);
                  const yAxisY = yRange.min <= 0 && yRange.max >= 0 
                    ? height - padding - ((-yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding)
                    : height - padding;
                  return (
                    <g key={`xtick-${x}`}>
                      <line x1={px} y1={yAxisY - 3} x2={px} y2={yAxisY + 3} stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                      <text x={px} y={yAxisY + 14} fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="middle">
                        {Math.abs(x) < 0.001 ? '' : x.toFixed(1).replace(/\.0$/, '')}
                      </text>
                    </g>
                  );
                })}
                
                {/* Y-axis ticks and labels */}
                {yTicks.map(y => {
                  const py = height - padding - ((y - yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding);
                  const xAxisX = xRange.min <= 0 && xRange.max >= 0 
                    ? padding + ((-xRange.min) / (xRange.max - xRange.min)) * (width - 2 * padding)
                    : padding;
                  return (
                    <g key={`ytick-${y}`}>
                      <line x1={xAxisX - 3} y1={py} x2={xAxisX + 3} y2={py} stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                      <text x={xAxisX - 8} y={py + 3} fontSize="9" fill="hsl(var(--muted-foreground))" textAnchor="end">
                        {Math.abs(y) < 0.001 ? '' : y.toFixed(1).replace(/\.0$/, '')}
                      </text>
                    </g>
                  );
                })}
                
                {/* Axis labels */}
                <text x={width - padding + 10} y={height - padding + 5} fontSize="12" fill="hsl(var(--foreground))" fontStyle="italic">x</text>
                <text x={padding - 5} y={padding - 10} fontSize="12" fill="hsl(var(--foreground))" fontStyle="italic">y</text>
                
                {/* Vertical asymptotes */}
                {showKeyPoints && keyPoints.filter(p => p.type === 'asymptote').map((point, i) => {
                  const { px } = graphToScreen(point.x, 0);
                  return (
                    <line
                      key={`asym-${i}`}
                      x1={px}
                      y1={padding}
                      x2={px}
                      y2={height - padding}
                      stroke={getPointColor('asymptote')}
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      opacity="0.7"
                    />
                  );
                })}
                
                {/* Tangent lines */}
                {tangentPaths.map((tangent, i) => tangent && (
                  <g key={`tangent-${i}`}>
                    <path
                      d={tangent.path}
                      fill="none"
                      stroke={tangent.color}
                      strokeWidth="1.5"
                      strokeDasharray="8 4"
                      opacity="0.8"
                    />
                    <circle
                      cx={tangent.point.x}
                      cy={tangent.point.y}
                      r="5"
                      fill={tangent.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  </g>
                ))}
                
                {/* Function curves */}
                {paths.map(func => (
                  <motion.path
                    key={func.id}
                    d={func.path}
                    fill="none"
                    stroke={func.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                  />
                ))}
                
                {/* Key points */}
                {showKeyPoints && keyPoints.filter(p => p.type !== 'asymptote').map((point, i) => {
                  const { px, py } = graphToScreen(point.x, point.y);
                  if (px < padding || px > width - padding || py < padding || py > height - padding) return null;
                  
                  return (
                    <g key={`keypoint-${i}`}>
                      <motion.circle
                        cx={px}
                        cy={py}
                        r="6"
                        fill={getPointColor(point.type)}
                        stroke="white"
                        strokeWidth="2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        style={{ cursor: 'pointer' }}
                      />
                      {selectedPoint === point && (
                        <g>
                          <rect
                            x={px + 8}
                            y={py - 20}
                            width={point.label.length * 6 + 10}
                            height="18"
                            fill="hsl(var(--popover))"
                            rx="4"
                            stroke="hsl(var(--border))"
                          />
                          <text x={px + 13} y={py - 8} fontSize="10" fill="hsl(var(--popover-foreground))">
                            {point.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
                
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
                      opacity="0.4"
                    />
                    <line
                      x1={padding}
                      y1={height - padding - ((hoverPoint.y - yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding)}
                      x2={width - padding}
                      y2={height - padding - ((hoverPoint.y - yRange.min) / (yRange.max - yRange.min)) * (height - 2 * padding)}
                      stroke="hsl(var(--primary))"
                      strokeWidth="1"
                      strokeDasharray="4"
                      opacity="0.4"
                    />
                    
                    {/* Coordinate display */}
                    <rect
                      x={width - padding - 90}
                      y={padding + 5}
                      width="85"
                      height="40"
                      fill="hsl(var(--popover))"
                      fillOpacity="0.95"
                      rx="4"
                      stroke="hsl(var(--border))"
                    />
                    <text x={width - padding - 85} y={padding + 20} fontSize="10" fill="hsl(var(--muted-foreground))">
                      x = {hoverPoint.x}
                    </text>
                    <text x={width - padding - 85} y={padding + 35} fontSize="10" fill="hsl(var(--muted-foreground))">
                      y = {hoverPoint.y}
                    </text>
                    
                    {/* Function value indicators */}
                    {hoverPoint.funcValues.map((fv, i) => {
                      if (!isFinite(fv.y)) return null;
                      const { py } = graphToScreen(hoverPoint.x, fv.y);
                      const { px } = graphToScreen(hoverPoint.x, 0);
                      if (py < padding || py > height - padding) return null;
                      
                      return (
                        <circle
                          key={`hover-${i}`}
                          cx={px}
                          cy={py}
                          r="4"
                          fill={fv.color}
                          stroke="white"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </g>
                )}
              </svg>
            </div>

            {/* Controls */}
            <div className="border-t border-border/30">
              <Tabs defaultValue="functions" className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-9">
                  <TabsTrigger value="functions" className="text-xs">Functions</TabsTrigger>
                  <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
                  <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
                </TabsList>
                
                <TabsContent value="functions" className="p-3 space-y-2 m-0">
                  <ScrollArea className="h-[100px]">
                    {functions.map(func => (
                      <div key={func.id} className="flex items-center gap-2 py-1">
                        <button 
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: func.color, backgroundColor: func.visible ? func.color : 'transparent' }}
                          onClick={() => toggleFunction(func.id)}
                        />
                        <span className="flex-1 font-mono text-sm text-muted-foreground">
                          y = {func.expression}
                        </span>
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
                  </ScrollArea>
                  
                  <div className="flex gap-2 pt-2 border-t border-border/30">
                    <Input
                      value={newFunc}
                      onChange={(e) => setNewFunc(e.target.value)}
                      placeholder="e.g., sin(x), x^2 - 4, 1/x"
                      className="flex-1 h-8 text-sm font-mono"
                      onKeyDown={(e) => e.key === 'Enter' && addFunction()}
                    />
                    <Button size="sm" onClick={addFunction} className="h-8">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="analysis" className="p-3 m-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Key Points</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2"
                      onClick={() => setShowKeyPoints(!showKeyPoints)}
                    >
                      {showKeyPoints ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[80px]">
                    <div className="space-y-1">
                      {keyPoints.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No key points detected</p>
                      ) : (
                        keyPoints.map((point, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getPointColor(point.type) }}
                            />
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {point.type}
                            </Badge>
                            <span className="font-mono text-muted-foreground">{point.label}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="tools" className="p-3 m-0 space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Add Tangent Line at x =</label>
                    <div className="flex gap-2">
                      <Input
                        value={tangentX}
                        onChange={(e) => setTangentX(e.target.value)}
                        placeholder="e.g., 2"
                        className="flex-1 h-8 text-sm font-mono"
                        type="number"
                        step="0.5"
                      />
                      <Button 
                        size="sm" 
                        className="h-8"
                        onClick={() => {
                          const x = parseFloat(tangentX);
                          if (!isNaN(x) && functions.length > 0) {
                            addTangentLine(functions[0].id, x);
                            setTangentX('');
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  {tangentLines.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Active Tangents</label>
                      {tangentPaths.map((t, i) => t && (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="font-mono text-muted-foreground truncate">{t.label}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-5 h-5"
                            onClick={() => setTangentLines(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Legend */}
            <div className="px-3 py-2 border-t border-border/30 flex items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span>zeros</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>max</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>min</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 border-t-2 border-dashed border-amber-500" />
                <span>asymptote</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
