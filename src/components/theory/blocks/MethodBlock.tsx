import { motion } from 'framer-motion';
import { ListOrdered, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import MathRenderer from '@/components/MathRenderer';
import type { MethodBlock as MethodBlockType, MethodStep } from '../types/blocks';
import { TheoryBlockMedia } from '../TheoryBlockMedia';
import { useTheoryBlockMedia } from '@/hooks/useTheoryBlockMedia';
import { TheoryProse } from '../TheoryProse';

interface MethodBlockProps {
  block: MethodBlockType;
  showBlockNumber?: boolean;
}

export function MethodBlock({ block, showBlockNumber = true }: MethodBlockProps) {
  const { content } = block;
  const { fetchMediaStatus, generateMedia } = useTheoryBlockMedia(block.id);
  const [mediaState, setMediaState] = useState<{
    videoStatus: 'none' | 'pending' | 'processing' | 'ready' | 'failed';
    audioUrl: string | null;
    videoUrl: string | null;
    visualPlan: unknown;
    generationMode: 'full' | 'fallback';
    generationError: string | null;
  } | null>(null);

  useEffect(() => {
    fetchMediaStatus().then(setMediaState);
  }, [fetchMediaStatus]);

  const handleRegenerate = async () => {
    const result = await generateMedia();
    if (result) {
      setMediaState(result);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-card rounded-xl border-l-4 border-l-emerald-500 border border-border shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/5 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <ListOrdered className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {showBlockNumber && block.blockNumber && (
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded">
                {block.blockNumber}
              </span>
            )}
            <h3 className="font-semibold text-foreground">Method</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{content.name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* When to Apply */}
        <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
          <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
            When to use this method
          </h4>
          <TheoryProse>
            <MathRenderer latex={content.applicableWhen} className="text-foreground text-sm" />
          </TheoryProse>
        </div>

        {/* Steps - Vertical list layout */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Procedure:</h4>
          {content.steps.map((step: MethodStep) => (
            <motion.div
              key={step.stepNumber}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.stepNumber * 0.1 }}
              className="flex gap-4 p-4 bg-muted/30 rounded-lg border border-border hover:border-emerald-500/30 transition-colors"
            >
              {/* Step number */}
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white text-sm font-bold">
                  {step.stepNumber}
                </span>
              </div>
              
              {/* Step content - vertical stack */}
              <div className="flex-1 space-y-2">
                {/* Action sentence */}
                <p className="font-medium text-foreground leading-relaxed">{step.action}</p>
                
                {/* LaTeX formula (if any) - centered, display mode */}
                {step.mathExpression && (
                  <div className="p-3 bg-background rounded border border-border">
                    <MathRenderer latex={step.mathExpression} displayMode className="text-foreground" />
                  </div>
                )}
                
                {/* Justification */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-medium">Justified by:</span>{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">{step.justifiedBy}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Warnings */}
        {content.warnings && content.warnings.length > 0 && (
          <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Common Mistakes to Avoid</h4>
            </div>
            <ul className="space-y-1 pl-4">
              {content.warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-medium mt-0.5">⚠</span>
                  <span className="text-sm text-foreground leading-relaxed">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Examples */}
        {content.examples && content.examples.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground">Quick examples:</h4>
            <ul className="space-y-2 pl-4">
              {content.examples.map((example, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-medium mt-0.5">•</span>
                  <TheoryProse className="flex-1">
                    <MathRenderer latex={example} className="text-foreground text-sm" />
                  </TheoryProse>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Media Player */}
        {mediaState && (
          <TheoryBlockMedia
            blockId={block.id}
            blockNumber={block.blockNumber}
            blockTitle={block.title}
            videoStatus={mediaState.videoStatus}
            videoUrl={mediaState.videoUrl}
            audioUrl={mediaState.audioUrl}
            visualPlan={mediaState.visualPlan as any}
            generationMode={mediaState.generationMode}
            generationError={mediaState.generationError}
            onRegenerate={handleRegenerate}
          />
        )}
      </div>
    </motion.section>
  );
}
