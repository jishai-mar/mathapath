import { DefinitionBlock } from './blocks/DefinitionBlock';
import { TheoremBlock } from './blocks/TheoremBlock';
import { MethodBlock } from './blocks/MethodBlock';
import { VisualBlock } from './blocks/VisualBlock';
import { WorkedExampleBlockNew } from './blocks/WorkedExampleBlockNew';
import { FormalDefinition } from './blocks/FormalDefinition';
import { IntuitiveExplanation } from './blocks/IntuitiveExplanation';
import { WorkedExample } from './blocks/WorkedExample';
import { DeepDive } from './blocks/DeepDive';
import { CommonMistakeBlock } from './blocks/CommonMistakeBlock';
import { DeepDiveBlock } from './blocks/DeepDiveBlock';
import type { TheoryBlockData, TheoryBlockRow, parseTheoryBlock } from './types/blocks';
import type { TheoryBlock } from './types';

interface TheoryBlockRendererProps {
  // Support both new database blocks and legacy static blocks
  block: TheoryBlockData | TheoryBlock;
  showBlockNumber?: boolean;
}

// Type guard to check if block is from database (has blockNumber property)
function isDatabaseBlock(block: TheoryBlockData | TheoryBlock): block is TheoryBlockData {
  return 'blockNumber' in block;
}

// Type guard for legacy blocks (from static theoryTopics.ts)
function isLegacyBlock(block: TheoryBlockData | TheoryBlock): block is TheoryBlock {
  return !('blockNumber' in block);
}

export function TheoryBlockRenderer({ block, showBlockNumber = true }: TheoryBlockRendererProps) {
  // Handle legacy static blocks (from theoryTopics.ts)
  if (isLegacyBlock(block)) {
    switch (block.type) {
      case 'formal-definition':
        return <FormalDefinition block={block} />;
      case 'intuitive-explanation':
        return <IntuitiveExplanation block={block} />;
      case 'worked-example':
        return <WorkedExample block={block} />;
      case 'deep-dive':
        return <DeepDive block={block} />;
      default:
        return null;
    }
  }

  // Handle new database blocks
  if (isDatabaseBlock(block)) {
    switch (block.type) {
      case 'definition':
        return <DefinitionBlock block={block} showBlockNumber={showBlockNumber} />;
      case 'theorem':
        return <TheoremBlock block={block} showBlockNumber={showBlockNumber} />;
      case 'method':
        return <MethodBlock block={block} showBlockNumber={showBlockNumber} />;
      case 'visual':
        return <VisualBlock block={block} showBlockNumber={showBlockNumber} />;
      case 'worked-example':
        return <WorkedExampleBlockNew block={block} showBlockNumber={showBlockNumber} />;
      case 'property':
        // Property blocks use similar styling to theorems
        return <TheoremBlock block={block as any} showBlockNumber={showBlockNumber} />;
      case 'common-mistake':
        return <CommonMistakeBlock block={block as any} showBlockNumber={showBlockNumber} />;
      case 'deep-dive':
        return <DeepDiveBlock block={block as any} showBlockNumber={showBlockNumber} />;
      case 'proof':
      case 'remark':
        // Fallback for proof and remark - render as simple cards for now
        return (
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2">{block.title}</h4>
            <p className="text-sm text-muted-foreground">
              {typeof block.content === 'object' && 'text' in block.content 
                ? (block.content as any).text 
                : JSON.stringify(block.content)}
            </p>
          </div>
        );
      default:
        return null;
    }
  }

  return null;
}

// Helper component to render a list of theory blocks
interface TheoryBlockListProps {
  blocks: (TheoryBlockData | TheoryBlock)[];
  showBlockNumbers?: boolean;
}

export function TheoryBlockList({ blocks, showBlockNumbers = true }: TheoryBlockListProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => (
        <TheoryBlockRenderer 
          key={'id' in block ? block.id : index} 
          block={block} 
          showBlockNumber={showBlockNumbers}
        />
      ))}
    </div>
  );
}
