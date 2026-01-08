import { motion } from 'framer-motion';
import { BookOpen, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import MathRenderer from '@/components/MathRenderer';
import type { DefinitionBlock as DefinitionBlockType } from '../types/blocks';
import { TheoryBlockMedia } from '../TheoryBlockMedia';
import { useTheoryBlockMedia } from '@/hooks/useTheoryBlockMedia';

interface DefinitionBlockProps {
  block: DefinitionBlockType;
  showBlockNumber?: boolean;
}

export function DefinitionBlock({ block, showBlockNumber = true }: DefinitionBlockProps) {
  const [copied, setCopied] = useState(false);
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

  const handleCopyNotation = () => {
    navigator.clipboard.writeText(content.notation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      className="relative bg-card rounded-xl border-l-4 border-l-blue-500 border border-border shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-blue-500/5 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {showBlockNumber && block.blockNumber && (
              <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded">
                {block.blockNumber}
              </span>
            )}
            <h3 className="font-semibold text-foreground">Definition</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{block.title}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Term and Notation */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-semibold text-foreground">{content.term}</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border">
            <MathRenderer latex={content.notation} className="text-base" />
            <button
              onClick={handleCopyNotation}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Copy notation"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Formal Statement */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border">
          <MathRenderer latex={content.formalStatement} displayMode className="text-foreground" />
        </div>

        {/* Domain Restrictions */}
        {content.domain && (
          <div className="flex items-start gap-2 text-sm">
            <span className="font-medium text-muted-foreground">Domain:</span>
            <MathRenderer latex={content.domain} className="text-foreground" />
          </div>
        )}

        {/* Examples */}
        {content.examples.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Examples:</h4>
            <ul className="space-y-2 pl-4">
              {content.examples.map((example, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-500 font-medium">•</span>
                  <MathRenderer latex={example} className="text-foreground text-sm" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Counterexamples */}
        {content.counterexamples && content.counterexamples.length > 0 && (
          <div className="space-y-2 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
            <h4 className="text-sm font-medium text-destructive">Non-examples:</h4>
            <ul className="space-y-1 pl-4">
              {content.counterexamples.map((ce, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-destructive font-medium">✗</span>
                  <MathRenderer latex={ce} className="text-foreground text-sm" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Remarks */}
        {content.remarks && content.remarks.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            {content.remarks.map((remark, idx) => (
              <p key={idx} className="text-sm text-muted-foreground italic">
                <MathRenderer latex={remark} />
              </p>
            ))}
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
