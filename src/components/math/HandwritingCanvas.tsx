import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Trash2, Pencil, PenTool } from 'lucide-react';

interface HandwritingCanvasProps {
  onClear?: () => void;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

export function HandwritingCanvas({ onClear, className = '' }: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const lastPoint = useRef<Point | null>(null);

  // Set up canvas on mount and resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, []);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPoint.current = getPoint(e);
  }, [getPoint]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPoint.current) return;

    const currentPoint = getPoint(e);
    
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'hsl(var(--foreground))';
      ctx.lineWidth = brushSize;
    }
    
    ctx.stroke();
    lastPoint.current = currentPoint;
  }, [isDrawing, isEraser, brushSize, getPoint]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPoint.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear?.();
  }, [onClear]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Handschrift</span>
        
        <div className="flex items-center gap-1 ml-auto">
          <Button
            type="button"
            variant={!isEraser ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsEraser(false)}
            className="h-8 w-8 p-0"
            title="Pen"
          >
            <PenTool className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={isEraser ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsEraser(true)}
            className="h-8 w-8 p-0"
            title="Gum"
          >
            <Eraser className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearCanvas}
            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Wissen"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="text-xs">Wissen</span>
          </Button>
        </div>
      </div>
      
      {/* Brush size slider */}
      <div className="flex items-center gap-2">
        <Pencil className="w-3 h-3 text-muted-foreground" />
        <input
          type="range"
          min="1"
          max="8"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-20 h-1 accent-primary"
        />
        <span className="text-xs text-muted-foreground w-4">{brushSize}</span>
      </div>

      <div className="relative rounded-lg border-2 border-dashed border-border bg-background overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-[180px] touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {/* Grid pattern overlay for math paper feel */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Schrijf hier je uitwerking met muis of touch
      </p>
    </div>
  );
}
