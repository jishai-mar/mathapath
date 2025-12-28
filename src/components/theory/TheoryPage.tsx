import { useCallback } from 'react';
import { toast } from 'sonner';
import { TheoryPageLayout } from './TheoryPageLayout';
import { TheoryVisualizer } from './TheoryVisualizer';
import { FormalDefinition } from './blocks/FormalDefinition';
import { IntuitiveExplanation } from './blocks/IntuitiveExplanation';
import { WorkedExample } from './blocks/WorkedExample';
import { DeepDive } from './blocks/DeepDive';
import { SubtopicsPanel } from './SubtopicsPanel';
import { TheoryTopic, TheoryBlock } from './types';

interface TheoryPageProps {
  topic: TheoryTopic;
  onOpenTutor?: () => void;
}

export function TheoryPage({ topic, onOpenTutor }: TheoryPageProps) {
  const handleSave = useCallback(() => {
    toast.success('Topic saved to bookmarks');
  }, []);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  }, []);

  const handleAskGilbert = useCallback(() => {
    onOpenTutor?.();
    // Dispatch event for persistent Gilbert
    window.dispatchEvent(new CustomEvent('open-gilbert', {
      detail: { context: `Theory topic: ${topic.title}` }
    }));
  }, [topic.title, onOpenTutor]);

  const renderBlock = (block: TheoryBlock, index: number) => {
    switch (block.type) {
      case 'formal-definition':
        return <FormalDefinition key={index} block={block} />;
      case 'intuitive-explanation':
        return <IntuitiveExplanation key={index} block={block} />;
      case 'worked-example':
        return <WorkedExample key={index} block={block} />;
      case 'deep-dive':
        return <DeepDive key={index} block={block} />;
      default:
        return null;
    }
  };

  return (
    <TheoryPageLayout
      title={topic.title}
      subtitle={topic.subtitle}
      breadcrumb={topic.breadcrumb}
      onSave={handleSave}
      onShare={handleShare}
      onAskGilbert={handleAskGilbert}
      practiceUrl={topic.practiceUrl}
      nextTopicUrl={topic.nextTopicId ? `/theory/${topic.nextTopicId}` : undefined}
      nextTopicTitle={topic.nextTopicTitle}
      visualizer={
        topic.visualizer ? (
          <TheoryVisualizer config={topic.visualizer} />
        ) : undefined
      }
    >
      {topic.blocks.map((block, index) => renderBlock(block, index))}
      
      {/* Subtopics panel - shows related learning content from database */}
      {topic.databaseTopicId && (
        <SubtopicsPanel 
          databaseTopicId={topic.databaseTopicId} 
          topicSlug={topic.id}
        />
      )}
    </TheoryPageLayout>
  );
}
