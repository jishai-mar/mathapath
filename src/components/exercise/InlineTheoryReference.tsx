import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MathRenderer from '@/components/MathRenderer';
import { useTheoryBlock } from '@/hooks/useTheoryBlocks';
import type { TheoryBlockRow } from '@/components/theory/types/blocks';

interface InlineTheoryReferenceProps {
  blockNumber: string;
  blockId?: string;
  children?: React.ReactNode;
}

/**
 * Inline clickable reference to a theory block.
 * Renders as underlined text that shows a tooltip/popover on hover with the block content.
 * 
 * Example usage in a solution step:
 * "By <InlineTheoryReference blockNumber="D1">Definition D1</InlineTheoryReference>, we know..."
 */
export function InlineTheoryReference({ 
  blockNumber, 
  blockId,
  children 
}: InlineTheoryReferenceProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  
  const { data: block, isLoading } = useTheoryBlock(blockId);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Delay showing popover for smoother UX
    setTimeout(() => setShowPopover(true), 200);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPopover(false);
  };

  return (
    <span className="relative inline-block">
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="font-mono text-primary underline decoration-dotted underline-offset-2 cursor-help hover:text-primary/80 transition-colors"
      >
        {children || blockNumber}
      </span>
      
      <AnimatePresence>
        {showPopover && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 max-w-sm"
          >
            <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
              {/* Arrow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-border" />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                </div>
              ) : block ? (
                <TheoryBlockPreview block={block} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {blockNumber}: Theory content not available
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// Compact preview for the popover
function TheoryBlockPreview({ block }: { block: TheoryBlockRow }) {
  const content = block.content as Record<string, any>;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-primary/20 text-primary rounded">
          {block.block_number}
        </span>
        <span className="text-xs font-medium text-foreground truncate">
          {block.title}
        </span>
      </div>

      {/* Content preview based on type */}
      <div className="text-xs text-muted-foreground">
        {block.block_type === 'definition' && content.formalStatement && (
          <MathRenderer latex={content.formalStatement} className="text-xs" />
        )}
        {block.block_type === 'theorem' && content.formalStatement && (
          <MathRenderer latex={content.formalStatement} className="text-xs" />
        )}
        {block.block_type === 'method' && content.applicableWhen && (
          <p className="line-clamp-2">{content.applicableWhen}</p>
        )}
        {!content.formalStatement && !content.applicableWhen && (
          <p className="line-clamp-2">
            {typeof content === 'string' ? content : JSON.stringify(content).slice(0, 100)}...
          </p>
        )}
      </div>

      {/* Click for more hint */}
      <p className="text-[10px] text-muted-foreground/60 text-center">
        Click badge to view full content
      </p>
    </div>
  );
}
