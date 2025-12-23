import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TutorVideoPlayer, { generateVideoSteps, VideoStep } from './TutorVideoPlayer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, PlayCircle, X } from 'lucide-react';

interface TheoryContent {
  definition?: string;
  key_rule?: string;
  formula?: string;
  when_to_use?: string;
  worked_example?: { problem: string; steps: string[]; answer: string };
  common_mistake?: { wrong: string; right: string };
}

interface TheoryVideoViewProps {
  subtopicName: string;
  topicName?: string;
  existingContent?: TheoryContent | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function TheoryVideoView({
  subtopicName,
  topicName = '',
  existingContent,
  isOpen,
  onClose,
  onComplete,
}: TheoryVideoViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<TheoryContent | null>(existingContent || null);
  const [videoSteps, setVideoSteps] = useState<VideoStep[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate content if not provided
  useEffect(() => {
    if (isOpen && !content) {
      generateContent();
    } else if (isOpen && content) {
      const steps = generateVideoSteps(subtopicName, content);
      setVideoSteps(steps);
    }
  }, [isOpen, content, subtopicName]);

  const generateContent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-theory-content', {
        body: { subtopicName, topicName }
      });

      if (error) throw error;
      
      if (data && !data.error) {
        setContent(data);
        const steps = generateVideoSteps(subtopicName, data);
        setVideoSteps(steps);
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating theory:', error);
      toast.error('Could not load video content');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    toast.success('Video completed! Ready to practice?');
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={`${isFullscreen ? 'max-w-full h-full m-0 rounded-none' : 'max-w-4xl'} p-0 overflow-hidden`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Preparing your video lesson...</p>
          </div>
        ) : videoSteps.length > 0 ? (
          <TutorVideoPlayer
            title={subtopicName}
            steps={videoSteps}
            onComplete={handleComplete}
            onClose={onClose}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <p className="text-muted-foreground">No content available</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Button component to trigger video view
export function WatchVideoButton({ 
  subtopicName, 
  topicName,
  content,
  onComplete,
  variant = 'default',
  className = '',
}: { 
  subtopicName: string;
  topicName?: string;
  content?: TheoryContent | null;
  onComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setIsOpen(true)}
        className={`gap-2 ${className}`}
      >
        <PlayCircle className="w-4 h-4" />
        Watch Video Explanation
      </Button>
      
      <TheoryVideoView
        subtopicName={subtopicName}
        topicName={topicName}
        existingContent={content}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={onComplete}
      />
    </>
  );
}
