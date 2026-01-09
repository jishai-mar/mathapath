import { motion } from 'framer-motion';
import { Eye, Info } from 'lucide-react';
import MathRenderer from '@/components/MathRenderer';
import { TheoryVisualizer } from '../TheoryVisualizer';
import type { VisualBlock as VisualBlockType } from '../types/blocks';
import type { VisualizerConfig } from '../types';
import { TheoryProse } from '../TheoryProse';

interface VisualBlockProps {
  block: VisualBlockType;
  showBlockNumber?: boolean;
}

export function VisualBlock({ block, showBlockNumber = true }: VisualBlockProps) {
  const { content } = block;

  // Convert our block config to TheoryVisualizer config format
  const visualizerConfig: VisualizerConfig = {
    type: 'graph',
    title: block.title,
    description: content.description,
    controls: content.graphConfig.controls,
    graphConfig: {
      function: content.graphConfig.functions?.[0]?.expression || 'x',
      domain: content.graphConfig.domain,
      range: content.graphConfig.range,
      showGrid: content.graphConfig.showGrid ?? true,
      showAxis: content.graphConfig.showAxis ?? true,
      annotations: content.annotations?.map(a => ({
        type: a.type as 'point' | 'line' | 'area' | 'label',
        x: a.x,
        y: a.y,
        label: a.label,
        color: a.color,
      })),
    },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-card rounded-xl border-l-4 border-l-cyan-500 border border-border shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-cyan-500/5 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Eye className="w-5 h-5 text-cyan-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {showBlockNumber && block.blockNumber && (
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded">
                {block.blockNumber}
              </span>
            )}
            <h3 className="font-semibold text-foreground">Visual Understanding</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{block.title}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Description */}
        <TheoryProse>
          <MathRenderer latex={content.description} className="text-foreground" />
        </TheoryProse>

        {/* Interactive Graph - in its own container, never overlapping text */}
        <div className="rounded-lg overflow-hidden border border-border">
          <TheoryVisualizer config={visualizerConfig} />
        </div>

        {/* Algebraic Interpretation */}
        <div className="p-4 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
          <div className="flex items-start gap-2 mb-2">
            <Info className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
              Connecting Algebra to Geometry
            </h4>
          </div>
          <TheoryProse>
            <MathRenderer latex={content.algebraicInterpretation} className="text-foreground text-sm" />
          </TheoryProse>
        </div>

        {/* Key Observations */}
        {content.keyObservations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Key Observations:</h4>
            <ul className="space-y-2">
              {content.keyObservations.map((observation, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <TheoryProse className="flex-1">
                    <MathRenderer latex={observation} className="text-foreground text-sm" />
                  </TheoryProse>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.section>
  );
}
