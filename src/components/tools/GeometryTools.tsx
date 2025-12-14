import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Ruler, X, Minimize2, Maximize2, RotateCcw } from 'lucide-react';

interface GeometryToolsProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

type Tool = 'ruler' | 'protractor' | 'grid';

export default function GeometryTools({ isOpen, onClose, isMinimized, onToggleMinimize }: GeometryToolsProps) {
  const [activeTool, setActiveTool] = useState<Tool>('ruler');
  const [rotation, setRotation] = useState(0);
  const [measurement, setMeasurement] = useState<string>('');

  const width = 320;
  const height = 200;

  const handleRulerClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const units = Math.round((x - 20) / 30 * 10) / 10;
    if (units >= 0 && units <= 10) {
      setMeasurement(`${units} units`);
    }
  };

  const handleProtractorClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = width / 2;
    const cy = height - 20;
    const x = e.clientX - rect.left - cx;
    const y = cy - (e.clientY - rect.top);
    
    if (y > 0) {
      let angle = Math.atan2(x, y) * (180 / Math.PI);
      angle = 90 - angle;
      if (angle >= 0 && angle <= 180) {
        setMeasurement(`${Math.round(angle)}°`);
      }
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
            <Ruler className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Geometry Tools</span>
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
            {/* Tool selector */}
            <div className="flex gap-1 p-2 border-b border-border/30">
              {(['ruler', 'protractor', 'grid'] as Tool[]).map((tool) => (
                <Button
                  key={tool}
                  variant={activeTool === tool ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => { setActiveTool(tool); setMeasurement(''); }}
                  className="flex-1 capitalize text-xs"
                >
                  {tool === 'ruler' && '📏'}
                  {tool === 'protractor' && '📐'}
                  {tool === 'grid' && '📊'}
                  {' '}{tool}
                </Button>
              ))}
            </div>

            {/* Tool canvas */}
            <div className="p-3 bg-muted/10">
              <svg
                width={width}
                height={height}
                className="bg-background rounded-lg cursor-crosshair"
                onClick={activeTool === 'ruler' ? handleRulerClick : activeTool === 'protractor' ? handleProtractorClick : undefined}
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {activeTool === 'ruler' && (
                  <g>
                    {/* Ruler body */}
                    <rect x="10" y={height/2 - 30} width={width - 20} height="60" fill="hsl(var(--secondary))" rx="4" />
                    
                    {/* Tick marks */}
                    {Array.from({ length: 101 }).map((_, i) => {
                      const x = 20 + (i / 100) * (width - 40);
                      const isMajor = i % 10 === 0;
                      const isHalf = i % 5 === 0;
                      return (
                        <g key={i}>
                          <line
                            x1={x}
                            y1={height/2 - 30}
                            x2={x}
                            y2={height/2 - 30 + (isMajor ? 20 : isHalf ? 15 : 8)}
                            stroke="hsl(var(--foreground))"
                            strokeWidth={isMajor ? 1.5 : 0.5}
                          />
                          {isMajor && (
                            <text
                              x={x}
                              y={height/2 + 5}
                              fill="hsl(var(--foreground))"
                              fontSize="10"
                              textAnchor="middle"
                            >
                              {i / 10}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}

                {activeTool === 'protractor' && (
                  <g>
                    {/* Protractor arc */}
                    <path
                      d={`M 40 ${height - 20} A ${width/2 - 40} ${width/2 - 40} 0 0 1 ${width - 40} ${height - 20}`}
                      fill="hsl(var(--secondary))"
                      stroke="hsl(var(--border))"
                    />
                    
                    {/* Degree marks */}
                    {Array.from({ length: 181 }).map((_, i) => {
                      const angle = (i - 90) * (Math.PI / 180);
                      const r = width/2 - 40;
                      const cx = width/2;
                      const cy = height - 20;
                      const isMajor = i % 10 === 0;
                      const innerR = isMajor ? r - 15 : i % 5 === 0 ? r - 10 : r - 5;
                      
                      return (
                        <g key={i}>
                          <line
                            x1={cx + Math.cos(angle) * innerR}
                            y1={cy - Math.sin(angle) * innerR}
                            x2={cx + Math.cos(angle) * r}
                            y2={cy - Math.sin(angle) * r}
                            stroke="hsl(var(--foreground))"
                            strokeWidth={isMajor ? 1 : 0.3}
                          />
                          {isMajor && (
                            <text
                              x={cx + Math.cos(angle) * (r - 25)}
                              y={cy - Math.sin(angle) * (r - 25)}
                              fill="hsl(var(--foreground))"
                              fontSize="8"
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              {i}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    
                    {/* Center point */}
                    <circle cx={width/2} cy={height - 20} r="3" fill="hsl(var(--primary))" />
                  </g>
                )}

                {activeTool === 'grid' && (
                  <g>
                    {/* Grid lines */}
                    {Array.from({ length: 21 }).map((_, i) => {
                      const pos = 10 + (i / 20) * (width - 20);
                      const yPos = 10 + (i / 20) * (height - 20);
                      return (
                        <g key={i} stroke="hsl(var(--border))" strokeWidth={i === 10 ? 1.5 : 0.5}>
                          <line x1={pos} y1={10} x2={pos} y2={height - 10} />
                          {i <= 13 && <line x1={10} y1={yPos} x2={width - 10} y2={yPos} />}
                        </g>
                      );
                    })}
                    
                    {/* Axes labels */}
                    <text x={width - 15} y={height/2 + 15} fill="hsl(var(--muted-foreground))" fontSize="10">x</text>
                    <text x={width/2 + 5} y={20} fill="hsl(var(--muted-foreground))" fontSize="10">y</text>
                  </g>
                )}
              </svg>
            </div>

            {/* Measurement display & controls */}
            <div className="flex items-center justify-between p-3 border-t border-border/30">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRotation(r => (r + 15) % 360)}
                  className="h-7"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Rotate
                </Button>
              </div>
              
              {measurement && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-3 py-1 bg-primary/10 rounded-lg text-sm font-mono text-primary"
                >
                  {measurement}
                </motion.div>
              )}
            </div>

            <p className="px-3 pb-2 text-[10px] text-muted-foreground">
              Click on the tool to measure. Rotate for different angles.
            </p>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
