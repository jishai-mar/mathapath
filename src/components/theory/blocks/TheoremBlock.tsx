import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, Lightbulb } from 'lucide-react';
import { useState, useEffect } from 'react';
import MathRenderer from '@/components/MathRenderer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { TheoremBlock as TheoremBlockType, ProofStep } from '../types/blocks';
import { TheoryBlockMedia } from '../TheoryBlockMedia';
import { useTheoryBlockMedia } from '@/hooks/useTheoryBlockMedia';

interface TheoremBlockProps {
  block: TheoremBlockType;
  showBlockNumber?: boolean;
}

export function TheoremBlock({ block, showBlockNumber = true }: TheoremBlockProps) {
  const [proofOpen, setProofOpen] = useState(false);
  const [intuitionOpen, setIntuitionOpen] = useState(false);
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
      className="relative bg-card rounded-xl border-l-4 border-l-purple-500 border border-border shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-purple-500/5 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {showBlockNumber && block.blockNumber && (
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded">
                {block.blockNumber}
              </span>
            )}
            <h3 className="font-semibold text-foreground">Theorem</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{content.name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Formal Statement */}
        <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
          <MathRenderer latex={content.formalStatement} displayMode className="text-foreground" />
        </div>

        {/* Hypothesis and Conclusion */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">If (Hypothesis)</h4>
            <MathRenderer latex={content.hypothesis} className="text-foreground text-sm" />
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Then (Conclusion)</h4>
            <MathRenderer latex={content.conclusion} className="text-foreground text-sm" />
          </div>
        </div>

        {/* Why It Works - Intuition */}
        <Collapsible open={intuitionOpen} onOpenChange={setIntuitionOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-amber-500/10 hover:bg-amber-500/15 rounded-lg border border-amber-500/20 transition-colors">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Why does this work?</span>
            <ChevronDown className={`w-4 h-4 ml-auto text-amber-500 transition-transform ${intuitionOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <AnimatePresence>
              {intuitionOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-4 bg-amber-500/5 rounded-lg border border-amber-500/10"
                >
                  <MathRenderer latex={content.intuition} className="text-foreground text-sm leading-relaxed" />
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>

        {/* Proof (if available) */}
        {content.proof && content.proof.length > 0 && (
          <Collapsible open={proofOpen} onOpenChange={setProofOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors">
              <span className="text-sm font-medium text-foreground">Proof</span>
              <ChevronDown className={`w-4 h-4 ml-auto text-muted-foreground transition-transform ${proofOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <AnimatePresence>
                {proofOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-3"
                  >
                    {content.proof.map((step: ProofStep) => (
                      <div key={step.stepNumber} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center">
                          {step.stepNumber}
                        </span>
                        <div className="flex-1 space-y-1">
                          <MathRenderer latex={step.statement} className="text-foreground text-sm" />
                          <p className="text-xs text-muted-foreground italic">
                            {step.justification}
                            {step.referencedBlocks && step.referencedBlocks.length > 0 && (
                              <span className="ml-1">
                                (see {step.referencedBlocks.join(', ')})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium text-right">∎ Q.E.D.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Applications */}
        {content.applications.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground">Applications:</h4>
            <ul className="space-y-1 pl-4">
              {content.applications.map((app, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-500 font-medium">→</span>
                  <span className="text-sm text-foreground">{app}</span>
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
