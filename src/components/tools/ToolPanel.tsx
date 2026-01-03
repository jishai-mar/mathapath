import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calculator, LineChart, Ruler, ChevronRight } from 'lucide-react';
import MathCalculator from './MathCalculator';
import AdvancedGraphCalculator from './AdvancedGraphCalculator';
import GeometryTools from './GeometryTools';

export interface ToolSuggestion {
  calculator?: boolean;
  graph?: boolean;
  geometry?: boolean;
  message?: string;
  graphFunctions?: string[]; // Auto-load these functions into graph
}

interface ToolPanelProps {
  subtopicName: string;
  suggestion?: ToolSuggestion;
  onToolUsed?: (tool: string) => void;
}

export function detectToolsFromTopic(subtopicName: string): ToolSuggestion {
  const name = subtopicName.toLowerCase();
  
  const graphKeywords = ['function', 'graph', 'parabola', 'line', 'curve', 'derivative', 'limit', 'quadratic', 'linear'];
  const calculatorKeywords = ['solve', 'equation', 'calculate', 'simplify', 'evaluate', 'logarithm', 'exponent', 'fraction'];
  const geometryKeywords = ['angle', 'triangle', 'geometry', 'measure', 'distance', 'coordinate', 'polygon'];
  
  return {
    calculator: calculatorKeywords.some(k => name.includes(k)),
    graph: graphKeywords.some(k => name.includes(k)),
    geometry: geometryKeywords.some(k => name.includes(k)),
  };
}

export default function ToolPanel({ subtopicName, suggestion, onToolUsed }: ToolPanelProps) {
  const [showCalculator, setShowCalculator] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showGeometry, setShowGeometry] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [minimizedTools, setMinimizedTools] = useState<Record<string, boolean>>({});
  const [graphFunctions, setGraphFunctions] = useState<string[]>([]);

  const detectedTools = detectToolsFromTopic(subtopicName);
  // Merge suggestion with detected, ensuring graph and calculator are always available if suggested
  const tools = {
    calculator: suggestion?.calculator || detectedTools.calculator || true, // Always show calculator
    graph: suggestion?.graph || detectedTools.graph || true, // Always show graph
    geometry: suggestion?.geometry || detectedTools.geometry,
    message: suggestion?.message
  };
  
  const hasTools = tools.calculator || tools.graph || tools.geometry;

  // Auto-expand and show graph when functions are provided
  useEffect(() => {
    if (suggestion?.graphFunctions && suggestion.graphFunctions.length > 0) {
      setGraphFunctions(suggestion.graphFunctions);
      setShowGraph(true);
      setIsExpanded(true);
      onToolUsed?.('graph');
    }
  }, [suggestion?.graphFunctions]);

  useEffect(() => {
    if (suggestion?.message) {
      setIsExpanded(true);
    }
  }, [suggestion?.message]);

  const handleOpenTool = (tool: string) => {
    switch (tool) {
      case 'calculator':
        setShowCalculator(true);
        break;
      case 'graph':
        setShowGraph(true);
        break;
      case 'geometry':
        setShowGeometry(true);
        break;
    }
    onToolUsed?.(tool);
  };

  if (!hasTools) return null;

  return (
    <>
      {/* Tool trigger bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-20 right-4 z-40"
      >
        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              initial={{ width: 48, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 48, opacity: 0 }}
              className="flex items-center gap-2 p-2 bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg"
            >
              {suggestion?.message && (
                <span className="text-xs text-muted-foreground px-2 max-w-[180px] truncate">
                  {suggestion.message}
                </span>
              )}
              
              <div className="flex items-center gap-1">
                {tools.calculator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenTool('calculator')}
                    className="gap-1 h-8"
                  >
                    <Calculator className="w-4 h-4 text-primary" />
                    <span className="text-xs">Calculator</span>
                  </Button>
                )}
                {tools.graph && (
                  <Button
                    variant={showGraph ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleOpenTool('graph')}
                    className="gap-1 h-8"
                  >
                    <LineChart className="w-4 h-4 text-primary" />
                    <span className="text-xs">Graph</span>
                  </Button>
                )}
                {tools.geometry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenTool('geometry')}
                    className="gap-1 h-8"
                  >
                    <Ruler className="w-4 h-4 text-primary" />
                    <span className="text-xs">Measure</span>
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex gap-1"
            >
              {tools.calculator && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsExpanded(true)}
                  className="w-10 h-10 rounded-full bg-card/95 backdrop-blur-sm shadow-lg"
                  title="Calculator available"
                >
                  <Calculator className="w-4 h-4 text-primary" />
                </Button>
              )}
              {tools.graph && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsExpanded(true)}
                  className="w-10 h-10 rounded-full bg-card/95 backdrop-blur-sm shadow-lg"
                  title="Graph plotter available"
                >
                  <LineChart className="w-4 h-4 text-primary" />
                </Button>
              )}
              {tools.geometry && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsExpanded(true)}
                  className="w-10 h-10 rounded-full bg-card/95 backdrop-blur-sm shadow-lg"
                  title="Geometry tools available"
                >
                  <Ruler className="w-4 h-4 text-primary" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tool windows */}
      <div className="fixed bottom-36 right-4 z-50 flex flex-col gap-3">
        <MathCalculator
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
          isMinimized={minimizedTools.calculator}
          onToggleMinimize={() => setMinimizedTools(m => ({ ...m, calculator: !m.calculator }))}
        />
        <AdvancedGraphCalculator
          isOpen={showGraph}
          onClose={() => setShowGraph(false)}
          isMinimized={minimizedTools.graph}
          onToggleMinimize={() => setMinimizedTools(m => ({ ...m, graph: !m.graph }))}
          initialFunctions={graphFunctions}
        />
        <GeometryTools
          isOpen={showGeometry}
          onClose={() => setShowGeometry(false)}
          isMinimized={minimizedTools.geometry}
          onToggleMinimize={() => setMinimizedTools(m => ({ ...m, geometry: !m.geometry }))}
        />
      </div>
    </>
  );
}
