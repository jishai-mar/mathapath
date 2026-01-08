import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TheoryBlockRenderer } from '@/components/theory/TheoryBlockRenderer';
import { useTheoryBlock } from '@/hooks/useTheoryBlocks';
import type { TheoryBlockRow } from '@/components/theory/types/blocks';

interface TheoryLinkBadgeProps {
  blockNumber: string;
  blockId?: string;
  theoryBlock?: TheoryBlockRow;
  relevance?: 'primary' | 'secondary' | 'reference';
}

const relevanceColors = {
  primary: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  secondary: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
  reference: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30 hover:bg-gray-500/30',
};

export function TheoryLinkBadge({ 
  blockNumber, 
  blockId, 
  theoryBlock: providedBlock,
  relevance = 'primary' 
}: TheoryLinkBadgeProps) {
  const [open, setOpen] = useState(false);
  
  // Fetch block if not provided
  const { data: fetchedBlock, isLoading } = useTheoryBlock(
    !providedBlock && blockId ? blockId : undefined
  );

  const block = providedBlock || fetchedBlock;

  // Parse the block for rendering
  const parsedBlock = block ? {
    id: block.id,
    topicId: block.topic_id,
    blockNumber: block.block_number || blockNumber,
    orderIndex: block.order_index,
    title: block.title,
    type: block.block_type,
    content: block.content,
    prerequisites: block.prerequisites || [],
  } : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-colors cursor-pointer ${relevanceColors[relevance]}`}
        >
          <BookOpen className="w-3 h-3" />
          {blockNumber}
        </motion.button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-primary/20 text-primary rounded">
              {blockNumber}
            </span>
            <span>{block?.title || 'Theory Block'}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : parsedBlock ? (
            <TheoryBlockRenderer block={parsedBlock as any} showBlockNumber={false} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Theory block content not available.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Component to show multiple theory badges
interface TheoryLinkBadgesProps {
  links: Array<{
    blockNumber: string;
    blockId?: string;
    theoryBlock?: TheoryBlockRow;
    relevance?: 'primary' | 'secondary' | 'reference';
  }>;
  label?: string;
}

export function TheoryLinkBadges({ links, label = 'Required Theory' }: TheoryLinkBadgesProps) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}:</span>
      <AnimatePresence>
        {links.map((link, idx) => (
          <motion.div
            key={link.blockNumber}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: idx * 0.05 }}
          >
            <TheoryLinkBadge {...link} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
